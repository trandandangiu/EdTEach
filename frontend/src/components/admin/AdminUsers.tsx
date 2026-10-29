import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, ShieldCheck, UserCheck, Edit3, Trash2, Key, 
  Lock, Unlock, AlertCircle, CheckCircle2, Loader2, X, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt?: string;
  userRoles?: Array<{ role: { code: string; name: string } }>;
  roles?: string[];
  role?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PARENT' | 'TUTOR' | 'STAFF' | 'ADMIN'>('ALL');

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
    password: 'password123',
    roleCode: 'PARENT',
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
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createUser({
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        roleCodes: [formData.roleCode],
      });
      showNotification('success', `Đã tạo tài khoản "${formData.fullName}" thành công!`);
      setIsCreateOpen(false);
      setFormData({ username: '', fullName: '', email: '', phone: '', password: 'password123', roleCode: 'PARENT' });
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
        roleCodes: [formData.roleCode],
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
    const primaryRole = u.userRoles?.[0]?.role?.code || u.roles?.[0] || u.role || 'PARENT';
    setFormData({
      username: u.username || '',
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      roleCode: primaryRole,
    });
  };

  const getUserRoleCodes = (u: UserRecord): string[] => {
    if (u.userRoles && u.userRoles.length > 0) {
      return u.userRoles.map(ur => ur.role.code);
    }
    if (u.roles && u.roles.length > 0) return u.roles;
    if (u.role) return [u.role];
    return ['USER'];
  };

  const filtered = users.filter((u) => {
    const roleCodes = getUserRoleCodes(u);
    const matchRole = 
      roleFilter === 'ALL' ? true :
      roleFilter === 'PARENT' ? roleCodes.includes('PARENT') :
      roleFilter === 'TUTOR' ? (roleCodes.includes('TUTOR') || roleCodes.includes('APPLICANT')) :
      roleFilter === 'STAFF' ? roleCodes.some(r => r.startsWith('STAFF_')) :
      roleFilter === 'ADMIN' ? roleCodes.includes('ADMIN') : true;

    const term = search.toLowerCase();
    const matchSearch =
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').toLowerCase().includes(term) ||
      roleCodes.some(r => r.toLowerCase().includes(term));

    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Hệ Thống Phân Quyền (RBAC) & Quản Trị</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quản Lý Tài Khoản Người Dùng (CRUD)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo tài khoản mới, phân quyền, khóa và đặt lại mật khẩu cho Phụ huynh, Gia sư và Nhân viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            title="Làm mới"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setFormData({ username: '', fullName: '', email: '', phone: '', password: 'password123', roleCode: 'PARENT' });
              setIsCreateOpen(true);
            }}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Tạo Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PARENT', 'TUTOR', 'STAFF', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                roleFilter === r ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'Tất cả' :
               r === 'PARENT' ? 'Phụ huynh' :
               r === 'TUTOR' ? 'Gia sư' :
               r === 'STAFF' ? 'Điều phối & CSKH' : 'Quản trị viên'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-emerald-800" size={32} />
            <p className="text-xs font-bold">Đang tải danh sách người dùng...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Không tìm thấy tài khoản người dùng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Người Dùng</th>
                  <th className="p-4">Tên Đăng Nhập</th>
                  <th className="p-4">Liên Hệ</th>
                  <th className="p-4">Vai Trò (Roles)</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtered.map((u) => {
                  const roleCodes = getUserRoleCodes(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.fullName || 'Chưa đặt tên'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-700">
                        {u.username}
                      </td>
                      <td className="p-4 text-slate-600">
                        <div>{u.email || '-'}</div>
                        <div className="text-[11px] text-slate-400">{u.phone || '-'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {roleCodes.map((rc) => (
                            <span 
                              key={rc}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                                rc === 'ADMIN' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                rc === 'PARENT' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                rc === 'TUTOR' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                rc === 'APPLICANT' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {rc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          title="Bấm để bật/tắt kích hoạt"
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 transition ${
                            u.active !== false 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {u.active !== false ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              Đã khóa
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Sửa thông tin"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-800 transition"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setResetPwdUser(u);
                              setNewPasswordValue('password123');
                            }}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-amber-700 transition"
                          >
                            <Key size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Xóa tài khoản"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tạo tài khoản mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Tạo Tài Khoản Người Dùng Mới</h3>
                <p className="text-slate-500 text-[11px]">Cấp tài khoản mới cho Phụ huynh, Gia sư hoặc Cán bộ quản lý</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0988 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mật khẩu khởi tạo *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vai trò (Role) *</label>
                  <select
                    value={formData.roleCode}
                    onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden font-bold text-slate-800"
                  >
                    <option value="PARENT">Phụ Huynh (PARENT)</option>
                    <option value="TUTOR">Gia Sư Chính Thức (TUTOR)</option>
                    <option value="APPLICANT">Ứng Viên Gia Sư (APPLICANT)</option>
                    <option value="STAFF_MATCHING">Chuyên Viên Ghép Lớp (STAFF_MATCHING)</option>
                    <option value="STAFF_CARE">Chuyên Viên CSKH (STAFF_CARE)</option>
                    <option value="STAFF_ACADEMIC">Chuyên Viên Học Thuật (STAFF_ACADEMIC)</option>
                    <option value="ADMIN">Quản Trị Viên Toàn Quyền (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Xác Nhận Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sửa người dùng */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Chỉnh Sửa Thông Tin Người Dùng</h3>
                <p className="text-slate-500 text-[11px]">Tài khoản: <strong>{editingUser.username}</strong></p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Vai trò chính</label>
                <select
                  value={formData.roleCode}
                  onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden font-bold text-slate-800"
                >
                  <option value="PARENT">Phụ Huynh (PARENT)</option>
                  <option value="TUTOR">Gia Sư Chính Thức (TUTOR)</option>
                  <option value="APPLICANT">Ứng Viên Gia Sư (APPLICANT)</option>
                  <option value="STAFF_MATCHING">Chuyên Viên Ghép Lớp (STAFF_MATCHING)</option>
                  <option value="STAFF_CARE">Chuyên Viên CSKH (STAFF_CARE)</option>
                  <option value="STAFF_ACADEMIC">Chuyên Viên Học Thuật (STAFF_ACADEMIC)</option>
                  <option value="ADMIN">Quản Trị Viên Toàn Quyền (ADMIN)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đặt lại mật khẩu */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Đặt Lại Mật Khẩu</h3>
              <button onClick={() => setResetPwdUser(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-slate-600">
              Đặt lại mật khẩu mới cho người dùng <strong>{resetPwdUser.fullName || resetPwdUser.username}</strong>:
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
