import crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { FacebookPostPayload, MetaAppUsageHeader } from 'shared-types';

export interface MetaPublishResponse {
  id: string; // Form: {page_id}_{post_id} or photo_id
  post_id?: string;
  usageHeader?: MetaAppUsageHeader;
}

export interface ClassifiedMetaError {
  isTransient: boolean;
  isRateLimit: boolean;
  isTokenExpired: boolean;
  httpStatusCode?: number;
  errorCode?: number;
  errorMessage: string;
}

export class MetaGraphApiClient {
  private apiVersion: string;
  private appSecret: string;

  constructor(appSecret?: string, apiVersion?: string) {
    this.appSecret = appSecret || process.env.META_APP_SECRET || '';
    this.apiVersion = apiVersion || process.env.META_GRAPH_API_VERSION || 'v20.0';
  }

  public generateAppSecretProof(accessToken: string): string | undefined {
    if (!this.appSecret || this.appSecret.startsWith('dien_')) {
      return undefined;
    }
    return crypto
      .createHmac('sha256', this.appSecret)
      .update(accessToken)
      .digest('hex');
  }

  public parseUsageHeader(response: AxiosResponse): MetaAppUsageHeader | undefined {
    const appUsageRaw = response.headers['x-app-usage'] || response.headers['x-business-use-case-usage'];
    if (!appUsageRaw) return undefined;

    try {
      const parsed = typeof appUsageRaw === 'string' ? JSON.parse(appUsageRaw) : appUsageRaw;
      const data = Array.isArray(parsed) ? parsed[0] : parsed;
      return {
        call_count: data.call_count || 0,
        total_cputime: data.total_cputime || 0,
        total_time: data.total_time || 0,
        estimated_time_to_regain_access: data.estimated_time_to_regain_access,
      };
    } catch {
      return undefined;
    }
  }

  public classifyError(error: any): ClassifiedMetaError {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response) {
      return {
        isTransient: true,
        isRateLimit: false,
        isTokenExpired: false,
        errorMessage: error.message || 'Network timeout or connection reset',
      };
    }

    const httpStatusCode = error.response?.status;
    const metaError = error.response?.data?.error || {};
    const errorCode = metaError.code;
    const errorMessage = metaError.message || error.message || 'Unknown Meta API error';

    // Meta Rate limit error codes: 4, 17, 32
    if ([4, 17, 32].includes(errorCode) || httpStatusCode === 429) {
      return {
        isTransient: true,
        isRateLimit: true,
        isTokenExpired: false,
        httpStatusCode,
        errorCode,
        errorMessage,
      };
    }

    // Token expired/revoked: 190
    if (errorCode === 190) {
      return {
        isTransient: false,
        isRateLimit: false,
        isTokenExpired: true,
        httpStatusCode,
        errorCode,
        errorMessage,
      };
    }

    // Server-side Meta transient errors: 1, 2 or 5xx
    if ([1, 2].includes(errorCode) || (httpStatusCode && httpStatusCode >= 500)) {
      return {
        isTransient: true,
        isRateLimit: false,
        isTokenExpired: false,
        httpStatusCode,
        errorCode,
        errorMessage,
      };
    }

    // Other 4xx errors are permanent client/payload rejections
    return {
      isTransient: false,
      isRateLimit: false,
      isTokenExpired: false,
      httpStatusCode,
      errorCode,
      errorMessage,
    };
  }

  public async publishPhotoPost(
    pageId: string,
    pageAccessToken: string,
    payload: FacebookPostPayload
  ): Promise<MetaPublishResponse> {
    const appSecretProof = this.generateAppSecretProof(pageAccessToken);
    const url = `https://graph.facebook.com/${this.apiVersion}/${pageId}/photos`;

    const form = new FormData();
    form.append('caption', payload.caption);
    if (appSecretProof) {
      form.append('appsecret_proof', appSecretProof);
    }

    if (payload.mediaBuffer) {
      form.append('source', payload.mediaBuffer, {
        filename: 'image.jpg',
        contentType: payload.mimeType || 'image/jpeg',
      });
    }

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${pageAccessToken}`,
      },
      timeout: 30000,
    });

    return {
      id: response.data.id || response.data.post_id,
      post_id: response.data.post_id,
      usageHeader: this.parseUsageHeader(response),
    };
  }

  public async publishFeedPost(
    pageId: string,
    pageAccessToken: string,
    payload: FacebookPostPayload
  ): Promise<MetaPublishResponse> {
    const appSecretProof = this.generateAppSecretProof(pageAccessToken);
    const url = `https://graph.facebook.com/${this.apiVersion}/${pageId}/feed`;

    const postBody: any = {
      message: payload.caption,
    };
    if (appSecretProof) {
      postBody.appsecret_proof = appSecretProof;
    }
    if (payload.linkUrl) {
      postBody.link = payload.linkUrl;
    }

    const response = await axios.post(url, postBody, {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return {
      id: response.data.id,
      usageHeader: this.parseUsageHeader(response),
    };
  }

  public async getPageFeed(pageId: string, pageAccessToken: string, limit = 25): Promise<any[]> {
    const appSecretProof = this.generateAppSecretProof(pageAccessToken);
    const url = `https://graph.facebook.com/${this.apiVersion}/${pageId}/feed`;

    const params: any = {
      access_token: pageAccessToken,
      limit,
      fields: 'id,message,created_time,link,attachments',
    };
    if (appSecretProof) {
      params.appsecret_proof = appSecretProof;
    }

    const response = await axios.get(url, {
      params,
      timeout: 15000,
    });

    return response.data?.data || [];
  }

  public async getPageDetails(pageId: string, pageAccessToken: string): Promise<any> {
    // Strategy 1: GET /me with NO fields param (minimal, no extra permissions needed)
    try {
      const urlMe = `https://graph.facebook.com/${this.apiVersion}/me`;
      const resMe = await axios.get(urlMe, {
        params: { access_token: pageAccessToken },
        timeout: 10000,
      });
      // Returns at minimum { id, name } for a valid Page Access Token
      return resMe.data;
    } catch {
      // Strategy 2: GET /debug_token with app access token
      if (this.appSecret && !this.appSecret.startsWith('dien_')) {
        const appId = process.env.META_APP_ID || '';
        const appToken = `${appId}|${this.appSecret}`;
        const urlDebug = `https://graph.facebook.com/${this.apiVersion}/debug_token`;
        const resDebug = await axios.get(urlDebug, {
          params: { input_token: pageAccessToken, access_token: appToken },
          timeout: 10000,
        });
        const d = resDebug.data?.data;
        if (d && d.is_valid) {
          return { id: d.profile_id || pageId, name: d.granular_scopes ? 'Page Token Valid' : 'Verified', isValid: true };
        }
        throw new Error('Token không hợp lệ theo debug_token.');
      }

      // Strategy 3: If we get error 100 from /me but NOT error 190,
      // the token itself is valid, just missing read permissions.
      // Try a bare GET /{pageId} with no fields.
      const urlBare = `https://graph.facebook.com/${this.apiVersion}/${pageId}`;
      const resBare = await axios.get(urlBare, {
        params: { access_token: pageAccessToken },
        timeout: 10000,
      });
      return resBare.data;
    }
  }

  /**
   * Lightweight token validity check - catches error code to determine if token is valid
   * even when the app lacks pages_read_engagement permission.
   * Returns { valid: true, id, name? } or { valid: false, reason }.
   */
  public async verifyPageToken(pageId: string, pageAccessToken: string): Promise<{ valid: boolean; id?: string; name?: string; reason?: string }> {
    try {
      const details = await this.getPageDetails(pageId, pageAccessToken);
      return { valid: true, id: details.id, name: details.name };
    } catch (err: any) {
      const httpStatus = err.response?.status;
      const metaError = err.response?.data?.error || {};
      const errorCode = metaError.code;

      // Error 190 = token expired/invalid → definitely bad
      if (errorCode === 190) {
        return { valid: false, reason: metaError.message || 'Token hết hạn hoặc không hợp lệ.' };
      }

      // Error 100 with mention of pages_read_engagement = token IS valid,
      // just missing read permission (OK for posting!)
      if (errorCode === 100 && (metaError.message || '').includes('pages_read_engagement')) {
        return { valid: true, id: pageId, name: undefined, reason: 'Token hợp lệ (thiếu quyền đọc nhưng có thể đăng bài).' };
      }

      // Other errors
      return { valid: false, reason: metaError.message || err.message || 'Lỗi không xác định.' };
    }
  }
}
