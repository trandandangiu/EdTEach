import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Briefcase, ArrowRight, Lock, KeyRound } from 'lucide-react';

const STAFF_PRESETS = [
  { role: 'STAFF_RECRUIT', dept: 'DEPT_RECRUIT', username: 'staff_recruit', label: 'Tuyển dụng & Thẩm định', icon: '📋', path: '/staff/recruit' },
  { role: 'STAFF_MATCHING', dept: 'DEPT_MATCHING', username: 'staff_matching', label: 'Điều phối & Ghép lớp', icon: '🔄', path: '/staff/matching' },
  { role: 'STAFF_CS', dept: 'DEPT_CS', username: 'staff_care', label: 'CSKH (Phụ huynh)', icon: '📞', path: '/staff/care' },
  { role: 'STAFF_TUTOR_CARE', dept: 'DEPT_TUTOR_CARE', username: 'staff_tutor_care', label: 'Chăm sóc Gia sư', icon: '🤝', path: '/staff/tutor-care' },
  { role: 'STAFF_ACADEMIC', dept: 'DEPT_ACADEMIC', username: 'staff_academic', label: 'Giám sát Học thuật', icon: '📚', path: '/staff/academic' },
  { role: 'STAFF_FORUM', dept: 'DEPT_FORUM', username: 'staff_forum', label: 'Kiểm duyệt Diễn đàn', icon: '🛡️', path: '/staff/forum' },
];

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const success = await login(identifier, password);
      if (success) {
        // Tự động nhận diện hướng chuyển tiếp
        const staffDept = localStorage.getItem('viettutor_staff_dept');
        const match = STAFF_PRESETS.find(p => p.dept === staffDept || identifier.includes(p.username));
        if (match) {
          navigate(match.path, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStaffLogin = async (preset: typeof STAFF_PRESETS[0]) => {
    try {
      setLoading(true);
      setError(null);
      await login(preset.username, 'password123');
      navigate(preset.path, { replace: true });
    } catch (err: any) {
      setError(`Không thể đăng nhập ${preset.label}: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Viet<span className="text-indigo-400">Tutor Staff</span>
          </span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-2">
          Cổng Đăng Nhập Nhân Sự
        </h1>
        <p className="text-xs text-slate-400">
          Dành riêng cho cán bộ, chuyên viên 6 bộ phận vận hành & Quản trị viên
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Form đăng nhập chính */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tài khoản nhân sự (Username / Email / SĐT)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ví dụ: staff_recruit hoặc email nội bộ"
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Cán Bộ'}</span>
            </button>
          </form>

          {/* Đăng nhập nhanh kiểm thử cho 6 bộ phận */}
          <div className="pt-4 border-t border-slate-700/60">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              ⚡ Truy cập nhanh theo bộ phận (Demo Môi Trường):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_PRESETS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickStaffLogin(p)}
                  className="p-2.5 bg-slate-900/80 hover:bg-slate-700/70 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-xs font-bold text-slate-200 truncate">{p.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{p.username}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/40 text-center text-xs text-slate-400 flex items-center justify-between">
            <Link to="/" className="text-slate-400 hover:text-white transition">
              ← Về trang chủ
            </Link>
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition">
              Đăng nhập Phụ huynh / Gia sư →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
