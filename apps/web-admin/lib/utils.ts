export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !headers.has('x-csrf-token')) {
      headers.set('x-csrf-token', csrfToken);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatTimeAgo(dateString?: string | Date): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

export function translateMetaError(code?: string, rawMsg?: string): string {
  if (!code && !rawMsg) return 'Chưa có thông tin lỗi từ Meta';

  const knownErrors: Record<string, string> = {
    '190': 'Token quyền Facebook Page đã hết hạn hoặc bị đổi mật khẩu. Cần cập nhật lại Token.',
    '200': 'Tài khoản không có quyền đăng bài lên Fanpage này (Thiếu pages_manage_posts).',
    '368': 'Tài khoản/Trang bị Meta tạm thời chặn đăng bài do nghi ngờ spam hoặc vi phạm tiêu chuẩn.',
    '506': 'Bài viết bị trùng lặp nội dung hoàn toàn trên Fanpage trong thời gian ngắn.',
    '100': 'Tham số gửi sang Facebook Meta Graph API không hợp lệ hoặc thiếu dữ liệu bắt buộc.',
    'ETIMEDOUT': 'Kết nối tới máy chủ Facebook bị quá thời gian (Timeout). Hệ thống giữ trạng thái UNKNOWN để tránh đăng trùng.',
    'ECONNRESET': 'Kết nối mạng tới Facebook bị ngắt giữa chừng. Đã giữ trạng thái UNKNOWN để kiểm tra đối soát.',
  };

  return knownErrors[code || ''] || rawMsg || `Lỗi Meta API mã [${code}]`;
}
