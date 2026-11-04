import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  PlusCircle, 
  BookOpenCheck,
  HeartHandshake,
  Sparkles
} from 'lucide-react';

export default function ParentLayout() {
  const location = useLocation();
  const { currentUser } = useAuth();

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
      desc: 'Quản lý thông tin và hồ sơ học tập của con',
    },
    {
      label: 'Lịch học',
      path: '/parent/schedule',
      icon: Calendar,
      desc: 'Thời khoá biểu và lịch học của con',
    },
    {
      label: 'Yêu cầu tìm gia sư',
      path: '/parent/requests',
      icon: FileText,
      exact: true,
      desc: 'Lịch sử và trạng thái ghép lớp gia sư',
    },
    {
      label: 'Đăng yêu cầu mới',
      path: '/parent/requests/new',
      icon: PlusCircle,
      desc: 'Gửi yêu cầu tìm gia sư theo nhu cầu',
      highlight: true,
    },
    {
      label: 'Sổ liên lạc và Báo cáo',
      path: '/parent/reports',
      icon: BookOpenCheck,
      desc: 'Xem và xác nhận nhận xét từng buổi học',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Parent Left Sidebar */}
        <aside className="w-full md:w-64 bg-emerald-950 text-white shrink-0 border-r border-emerald-900/60 p-4 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="px-3 py-2 border-b border-emerald-900/80">
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest block">
                VietTutor Family
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                Khu Vực Phụ Huynh
              </span>
            </div>

            <nav className="space-y-1">
              <span className="text-[10px] font-black text-emerald-300 tracking-wider px-3 block mb-2">
                CHỨC NĂNG
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
                        : item.highlight
                          ? 'text-emerald-300 hover:bg-emerald-900/80 hover:text-white bg-emerald-900/30'
                          : 'text-emerald-200/80 hover:bg-emerald-900 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isActive 
                        ? 'text-emerald-300' 
                        : item.highlight 
                          ? 'text-emerald-300' 
                          : 'text-emerald-400'
                    }`} />
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.highlight && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-700 text-emerald-100 rounded">Mới</span>
                        )}
                      </div>
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
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Phụ huynh đồng hành</span>
            </div>
            <div className="text-white font-bold text-xs truncate">
              {currentUser?.name || 'Phụ Huynh'}
            </div>
            <div className="text-[11px] text-emerald-300">
              Đồng hành giáo dục cùng VietTutor
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
