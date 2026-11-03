// frontend/src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Gamepad2,
  Award,
} from 'lucide-react';

// ★ Helper: chuẩn hoá role về string code (xử lý cả 2 dạng: string hoặc object)
const getRoleCode = (role: any): string => {
  if (typeof role === 'string') return role;
  return role?.code ?? '';
};

const getRoleName = (role: any): string => {
  if (typeof role === 'string') return role;
  return role?.name ?? role?.code ?? '';
};

const getStaffDashboardPath = (roles: string[], deptCode?: string) => {
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('STAFF_RECRUIT') || deptCode === 'DEPT_RECRUIT') return '/staff/recruit';
  if (roles.includes('STAFF_MATCHING') || deptCode === 'DEPT_MATCHING') return '/staff/matching';
  if (roles.includes('STAFF_CS') || deptCode === 'DEPT_CS') return '/staff/care';
  if (roles.includes('STAFF_TUTOR_CARE') || deptCode === 'DEPT_TUTOR_CARE') return '/staff/tutor-care';
  if (roles.includes('STAFF_ACADEMIC') || deptCode === 'DEPT_ACADEMIC') return '/staff/academic';
  if (roles.includes('STAFF_FORUM') || deptCode === 'DEPT_FORUM') return '/staff/forum';
  return '/staff/recruit';
};

export const Navbar: React.FC = () => {
  const { currentUser, switchUserRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // ★ Chuẩn hoá mảng roles thành mảng string code
  const roleCodes: string[] = (currentUser?.roles ?? []).map(getRoleCode);
  const hasRole = (code: string) => roleCodes.includes(code);

  // =========================================================================
  // 🚧 TẠM ẨN KIDS MODE — BẬT LẠI BẰNG CÁCH BỎ COMMENT
  // =========================================================================
  // if (currentUser?.actorType === 'STUDENT') {
  //   return (
  //     <header className="sticky top-0 z-40 bg-emerald-700 text-white shadow-md border-b border-emerald-800">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
  //         <div className="flex items-center gap-3">
  //           <Link to="/kids" className="flex items-center gap-2 group">
  //             <span className="w-10 h-10 rounded-2xl bg-white text-emerald-800 font-black text-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition">
  //               🌱
  //             </span>
  //             <div>
  //               <span className="font-black text-lg tracking-tight text-white block leading-tight">Góc Học Của Bé</span>
  //               <span className="text-[11px] text-emerald-200 font-medium">Bảo Nam · Lớp 4A</span>
  //             </div>
  //           </Link>
  //         </div>
  //
  //         <nav className="flex items-center gap-1 sm:gap-2">
  //           <Link to="/kids" className="...">...</Link>
  //           <Link to="/kids/games" className="...">...</Link>
  //           <Link to="/kids/trophy" className="...">...</Link>
  //         </nav>
  //
  //         <div className="flex items-center gap-2">
  //           <button onClick={() => { switchUserRole('PARENT'); navigate('/parent/dashboard'); }} className="...">
  //             <span>Về chế độ Bố Mẹ</span>
  //           </button>
  //         </div>
  //       </div>
  //     </header>
  //   );
  // }

  return (
    <>
      {/* =====================================================================
          🚧 TẠM ẨN THANH DEMO ROLE SWITCHER — Chỉ dùng khi dev test
          Bật lại bằng cách bỏ comment khối dưới
      ===================================================================== */}
      {/* <div className="bg-emerald-950 text-emerald-200 text-xs px-4 py-1.5 border-b border-emerald-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-100">Chế độ trải nghiệm:</span>
          <span className="text-emerald-300">
            {currentUser ? `${currentUser.name} (${(currentUser.roles ?? []).map(getRoleName).join(', ')})` : 'Khách vãng lai'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 hidden sm:inline text-[11px]">Chuyển vai trò:</span>
          <button onClick={() => { switchUserRole('PUBLIC'); navigate('/'); }} className="px-2 py-0.5 rounded text-[11px]">Khách</button>
          <button onClick={() => { switchUserRole('PARENT'); navigate('/parent/dashboard'); }} className="px-2 py-0.5 rounded text-[11px]">Phụ Huynh</button>
          <button onClick={() => { switchUserRole('TUTOR'); navigate('/tutor/dashboard'); }} className="px-2 py-0.5 rounded text-[11px]">Gia Sư</button>
          <button onClick={() => { switchUserRole('APPLICANT'); navigate('/apply'); }} className="px-2 py-0.5 rounded text-[11px]">Ứng Viên</button>
          <button onClick={() => { switchUserRole('ADMIN'); navigate('/admin'); }} className="px-2 py-0.5 rounded text-[11px]">Admin</button>
        </div>
      </div> */}

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-emerald-900/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-sm">
                <GraduationCap className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-emerald-950 block leading-tight">
                  Viet<span className="text-emerald-700">Tutor</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700/80">
                  Gia Sư Tinh Hoa & EdTech
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
              {/* ✅ LUỒNG 1: Tìm gia sư - LUÔN HIỆN */}
              <Link
                to="/tutors"
                className={`transition-colors py-1 ${
                  location.pathname === '/tutors'
                    ? 'text-emerald-800 border-b-2 border-emerald-800'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                Tìm Gia Sư
              </Link>

              {/* 🚧 TẠM ẨN - DIỄN ĐÀN */}
              {/* <Link to="/forum" className="...">Diễn Đàn</Link> */}

              {/* 🚧 TẠM ẨN - CỔNG NHÂN SỰ (chỉ hiện cho ADMIN) */}
              {hasRole('ADMIN') && (
                <Link
                  to="/admin"
                  className={`transition-colors py-1 flex items-center gap-1 font-bold ${
                    location.pathname.startsWith('/admin')
                      ? 'text-indigo-700 border-b-2 border-indigo-700'
                      : 'text-indigo-600 hover:text-indigo-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Admin Center</span>
                </Link>
              )}

              {/* 🚧 TẠM ẨN - STAFF PORTAL (chỉ hiện cho STAFF, không phải ADMIN) */}
              {!hasRole('ADMIN') && roleCodes.some(r => r.startsWith('STAFF_')) && (
                <Link
                  to={getStaffDashboardPath(roleCodes, currentUser?.departmentCode)}
                  className={`transition-colors py-1 flex items-center gap-1 font-bold ${
                    location.pathname.startsWith('/staff')
                      ? 'text-indigo-700 border-b-2 border-indigo-700'
                      : 'text-indigo-600 hover:text-indigo-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Cổng Nhân Sự</span>
                </Link>
              )}

              {/* ✅ LUỒNG 1: Khu vực phụ huynh */}
              {hasRole('PARENT') && (
                <>
                  <Link
                    to="/parent/dashboard"
                    className={`transition-colors py-1 ${
                      location.pathname.startsWith('/parent')
                        ? 'text-emerald-800 font-bold border-b-2 border-emerald-800'
                        : 'text-slate-600 hover:text-emerald-900'
                    }`}
                  >
                    Khu Vực Phụ Huynh
                  </Link>
                  <Link
                    to="/parent/requests/new"
                    className="text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1 font-bold"
                  >
                    <span>+ Đăng Lớp Học</span>
                  </Link>
                </>
              )}

              {/* ✅ LUỒNG 1+2: Khu vực gia sư */}
              {hasRole('TUTOR') && (
                <Link
                  to="/tutor/dashboard"
                  className={`transition-colors py-1 ${
                    location.pathname.startsWith('/tutor')
                      ? 'text-emerald-800 font-bold border-b-2 border-emerald-800'
                      : 'text-slate-600 hover:text-emerald-900'
                  }`}
                >
                  Bàn Làm Việc Gia Sư
                </Link>
              )}

              {/* ✅ LUỒNG 3: Đăng ký gia sư (public) */}
              <Link
                to="/apply"
                className="text-slate-600 hover:text-emerald-900 transition-colors py-1"
              >
                Đăng Ký Gia Sư
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* 🚧 TẠM ẨN - NÚT GÓC BÉ HỌC (Kids Mode) */}
                {/* {hasRole('PARENT') && (
                  <button
                    onClick={() => { switchUserRole('STUDENT'); navigate('/kids'); }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition"
                  >
                    <span>🧒 Bật Góc Bé Học</span>
                  </button>
                )} */}

                <div className="relative">
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition bg-slate-50"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-lg object-cover border border-emerald-200"
                    />
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-slate-800 leading-none">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {getRoleName(currentUser.roles?.[0])}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 text-xs">
                        <div className="font-bold text-slate-900">{currentUser.name}</div>
                        <div className="text-slate-500 truncate">{currentUser.email}</div>
                      </div>

                      <div className="py-1 text-xs">
                        {/* ✅ LUỒNG 1: Link phụ huynh */}
                        {hasRole('PARENT') && (
                          <Link
                            to="/parent/dashboard"
                            onClick={() => setRoleMenuOpen(false)}
                            className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                          >
                            Bảng điều khiển Phụ huynh
                          </Link>
                        )}

                        {/* ✅ LUỒNG 1+2: Link gia sư */}
                        {hasRole('TUTOR') && (
                          <Link
                            to="/tutor/dashboard"
                            onClick={() => setRoleMenuOpen(false)}
                            className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                          >
                            Bàn làm việc Gia sư
                          </Link>
                        )}

                        {/* ✅ LUỒNG 3: Link admin */}
                        {hasRole('ADMIN') && (
                          <Link
                            to="/admin"
                            onClick={() => setRoleMenuOpen(false)}
                            className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                          >
                            Quản trị viên (Admin)
                          </Link>
                        )}

                        {/* 🚧 TẠM ẨN: Link Kids Mode */}
                        {/* {hasRole('STUDENT') && (
                          <Link to="/kids" ...>Góc Học Của Bé</Link>
                        )} */}

                        {/* 🚧 TẠM ẨN: Link Forum */}
                        {/* <Link to="/forum" ...>Diễn Đàn Cộng Đồng</Link> */}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setRoleMenuOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-900 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/apply"
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-xs"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Đăng ký làm Gia sư</span>
                </Link>
                <Link
                  to="/register/parent"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition"
                >
                  Phụ huynh Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};