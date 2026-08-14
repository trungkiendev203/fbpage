'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Inbox,
  ArrowUpDown,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ReviewItem } from '../../types';
import { formatDate, apiFetch } from '../../lib/utils';

export default function ReviewInboxPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<string>('NEWEST');
  const [pages, setPages] = useState<any[]>([]);

  // Decision Form State
  const selectedItem = items.find((i) => i.id === selectedId) || items[0];
  const [editedCaption, setEditedCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetPageId, setTargetPageId] = useState('');
  const [totalDbCount, setTotalDbCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const fetchInboxData = async () => {
    setLoading(true);
    try {
      const [postsRes, pagesRes] = await Promise.all([
        apiFetch('/api/v1/posts?limit=50'),
        apiFetch('/api/v1/facebook/pages'),
      ]);
      if (!postsRes.ok || !pagesRes.ok) {
        throw new Error(`API trả về HTTP ${!postsRes.ok ? postsRes.status : pagesRes.status}`);
      }
      const postsData = await postsRes.json();
      const pagesData = await pagesRes.json();

      setTotalDbCount(postsData.totalCount || 0);
      const rawPosts = postsData.data || [];
      const rawPages = pagesData.data || [];

      setPages(rawPages);
      if (rawPages.length > 0) setTargetPageId(rawPages[0].id);

      const mappedItems: ReviewItem[] = rawPosts.map((p: any) => ({
        id: p.id,
        articleId: p.articleId || p.article?.id,
        reviewStatus: p.reviewStatus || 'IN_REVIEW',
        generationStatus: p.generationStatus || 'GENERATED',
        sensitivityFlag: !!p.sensitivityFlag,
        isAutoPublishEligible: !!p.isAutoPublishEligible,
        createdAt: p.createdAt,
        article: {
          id: p.article?.id || p.id,
          title: p.article?.title || 'Chưa có tiêu đề bài báo',
          canonicalUrl: p.article?.canonicalUrl || '',
          sourceName: p.article?.source?.name || 'Nguồn Tin Báo',
          author: p.article?.author || 'Tòa báo',
          publishedAt: p.article?.publishedAt || p.createdAt,
          rawSummary: p.article?.rawSummary || p.article?.rawContent || 'Chưa có tóm tắt',
          imageUrl: p.currentRevision?.mediaAssetUrl || p.article?.imageUrl,
        },
        currentRevision: {
          id: p.currentRevision?.id || 'rev-1',
          postId: p.id,
          revisionNumber: p.currentRevision?.revisionNumber || 1,
          caption: p.currentRevision?.caption || '',
          createdAt: p.currentRevision?.createdAt || p.createdAt,
        },
      }));

      setItems(mappedItems);
      if (mappedItems.length > 0) {
        setSelectedId(mappedItems[0].id);
        setEditedCaption(mappedItems[0].currentRevision.caption);
        setImageUrl(mappedItems[0].article.imageUrl || '');
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setEditedCaption(selectedItem.currentRevision?.caption || '');
      setImageUrl(selectedItem.article?.imageUrl || '');
    }
  }, [selectedId]);

  // Keyboard Shortcuts (A = Approve, E = Edit, R = Reject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (!selectedItem) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowRejectDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editedCaption, selectedItem]);

  const handleInsertSourceLink = () => {
    if (!selectedItem) return;
    const linkStr = `\n\n🔗 Nguồn bài báo: ${selectedItem.article.canonicalUrl}`;
    if (!editedCaption.includes(selectedItem.article.canonicalUrl)) {
      setEditedCaption((prev) => `${prev}${linkStr}`);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      const res = await apiFetch(`/api/v1/posts/${selectedId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: editedCaption,
          facebookPageId: targetPageId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi duyệt đăng bài: ${data.message || data.error}`);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedId ? { ...item, reviewStatus: 'APPROVED' } : item
        )
      );
      alert(`✓ ${data.message}`);
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    }
  };

  const handleReject = (reason?: string) => {
    if (!selectedItem) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, reviewStatus: 'REJECTED' } : item
      )
    );
    setShowRejectDialog(false);
    alert(`✓ Đã từ chối bài viết với lý do: "${reason}"`);
  };

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.article.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.reviewStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(a.article.publishedAt || a.createdAt).getTime();
      const timeB = new Date(b.article.publishedAt || b.createdAt).getTime();
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Duyệt Bài Viết (Review Inbox)</h1>
          <p className="text-xs text-slate-500">
            Trung tâm Biên tập & Duyệt Nội dung (Nhấn phím <kbd className="px-1 bg-slate-200 rounded font-mono">A</kbd>: Duyệt, <kbd className="px-1 bg-slate-200 rounded font-mono">E</kbd>: Sửa, <kbd className="px-1 bg-slate-200 rounded font-mono">R</kbd>: Từ chối)
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-200">
            Hiển thị {filteredItems.length} bài (Tổng DB: {totalDbCount} bài)
          </span>
        </div>
      </div>

      {/* 3-Pane Layout Container */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Đang tải bài viết từ Database...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Chưa có bài viết nào cần duyệt trong Database</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hệ thống đang chạy tiến trình Scraper cào tin ngầm. Khi có bài báo mới được AI biên soạn, bài viết sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left Pane: Article Selection List (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm tiêu đề bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 font-medium"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="IN_REVIEW">Chờ Duyệt</option>
                  <option value="APPROVED">Đã Duyệt</option>
                  <option value="REJECTED">Từ Chối</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 font-semibold text-blue-700"
                >
                  <option value="NEWEST">⚡ Mới nhất trước</option>
                  <option value="OLDEST">⏳ Cũ nhất trước</option>
                </select>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3 transition flex flex-col space-y-2 ${
                    selectedId === item.id ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={item.reviewStatus} size="sm" />
                    {item.sensitivityFlag && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 font-bold rounded flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Nhạy cảm</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.article.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{item.article.sourceName}</span>
                    <span className="font-mono text-slate-400">{formatDate(item.article.publishedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Center Pane: Article vs Caption Comparison & Media/Link Insertion (5 cols) */}
          {selectedItem && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bài Báo Gốc ({selectedItem.article.sourceName})
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                    {selectedItem.article.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Đăng lúc: {formatDate(selectedItem.article.publishedAt)} • Tác giả: {selectedItem.article.author || 'N/A'}
                  </p>
                </div>
                {selectedItem.article.canonicalUrl && (
                  <a
                    href={selectedItem.article.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs flex items-center space-x-1 flex-shrink-0"
                    title="Mở link bài báo gốc"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Original News Content */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">Tóm tắt báo gốc:</p>
                <p className="leading-relaxed">{selectedItem.article.rawSummary}</p>
              </div>

              {/* AI Generated Caption Box */}
              <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <span className="text-xs font-bold text-blue-900 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Nội Dung Caption Biên Soạn Bởi AI</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleInsertSourceLink}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded flex items-center space-x-1 shadow-2xs"
                      title="Tự động thêm dòng link nguồn bài báo vào cuối caption"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Chèn Link Nguồn</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Hủy sửa' : 'Chỉnh sửa'}</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    rows={9}
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="w-full border border-blue-300 rounded-md p-2.5 text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {editedCaption || 'Bài viết chưa có caption.'}
                  </div>
                )}
              </div>

              {/* Image & Link Attachment */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 flex items-center space-x-1">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>Hình Ảnh & Dẫn Nguồn Đính Kèm</span>
                  </span>
                </div>

                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded overflow-hidden border border-slate-200 bg-slate-100 max-h-48">
                      <img src={imageUrl} alt="Ảnh bài báo" className="w-full h-40 object-cover" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        URL Hình ảnh minh họa:
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Không tìm thấy hình ảnh đính kèm bài báo gốc.</p>
                )}
              </div>
            </div>
          )}

          {/* Right Pane: Editorial Decision Panel (4 cols) */}
          {selectedItem && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between min-h-0 overflow-y-auto space-y-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Bảng Quyết Định Biên Tập
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fanpage Đích Xuất Bản
                  </label>
                  <select
                    value={targetPageId}
                    onChange={(e) => setTargetPageId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pageId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Trạng thái duyệt:</span>
                    <StatusBadge status={selectedItem.reviewStatus} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Điều kiện auto-publish:</span>
                    <span className={selectedItem.isAutoPublishEligible ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {selectedItem.isAutoPublishEligible ? 'Đủ điều kiện' : 'Bắt buộc duyệt tay'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={handleApprove}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-sm flex items-center justify-center space-x-2 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Duyệt Đăng Bài Này (Phím A)</span>
                </button>

                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-md flex items-center justify-center space-x-2 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ Chối Bài Này (Phím R)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <ConfirmDialog
          isOpen={showRejectDialog}
          title="Từ Chối Bài Viết"
          description={`Bạn đang từ chối bài viết "${selectedItem.article.title}". Vui lòng nhập lý do từ chối.`}
          requireReason={true}
          confirmLabel="Xác Nhận Từ Chối"
          onConfirm={handleReject}
          onClose={() => setShowRejectDialog(false)}
        />
      )}
    </div>
  );
}
