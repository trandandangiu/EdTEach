// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import bgLogin from '../assets/backgroundlogin.jpg';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// Helper: xác định trang đích sau khi login thành công dựa trên role
const getRedirectPath = (roles: string[], actorType?: string): string => {
  const normRoles = (roles || []).map((r) => (typeof r === 'string' ? r : (r as any)?.code || '')).filter(Boolean);
  if (normRoles.includes('ADMIN') || actorType === 'ADMIN') return '/admin';
  if (normRoles.includes('PARENT') || actorType === 'PARENT') return '/parent/dashboard';
  if (normRoles.includes('TUTOR') || actorType === 'TUTOR') return '/tutor/dashboard';
  if (normRoles.includes('APPLICANT')) return '/apply';
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

      // Xác định dashboard chuẩn dựa trên role tài khoản
      const target = getRedirectPath(user.roles, user.actorType);

      // Chỉ chuyển về fromState NẾU trang đó phù hợp với role của tài khoản
      const fromState = (location.state as any)?.from?.pathname;
      const isRoleAllowedFromState =
        fromState &&
        fromState !== '/login' &&
        fromState !== '/' &&
        ((user.roles.includes('ADMIN') || user.actorType === 'ADMIN') ||
          ((user.roles.includes('PARENT') || user.actorType === 'PARENT') && fromState.startsWith('/parent')) ||
          ((user.roles.includes('TUTOR') || user.actorType === 'TUTOR') && fromState.startsWith('/tutor')));

      navigate(isRoleAllowedFromState ? fromState : target, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      {/* Modern neutral overlay with subtle blur */}
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-xs" />

      {/* Logo + Title */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-block">
          <span className="font-semibold text-2xl tracking-tight text-white drop-shadow-sm">
            Viet<span className="text-brand-500">Tutor</span>
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Đăng nhập hệ thống
        </h1>
        <p className="text-xs text-ink-300 max-w-xs mx-auto">
          Truy cập bàn làm việc dành cho Phụ huynh, Gia sư & Quản trị viên
        </p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-3xl border border-ink-200 shadow-2xl shadow-ink-950/20 py-8 px-6 sm:px-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
              <span className="text-xs text-danger-600 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên đăng nhập"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              disabled={loading}
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              disabled={loading}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                className="rounded-xl py-3 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="pt-3 text-center text-xs text-ink-500 border-t border-ink-100 space-y-2">
            <div>
              Chưa có tài khoản phụ huynh?{' '}
              <Link to="/register/parent" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
                Đăng ký Phụ huynh
              </Link>
            </div>
            <div>
              Bạn muốn ứng tuyển gia sư?{' '}
              <Link to="/apply" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
                Đăng ký làm Gia sư
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-ink-400">
            Hỗ trợ đăng nhập:{' '}
            <span className="font-medium text-ink-600">1900 8866</span>
          </div>
        </div>
      </div>

      {/* Back to home */}
      <div className="relative z-10 mt-6 text-center">
        <Link to="/" className="text-xs font-medium text-ink-300 hover:text-white transition">
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}