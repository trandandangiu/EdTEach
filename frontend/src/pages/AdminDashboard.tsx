import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { 
  LayoutDashboard, 
  UserCheck, 
  Layers, 
  PhoneCall, 
  BookOpenCheck, 
  MessageSquare, 
  Users, 
  Building2, 
  Database, 
  ShieldAlert, 
  KeyRound,
  GraduationCap
} from 'lucide-react';

export default function AdminDashboard() {
  const location = useLocation();

  const navGroups = [
    {
      group: 'VẬN HÀNH & GIÁO DỤC',
      items: [
        { label: 'Tổng quan điều hành', path: '/admin', icon: LayoutDashboard, exact: true },
        { label: 'Tuyển dụng & Thẩm định', path: '/admin/recruit', icon: UserCheck },
        { label: 'Điều phối & Lớp học', path: '/admin/matching', icon: Layers },
        { label: 'CSKH & Giám sát 24/48h', path: '/admin/care', icon: PhoneCall },
        // [FUTURE] { label: 'Học thuật & Ngân hàng đề', path: '/admin/academic', icon: BookOpenCheck },
        // [FUTURE] { label: 'Kiểm duyệt diễn đàn', path: '/admin/forum-mod', icon: MessageSquare },
      ],
    },
    {
      group: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        // [FUTURE] { label: 'Người dùng & Phân quyền', path: '/admin/system/users', icon: Users },
        // [FUTURE] { label: 'Cơ cấu phòng ban', path: '/admin/system/departments', icon: Building2 },
        // [FUTURE] { label: 'Trình duyệt CSDL (Tables)', path: '/admin/system/database', icon: Database },
        // [FUTURE] { label: 'Nhật ký kiểm toán (Audit)', path: '/admin/system/audit-logs', icon: ShieldAlert },
        // [FUTURE] { label: 'Phiên hoạt động (Sessions)', path: '/admin/system/sessions', icon: KeyRound },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin Left Sidebar: Deep green & crisp white */}
        <aside className="w-full md:w-64 bg-emerald-950 text-white shrink-0 border-r border-emerald-900/60 p-4 space-y-6">
          <div className="px-3 py-2 border-b border-emerald-900/80">
            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest block">VietTutor Command Center</span>
            <span className="text-sm font-bold text-white">Trung Tâm Điều Hành</span>
          </div>

          <nav className="space-y-6">
            {navGroups.filter(g => g.items.length > 0).map((g, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] font-black text-emerald-300 tracking-wider px-3 block">
                  {g.group}
                </span>
                <div className="space-y-1 pt-1">
                  {g.items.map((item, iIdx) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);

                    return (
                      <Link
                        key={iIdx}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-800 text-white shadow-xs font-bold'
                            : 'text-emerald-200/80 hover:bg-emerald-900 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
