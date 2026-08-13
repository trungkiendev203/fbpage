'use client';

import React, { useState, useEffect } from 'react';

export default function PostsReviewPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/posts', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
      })
      .then((data) => {
        setPosts(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Quản lý & Duyệt Bài Viết</h2>
          <p className="text-slate-400 text-sm">Xem trước bài AI vừa soạn, chỉnh sửa nội dung hoặc duyệt xuất bản sang Facebook Fanpage</p>
        </div>
      </div>

      {loading && <div className="text-slate-400 text-center py-8">Đang tải danh sách bài viết từ API...</div>}
      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm">{error}</div>}

      {!loading && !error && posts.length === 0 && (
        <div className="text-slate-500 text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          Chưa có bài viết nào trong hệ thống.
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  post.reviewStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {post.reviewStatus === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt (Draft)'}
                </span>
                <span className="text-xs text-slate-400">{post.article?.title}</span>
              </div>

              <h3 className="font-semibold text-slate-100 text-lg">{post.article?.title}</h3>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm whitespace-pre-wrap font-mono">
                {post.currentRevision?.caption || 'Chưa có nội dung caption'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
