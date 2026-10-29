import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Heart, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-emerald-950 text-emerald-100/90 pt-14 pb-8 border-t border-emerald-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-tight">
                Viet<span className="text-emerald-400">Tutor</span>
              </span>
              <span className="text-[10px] text-emerald-300 uppercase font-semibold">Gia Sư Tinh Hoa</span>
            </div>
          </div>
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            Hệ sinh thái kết nối gia sư chuẩn sư phạm và công nghệ học tập thông minh. Đảm bảo chất lượng qua 4 vòng thẩm định nghiêm ngặt.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Gia sư xác thực hồ sơ & năng lực</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Dành Cho Phụ Huynh</h4>
          <ul className="space-y-2 text-xs text-emerald-200/80">
            <li><Link to="/tutors" className="hover:text-white transition">Tìm kiếm gia sư theo môn & quận</Link></li>
            <li><Link to="/parent/requests/new" className="hover:text-white transition">Đăng ký lớp học theo yêu cầu</Link></li>
            <li><Link to="/parent/dashboard" className="hover:text-white transition">Theo dõi tiến độ học tập của con</Link></li>
            <li><Link to="/forum" className="hover:text-white transition">Kinh nghiệm đồng hành cùng con</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Dành Cho Gia Sư</h4>
          <ul className="space-y-2 text-xs text-emerald-200/80">
            <li><Link to="/apply" className="hover:text-white transition">Quy trình tuyển dụng & Kiểm tra</Link></li>
            <li><Link to="/tutor/board" className="hover:text-white transition">Bảng lớp học mở tuyển</Link></li>
            <li><Link to="/tutor/offers" className="hover:text-white transition">Hòm thư Offer lớp học</Link></li>
            <li><Link to="/tutor/tasks" className="hover:text-white transition">Giao bài tập & Nhiệm vụ cho bé</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Liên Hệ & Hỗ Trợ 24/7</h4>
          <div className="space-y-2.5 text-xs text-emerald-200/80">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hotline Phụ Huynh: 1900 8866 (8h - 22h)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>hotro@viettutor.edu.vn</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Tòa nhà Innovation Hub, Duy Tân, Cầu Giấy, Hà Nội</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300/70">
        <p>© 2026 VietTutor EdTech. Nền tảng gia sư tiêu chuẩn sư phạm hàng đầu Việt Nam.</p>
        <p className="flex items-center gap-1">
          Thiết kế chuẩn <span className="font-semibold text-emerald-200">Xanh lá đậm & Trắng</span> · Tối ưu cho phụ huynh, gia sư & học sinh
        </p>
      </div>
    </footer>
  );
};
