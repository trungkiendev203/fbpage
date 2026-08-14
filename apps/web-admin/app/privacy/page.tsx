'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-4 h-4" />
            <span>META VERIFIED PRIVACY POLICY</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Chính Sách Quyền Riêng Tư (Privacy Policy)
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Chính sách bảo vệ thông tin người dùng và quyền riêng tư cho Ứng dụng Quản lý & Tự động hóa Facebook Page.
          </p>
          <p className="text-xs text-slate-500 font-mono">Cập nhật lần cuối: 14 tháng 8, 2026</p>
        </div>

        {/* Content Body */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-300 shadow-xl">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></span>
              1. Giới thiệu chung (Overview)
            </h2>
            <p>
              Ứng dụng <strong>Tools FB (Kiên Editorial Operations Cockpit)</strong> cam kết bảo vệ quyền riêng tư và dữ liệu của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin khi bạn liên kết tài khoản Facebook và sử dụng các tính năng điều phối nội dung trên các Facebook Page do bạn quản lý.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></span>
              2. Dữ liệu chúng tôi thu thập (Data We Collect)
            </h2>
            <p>Khi bạn sử dụng ứng dụng và cấp quyền thông qua Facebook OAuth / Graph API, chúng tôi chỉ thu thập các dữ liệu cần thiết tối thiểu:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
              <li><strong>Thông tin tài khoản Facebook công khai:</strong> Họ tên, ID người dùng (User ID), Địa chỉ Email.</li>
              <li><strong>Thông tin Facebook Page:</strong> Danh sách Page ID, Tên Trang (Page Name), Mã truy cập Trang (Page Access Token).</li>
              <li><strong>Nội dung bài viết:</strong> Tiêu đề, nội dung caption, hình ảnh/video được tạo hoặc xuất bản lên Facebook Page.</li>
              <li><strong>Nhật ký hệ thống (Audit Logs):</strong> Địa chỉ IP, User-Agent, thời gian thao tác để phục vụ mục đích bảo mật.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></span>
              3. Mục đích sử dụng dữ liệu (How We Use Your Data)
            </h2>
            <p>Chúng tôi chỉ sử dụng dữ liệu thu thập được cho các mục đích chính đáng sau:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <div className="font-semibold text-white text-xs flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" /> Đăng bài tự động
                </div>
                <p className="text-xs text-slate-400">Thực hiện đăng bài viết, lịch xuất bản nội dung lên Facebook Page do bạn ủy quyền.</p>
              </div>
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <div className="font-semibold text-white text-xs flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" /> Biên tập & AI Rewriter
                </div>
                <p className="text-xs text-slate-400">Biên tập nội dung tin tức và tối ưu hóa bài viết trước khi phê duyệt xuất bản.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></span>
              4. Bảo mật dữ liệu (Data Security & Encryption)
            </h2>
            <p>
              Toàn bộ Mã truy cập (Access Token) của Facebook Page và thông tin nhạy cảm đều được mã hóa bằng thuật toán chuẩn quân sự <strong>AES-256-GCM</strong> với khóaMaster Key độc lập trước khi ghi vào cơ sở dữ liệu. Kết nối truyền tải dữ liệu đều bắt buộc mã hóa qua giao thức **HTTPS (SSL/TLS)**.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></span>
              5. Quyền yêu cầu Xóa dữ liệu (User Data Deletion Rights)
            </h2>
            <p>
              Người dùng có quyền hoàn toàn trong việc ngắt kết nối và yêu cầu xóa toàn bộ dữ liệu cá nhân cũng như Access Token của Facebook Page khỏi hệ thống của chúng tôi bất kỳ lúc nào.
            </p>
            <p>
              Để gửi yêu cầu xóa dữ liệu, vui lòng truy cập trang hướng dẫn chi tiết tại:{' '}
              <Link href="/data-deletion" className="text-blue-400 font-semibold hover:underline">
                https://toolsfb.quynhanhbeauty.online/data-deletion
              </Link>
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-lg font-bold text-white">6. Thông tin liên hệ (Contact Us)</h2>
            <p className="text-slate-400">Nếu bạn có bất kỳ câu hỏi nào về Chính sách quyền riêng tư này, vui lòng liên hệ với chúng tôi qua:</p>
            <div className="text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <p><span className="text-slate-500">Đơn vị vận hành:</span> Kiên Editorial Operations Cockpit</p>
              <p><span className="text-slate-500">Email quản trị:</span> admin@fbpage.local / kiendev203@gmail.com</p>
              <p><span className="text-slate-500">Trang chủ:</span> https://toolsfb.quynhanhbeauty.online</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          &copy; 2026 Tools FB. All rights reserved. Meta Graph API Compliant Privacy Policy.
        </div>
      </div>
    </div>
  );
}
