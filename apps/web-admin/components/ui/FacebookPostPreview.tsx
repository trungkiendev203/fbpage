'use client';

import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Globe, Monitor, Smartphone } from 'lucide-react';

interface FacebookPostPreviewProps {
  pageName?: string;
  caption: string;
  imageUrl?: string;
  canonicalUrl?: string;
}

export default function FacebookPostPreview({
  pageName = 'Tin Tức Nghệ An 24h',
  caption,
  imageUrl,
  canonicalUrl,
}: FacebookPostPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Xem Trước Bài Đăng Facebook
        </span>
        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md p-1 text-xs">
          <button
            onClick={() => setDevice('desktop')}
            className={`px-2 py-1 rounded flex items-center space-x-1 ${
              device === 'desktop' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`px-2 py-1 rounded flex items-center space-x-1 ${
              device === 'mobile' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      <div className={`mx-auto bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden ${device === 'mobile' ? 'max-w-sm' : 'w-full'}`}>
        {/* Post Header */}
        <div className="p-3 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            FB
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">{pageName}</h4>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5">
              <span>Vừa xong</span>
              <span>•</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Post Text Caption */}
        <div className="px-3 pb-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {caption || 'Nội dung bài đăng sẽ hiển thị ở đây...'}
        </div>

        {/* Image / Link Card */}
        {imageUrl && (
          <div className="bg-slate-100 border-y border-slate-200 overflow-hidden">
            <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover" />
          </div>
        )}

        {canonicalUrl && (
          <div className="bg-slate-50 border-t border-slate-200 p-2.5">
            <p className="text-xs text-slate-500 uppercase font-semibold truncate">
              {new URL(canonicalUrl).hostname}
            </p>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{canonicalUrl}</p>
          </div>
        )}

        {/* Post Actions */}
        <div className="px-3 py-2 border-t border-slate-200 flex items-center justify-between text-slate-600 text-xs font-semibold">
          <button className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 hover:bg-slate-100 rounded">
            <ThumbsUp className="w-4 h-4" />
            <span>Thích</span>
          </button>
          <button className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 hover:bg-slate-100 rounded">
            <MessageSquare className="w-4 h-4" />
            <span>Bình luận</span>
          </button>
          <button className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 hover:bg-slate-100 rounded">
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
