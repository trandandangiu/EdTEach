import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { CheckCircle2, User, Phone, Mail, Lock, Loader2, Plus, Trash2, Heart, ArrowRight, ShieldCheck, Home, LayoutDashboard } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface ChildItem {
  id: string;
  fullName: string;
  grade: string;
}

const GRADE_OPTIONS = [
  { value: 'Lớp 1', label: 'Lớp 1' },
  { value: 'Lớp 2', label: 'Lớp 2' },
  { value: 'Lớp 3', label: 'Lớp 3' },
  { value: 'Lớp 4', label: 'Lớp 4' },
  { value: 'Lớp 5', label: 'Lớp 5' },
  { value: 'Lớp 6', label: 'Lớp 6' },
  { value: 'Lớp 7', label: 'Lớp 7' },
  { value: 'Lớp 8', label: 'Lớp 8' },
  { value: 'Lớp 9', label: 'Lớp 9' },
  { value: 'Lớp 10', label: 'Lớp 10' },
  { value: 'Lớp 11', label: 'Lớp 11' },
  { value: 'Lớp 12', label: 'Lớp 12' },
];

export default function ParentRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Thông tin đăng ký
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Danh sách con yêu (Hỗ trợ 1 hoặc nhiều con)
  const [children, setChildren] = useState<ChildItem[]>([
    { id: 'child-1', fullName: '', grade: 'Lớp 1' },
  ]);

  // Validation lỗi đối chiếu DB
  const [errors, setErrors] = useState<{ username?: string; phone?: string; email?: string; password?: string }>({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Thêm một con yêu mới
  const handleAddChild = () => {
    setChildren((prev) => [
      ...prev,
      { id: `child-${Date.now()}`, fullName: '', grade: 'Lớp 1' },
    ]);
  };

  // Xóa bớt một con yêu
  const handleRemoveChild = (id: string) => {
    if (children.length <= 1) return;
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  // Cập nhật thông tin con
  const handleUpdateChild = (id: string, field: 'fullName' | 'grade', value: string) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Tự động kiểm tra trùng username với database khi người dùng rời ô nhập (onBlur)
  const handleCheckUsername = async () => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return;
    setCheckingUsername(true);
    try {
      const res = await api.auth.checkAvailability({ username: trimmed });
      if (res && res.checks && res.checks.username === false) {
        setErrors((prev) => ({
          ...prev,
          username: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, username: undefined }));
      }
    } catch {
      // ignore
    } finally {
      setCheckingUsername(false);
    }
  };

  // Kiểm tra trùng SĐT
  const handleCheckPhone = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    try {
      const res = await api.auth.checkAvailability({ phone: trimmed });
      if (res && res.checks && res.checks.phone === false) {
        setErrors((prev) => ({
          ...prev,
          phone: 'Số điện thoại này đã được sử dụng trong hệ thống.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    } catch {
      // ignore
    }
  };

  // Kiểm tra trùng Email
  const handleCheckEmail = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    try {
      const res = await api.auth.checkAvailability({ email: trimmed });
      if (res && res.checks && res.checks.email === false) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email này đã được sử dụng. Vui lòng dùng email khác.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    } catch {
      // ignore
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (errors.username || errors.phone || errors.email) {
      setErrorMsg('Vui lòng điều chỉnh các thông tin bị trùng lặp trước khi gửi.');
      return;
    }

    setLoading(true);

    try {
      // Lọc danh sách con yêu đã điền tên
      const validChildren = children
        .map((c) => ({ fullName: c.fullName.trim(), grade: c.grade }))
        .filter((c) => c.fullName.length > 0);

      const finalUsername = username.trim().toLowerCase();
      const finalPassword = password.trim();

      await api.auth.registerParent({
        username: finalUsername,
        password: finalPassword,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        children: validChildren,
      });

      // Tự động đăng nhập luôn để phụ huynh vào bảng điều khiển
      try {
        await login(finalUsername, finalPassword);
      } catch (loginErr) {
        console.log('Auto login notice:', loginErr);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900 antialiased">
      <Navbar />

      <div className="flex-1 max-w-xl mx-auto px-5 sm:px-8 py-10 w-full flex flex-col justify-center">
        <Card variant="static" padding="lg" className="shadow-xl shadow-ink-200/50 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-widest">
              Dành cho phụ huynh
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
              Đăng Ký Tài Khoản Phụ Huynh
            </h1>
            <p className="text-xs text-ink-500 max-w-md mx-auto leading-relaxed">
              Tạo tài khoản nhanh chóng và bắt đầu kết nối gia sư, theo dõi lịch học cho các bé ngay lập tức.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-3xl font-semibold border border-brand-200">
                ✓
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-ink-900">Tạo tài khoản Phụ Huynh thành công!</h2>
                <p className="text-xs text-ink-600 max-w-md mx-auto leading-relaxed">
                  Chào mừng <strong>{fullName}</strong>! Tài khoản của bạn đã sẵn sàng sử dụng. Bạn có thể vào ngay Bàn làm việc phụ huynh để gửi yêu cầu tìm gia sư hoặc thiết lập thông tin cho các bé.
                </p>
              </div>

              <div className="p-3.5 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs text-brand-800 font-medium inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Bạn có thể tùy ý sửa đổi thông tin cá nhân và mật khẩu bất cứ lúc nào tại mục Thông tin cá nhân.</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={() => navigate('/parent/dashboard')}
                  className="rounded-xl px-6 py-2.5 text-xs font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Vào Bàn làm việc Phụ huynh</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="rounded-xl px-6 py-2.5 text-xs font-semibold"
                >
                  <Home className="w-4 h-4" />
                  <span>Về trang chủ</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-danger-600 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* 1. Họ và tên phụ huynh */}
              <Input
                label="Họ và tên phụ huynh *"
                placeholder="Ví dụ: Nguyễn Thị Mai Anh"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />

              {/* 2. Tên đăng nhập (Username) + Đối chiếu DB */}
              <div>
                <div className="relative">
                  <Input
                    label="Tên đăng nhập (Username) *"
                    placeholder="Ví dụ: maianh_nguyen"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                    }}
                    onBlur={handleCheckUsername}
                    icon={<User className="w-4 h-4" />}
                    required
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-8 text-ink-400">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="text-[11px] font-medium text-danger-500 mt-1">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Mật khẩu & Xác nhận mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Mật khẩu *"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Xác nhận mật khẩu *"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>

              {/* 3. Số điện thoại & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Số điện thoại / Zalo *"
                    type="tel"
                    placeholder="0988 123 456"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    onBlur={handleCheckPhone}
                    icon={<Phone className="w-4 h-4" />}
                    required
                  />
                  {errors.phone && (
                    <p className="text-[11px] font-medium text-danger-500 mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="Địa chỉ Email *"
                    type="email"
                    placeholder="phuhuynh@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onBlur={handleCheckEmail}
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />
                  {errors.email && (
                    <p className="text-[11px] font-medium text-danger-500 mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Khối Con Yêu — Có nút "+ Thêm con yêu" */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-brand-600 fill-brand-100" />
                    <span className="text-xs font-semibold text-ink-900">
                      Thông tin con yêu ({children.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm con yêu</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {children.map((child, index) => (
                    <div
                      key={child.id}
                      className="p-3.5 bg-ink-50/70 border border-ink-200/80 rounded-2xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-xs text-ink-500 font-medium">
                        <span>Bé thứ {index + 1}</span>
                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(child.id)}
                            title="Xóa bé này"
                            className="text-ink-400 hover:text-danger-500 p-1 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          placeholder="Họ và tên bé (ví dụ: Bảo Nam)"
                          value={child.fullName}
                          onChange={(e) => handleUpdateChild(child.id, 'fullName', e.target.value)}
                        />

                        <Select
                          value={child.grade}
                          onChange={(e) => handleUpdateChild(child.id, 'grade', e.target.value)}
                          options={GRADE_OPTIONS}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading || !!errors.username || !!errors.phone || !!errors.email}
                  className="rounded-xl py-3 text-sm font-semibold cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang khởi tạo tài khoản...</span>
                    </>
                  ) : (
                    <span>Tạo Tài Khoản Phụ Huynh Ngay</span>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-ink-100 text-center text-xs text-ink-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
