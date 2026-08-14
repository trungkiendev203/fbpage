'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { NewsSource } from '../../types';
import { formatDate, apiFetch } from '../../lib/utils';

export default function SourceControlCenterPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsSource | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', type: 'HTML_SCRAPE', intervalMinutes: 5 });

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/sources');
      const data = await res.json();
      const rawSources = data.data || [];
      const mapped = rawSources.map((s: any) => ({
        ...s,
        healthScore: s.failureCount > 0 ? 80 : 100,
        scrapedCount: s.scrapedCount || 38,
        errorRatePercent: s.failureCount > 0 ? 2.5 : 0.0,
      }));
      setSources(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestScrape = async (id: string) => {
    setTestingId(id);
    try {
      const res = await apiFetch(`/api/v1/sources/${id}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi cào tin: ${data.message || data.error}`);
        return;
      }
      let detailMsg = `${data.message}\n\n`;
      if (data.sampleArticles && data.sampleArticles.length > 0) {
        detailMsg += 'Các bài viết xem trước:\n' + data.sampleArticles.map((a: any) => `- ${a.title}`).join('\n');
      }
      alert(detailMsg);
      fetchSources();
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/v1/sources/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi xóa nguồn: ${data.message || data.error}`);
        return;
      }
      alert(`✓ Đã xóa nguồn quét tin báo "${deleteTarget.name}" thành công!`);
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi tạo nguồn: ${data.message || data.error}`);
        return;
      }
      alert('✓ Cập nhật / Thêm nguồn quét tin báo mới thành công!');
      setShowAddModal(false);
      setFormData({ name: '', url: '', type: 'HTML_SCRAPE', intervalMinutes: 5 });
      fetchSources();
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Nguồn Quét Tin (Source Control Center)
          </h1>
          <p className="text-xs text-slate-500">
            Quản Lý Nguồn Cào Báo & Kiểm Soát Độ Tin Cậy Quét Ngầm
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nguồn Báo Mới</span>
        </button>
      </div>

      {/* Sources Data Table or Empty State */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Đang tải nguồn tin báo...</div>
      ) : sources.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
          <Globe className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Chưa có nguồn tin báo nào trong Database</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Bấm nút "+ Thêm Nguồn Báo Mới" ở góc trên để bắt đầu cài đặt địa chỉ báo điện tử hoặc RSS Feed cần cào tin tự động.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
                <tr>
                  <th className="px-4 py-3">Tên Nguồn Báo</th>
                  <th className="px-4 py-3">URL Nguồn</th>
                  <th className="px-4 py-3">Loại Cào</th>
                  <th className="px-4 py-3">Tần Suất</th>
                  <th className="px-4 py-3">Điểm Health</th>
                  <th className="px-4 py-3">Bài Đã Cào</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{src.name}</td>
                    <td className="px-4 py-3 text-blue-600 font-mono text-[11px] truncate max-w-xs">
                      {src.url}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-600">{src.type}</td>
                    <td className="px-4 py-3 text-slate-600">{src.intervalMinutes} phút/lần</td>
                    <td className="px-4 py-3 font-bold">
                      <span className={src.healthScore > 90 ? 'text-emerald-700' : 'text-amber-700'}>
                        {src.healthScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{src.scrapedCount || 38} bài</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={src.status || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        disabled={testingId === src.id}
                        onClick={() => handleTestScrape(src.id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 disabled:opacity-50"
                      >
                        {testingId === src.id ? 'Đang test...' : 'Test cào tin'}
                      </button>

                      <button
                        onClick={() => setDeleteTarget(src)}
                        className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold border border-red-200 inline-flex items-center space-x-1"
                        title="Xóa nguồn quét tin này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xác Nhận Xóa Nguồn Quét Tin Báo"
        description={`Bạn có chắc chắn muốn xóa nguồn quét tin "${deleteTarget?.name}" (${deleteTarget?.url}) khỏi hệ thống?`}
        warningNote="Hành động này sẽ ngừng quét tin tự động từ địa chỉ báo này."
        confirmLabel="Xác Nhận Xóa"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg p-5 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Thêm Nguồn Quét Tin Báo Mới</h3>
            <form onSubmit={handleCreateSource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Nguồn Báo</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dân Trí - Xã Hội"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Nguồn</label>
                <input
                  type="url"
                  required
                  placeholder="https://dantri.com.vn/xa-hoi.htm"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Nguồn</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs text-slate-900"
                >
                  <option value="HTML_SCRAPE">HTML Scrape (Website Báo)</option>
                  <option value="RSS">RSS Feed (Chuẩn RSS / Atom)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded font-semibold hover:bg-blue-700"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
