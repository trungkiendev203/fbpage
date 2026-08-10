'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  Send,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DetailDrawer from '../../components/ui/DetailDrawer';
import { Publication } from '../../types';
import { formatDate, translateMetaError } from '../../lib/utils';

export default function PublishingOperationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [requeueTarget, setRequeueTarget] = useState<Publication | null>(null);
  const [markPublishedTarget, setMarkPublishedTarget] = useState<Publication | null>(null);
  const [fbPostIdInput, setFbPostIdInput] = useState('');

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/publications', { credentials: 'include' });
      const data = await res.json();
      setPublications(data.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const handleForceRequeue = async (reason?: string) => {
    if (!requeueTarget) return;
    try {
      const res = await fetch(`http://localhost:4000/api/v1/publications/${requeueTarget.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'FORCE_REQUEUE', note: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi đối soát: ${data.message || data.error}`);
        return;
      }
      alert(`✓ Đã đưa bài viết vào lại hàng đợi (QUEUED) thành công! Lý do: ${reason}`);
      setRequeueTarget(null);
      fetchPublications();
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    }
  };

  const handleMarkPublished = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPublishedTarget || !fbPostIdInput) return;
    try {
      const res = await fetch(`http://localhost:4000/api/v1/publications/${markPublishedTarget.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'MARK_PUBLISHED', fbPostId: fbPostIdInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi xác nhận: ${data.message || data.error}`);
        return;
      }
      alert('✓ Đã xác nhận trạng thái PUBLISHED với Facebook feed thành công!');
      setMarkPublishedTarget(null);
      setFbPostIdInput('');
      fetchPublications();
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    }
  };

  const filteredPubs = publications.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Đối Soát Xuất Bản (Publishing Operations)
          </h1>
          <p className="text-xs text-slate-500">
            Bảng Vận Hành Xuất Bản — Quản lý Trạng Thái & Khôi Phục Sự Cố Đăng Bài
          </p>
        </div>

        <button
          onClick={fetchPublications}
          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Warning Box */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
        <div className="flex items-center space-x-2 font-bold text-purple-900">
          <AlertTriangle className="w-4 h-4 text-purple-700" />
          <span>Quy trình Xử lý Trạng thái UNKNOWN (Mất kết nối giữa chừng):</span>
        </div>
        <p className="leading-relaxed text-purple-800">
          Trạng thái UNKNOWN xảy ra khi máy chủ gặp sự cố mất mạng hoặc timeout trong quá trình gửi bài sang Meta Graph API.
          Operator cần kiểm tra Fanpage trước khi bấm <strong>"Xác nhận đã đăng"</strong> hoặc <strong>"Đăng lại (Requeue)"</strong> để chống đăng trùng bài.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800"
          >
            <option value="ALL">Tất cả trạng thái xuất bản</option>
            <option value="UNKNOWN">UNKNOWN (Cần đối soát khẩn cấp)</option>
            <option value="PUBLISHED">PUBLISHED (Đã xuất bản)</option>
            <option value="QUEUED">QUEUED (Trong hàng đợi)</option>
            <option value="PUBLISHING">PUBLISHING (Đang xử lý)</option>
            <option value="RETRY_WAIT">RETRY_WAIT (Chờ thử lại)</option>
            <option value="FAILED_PERMANENT">FAILED_PERMANENT (Thất bại)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">Hiển thị {filteredPubs.length} mục</span>
      </div>

      {/* Operations Table or Empty State */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Đang tải dữ liệu xuất bản...</div>
      ) : filteredPubs.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
          <Send className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Chưa có bài xuất bản nào trong Database</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Khi các bài viết được duyệt và đưa vào hàng đợi xuất bản sang Fanpage, danh sách đối soát tiến trình sẽ tự động hiển thị ở đây.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
                <tr>
                  <th className="px-4 py-3">Bài Viết Nội Dung</th>
                  <th className="px-4 py-3">Facebook Page</th>
                  <th className="px-4 py-3">Giờ Xếp Lịch</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3">Lần Thử</th>
                  <th className="px-4 py-3">Diễn Giải Kết Quả Meta</th>
                  <th className="px-4 py-3 text-right">Thao Tác Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPubs.map((pub) => {
                  const lastAttempt = pub.attempts && pub.attempts[0];
                  const translatedError = translateMetaError(
                    lastAttempt?.errorCode,
                    lastAttempt?.errorMessage
                  );

                  return (
                    <tr key={pub.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">
                        {pub.postRevision?.caption || 'Nội dung bài viết...'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {pub.facebookPage?.name || 'Fanpage'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {formatDate(pub.scheduledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={pub.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {pub.attempts?.length || 1} lần
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={translatedError}>
                        {pub.status === 'PUBLISHED' ? (
                          <span className="text-emerald-700 font-semibold">✓ Đã xuất bản lên Fanpage</span>
                        ) : (
                          <span className="text-amber-800">{translatedError}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPub(pub)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-semibold"
                        >
                          Chi tiết
                        </button>

                        {pub.status === 'UNKNOWN' && (
                          <>
                            <button
                              onClick={() => setMarkPublishedTarget(pub)}
                              className="px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold"
                            >
                              Xác nhận đã đăng
                            </button>
                            <button
                              onClick={() => setRequeueTarget(pub)}
                              className="px-2 py-1 bg-purple-600 text-white hover:bg-purple-700 rounded font-semibold"
                            >
                              Đăng lại (Requeue)
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for FORCE_REQUEUE */}
      <ConfirmDialog
        isOpen={!!requeueTarget}
        title="Xác Nhận Đăng Lại Bài Viết (FORCE REQUEUE)"
        description={`Bạn chuẩn bị đưa bài viết "${requeueTarget?.postRevision?.caption.substring(0, 40)}..." vào lại hàng đợi đăng bài.`}
        warningNote="Hành động này có thể dẫn đến việc ĐĂNG TRÙNG BÀI nếu bài viết đã thực sự xuất hiện trên Facebook."
        requireReason={true}
        confirmLabel="Đưa Vào Hàng Đợi"
        onConfirm={handleForceRequeue}
        onClose={() => setRequeueTarget(null)}
      />

      {/* Modal for MARK_PUBLISHED */}
      {markPublishedTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg p-5 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Xác Nhận Đã Đăng Bài Trên Facebook</h3>
            <p className="text-xs text-slate-600">
              Nhập Facebook Post ID lấy từ trang Fanpage để xác minh và đánh dấu trạng thái PUBLISHED:
            </p>
            <form onSubmit={handleMarkPublished} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Ví dụ: 100123456789_987654321"
                value={fbPostIdInput}
                onChange={(e) => setFbPostIdInput(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMarkPublishedTarget(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded font-semibold hover:bg-emerald-700"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attempt History Drawer */}
      <DetailDrawer
        isOpen={!!selectedPub}
        title="Lịch Sử Các Lần Thử Đăng Bài (Attempt Log)"
        subtitle={selectedPub?.id}
        onClose={() => setSelectedPub(null)}
      >
        {selectedPub && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <p className="font-bold text-slate-900">Nội dung bài đăng:</p>
              <p className="text-slate-800 whitespace-pre-wrap">{selectedPub.postRevision?.caption}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Danh sách các lần gọi Meta API:</h4>
              {selectedPub.attempts?.map((att) => (
                <div key={att.id} className="p-3 border border-slate-200 rounded bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Lần thử #{att.attemptNumber}</span>
                    <StatusBadge status={att.status} size="sm" />
                  </div>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Bắt đầu: {formatDate(att.requestStartedAt)} | Hoàn tất: {formatDate(att.requestCompletedAt)}
                  </p>
                  {att.errorMessage && (
                    <p className="text-red-700 font-semibold mt-1">Lỗi: {att.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
