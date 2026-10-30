import React from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ClipboardCheck,
  GitPullRequest,
  Headphones,
  GraduationCap,
  BookOpen,
  MessageSquare,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Clock,
  AlertTriangle,
  FolderOpen,
  HelpCircle,
  Award,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface DeptConfig {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  bgGradient: string;
  basePath: string;
  menus: MenuItem[];
}

const DEPT_CONFIGS: Record<string, DeptConfig> = {
  STAFF_RECRUIT: {
    code: 'DEPT_RECRUIT',
    name: 'Phòng Tuyển Dụng & Thẩm Định',
    shortName: 'Tuyển Dụng',
    icon: '📋',
    color: 'emerald',
    bgGradient: 'from-emerald-950 via-slate-900 to-slate-950',
    basePath: '/staff/recruit',
    menus: [
      { name: 'Kanban Tuyển Dụng', path: '/staff/recruit', icon: <ClipboardCheck className="w-4 h-4" /> },
      { name: 'Chấm Thi Ứng Viên', path: '/staff/recruit/grades', icon: <Award className="w-4 h-4" /> },
      { name: 'Quản Lý Ứng Tuyển', path: '/staff/recruit/candidates', icon: <Users className="w-4 h-4" /> },
      { name: 'Nhân Sự Phòng Ban', path: '/staff/recruit/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
  STAFF_MATCHING: {
    code: 'DEPT_MATCHING',
    name: 'Phòng Điều Phối & Ghép Lớp',
    shortName: 'Điều Phối',
    icon: '🔄',
    color: 'blue',
    bgGradient: 'from-blue-950 via-slate-900 to-slate-950',
    basePath: '/staff/matching',
    menus: [
      { name: 'Hàng Đợi Ghép Lớp', path: '/staff/matching', icon: <GitPullRequest className="w-4 h-4" /> },
      { name: 'Quản Lý Lớp Học', path: '/staff/matching/classes', icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: 'Lớp Chờ Duyệt', path: '/staff/matching/pending-classes', icon: <Clock className="w-4 h-4" /> },
      { name: 'Nhân Sự Phòng Ban', path: '/staff/matching/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
  STAFF_CS: {
    code: 'DEPT_CS',
    name: 'Phòng CSKH (Phụ Huynh)',
    shortName: 'CSKH',
    icon: '📞',
    color: 'amber',
    bgGradient: 'from-amber-950 via-slate-900 to-slate-950',
    basePath: '/staff/care',
    menus: [
      { name: 'Phiếu Chăm Sóc KH', path: '/staff/care', icon: <Headphones className="w-4 h-4" /> },
      { name: 'Báo Cáo >24h Chưa Duyệt', path: '/staff/care/unconfirmed', icon: <AlertTriangle className="w-4 h-4" /> },
      { name: 'Nhân Sự Phòng Ban', path: '/staff/care/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
  STAFF_TUTOR_CARE: {
    code: 'DEPT_TUTOR_CARE',
    name: 'Phòng Chăm Sóc Gia Sư',
    shortName: 'CS Gia Sư',
    icon: '🤝',
    color: 'teal',
    bgGradient: 'from-teal-950 via-slate-900 to-slate-950',
    basePath: '/staff/tutor-care',
    menus: [
      { name: 'Giám Sát Báo Cáo', path: '/staff/tutor-care', icon: <GraduationCap className="w-4 h-4" /> },
      { name: 'Cảnh Báo Quá Hạn', path: '/staff/tutor-care/overdue', icon: <Clock className="w-4 h-4" /> },
      { name: 'Xử Lý Vi Phạm', path: '/staff/tutor-care/violations', icon: <AlertTriangle className="w-4 h-4" /> },
      { name: 'Nhân Sự Phòng Ban', path: '/staff/tutor-care/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
  STAFF_ACADEMIC: {
    code: 'DEPT_ACADEMIC',
    name: 'Phòng Giám Sát Học Thuật',
    shortName: 'Học Thuật',
    icon: '📚',
    color: 'purple',
    bgGradient: 'from-purple-950 via-slate-900 to-slate-950',
    basePath: '/staff/academic',
    menus: [
      { name: 'Ngân Hàng Đề Thi', path: '/staff/academic', icon: <BookOpen className="w-4 h-4" /> },
      { name: 'Quản Lý Mini-Game', path: '/staff/academic/games', icon: <Sparkles className="w-4 h-4" /> },
      { name: 'Phiếu Học Thuật Cần Xử Lý', path: '/staff/academic/cases', icon: <AlertTriangle className="w-4 h-4" /> },
      { name: 'Nhân Sự Phòng Ban', path: '/staff/academic/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
  STAFF_FORUM: {
    code: 'DEPT_FORUM',
    name: 'Ban Kiểm Duyệt Diễn Đàn',
    shortName: 'Diễn Đàn',
    icon: '🛡️',
    color: 'indigo',
    bgGradient: 'from-indigo-950 via-slate-900 to-slate-950',
    basePath: '/staff/forum',
    menus: [
      { name: 'Kiểm Duyệt Bài Viết', path: '/staff/forum', icon: <MessageSquare className="w-4 h-4" /> },
      { name: 'Báo Cáo Vi Phạm (Flags)', path: '/staff/forum/flags', icon: <AlertTriangle className="w-4 h-4" /> },
      { name: 'Nhân Sự Phòng Ban', path: '/staff/forum/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
};

export default function StaffLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRoles = currentUser?.roles || [];
  const isAdmin = userRoles.includes('ADMIN');

  // Xác định department config dựa trên role hoặc path hiện tại
  const currentPath = location.pathname;
  let activeRole = 'STAFF_RECRUIT';

  if (currentPath.startsWith('/staff/matching')) activeRole = 'STAFF_MATCHING';
  else if (currentPath.startsWith('/staff/care')) activeRole = 'STAFF_CS';
  else if (currentPath.startsWith('/staff/tutor-care')) activeRole = 'STAFF_TUTOR_CARE';
  else if (currentPath.startsWith('/staff/academic')) activeRole = 'STAFF_ACADEMIC';
  else if (currentPath.startsWith('/staff/forum')) activeRole = 'STAFF_FORUM';
  else if (currentPath.startsWith('/staff/recruit')) activeRole = 'STAFF_RECRUIT';
  else {
    // Fallback theo role của user
    const matched = Object.keys(DEPT_CONFIGS).find(r => userRoles.includes(r));
    if (matched) activeRole = matched;
  }

  const currentDept = DEPT_CONFIGS[activeRole] || DEPT_CONFIGS.STAFF_RECRUIT;

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <header className={`bg-gradient-to-r ${currentDept.bgGradient} border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white group-hover:scale-105 transition">
                <span>{currentDept.icon}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight leading-none text-white">
                  Viet<span className="text-emerald-400">Tutor Staff</span>
                </span>
                <span className="text-[10px] text-slate-300 font-semibold tracking-wide uppercase mt-0.5">
                  {currentDept.shortName}
                </span>
              </div>
            </Link>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <span className="text-xs font-bold text-slate-300 hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
              <span>{currentDept.name}</span>
            </span>
          </div>

          {/* Right Header Navigation & User info */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px] font-semibold">
                <span className="text-slate-400 px-2">Chuyển ban:</span>
                {Object.entries(DEPT_CONFIGS).map(([key, cfg]) => (
                  <Link
                    key={key}
                    to={cfg.basePath}
                    className={`px-2 py-1 rounded-lg transition ${
                      activeRole === key ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cfg.shortName}
                  </Link>
                ))}
                <Link
                  to="/admin"
                  className="px-2 py-1 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-white/10 font-bold border-l border-white/10 ml-1"
                >
                  Admin Center →
                </Link>
              </div>
            )}

            <div className="flex items-center gap-2 pl-2">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block">
                  {currentUser?.name || 'Chuyên viên'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {isAdmin ? 'Quản Trị Viên' : currentDept.shortName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-white/10 transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Subnav (Horizontal Tabs) */}
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {currentDept.menus.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === currentDept.basePath}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Staff Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 bg-slate-950">
        <span>VietTutor Internal Staff Operation System · Phiên bản 2.5 Multi-Department RBAC</span>
      </footer>
    </div>
  );
}
