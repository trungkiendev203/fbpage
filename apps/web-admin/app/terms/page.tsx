'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
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
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-mono">
            <FileText className="w-4 h-4" />
            <span>TERMS OF SERVICE</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Điều Khoản Dịch Vụ (Terms of Service)
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Điều khoản và điều kiện sử dụng Nền tảng Điều phối Nội dung Tools FB.
          </p>
          <p className="text-xs text-slate-500 font-mono">Cập nhật lần cuối: 14 tháng 8, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-300 shadow-xl">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Chấp nhận điều khoản</h2>
            <p>
              Khi sử dụng ứng dụng <strong>Tools FB</strong>, bạn đồng ý tuân thủ toàn bộ các điều khoản dịch vụ và chính sách của Facebook Meta Platform Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Quyền hạn và Trách nhiệm</h2>
            <p>
              Người dùng tự chịu trách nhiệm về toàn bộ nội dung được biên tập, đăng tải hoặc tự động hóa lên các Trang Facebook Page thuộc quyền sở hữu của mình.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          &copy; 2026 Tools FB. Terms of Service Standard Compliance.
        </div>
      </div>
    </div>
  );
}
