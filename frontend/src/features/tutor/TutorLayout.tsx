import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Inbox, 
  GraduationCap,
  CheckCircle2
} from 'lucide-react';

export default function TutorLayout() {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    {
      label: 'Tổng quan bàn làm việc',
      path: '/tutor/dashboard',
      icon: LayoutDashboard,
      exact: true,
      desc: 'Thống kê lớp, giờ dạy & việc cần làm',
    },
    {
      label: 'Lớp học & Lịch dạy',
      path: '/tutor/classes',
      icon: BookOpen,
      desc: 'Quản lý lớp học & sổ liên lạc',
    },
    {
      label: 'Hộp thư Lời mời nhận lớp',
      path: '/tutor/offers',
      icon: Inbox,
      desc: 'Xem & phản hồi đề xuất ghép lớp',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900 antialiased">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Tutor Left Sidebar — Modern SaaS Neutral */}
        <aside className="w-full md:w-64 bg-white text-ink-900 shrink-0 border-r border-ink-200 p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="pb-4 border-b border-ink-100">
              <span className="text-[10px] uppercase font-semibold text-brand-700 tracking-wider block">
                Cổng gia sư
              </span>
              <span className="text-base font-semibold text-ink-900 flex items-center gap-2 mt-1">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                Bàn Làm Việc Gia Sư
              </span>
            </div>

            <nav className="space-y-1">
              <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider px-3 block mb-2">
                Chức năng
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
                        : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-brand-600' : 'text-ink-400'}`} />
                    <div className="leading-tight">
                      <div>{item.label}</div>
                      <div className="text-[10px] text-ink-400 font-normal mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick status card at bottom */}
          <div className="bg-ink-50 border border-ink-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-brand-700 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span>Gia sư chính thức</span>
            </div>
            <div className="text-ink-900 font-semibold text-xs truncate">
              {currentUser?.name || 'Thầy Gia Sư'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Hồ sơ đã xác thực chuyên môn</span>
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
