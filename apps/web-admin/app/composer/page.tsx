'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Link as LinkIcon, Image as ImageIcon, AlertTriangle, Save } from 'lucide-react';
import FacebookPostPreview from '../../components/ui/FacebookPostPreview';

export default function SmartComposerPage() {
  const [caption, setCaption] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pages, setPages] = useState<any[]>([]);
  const [targetPageId, setTargetPageId] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/v1/facebook/pages', { credentials: 'include' });
        const data = await res.json();
        const rawPages = data.data || [];
        setPages(rawPages);
        if (rawPages.length > 0) setTargetPageId(rawPages[0].id);
      } catch (err) {
        console.error('Failed to fetch pages for composer:', err);
      }
    };
    fetchPages();
  }, []);

  const selectedPage = pages.find((p) => p.id === targetPageId) || { name: 'Fanpage', pageId: 'N/A' };

  const handleCaptionChange = (val: string) => {
    setCaption(val);
    setIsSaved(false);
  };

  const handleAddHashtag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => `${prev} ${tag}`);
      setIsSaved(false);
    }
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    alert('✓ Đã tự động lưu bản nháp composer!');
  };

  const handlePublishNow = () => {
    if (!caption) {
      alert('Vui lòng nhập nội dung bài đăng!');
      return;
    }
    alert(`✓ Đã đưa bài viết vào hàng đợi xuất bản sang Fanpage "${selectedPage.name}"!`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Soạn Thảo Thông Minh (Smart Composer)</h1>
          <p className="text-xs text-slate-500">
            Soạn Thảo & Tối Ưu Nội Dung Đa Kênh Facebook Fanpage
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-mono flex items-center space-x-1">
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>{isSaved ? 'Đã lưu bản nháp' : 'Chưa lưu thay đổi...'}</span>
          </span>
          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200"
          >
            Lưu bản nháp
          </button>
          <button
            onClick={handlePublishNow}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700"
          >
            Xuất bản ngay &rarr;
          </button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          {/* Target Page Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trang Fanpage Xuất Bản Đích
            </label>
            <select
              value={targetPageId}
              onChange={(e) => setTargetPageId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-900"
            >
              {pages.length === 0 ? (
                <option value="">Chưa có Fanpage kết nối trong Database</option>
              ) : (
                pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Page ID: {p.pageId})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Caption Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nội dung Bài Đăng (Caption)
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {caption.length} / 2000 ký tự
              </span>
            </div>
            <textarea
              rows={8}
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="Nhập nội dung bài viết tiếng Việt..."
              className="w-full border border-slate-300 rounded-md p-3 text-xs font-sans text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Hashtags Suggestion Box */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">Gợi ý Hashtag Nóng:</span>
            <div className="flex flex-wrap gap-1.5">
              {['#TinNgheAn', '#PhapLuat24h', '#ThoiSuNong', '#BienDongSocial', '#NgheAnNews'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddHashtag(tag)}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold transition"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Attribution & Media URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Link Nguồn Gốc (Attribution)</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>URL Hình Ảnh Minh Họa</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Warnings Bar */}
          {!canonicalUrl && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Thiếu link nguồn bài viết gốc! Quy định yêu cầu phải có link dẫn nguồn bài báo.</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Facebook Post Preview (5 cols) */}
        <div className="lg:col-span-5">
          <FacebookPostPreview
            pageName={selectedPage.name}
            caption={caption || 'Nội dung xem trước bài đăng Facebook...'}
            imageUrl={imageUrl}
            canonicalUrl={canonicalUrl}
          />
        </div>
      </div>
    </div>
  );
}
