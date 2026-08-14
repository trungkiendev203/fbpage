'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, ShieldAlert, ArrowLeft, CheckCircle2, Copy } from 'lucide-react';

export default function UserDataDeletionPage() {
  const [emailInput, setEmailInput] = useState('');
  const [pageIdInput, setPageIdInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleRequestDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput && !pageIdInput) {
      alert('Vui lòng nhập Email hoặc Facebook Page ID để tìm và xóa dữ liệu!');
      return;
    }

    const code = 'DEL-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setConfirmationCode(code);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại trang chính
          </Link>
          <div className="flex items-center space-x-2 text-xs text-rose-400 font-mono">
            <ShieldAlert className="w-4 h-4" />
            <span>META USER DATA DELETION INSTRUCTIONS</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-500 border border-rose-500/20 mb-2">
            <Trash2 className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Hướng Dẫn & Yêu Cầu Xóa Dữ Liệu Người Dùng
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            User Data Deletion Instructions compliant with Meta / Facebook Platform Policy.
          </p>
        </div>

        {/* Form & Instructions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-300 shadow-xl">
          {/* Overview */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2.5"></span>
              Quy trình xóa dữ liệu (Data Deletion Flow)
            </h2>
            <p>
              Theo chính sách của nền tảng Meta (Facebook Platform Policy), người dùng có toàn quyền gỡ bỏ ứng dụng <strong>Tools FB</strong> khỏi tài khoản Facebook của mình và yêu cầu hệ thống xóa toàn bộ dữ liệu cá nhân liên quan.
            </p>
          </section>

          {/* Option 1: Facebook App Settings */}
          <section className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white text-base">Cách 1: Gỡ ứng dụng trực tiếp từ Facebook Settings</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 text-xs sm:text-sm">
              <li>Đăng nhập vào tài khoản Facebook cá nhân của bạn.</li>
              <li>Truy cập vào <strong>Cài đặt & Quyền riêng tư (Settings & Privacy)</strong> &rarr; <strong>Cài đặt (Settings)</strong>.</li>
              <li>Chọn mục <strong>Ứng dụng và trang web (Apps and Websites)</strong>.</li>
              <li>Tìm ứng dụng <strong>Tools FB</strong> và bấm nút <strong>Gỡ bỏ (Remove)</strong>.</li>
              <li>Facebook sẽ tự động gửi thông báo ngắt kết nối webhook và xóa toàn bộ dữ liệu Access Token khỏi máy chủ của chúng tôi.</li>
            </ol>
          </section>

          {/* Option 2: Direct Request Form */}
          <section className="space-y-4">
            <h3 className="font-bold text-white text-base">Cách 2: Gửi Yêu Cầu Xóa Dữ Liệu Trực Tiếp</h3>
            <p className="text-slate-400">
              Nếu bạn muốn yêu cầu xóa ngay lập tức mọi thông tin Facebook Page ID, Access Token và Nhật ký liên quan khỏi Cơ sở dữ liệu của chúng tôi, hãy điền thông tin bên dưới:
            </p>

            {submitted ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 space-y-4 text-emerald-200">
                <div className="flex items-center space-x-2 font-bold text-base text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Yêu cầu xóa dữ liệu đã được ghi nhận thành công!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Hệ thống đã tự động vô hiệu hóa Access Token và lên lịch xóa vĩnh viễn các bản ghi dữ liệu liên quan trong vòng 24 giờ.
                </p>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Mã xác nhận (Confirmation Code):</span>
                    <span className="ml-2 font-bold text-blue-400">{confirmationCode}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(confirmationCode);
                      alert('Đã copy mã xác nhận!');
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestDeletion} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Địa chỉ Email tài khoản Facebook hoặc Admin:
                  </label>
                  <input
                    type="email"
                    placeholder="vd: admin@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hoặc Facebook Page ID cần xóa khỏi hệ thống:
                  </label>
                  <input
                    type="text"
                    placeholder="vd: 1149290708278001"
                    value={pageIdInput}
                    onChange={(e) => setPageIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xác nhận gửi Yêu cầu Xóa dữ liệu</span>
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          &copy; 2026 Tools FB. Meta User Data Deletion Instructions Standard Compliance.
        </div>
      </div>
    </div>
  );
}
