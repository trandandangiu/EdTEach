import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, ShieldCheck, UserCheck, Edit3, Trash2, Key,
  Lock, Unlock, AlertCircle, CheckCircle2, Loader2, X, RefreshCw,
  Building2, ExternalLink, MapPin
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';

// 3 Vai trò cốt lõi của hệ thống theo yêu cầu thu hẹp phạm vi
const CORE_ROLES = [
  { code: 'TUTOR', name: 'Gia Sư (TUTOR)' },
  { code: 'PARENT', name: 'Phụ Huynh (PARENT)' },
  { code: 'ADMIN', name: 'Quản Trị Viên (ADMIN)' },
];

interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  active: boolean;
  departmentId?: number | null;
  department?: { id: number; code: string; name: string } | null;
  createdAt?: string;
  userRoles?: Array<{ role: { code: string; name: string } }>;
  roles?: string[];
  role?: string;
}

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TUTOR' | 'PARENT' | 'ADMIN'>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<UserRecord | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('password123');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    location: '',
    password: 'password123',
    roleCode: 'TUTOR',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res: any = await api.admin.getUsers();
      const list = Array.isArray(res) ? res : (res.data || res.users || []);
      setUsers(list);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createUser({
        username: formData.username.trim().toLowerCase(),
        password: formData.password || 'password123',
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        location: formData.location.trim() || undefined,
        roleCodes: [formData.roleCode],
      });
      showNotification('success', `Đã tạo tài khoản "${formData.fullName}" thành công!`);
      setIsCreateOpen(false);
      setFormData({ username: '', fullName: '', email: '', phone: '', location: '', password: 'password123', roleCode: 'TUTOR' });
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err?.message || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.admin.updateUser(editingUser.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        location: formData.location.trim() || undefined,
        roleCodes: [formData.roleCode],
        password: formData.password && formData.password.trim().length >= 6 ? formData.password.trim() : undefined,
      });
      showNotification('success', `Cập nhật thông tin "${formData.fullName}" thành công!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err?.message || 'Lỗi khi cập nhật tài khoản');
    }
  };

  const handleToggleActive = async (user: UserRecord) => {
    try {
      await api.admin.toggleUserActive(user.id);
      showNotification('success', `Đã ${user.active ? 'khóa' : 'kích hoạt'} tài khoản ${user.fullName || user.username}`);
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err?.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser) return;
    try {
      await api.admin.resetPassword(resetPwdUser.id, newPasswordValue);
      showNotification('success', `Đã đặt lại mật khẩu cho "${resetPwdUser.fullName || resetPwdUser.username}" thành công!`);
      setResetPwdUser(null);
      setNewPasswordValue('password123');
    } catch (err: any) {
      showNotification('error', err?.message || 'Lỗi khi đặt lại mật khẩu');
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.fullName || user.username}"?`)) return;
    try {
      await api.admin.deleteUser(user.id);
      showNotification('success', `Đã xóa tài khoản "${user.fullName || user.username}"`);
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err?.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    const primaryRole = u.userRoles?.[0]?.role?.code || u.roles?.[0] || u.role || 'TUTOR';
    setFormData({
      username: u.username || '',
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      location: u.location && u.location !== '—' ? u.location : '',
      password: '',
      roleCode: primaryRole === 'APPLICANT' ? 'TUTOR' : primaryRole,
    });
  };

  const getUserRoleCodes = (u: UserRecord): string[] => {
    const extractCode = (r: any): string => {
      if (!r) return '';
      if (typeof r === 'string') return r;
      return r.code || r.name || '';
    };

    if (u.userRoles && u.userRoles.length > 0) {
      return u.userRoles.map(ur => extractCode(ur.role)).filter(Boolean);
    }
    if (u.roles && u.roles.length > 0) {
      return u.roles.map(extractCode).filter(Boolean);
    }
    if (u.role) {
      return [extractCode(u.role)].filter(Boolean);
    }
    return ['USER'];
  };

  const filtered = users.filter((u) => {
    const roleCodes = getUserRoleCodes(u);
    const matchRole =
      roleFilter === 'ALL' ? true :
      roleFilter === 'PARENT' ? roleCodes.includes('PARENT') :
      roleFilter === 'TUTOR' ? (roleCodes.includes('TUTOR') || roleCodes.includes('APPLICANT')) :
      roleFilter === 'ADMIN' ? roleCodes.includes('ADMIN') : true;

    const term = search.toLowerCase();
    const matchSearch =
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').toLowerCase().includes(term) ||
      (u.location || '').toLowerCase().includes(term) ||
      roleCodes.some(r => r.toLowerCase().includes(term));

    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        eyebrow="Quản trị người dùng & Phân quyền"
        title="Quản Lý Tài Khoản Người Dùng"
        description="Thêm, sửa, xóa, khóa/mở khóa và cập nhật địa điểm cho toàn bộ tài khoản Gia Sư, Phụ Huynh và Quản Trị Viên."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers()}
              title="Làm mới"
              className="p-2 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-600 transition cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormData({
                  username: '',
                  fullName: '',
                  email: '',
                  phone: '',
                  location: '',
                  password: 'password123',
                  roleCode: 'TUTOR',
                });
                setIsCreateOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Tạo Tài Khoản Mới</span>
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
          message.type === 'success' 
            ? 'bg-brand-50 text-brand-900 border-brand-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-ink-400 hover:text-ink-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <Card variant="static" padding="md" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Role Tabs: Tất cả | Gia sư | Phụ huynh | Quản trị viên */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: `Tất cả (${users.length})` },
            { key: 'TUTOR', label: `Gia sư (${users.filter(u => getUserRoleCodes(u).some(r => ['TUTOR', 'APPLICANT'].includes(r))).length})` },
            { key: 'PARENT', label: `Phụ huynh (${users.filter(u => getUserRoleCodes(u).includes('PARENT')).length})` },
            { key: 'ADMIN', label: `Quản trị viên (${users.filter(u => getUserRoleCodes(u).includes('ADMIN')).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                roleFilter === tab.key
                  ? 'bg-ink-900 text-white shadow-2xs'
                  : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT, username, khu vực..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden bg-white"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card variant="static" padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-ink-400 gap-2">
            <Loader2 className="animate-spin text-brand-600" size={32} />
            <p className="text-xs font-semibold">Đang tải danh sách tài khoản người dùng...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-400 text-xs">
            Không tìm thấy tài khoản người dùng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50/80 text-ink-500 font-semibold border-b border-ink-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Người Dùng</th>
                  <th className="p-4">Tên Đăng Nhập</th>
                  <th className="p-4">Liên Hệ</th>
                  <th className="p-4">Khu Vực (Location)</th>
                  <th className="p-4">Vai Trò</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((u) => {
                  const roleCodes = getUserRoleCodes(u);
                  const isCurrentAccount = u.id === currentUserId;
                  const isSuperAdmin = u.username === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-ink-50/60 transition">
                      <td className="p-4">
                        <div className="font-semibold text-ink-900">{u.fullName || 'Chưa đặt tên'}</div>
                        <div className="text-[10px] text-ink-400 font-mono">ID: {u.id.slice(0, 8)}...</div>
                      </td>
                      <td className="p-4 font-mono font-medium text-ink-700">
                        {u.username}
                      </td>
                      <td className="p-4 text-ink-600">
                        <div>{u.email || '—'}</div>
                        <div className="text-[11px] text-ink-400">{u.phone || '—'}</div>
                      </td>
                      <td className="p-4 text-ink-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-brand-600 shrink-0" />
                          <span className="truncate max-w-[160px]">{u.location || '—'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {roleCodes.map((rc) => {
                            const badgeVariant = 
                              rc === 'ADMIN' ? 'gold' :
                              rc === 'PARENT' ? 'neutral' : 'brand';
                            const roleLabel =
                              rc === 'ADMIN' ? 'Quản Trị Viên' :
                              rc === 'PARENT' ? 'Phụ Huynh' : 'Gia Sư';
                            return (
                              <Badge key={rc} variant={badgeVariant}>
                                {roleLabel}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          disabled={isCurrentAccount || isSuperAdmin}
                          onClick={() => handleToggleActive(u)}
                          title={isCurrentAccount ? 'Không thể khóa chính mình' : isSuperAdmin ? 'Không thể khóa tài khoản admin tối cao' : 'Bấm để đổi trạng thái'}
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 transition cursor-pointer ${
                            isCurrentAccount || isSuperAdmin ? 'opacity-60 cursor-not-allowed bg-ink-100 text-ink-500' :
                            u.active !== false
                              ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active !== false ? 'bg-brand-600' : 'bg-rose-600'}`} />
                          <span>{u.active !== false ? 'Hoạt động' : 'Đã khóa'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {roleCodes.includes('TUTOR') && (
                            <a
                              href={`/tutors/${u.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Xem trang hồ sơ gia sư"
                              className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-700 transition inline-flex items-center"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(u)}
                            title="Sửa thông tin tài khoản & địa điểm"
                            className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-600 hover:text-brand-700 transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setResetPwdUser(u);
                              setNewPasswordValue('password123');
                            }}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-600 hover:text-amber-700 transition cursor-pointer"
                          >
                            <Key size={14} />
                          </button>
                          {!isCurrentAccount && !isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Xóa tài khoản"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-ink-400 hover:text-danger-600 transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Tạo tài khoản mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-lg w-full shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900">Tạo Tài Khoản Người Dùng Mới</h3>
                <p className="text-ink-500 text-[11px] mt-0.5">Cấp tài khoản mới cho Gia Sư, Phụ Huynh hoặc Quản Trị Viên</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0988 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-ink-700 font-semibold mb-1">
                  Khu vực / Tỉnh, Thành phố (Location)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Ví dụ: Cầu Giấy, Hà Nội hoặc Quận 1, TP.HCM"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Mật khẩu khởi tạo *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl font-mono focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Vai trò (Role) *</label>
                  <select
                    value={formData.roleCode}
                    onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden font-semibold text-ink-800 bg-white"
                  >
                    {CORE_ROLES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-ink-100">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  Xác Nhận Tạo Tài Khoản
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Sửa người dùng */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-lg w-full shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900">Chỉnh Sửa Thông Tin Người Dùng</h3>
                <p className="text-ink-500 text-[11px] mt-0.5">Tài khoản: <strong className="font-mono">{editingUser.username}</strong></p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-ink-700 font-semibold mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-ink-700 font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-ink-700 font-semibold mb-1">
                  Khu vực / Tỉnh, Thành phố (Location)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-700 font-semibold mb-1">Vai trò</label>
                <select
                  value={formData.roleCode}
                  onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden font-semibold text-ink-800 bg-white"
                >
                  {CORE_ROLES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-ink-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Đặt lại mật khẩu mới</span>
                  <span className="text-[10px] text-ink-400 font-normal">Để trống nếu giữ nguyên</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập mật khẩu mới cho tài khoản (tối thiểu 6 ký tự)..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl font-mono focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-ink-100">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Đặt lại mật khẩu */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-sm w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <h3 className="text-sm font-semibold text-ink-900">Đặt Lại Mật Khẩu</h3>
              <button onClick={() => setResetPwdUser(null)} className="text-ink-400 hover:text-ink-600 cursor-pointer">✕</button>
            </div>

            <p className="text-ink-600">
              Đặt lại mật khẩu mới cho người dùng <strong>{resetPwdUser.fullName || resetPwdUser.username}</strong>:
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-ink-700 font-semibold mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl font-mono focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Xác Nhận Đổi
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
