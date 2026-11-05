import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  PlusCircle, 
  BookOpenCheck,
  HeartHandshake
} from 'lucide-react';

export default function ParentLayout() {
  const location = useLocation();

  const navItems = [
    {
      label: 'Tổng quan học tập',
      path: '/parent/dashboard',
      icon: LayoutDashboard,
      exact: true,
      desc: 'Tiến độ học tập của các con',
    },
    {
      label: 'Hồ sơ con cái',
      path: '/parent/children',
      icon: Users,
      desc: 'Thông tin và lớp học của con',
    },
    {
      label: 'Lịch học trong tuần',
      path: '/parent/schedule',
      icon: Calendar,
      desc: 'Thời khoá biểu và lịch học',
    },
    {
      label: 'Yêu cầu tìm gia sư',
      path: '/parent/requests',
      icon: FileText,
      exact: true,
      desc: 'Lịch sử & trạng thái ghép lớp',
    },
    {
      label: 'Đăng yêu cầu mới',
      path: '/parent/requests/new',
      icon: PlusCircle,
      desc: 'Gửi yêu cầu tìm gia sư',
      highlight: true,
    },
    {
      label: 'Sổ liên lạc & Báo cáo',
      path: '/parent/reports',
      icon: BookOpenCheck,
      desc: 'Nhận xét sau từng buổi học',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900 antialiased">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Parent Left Sidebar — Modern SaaS Neutral */}
        <aside className="w-full md:w-64 bg-white text-ink-900 shrink-0 border-r border-ink-200 p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="pb-4 border-b border-ink-100">
              <span className="text-[10px] uppercase font-semibold text-brand-700 tracking-wider block">
                Cổng phụ huynh
              </span>
              <span className="text-base font-semibold text-ink-900 flex items-center gap-2 mt-1">
                <HeartHandshake className="w-4 h-4 text-brand-600" />
                Đồng Hành Cùng Con
              </span>
            </div>

            <nav className="space-y-1">
              <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider px-3 block mb-2">
                Chức năng chính
              </span>
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={idx}
                    to={item.path}
                    className={`flex items-start gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-ink-100 text-ink-900 font-semibold shadow-2xs'
                        : item.highlight
                          ? 'text-brand-800 bg-brand-50/70 hover:bg-brand-50 font-semibold border border-brand-100'
                          : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isActive 
                        ? 'text-brand-600' 
                        : item.highlight 
                          ? 'text-brand-600' 
                          : 'text-ink-400'
                    }`} />
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.highlight && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-brand-600 text-white rounded-full font-bold">
                            Mới
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-ink-400 font-normal mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200/80 text-xs text-ink-600 space-y-1.5">
            <div className="font-semibold text-ink-900">Cần tư vấn chọn gia sư?</div>
            <p className="text-[11px] text-ink-500 leading-relaxed">
              Chuyên viên học vụ luôn sẵn sàng hỗ trợ bạn xếp lớp phù hợp nhất cho bé.
            </p>
            <div className="text-brand-700 font-semibold pt-1">
              Hotline: 1900 8866
            </div>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
