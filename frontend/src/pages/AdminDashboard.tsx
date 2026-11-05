import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { 
  LayoutDashboard, 
  UserCheck, 
  Layers, 
  PhoneCall, 
  Users, 
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const location = useLocation();

  const navGroups = [
    {
      group: 'VẬN HÀNH',
      items: [
        { label: 'Tổng quan điều hành', path: '/admin', icon: LayoutDashboard, exact: true },
        { label: 'Tuyển dụng & Thẩm định', path: '/admin/recruit', icon: UserCheck },
        { label: 'Điều phối & Ghép lớp', path: '/admin/matching', icon: Layers },
        { label: 'Chăm sóc & Phản hồi', path: '/admin/care', icon: PhoneCall },
      ],
    },
    {
      group: 'HỆ THỐNG',
      items: [
        { label: 'Quản lý Người dùng', path: '/admin/system/users', icon: Users },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900 antialiased">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin Left Sidebar — Modern SaaS Neutral */}
        <aside className="w-full md:w-64 bg-white text-ink-900 shrink-0 border-r border-ink-200 p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="pb-4 border-b border-ink-100">
              <span className="text-[10px] uppercase font-semibold text-brand-700 tracking-wider block">
                VietTutor Command Center
              </span>
              <span className="text-base font-semibold text-ink-900 flex items-center gap-2 mt-1">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                Trung Tâm Điều Hành
              </span>
            </div>

            <nav className="space-y-5">
              {navGroups.map((g, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider px-3 block">
                    {g.group}
                  </span>
                  <div className="space-y-1">
                    {g.items.map((item, iIdx) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                      return (
                        <Link
                          key={iIdx}
                          to={item.path}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs transition duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-ink-100 text-ink-900 font-semibold shadow-2xs'
                              : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50 font-medium'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-ink-400'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200/80 text-xs text-ink-500 space-y-1">
            <div className="font-semibold text-ink-900 text-[11px]">Trạng thái hệ thống</div>
            <div className="flex items-center gap-2 text-brand-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span>Hệ thống hoạt động bình thường</span>
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
