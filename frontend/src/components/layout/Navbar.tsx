import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  ChevronDown,
  Users,
  GraduationCap,
  ShieldCheck,
  User,
  Settings,
} from 'lucide-react';
import { Button } from '../ui/Button';

// Helper: chuẩn hoá role về string code
const getRoleCode = (role: any): string => {
  if (typeof role === 'string') return role;
  return role?.code ?? '';
};

const getRoleName = (role: any): string => {
  if (typeof role === 'string') return role;
  return role?.name ?? role?.code ?? '';
};

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleCodes: string[] = (currentUser?.roles ?? []).map(getRoleCode);
  const hasRole = (code: string) => roleCodes.includes(code);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-ink-200/60">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          {/* Logo text only, no colored box as specified */}
          <Link to="/" className="flex items-center gap-1.5 group">
            <span className="font-semibold text-lg sm:text-xl tracking-tight text-ink-900">
              Viet<span className="text-brand-600">Tutor</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-600">
            {/* 1. Nếu là GIA SƯ: Hiện Bàn Làm Việc Gia Sư */}
            {currentUser && hasRole('TUTOR') && !hasRole('ADMIN') && (
              <Link
                to="/tutor/dashboard"
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  location.pathname.startsWith('/tutor')
                    ? 'text-ink-900 font-semibold'
                    : 'hover:text-ink-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <span>Bàn Làm Việc Gia Sư</span>
              </Link>
            )}

            {/* 2. Nếu là PHỤ HUYNH: Hiện Bàn Làm Việc Phụ Huynh */}
            {currentUser && hasRole('PARENT') && !hasRole('ADMIN') && !hasRole('TUTOR') && (
              <Link
                to="/parent/dashboard"
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  location.pathname.startsWith('/parent')
                    ? 'text-ink-900 font-semibold'
                    : 'hover:text-ink-900'
                }`}
              >
                <Users className="w-4 h-4 text-brand-600" />
                <span>Bàn Làm Việc Phụ Huynh</span>
              </Link>
            )}

            {/* 3. Nếu là ADMIN */}
            {hasRole('ADMIN') && (
              <Link
                to="/admin"
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'text-ink-900 font-semibold'
                    : 'hover:text-ink-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Quản trị hệ thống</span>
              </Link>
            )}

            {/* 4. Khách vãng lai */}
            {!currentUser && (
              <>
                <Link
                  to="/tutors"
                  className={`transition-colors py-1 ${
                    location.pathname === '/tutors'
                      ? 'text-ink-900 font-semibold'
                      : 'hover:text-ink-900'
                  }`}
                >
                  Tìm Gia Sư
                </Link>
                <Link
                  to="/apply"
                  className={`transition-colors py-1 ${
                    location.pathname === '/apply'
                      ? 'text-ink-900 font-semibold'
                      : 'hover:text-ink-900'
                  }`}
                >
                  Đăng Ký Làm Gia Sư
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-ink-200 hover:border-ink-300 transition bg-white cursor-pointer"
              >
                <img
                  src={
                    currentUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                  }
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-ink-200"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-ink-900 leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-ink-500 font-medium mt-0.5">
                    {getRoleName(currentUser.roles?.[0])}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-ink-200 rounded-2xl shadow-xl shadow-ink-200/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-ink-100 text-xs">
                    <div className="font-semibold text-ink-900">{currentUser.name}</div>
                    <div className="text-ink-500 truncate">{currentUser.email}</div>
                  </div>

                  <div className="py-1 text-xs">
                    {/* Bàn làm việc theo vai trò */}
                    {hasRole('PARENT') && (
                      <Link
                        to="/parent/dashboard"
                        onClick={() => setRoleMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-ink-700 hover:bg-ink-50 hover:text-ink-900 font-medium"
                      >
                        <Users className="w-3.5 h-3.5 text-brand-600" />
                        <span>Bàn làm việc Phụ huynh</span>
                      </Link>
                    )}

                    {hasRole('TUTOR') && (
                      <Link
                        to="/tutor/dashboard"
                        onClick={() => setRoleMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-ink-700 hover:bg-ink-50 hover:text-ink-900 font-medium"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                        <span>Bàn làm việc Gia sư</span>
                      </Link>
                    )}

                    {hasRole('ADMIN') && (
                      <Link
                        to="/admin"
                        onClick={() => setRoleMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-ink-700 hover:bg-ink-50 hover:text-ink-900 font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        <span>Bàn làm việc Quản trị viên</span>
                      </Link>
                    )}

                    {/* Trang thông tin cá nhân & đổi mật khẩu cho tất cả người dùng */}
                    <Link
                      to="/profile"
                      onClick={() => setRoleMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-ink-700 hover:bg-brand-50 hover:text-brand-900 font-medium border-t border-ink-100/70 mt-1 pt-2"
                    >
                      <User className="w-3.5 h-3.5 text-ink-500" />
                      <span>Thông tin cá nhân & Đổi MK</span>
                    </Link>
                  </div>

                  <div className="border-t border-ink-100 pt-1">
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-danger-500 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-ink-600 hover:text-ink-900 px-3 py-2 transition"
              >
                Đăng nhập
              </Link>
              <Link to="/register/parent">
                <Button variant="primary" size="sm">
                  Đăng ký ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};