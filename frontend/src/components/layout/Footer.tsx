import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-ink-200 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Brand info */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-semibold text-lg tracking-tight text-ink-900">
                Viet<span className="text-brand-600">Tutor</span>
              </span>
            </Link>
            <p className="text-xs text-ink-500 leading-relaxed max-w-sm">
              Hệ sinh thái kết nối gia sư chuẩn sư phạm và công nghệ theo dõi học tập số hoá. Đảm bảo chất lượng qua 4 vòng thẩm định nghiêm ngặt.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>100% Gia sư xác thực hồ sơ & chuyên môn</span>
            </div>
          </div>

          {/* Dành cho Phụ Huynh */}
          <div>
            <h4 className="text-sm font-semibold text-ink-900 mb-4">Dành Cho Phụ Huynh</h4>
            <ul className="space-y-2.5 text-xs text-ink-600">
              <li>
                <Link to="/tutors" className="hover:text-ink-900 transition">
                  Tìm kiếm gia sư theo môn & khu vực
                </Link>
              </li>
              <li>
                <Link to="/parent/requests/new" className="hover:text-ink-900 transition">
                  Đăng ký yêu cầu tìm gia sư
                </Link>
              </li>
              <li>
                <Link to="/parent/dashboard" className="hover:text-ink-900 transition">
                  Theo dõi tiến độ học tập của con
                </Link>
              </li>
              <li>
                <Link to="/tutors" className="hover:text-ink-900 transition">
                  Bảng giá thù lao tham khảo
                </Link>
              </li>
            </ul>
          </div>

          {/* Dành cho Gia Sư */}
          <div>
            <h4 className="text-sm font-semibold text-ink-900 mb-4">Dành Cho Gia Sư</h4>
            <ul className="space-y-2.5 text-xs text-ink-600">
              <li>
                <Link to="/apply" className="hover:text-ink-900 transition">
                  Đăng ký hồ sơ ứng tuyển gia sư
                </Link>
              </li>
              <li>
                <Link to="/tutor/dashboard" className="hover:text-ink-900 transition">
                  Bàn làm việc & Lớp học nhận dạy
                </Link>
              </li>
              <li>
                <Link to="/apply" className="hover:text-ink-900 transition">
                  Quy trình thẩm định 4 vòng
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-ink-900 transition">
                  Đăng nhập tài khoản gia sư
                </Link>
              </li>
            </ul>
          </div>

          {/* Liên hệ & Hỗ trợ */}
          <div>
            <h4 className="text-sm font-semibold text-ink-900 mb-4">Liên Hệ & Hỗ Trợ</h4>
            <div className="space-y-3 text-xs text-ink-600">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-ink-400 shrink-0" />
                <span>Hotline: 1900 8866 (8h - 22h)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-ink-400 shrink-0" />
                <span>hotro@viettutor.edu.vn</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-ink-400 shrink-0 mt-0.5" />
                <span>Tòa nhà Innovation Hub, Duy Tân, Cầu Giấy, Hà Nội</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-ink-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
          <p>© 2026 VietTutor. Nền tảng kết nối gia sư tiêu chuẩn sư phạm hàng đầu.</p>
          <p className="text-ink-400">
            Học tập thông minh · Báo cáo minh bạch · Thẩm định chuyên sâu
          </p>
        </div>
      </div>
    </footer>
  );
};
