import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { GraduationCap, ShieldCheck, CheckCircle2, User, Phone, Mail, Lock } from 'lucide-react';

import { api } from '../../services/api';

export default function ParentRegisterPage() {
  const navigate = useNavigate();
  const { switchUserRole, login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('Lớp 4');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const username = (email || phone).trim().toLowerCase();
      await api.auth.registerParent({
        username,
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(async () => {
        await login(username, password);
        switchUserRole('PARENT');
        navigate('/parent/dashboard');
      }, 1200);
    } catch (err: any) {
      console.error('Registration failed:', err);
      // If backend fails due to network/duplicate, fallback gracefully
      setErrorMsg(err?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Dành Cho Phụ Huynh</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Đăng Ký Tài Khoản Phụ Huynh
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tạo tài khoản để quản lý lịch học, nhận báo cáo tiến độ từng buổi và cấp tài khoản làm bài cho bé.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-lg font-bold text-slate-900">Đăng ký thành công!</h2>
              <p className="text-xs text-slate-500">Đang chuyển bạn đến Bảng điều khiển phụ huynh...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Họ và tên phụ huynh</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Số điện thoại Zalo</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email nhận báo cáo</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-extrabold text-emerald-900 mb-3">Thông tin học sinh (Bé cần kèm)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Tên của bé</label>
                    <input
                      type="text"
                      required
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Khối lớp hiện tại</label>
                    <select
                      value={childGrade}
                      onChange={(e) => setChildGrade(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                    >
                      <option value="Tiền Tiểu Học">Chuẩn bị vào Lớp 1</option>
                      <option value="Lớp 1">Lớp 1</option>
                      <option value="Lớp 2">Lớp 2</option>
                      <option value="Lớp 3">Lớp 3</option>
                      <option value="Lớp 4">Lớp 4</option>
                      <option value="Lớp 5">Lớp 5</option>
                      <option value="Lớp 6">Lớp 6</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất đăng ký & Khám phá gia sư</span>
                </button>
              </div>

              <div className="text-center text-xs text-slate-500 pt-2">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-bold text-emerald-800 hover:underline">
                  Đăng nhập tại đây
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
