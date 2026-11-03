// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

// Helper: xác định trang đích sau khi login thành công dựa trên role
const getRedirectPath = (roles: string[]): string => {
  if (!roles || roles.length === 0) return '/';
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('STAFF_RECRUIT')) return '/staff/recruit';
  if (roles.includes('STAFF_MATCHING')) return '/staff/matching';
  if (roles.includes('STAFF_CS')) return '/staff/care';
  if (roles.includes('STAFF_TUTOR_CARE')) return '/staff/tutor-care';
  if (roles.includes('STAFF_ACADEMIC')) return '/staff/academic';
  if (roles.includes('STAFF_FORUM')) return '/staff/forum';
  if (roles.some((r) => r.startsWith('STAFF_'))) return '/staff/recruit';
  if (roles.includes('PARENT')) return '/parent/dashboard';
  if (roles.includes('TUTOR')) return '/tutor/dashboard';
  if (roles.includes('APPLICANT')) return '/apply';
  if (roles.includes('STUDENT')) return '/kids';
  return '/';
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(username.trim(), password);

      if (!user) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        setLoading(false);
        return;
      }

      // Ưu tiên redirect về trang trước đó nếu có (bị đá ra từ ProtectedRoute)
      const fromState = (location.state as any)?.from?.pathname;
      if (fromState && fromState !== '/login') {
        navigate(fromState, { replace: true });
        return;
      }

      const target = getRedirectPath(user.roles);
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo + Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-md">
            <GraduationCap className="w-7 h-7 text-emerald-100" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-emerald-950">
            Viet<span className="text-emerald-700">Tutor</span>
          </span>
        </Link>
        <h1 className="text-xl font-extrabold text-slate-900">
          Đăng nhập hệ thống
        </h1>
        <p className="text-xs text-slate-500">
          Nhập tài khoản được cấp để truy cập khu vực của bạn
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 space-y-5">
          {/* Error alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-xs text-rose-800 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                disabled={loading}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-800/70 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 space-y-2">
            <div>
              Chưa có tài khoản phụ huynh?{' '}
              <Link to="/register/parent" className="font-bold text-emerald-800 hover:underline">
                Đăng ký Phụ huynh
              </Link>
            </div>
            <div>
              Bạn muốn trở thành gia sư VietTutor?{' '}
              <Link to="/apply" className="font-bold text-emerald-800 hover:underline">
                Đăng ký làm Gia sư
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Quên mật khẩu? Vui lòng liên hệ hotline{' '}
            <span className="font-semibold text-slate-600">1900 8866</span>
          </div>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-6 text-center">
        <Link to="/" className="text-xs text-slate-500 hover:text-emerald-800 transition">
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}