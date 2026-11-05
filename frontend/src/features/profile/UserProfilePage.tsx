import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  ShieldCheck,
  KeyRound,
  FileText,
  Loader2,
  ArrowRight
} from 'lucide-react';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Form Thông tin cá nhân
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  // Form Đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Trạng thái thông báo
  const [infoMessage, setInfoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || (currentUser as any).fullName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.avatar || (currentUser as any).avatarUrl || '');
      setLocation((currentUser as any).location || (currentUser as any).parentProfile?.province || (currentUser as any).tutorProfile?.province || '');
      setBio((currentUser as any).tutorProfile?.bio || '');
    }
  }, [currentUser]);

  // Helper: Xác định đường dẫn bàn làm việc phù hợp với vai trò
  const getDashboardRoute = () => {
    const roles: string[] = (currentUser?.roles || []).map((r: any) => typeof r === 'string' ? r : r?.code);
    if (roles.includes('ADMIN')) return { path: '/admin', label: 'Bàn Làm Việc Quản Trị Viên' };
    if (roles.includes('TUTOR')) return { path: '/tutor/dashboard', label: 'Bàn Làm Việc Gia Sư' };
    if (roles.includes('PARENT')) return { path: '/parent/dashboard', label: 'Bàn Làm Việc Phụ Huynh' };
    return { path: '/', label: 'Trang Chủ' };
  };

  const dashboardInfo = getDashboardRoute();

  // Xử lý chọn ảnh đại diện từ thiết bị
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setInfoMessage({ type: 'error', text: 'Kích thước ảnh không được vượt quá 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý lưu thông tin cá nhân
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    setInfoLoading(true);

    try {
      await api.auth.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl || undefined,
        location: location.trim(),
        bio: bio.trim() || undefined,
      });

      setInfoMessage({
        type: 'success',
        text: 'Cập nhật thông tin cá nhân thành công!',
      });
    } catch (err: any) {
      setInfoMessage({
        type: 'error',
        text: err?.message || 'Không thể cập nhật thông tin. Vui lòng kiểm tra lại.',
      });
    } finally {
      setInfoLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);

    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setPwdLoading(true);

    try {
      await api.auth.changePassword({
        oldPassword,
        newPassword,
      });

      setPwdMessage({
        type: 'success',
        text: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.',
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPwdMessage({
        type: 'error',
        text: err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.',
      });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900 antialiased">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-5 sm:px-8 py-8 w-full space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-ink-200 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-widest">
              Tài Khoản & Cài Đặt
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              Thông Tin Cá Nhân
            </h1>
            <p className="text-xs text-ink-500">
              Quản lý hồ sơ cá nhân, số điện thoại, khu vực sinh sống và bảo mật mật khẩu tài khoản.
            </p>
          </div>

          {/* Ô Bàn làm việc */}
          <Link to={dashboardInfo.path}>
            <Button variant="primary" size="md" className="flex items-center gap-2 shadow-xs">
              <LayoutDashboard className="w-4 h-4" />
              <span>{dashboardInfo.label}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </Link>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-ink-200 gap-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Điều chỉnh thông tin cá nhân</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi mật khẩu tài khoản</span>
          </button>
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === 'info' && (
          <Card variant="static" padding="lg" className="space-y-6">
            {infoMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
                  infoMessage.type === 'success'
                    ? 'bg-brand-50 border-brand-200 text-brand-800'
                    : 'bg-rose-50 border-rose-200 text-danger-600'
                }`}
              >
                {infoMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger-600" />
                )}
                <span>{infoMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Profile Avatar & Preview từ thiết bị */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-ink-100">
                <div className="relative group shrink-0">
                  <img
                    src={
                      avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
                    }
                    alt={fullName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-brand-300 shadow-xs"
                  />
                  <label
                    htmlFor="user-avatar-file-input"
                    className="absolute inset-0 bg-ink-950/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Bấm để thay ảnh từ thiết bị"
                  >
                    <Camera className="w-6 h-6" />
                  </label>
                </div>

                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="text-xs font-semibold text-ink-900">Ảnh đại diện tài khoản</div>
                  <input
                    type="file"
                    id="user-avatar-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label
                      htmlFor="user-avatar-file-input"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 text-xs font-semibold rounded-xl cursor-pointer transition shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Chọn ảnh từ thiết bị</span>
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-2 bg-ink-100 hover:bg-ink-200 text-ink-600 text-xs font-medium rounded-xl transition cursor-pointer"
                      >
                        Đặt lại ảnh mặc định
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-400">
                    Chọn trực tiếp tệp ảnh từ máy tính hoặc điện thoại (JPG, PNG, GIF dưới 5MB). Không cần dán liên kết URL.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên đăng nhập (Username - readonly) */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Tên đăng nhập (Username)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.username || (currentUser as any)?.name || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-ink-100 text-ink-500 text-xs font-medium cursor-not-allowed"
                  />
                  <span className="text-[10px] text-ink-400 mt-1 block">Tên đăng nhập không thể thay đổi sau khi tạo.</span>
                </div>

                {/* Vai trò tài khoản */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Vai trò hệ thống
                  </label>
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {(currentUser?.roles || []).map((r: any, idx: number) => {
                      const code = typeof r === 'string' ? r : r?.code;
                      return (
                        <Badge key={idx} variant="emerald">
                          {code === 'ADMIN' ? 'Quản Trị Viên' : code === 'TUTOR' ? 'Gia Sư' : 'Phụ Huynh'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Họ và tên đầy đủ *
                  </label>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    icon={<User className="w-4 h-4" />}
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    icon={<Phone className="w-4 h-4" />}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Địa chỉ Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>

                {/* Khu vực sinh sống */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>Khu vực sinh sống / Địa chỉ</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio nếu là gia sư */}
              {(currentUser?.roles || []).some((r: any) => (typeof r === 'string' ? r : r?.code) === 'TUTOR') && (
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Giới thiệu bản thân & Phương pháp giảng dạy
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Giới thiệu kinh nghiệm, phong cách truyền cảm hứng cho học sinh..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs focus:border-brand-600 focus:outline-hidden resize-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-ink-100 flex justify-end">
                <Button type="submit" variant="primary" disabled={infoLoading}>
                  {infoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu thông tin...</span>
                    </>
                  ) : (
                    <span>Lưu Thay Đổi Thông Tin</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU */}
        {activeTab === 'password' && (
          <Card variant="static" padding="lg" className="max-w-xl mx-auto space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600" />
                <span>Đổi Mật Khẩu Đăng Nhập</span>
              </h2>
              <p className="text-xs text-ink-500">
                Để bảo vệ tài khoản, mật khẩu mới cần có tối thiểu 6 ký tự.
              </p>
            </div>

            {pwdMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
                  pwdMessage.type === 'success'
                    ? 'bg-brand-50 border-brand-200 text-brand-800'
                    : 'bg-rose-50 border-rose-200 text-danger-600'
                }`}
              >
                {pwdMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger-600" />
                )}
                <span>{pwdMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu đang sử dụng"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Mật khẩu mới *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={pwdLoading}>
                  {pwdLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Cập Nhật Mật Khẩu Mới</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
