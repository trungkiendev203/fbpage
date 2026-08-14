import React from 'react';

export const metadata = {
  title: 'Chính sách Quyền riêng tư | Privacy Policy',
  description: 'Chính sách quyền riêng tư và bảo mật thông tin người dùng ứng dụng Facebook Page Tools',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chính sách Quyền riêng tư</h1>
          <p className="text-sm font-medium text-blue-600 mt-1">Privacy Policy &amp; Data Protection</p>
          <p className="text-xs text-slate-400 mt-2">Cập nhật lần cuối: 14/08/2026</p>
        </div>

        <div className="space-y-8 text-slate-700 leading-relaxed text-sm">
          <section>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">1. Giới thiệu chung</h2>
            <p>
              Ứng dụng của chúng tôi (sau đây gọi là &ldquo;Hệ thống Quản lý và Tự động hóa Nội dung Facebook&rdquo;) cam kết bảo vệ quyền riêng tư và bảo mật thông tin của người dùng. Chính sách này giải thích cách chúng tôi tiếp nhận, xử lý và bảo vệ dữ liệu khi bạn sử dụng các tính năng kết nối với Meta / Facebook Graph API.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">2. Dữ liệu và Quyền hạn thu thập</h2>
            <p>Ứng dụng chỉ yêu cầu các quyền truy cập tối thiểu cần thiết phục vụ vận hành Fanpage theo ủy quyền của bạn, bao gồm:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-600">
              <li><strong>pages_show_list:</strong> Để hiển thị danh sách các Trang Fanpage mà bạn sở hữu/quản lý.</li>
              <li><strong>pages_read_engagement:</strong> Đọc dữ liệu tương tác để phân tích hiệu suất bài viết.</li>
              <li><strong>pages_manage_posts:</strong> Đăng bài viết, hình ảnh, lịch xuất bản theo yêu cầu của bạn.</li>
              <li><strong>Email cá nhân:</strong> Chỉ sử dụng để liên hệ xác thực tài khoản quản trị.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">3. Mục đích sử dụng dữ liệu</h2>
            <p>Chúng tôi chỉ sử dụng dữ liệu được cấp phép cho các mục đích:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-600">
              <li>Thực hiện xuất bản nội dung tự động lên các Trang Facebook của bạn theo đúng lịch trình đã lên.</li>
              <li>Đồng bộ hóa trạng thái bài viết và báo cáo số liệu vận hành nội dung.</li>
              <li>Chúng tôi <strong>KHÔNG</strong> bán, chia sẻ hoặc chuyển giao thông tin của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">4. Bảo mật dữ liệu (Data Security)</h2>
            <p>
              Tất cả các Access Token và khóa bảo mật kết nối Meta API đều được mã hóa chuẩn công nghiệp (AES-256-GCM) trước khi lưu trữ trong cơ sở dữ liệu và chỉ được giải mã khi thực hiện gửi request xuất bản bài viết hợp lệ.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">5. Hướng dẫn xóa dữ liệu (User Data Deletion)</h2>
            <p>
              Nếu bạn muốn xóa toàn bộ dữ liệu hoặc ngắt kết nối ứng dụng khỏi tài khoản Facebook của mình:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1.5 text-slate-600">
              <li>Đăng nhập Facebook cá nhân &gt; vào <strong>Cài đặt &amp; Quyền riêng tư</strong>.</li>
              <li>Chọn <strong>Cài đặt</strong> &gt; <strong>Tiện ích tích hợp cho doanh nghiệp</strong> (Business Integrations).</li>
              <li>Tìm tên ứng dụng &gt; Nhấn <strong>Gỡ bỏ (Remove)</strong>.</li>
              <li>Hoặc gửi email yêu cầu xóa dữ liệu đến: <span className="font-semibold text-slate-800">hau01012027@gmail.com</span>, chúng tôi sẽ xóa toàn bộ dữ liệu liên quan trong vòng 24 giờ.</li>
            </ol>
          </section>

          <section className="pt-4 border-t border-slate-200">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">6. Thông tin liên hệ</h2>
            <p>
              Mọi thắc mắc hoặc khiếu nại về quyền riêng tư, vui lòng liên hệ:
            </p>
            <p className="mt-1 font-medium text-slate-800">
              Quản trị viên Hệ thống<br />
              Email: <a href="mailto:hau01012027@gmail.com" className="text-blue-600 hover:underline">hau01012027@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
