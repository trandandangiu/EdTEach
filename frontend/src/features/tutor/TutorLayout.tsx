import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Inbox, 
  GraduationCap,
  CalendarCheck,
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
      desc: 'Quản lý lớp học, học sinh & sổ liên lạc',
    },
    {
      label: 'Hộp thư Lời mời nhận lớp',
      path: '/tutor/offers',
      icon: Inbox,
      desc: 'Xem & phản hồi đề xuất ghép lớp mới',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Tutor Left Sidebar */}
        <aside className="w-full md:w-64 bg-emerald-950 text-white shrink-0 border-r border-emerald-900/60 p-4 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="px-3 py-2 border-b border-emerald-900/80">
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest block">
                VietTutor Educator
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                Bàn Làm Việc Gia Sư
              </span>
            </div>

            <nav className="space-y-1">
              <span className="text-[10px] font-black text-emerald-300 tracking-wider px-3 block mb-2">
                CHỨC NĂNG GIA SƯ
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
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs font-bold'
                        : 'text-emerald-200/80 hover:bg-emerald-900 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-emerald-300' : 'text-emerald-400'}`} />
                    <div className="leading-tight">
                      <div>{item.label}</div>
                      <div className="text-[10px] text-emerald-400/80 font-normal mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick status card at bottom */}
          <div className="bg-emerald-900/60 border border-emerald-800/80 rounded-2xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gia sư chính thức</span>
            </div>
            <div className="text-white font-bold text-xs truncate">
              {currentUser?.name || 'Thầy Gia Sư'}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hồ sơ đã xác thực</span>
            </div>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
