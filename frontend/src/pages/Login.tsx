import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, switchUserRole } = useAuth();

  const [email, setEmail] = useState('maianh.nguyen@gmail.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<'PARENT' | 'TUTOR' | 'STUDENT' | 'ADMIN' | 'APPLICANT'>('PARENT');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || (
    selectedRole === 'PARENT' ? '/parent/dashboard' :
    selectedRole === 'TUTOR' ? '/tutor/dashboard' :
    selectedRole === 'STUDENT' ? '/kids' :
    selectedRole === 'ADMIN' ? '/admin' : '/apply'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, selectedRole);
    setLoading(false);
    navigate(from, { replace: true });
  };

  const handleQuickDemo = (role: 'PARENT' | 'TUTOR' | 'STUDENT' | 'ADMIN' | 'APPLICANT') => {
    switchUserRole(role);
    if (role === 'PARENT') navigate('/parent/dashboard');
    else if (role === 'TUTOR') navigate('/tutor/dashboard');
    else if (role === 'STUDENT') navigate('/kids');
    else if (role === 'ADMIN') navigate('/admin');
    else navigate('/apply');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-sm">
            <GraduationCap className="w-6 h-6 text-emerald-100" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-emerald-950">
            Viet<span className="text-emerald-700">Tutor</span>
          </span>
        </Link>
        <h2 className="text-xl font-extrabold text-slate-900">
          Đăng nhập hệ thống EdTech
        </h2>
        <p className="text-xs text-slate-500">
          Chọn vai trò hoặc đăng nhập bằng tài khoản được cấp
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 space-y-6">
          {/* Quick Demo Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ⚡ Đăng nhập nhanh kiểm thử theo vai trò:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('PARENT')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-left transition flex items-center justify-between"
              >
                <span>👨‍👩‍👧 Phụ Huynh</span>
                <span className="text-[10px] text-emerald-700 font-normal">→ Vào ngay</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('TUTOR')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-left transition flex items-center justify-between"
              >
                <span>🎓 Gia Sư</span>
                <span className="text-[10px] text-emerald-700 font-normal">→ Vào ngay</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('STUDENT')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-left transition flex items-center justify-between"
              >
                <span>🧒 Học Sinh (Kids)</span>
                <span className="text-[10px] text-emerald-700 font-normal">→ Vào ngay</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-left transition flex items-center justify-between"
              >
                <span>⚙️ Quản Trị Viên</span>
                <span className="text-[10px] text-emerald-700 font-normal">→ Vào ngay</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400">Hoặc điền biểu mẫu</span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò tài khoản</label>
              <select
                value={selectedRole}
                onChange={(e: any) => setSelectedRole(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
              >
                <option value="PARENT">Phụ huynh (Quản lý lớp của con)</option>
                <option value="TUTOR">Gia sư chính thức</option>
                <option value="STUDENT">Học sinh (Kids token)</option>
                <option value="ADMIN">Ban Quản trị & Điều hành</option>
                <option value="APPLICANT">Ứng viên tuyển dụng gia sư</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email hoặc Số điện thoại</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-2"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Chưa có tài khoản phụ huynh?{' '}
            <Link to="/register/parent" className="font-bold text-emerald-800 hover:underline">
              Đăng ký miễn phí tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
