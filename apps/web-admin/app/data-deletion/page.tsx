import React from 'react';

export const metadata = {
  title: 'Hướng dẫn Xóa dữ liệu người dùng | User Data Deletion',
  description: 'Hướng dẫn yêu cầu xóa dữ liệu người dùng khỏi ứng dụng Facebook Page Tools',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hướng dẫn Yêu cầu Xóa Dữ liệu</h1>
          <p className="text-sm font-medium text-blue-600 mt-1">Facebook User Data Deletion Instructions</p>
        </div>

        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p>
            Theo quy định và chính sách nền tảng của Meta (Facebook Platform Policy), người dùng có toàn quyền kiểm soát và yêu cầu xóa toàn bộ dữ liệu liên kết với ứng dụng của chúng tôi bất cứ lúc nào.
          </p>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Cách 1: Tự động gỡ quyền trên tài khoản Facebook</h2>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>Mở Facebook trên trình duyệt hoặc ứng dụng di động.</li>
              <li>Đi tới <strong>Cài đặt &amp; Quyền riêng tư (Settings &amp; Privacy)</strong> &gt; <strong>Cài đặt (Settings)</strong>.</li>
              <li>Chọn mục <strong>Tiện ích tích hợp cho doanh nghiệp (Business Integrations)</strong> hoặc <strong>Ứng dụng và trang web (Apps and Websites)</strong>.</li>
              <li>Tìm tên ứng dụng của chúng tôi trong danh sách đang hoạt động.</li>
              <li>Tích chọn ứng dụng và nhấn <strong>Gỡ (Remove)</strong> để chấm dứt toàn bộ quyền truy cập.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Cách 2: Gửi yêu cầu xóa dữ liệu trực tiếp</h2>
            <p className="text-slate-600 mb-2">
              Nếu bạn muốn xóa vĩnh viễn toàn bộ nhật ký bài viết, mã định danh Page và dữ liệu cấu hình đã lưu trong hệ thống của chúng tôi:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Gửi email yêu cầu đến: <strong className="text-slate-900">hau01012027@gmail.com</strong></li>
              <li>Tiêu đề email: <em>[Yêu cầu xóa dữ liệu Facebook App] - Tên Fanpage / ID của bạn</em></li>
              <li>Hệ thống sẽ thực hiện xóa hoàn toàn dữ liệu của bạn khỏi máy chủ trong vòng <strong>24 giờ làm việc</strong> và gửi email xác nhận hoàn tất.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
