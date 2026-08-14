'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Lock, Activity, AlertCircle, Trash2, Share2 } from 'lucide-react';
import { apiFetch } from '../../lib/utils';

export default function SettingsPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingRowId, setTestingRowId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; page?: any } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    pageId: '',
    name: '',
    accessToken: '',
  });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/facebook/pages');
      if (!res.ok) throw new Error(`API trả về HTTP ${res.status}`);
      const data = await res.json();
      setPages(data.data || []);
    } catch (err) {
      console.error('Failed to fetch Facebook pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FB_CONNECTED') {
        setSuccessMsg(`🟢 Kết nối thành công! Đã tự động thêm ${event.data.count || 1} Fanpage vào hệ thống.`);
        fetchPages();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFacebookOAuthConnect = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      '/api/v1/facebook/oauth/login',
      'FacebookOAuthPopup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
  };

  const handleTestConnection = async () => {
    if (!formData.pageId || !formData.accessToken) {
      alert('Vui lòng nhập Page ID và Page Access Token trước khi bấm kiểm tra kết nối!');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiFetch('/api/v1/facebook/pages/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: formData.pageId,
          accessToken: formData.accessToken,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success && data.page?.name) {
        setFormData((prev) => ({ ...prev, name: data.page.name }));
        fetchPages();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `🔴 Kiểm tra kết nối thất bại: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestExistingPage = async (pageId: string, pageName: string) => {
    setTestingRowId(pageId);
    try {
      const res = await apiFetch(`/api/v1/facebook/pages/${pageId}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(`Fanpage "${pageName}":\n\n${data.message}`);
      fetchPages();
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    } finally {
      setTestingRowId(null);
    }
  };

  const handleDeletePage = async (pageId: string, pageName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Fanpage "${pageName}" khỏi hệ thống?`)) return;
    try {
      const res = await apiFetch(`/api/v1/facebook/pages/${pageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi xóa Fanpage: ${data.message || data.error}`);
        return;
      }
      alert(`✓ ${data.message}`);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/v1/facebook/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi cấu hình: ${data.message || data.error}`);
        return;
      }
      setSuccessMsg(`✅ Đã kết nối & lưu Fanpage "${formData.name}" (Page ID: ${formData.pageId}) vào Database thành công!`);
      setFormData({ pageId: '', name: '', accessToken: '' });
      setTestResult(null);
      fetchPages();
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cấu Hình Hệ Thống & Kiểm Tra Kết Nối Fanpage</h1>
        <p className="text-xs text-slate-500">
          Xác Thực Token Trực Tiếp Với Meta Graph API, Mã Hóa AES-256-GCM & Cài Đặt Tự Động Đăng Bài
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
          Cấu Hình Facebook Fanpage Đăng Bài
        </h3>

        {/* 1-Click OAuth Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase">⚡ Kết Nối Nhanh 1-Click Qua Facebook</h4>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Đăng nhập tài khoản Facebook để tự động liên kết Fanpage và cấp đủ 100% quyền đăng bài trong 5 giây.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFacebookOAuthConnect}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs flex items-center space-x-2 shadow-sm transition flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>Kết Nối Qua Facebook (1-Click)</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-400 uppercase">Hoặc nhập thủ công bên dưới</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSavePage} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-700 mb-1">
              Facebook Page ID
            </label>
            <input
              type="text"
              required
              placeholder="Nhập Page ID thật từ Facebook (Ví dụ: 1235062086365796)"
              value={formData.pageId}
              onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700 mb-1">
              Page Access Token (Token Trang Dài)
            </label>
            <input
              type="password"
              required
              placeholder="Nhập mã Access Token dài từ Graph API Explorer (EAAB...)"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <Lock className="w-3 h-3 text-emerald-600 inline" />
              <span>Token được mã hóa bằng thuật toán <strong>AES-256-GCM</strong> trước khi ghi vào PostgreSQL Database.</span>
            </p>
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700 mb-1">
              Tên Facebook Fanpage (Tự động điền sau khi test kết nối)
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nghệ An 24h"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              disabled={testing}
              onClick={handleTestConnection}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 text-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối Trực Tiếp'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm text-xs transition disabled:opacity-50"
            >
              {saving ? 'Đang mã hóa & lưu...' : 'Lưu Cấu Hình Fanpage'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-500">Danh Sách Fanpage Đang Kết Nối Trong Hệ Thống:</h4>
          {loading ? (
            <p className="text-xs text-slate-400">Đang tải danh sách Fanpage từ Database...</p>
          ) : pages.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 italic">
              Chưa có Fanpage nào được lưu trong Database. Vui lòng sử dụng tính năng 1-Click hoặc nhập biểu mẫu trên.
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      {p.isValid ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">🔴 Đã Kết Nối OK</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">⚠️ Chưa Xác Thực</span>
                      )}
                    </div>
                    <p className="text-slate-500 font-mono">Page ID: {p.pageId}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={testingRowId === p.id}
                      onClick={() => handleTestExistingPage(p.id, p.name)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 text-xs flex items-center space-x-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{testingRowId === p.id ? 'Đang test...' : 'Kiểm Tra Kết Nối'}</span>
                    </button>

                    <button
                      onClick={() => handleDeletePage(p.id, p.name)}
                      className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold border border-red-200 text-xs flex items-center space-x-1"
                      title="Xóa Fanpage này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
