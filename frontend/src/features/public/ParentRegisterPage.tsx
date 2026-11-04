import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { GraduationCap, ShieldCheck, CheckCircle2, User, Phone, Mail, Lock, KeyRound, Loader2, Send } from 'lucide-react';
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

  // OTP Email Verification States
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpMsg, setOtpMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setOtpMsg({ type: 'error', text: 'Vui lòng nhập đúng định dạng Gmail trước khi gửi mã.' });
      return;
    }

    setOtpLoading(true);
    setOtpMsg(null);

    try {
      const res: any = await api.auth.sendEmailOtp(email.trim(), 'PARENT_REGISTER');
      setIsOtpSent(true);
      setCountdown(60);
      if (res.debugOtp && !res.sentViaSmtp) {
        setOtpCode(res.debugOtp);
      }
      const extraHint = res.debugOtp ? ` (Mã OTP test: ${res.debugOtp})` : '';
      setOtpMsg({ type: 'success', text: `${res.message || `Đã gửi mã xác thực về Gmail ${email}`}${extraHint}` });
    } catch (err: any) {
      setOtpMsg({ type: 'error', text: err?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ 6 chữ số mã xác nhận.' });
      return;
    }

    setOtpLoading(true);
    setOtpMsg(null);

    try {
      await api.auth.verifyEmailOtp(email.trim(), otpCode.trim());
      setIsOtpVerified(true);
      setOtpMsg({ type: 'success', text: 'Xác thực Gmail thành công! Bạn có thể hoàn tất đăng ký.' });
    } catch (err: any) {
      setOtpMsg({ type: 'error', text: err?.message || 'Mã xác nhận không đúng hoặc đã hết hạn.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isOtpVerified) {
      setErrorMsg('Vui lòng gửi và xác thực mã OTP Gmail trước khi tạo tài khoản.');
      return;
    }

    setLoading(true);

    try {
      const username = (email || phone).trim().toLowerCase();
      await api.auth.registerParent({
        username,
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });

      setIsSuccess(true);
      setTimeout(async () => {
        try {
          await login(username, password);
        } catch {
          // ignore
        }
        navigate('/parent/dashboard');
      }, 1200);
    } catch (err: any) {
      console.error('Registration failed:', err);
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
              Tạo tài khoản để quản lý lịch học, nhận báo cáo tiến độ từng buổi và bảo mật bằng mã xác thực Gmail.
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
                <label className="block text-xs font-bold text-slate-700">Họ và tên phụ huynh *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Thị Mai Anh"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Số điện thoại liên hệ / Zalo *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="0988 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu đăng nhập *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* KHỐI XÁC THỰC GMAIL BẰNG MÃ OTP */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-emerald-950">
                    Địa chỉ Gmail nhận thông báo & Mã xác nhận *
                  </label>
                  {isOtpVerified && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã xác thực Gmail
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      disabled={isOtpVerified}
                      placeholder="nhapemailcuaban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white disabled:bg-slate-100"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || countdown > 0 || isOtpVerified}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1.5"
                  >
                    {otpLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {countdown > 0 ? `Gửi lại (${countdown}s)` : isOtpSent ? 'Gửi lại mã' : 'Gửi mã xác nhận'}
                    </span>
                  </button>
                </div>

                {/* Nhập mã OTP khi đã gửi */}
                {isOtpSent && !isOtpVerified && (
                  <div className="pt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Nhập 6 số mã xác nhận từ Gmail..."
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-xs font-mono font-bold tracking-widest text-center px-3 py-2.5 pl-9 border border-emerald-300 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                      />
                      <KeyRound className="w-4 h-4 text-emerald-700 absolute left-3 top-3" />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpCode.trim().length !== 6}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition shrink-0"
                    >
                      Xác nhận mã
                    </button>
                  </div>
                )}

                {otpMsg && (
                  <p className={`text-[11px] font-medium ${otpMsg.type === 'error' ? 'text-rose-600' : 'text-emerald-800'}`}>
                    {otpMsg.text}
                  </p>
                )}
              </div>

              {/* Thông tin bé cần kèm */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-extrabold text-emerald-900 mb-3">Thông tin học sinh (Bé cần kèm)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Tên của bé</label>
                    <input
                      type="text"
                      required
                      placeholder="Bảo Nam"
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
                  disabled={loading || !isOtpVerified}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất đăng ký & Khám phá gia sư</span>
                    </>
                  )}
                </button>
                {!isOtpVerified && (
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    * Bạn cần nhấn "Gửi mã xác nhận" và điền mã từ Gmail để kích hoạt nút đăng ký.
                  </p>
                )}
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
