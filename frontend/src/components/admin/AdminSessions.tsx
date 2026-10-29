import React from 'react';
import { KeyRound, ShieldCheck, Laptop, Smartphone, AlertCircle } from 'lucide-react';

export default function AdminSessions() {
  const sessions = [
    {
      id: 'sess-01',
      device: 'MacBook Pro 16" (Chrome 131)',
      location: 'Hà Nội, Việt Nam',
      user: 'Quản Trị Viên Hệ Thống (admin@viettutor.edu.vn)',
      ip: '118.70.12.44',
      status: 'CURRENT',
      lastActive: 'Vừa xong',
    },
    {
      id: 'sess-02',
      device: 'iPhone 15 Pro (Safari)',
      location: 'Hà Nội, Việt Nam',
      user: 'Chị Mai Anh (maianh.nguyen@gmail.com)',
      ip: '171.244.5.89',
      status: 'ACTIVE',
      lastActive: '12 phút trước',
    },
    {
      id: 'sess-03',
      device: 'iPad Air 5 (VietTutor Kids App)',
      location: 'Hà Nội, Việt Nam',
      user: 'Bé Bảo Nam (Token Học Sinh)',
      ip: '171.244.5.89',
      status: 'ACTIVE',
      lastActive: '25 phút trước',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">An Ninh Phiên Đăng Nhập</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Phiên Hoạt Động & Quản Lý Token
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi các phiên đăng nhập thời gian thực và quản lý token ủy quyền học tập của học sinh.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
                {sess.device.includes('iPhone') || sess.device.includes('iPad') ? (
                  <Smartphone className="w-5 h-5" />
                ) : (
                  <Laptop className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900">{sess.device}</h4>
                  {sess.status === 'CURRENT' && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Phiên hiện tại của bạn
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mt-0.5">{sess.user}</p>
                <div className="text-slate-400 text-[11px] mt-1">
                  Địa điểm: {sess.location} · IP: {sess.ip} · Hoạt động: {sess.lastActive}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <span className="font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
                Đang trực tuyến
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
