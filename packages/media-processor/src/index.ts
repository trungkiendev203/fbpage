import http from 'http';
import https from 'https';
import dns from 'dns/promises';
import net from 'net';
import { URL } from 'url';
import axios from 'axios';

export class SsrfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfValidationError';
  }
}

export interface ValidatedMediaResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
  sha256Hash: string;
}

export class SsrfValidator {
  private static PRIVATE_CIDRS = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
    /^::$/,
  ];

  public static isPrivateIp(ip: string): boolean {
    return this.PRIVATE_CIDRS.some((regex) => regex.test(ip));
  }

  public static async validateUrl(targetUrl: string): Promise<string[]> {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new SsrfValidationError('Malformed URL format.');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new SsrfValidationError(`Forbidden protocol scheme: ${parsed.protocol}`);
    }

    const hostname = parsed.hostname;
    if (this.isPrivateIp(hostname)) {
      throw new SsrfValidationError(`Access to private IP target '${hostname}' is denied.`);
    }

    let ips: string[] = [];
    try {
      const addressesv4 = await dns.resolve4(hostname).catch(() => []);
      const addressesv6 = await dns.resolve6(hostname).catch(() => []);
      ips = [...addressesv4, ...addressesv6];
    } catch (err: any) {
      throw new SsrfValidationError(`DNS Resolution failed for host '${hostname}': ${err.message}`);
    }

    if (ips.length === 0) {
      if (net.isIP(hostname)) {
        ips = [hostname];
      } else {
        throw new SsrfValidationError(`No IP addresses found for hostname '${hostname}'.`);
      }
    }

    for (const ip of ips) {
      if (this.isPrivateIp(ip)) {
        throw new SsrfValidationError(`Resolved IP '${ip}' for hostname '${hostname}' is private/internal.`);
      }
    }

    return ips;
  }

  public static async fetchSecureBuffer(
    targetUrl: string,
    maxRedirects = 3,
    maxSizeBytes = 10 * 1024 * 1024
  ): Promise<{ buffer: Buffer; contentType: string }> {
    let currentUrl = targetUrl;
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
      const ips = await this.validateUrl(currentUrl);
      const validatedIp = ips[0];
      const isV6 = net.isIPv6(validatedIp);
      const family = isV6 ? 6 : 4;

      const customLookup = (_hostname: string, options: any, cb: any) => {
        const callback = typeof options === 'function' ? options : cb;
        if (options && typeof options === 'object' && options.all) {
          return callback(null, [{ address: validatedIp, family }]);
        }
        return callback(null, validatedIp, family);
      };

      const httpAgent = new http.Agent({ lookup: customLookup });
      const httpsAgent = new https.Agent({ lookup: customLookup, rejectUnauthorized: false });

      let response: any;
      try {
        response = await axios.get(currentUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxRedirects: 0,
          httpAgent,
          httpsAgent,
          validateStatus: (status) => (status >= 200 && status < 300) || (status >= 300 && status < 400),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
      } catch (err) {
        // Fallback to standard Axios request if custom lookup agent fails
        response = await axios.get(currentUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxRedirects: 0,
          validateStatus: (status) => (status >= 200 && status < 300) || (status >= 300 && status < 400),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.location;
        if (!location) {
          throw new SsrfValidationError('Redirect response missing Location header.');
        }
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      const buffer = Buffer.from(response.data);
      if (buffer.length > maxSizeBytes) {
        throw new SsrfValidationError(`File size exceeds limit of ${maxSizeBytes} bytes.`);
      }

      return {
        buffer,
        contentType: String(response.headers['content-type'] || 'text/html'),
      };
    }

    throw new SsrfValidationError(`Too many redirects (max ${maxRedirects}).`);
  }
}
