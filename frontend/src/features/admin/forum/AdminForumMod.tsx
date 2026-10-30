import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import {
  MessageSquare,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Flag,
  Eye,
  EyeOff,
  UserX,
  Search,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface ModPost {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryCode?: string;
  status: 'PUBLISHED' | 'HIDDEN' | 'DELETED' | 'PENDING_REVIEW';
  moderationNote?: string;
  createdAt: string;
  views: number;
  likes: number;
  repliesCount: number;
  flagsCount: number;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    active?: boolean;
    bannedUntil?: string | null;
  };
}

interface ModFlag {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { id: string; fullName: string; username: string };
  post?: {
    id: string;
    title: string;
    content: string;
    status: string;
    author?: { id: string; fullName: string; username: string; bannedUntil?: string | null };
  };
  comment?: {
    id: string;
    content: string;
    status: string;
    author?: { id: string; fullName: string; username: string };
  };
}

export default function AdminForumMod() {
  const [activeTab, setActiveTab] = useState<'posts' | 'flags'>('posts');
  const [posts, setPosts] = useState<ModPost[]>([]);
  const [flags, setFlags] = useState<ModFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN' | 'DELETED'>('ALL');

  // Modal ẩn bài
  const [hideModalPost, setHideModalPost] = useState<ModPost | null>(null);
  const [hideReason, setHideReason] = useState('Vi phạm tiêu chuẩn cộng đồng giáo dục');

  // Modal cấm tài khoản (Ban)
  const [banModalUser, setBanModalUser] = useState<{ id: string; name: string } | null>(null);
  const [banDuration, setBanDuration] = useState<number>(24);
  const [banReason, setBanReason] = useState('Đăng nội dung phản cảm / spam liên tục');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.forum.getAdminPosts({
        status: statusFilter,
        search: searchTerm || undefined,
      });
      if (res.data) setPosts(res.data);
    } catch (err) {
      console.error('Lỗi tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api.forum.getFlags({ status: 'ALL' });
      if (res.data) setFlags(res.data);
    } catch (err) {
      console.error('Lỗi tải flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else {
      fetchFlags();
    }
  }, [activeTab, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const executeHide = async () => {
    if (!hideModalPost) return;
    try {
      setActionLoading(true);
      await api.forum.hidePost(hideModalPost.id, hideReason);
      setPosts(posts.map(p => p.id === hideModalPost.id ? { ...p, status: 'HIDDEN', moderationNote: hideReason } : p));
      setHideModalPost(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ẩn bài');
    } finally {
      setActionLoading(false);
    }
  };

  const executeUnhide = async (id: string) => {
    try {
      await api.forum.unhidePost(id);
      setPosts(posts.map(p => p.id === id ? { ...p, status: 'PUBLISHED', moderationNote: undefined } : p));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khôi phục bài viết');
    }
  };

  const executeDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await api.forum.deletePost(id);
      setPosts(posts.map(p => p.id === id ? { ...p, status: 'DELETED' } : p));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa bài viết');
    }
  };

  const executeBanUser = async () => {
    if (!banModalUser) return;
    try {
      setActionLoading(true);
      const res = await api.admin.banUser(banModalUser.id, {
        durationHours: banDuration,
        banReason,
      });
      alert(res.message || 'Đã áp dụng biện pháp chế tài thành công');
      setBanModalUser(null);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khóa tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  const executeHandleFlag = async (flagId: string, action: 'HIDE_POST' | 'DELETE_POST' | 'DISMISS') => {
    try {
      await api.forum.handleFlag(flagId, {
        status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
        action,
      });
      setFlags(flags.map(f => f.id === flagId ? { ...f, status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED' } : f));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xử lý báo cáo');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            Ban Kiểm Duyệt Nội Dung & An Toàn Mạng
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Kiểm Duyệt Diễn Đàn & Báo Cáo Vi Phạm
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát bài thảo luận cộng đồng, xử lý báo cáo từ học sinh/phụ huynh và chế tài người dùng vi phạm.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'posts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Danh Sách Bài Viết</span>
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'flags'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Báo Cáo Vi Phạm ({flags.filter(f => f.status === 'OPEN').length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Controls Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-emerald-800"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900 transition"
              >
                Tìm
              </button>
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 font-medium">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 bg-white focus:outline-emerald-800"
              >
                <option value="ALL">Tất cả bài viết</option>
                <option value="PUBLISHED">Đang hiển thị</option>
                <option value="HIDDEN">Đã ẩn (Vi phạm)</option>
                <option value="DELETED">Đã xóa</option>
              </select>
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="animate-spin text-emerald-800" size={32} />
              <p className="text-xs font-bold">Đang tải danh sách bài viết...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
              Không tìm thấy bài viết nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => {
                const isUserBanned = p.author.bannedUntil && new Date(p.author.bannedUntil) > new Date();

                return (
                  <div
                    key={p.id}
                    className={`bg-white p-5 rounded-2xl border transition shadow-xs text-xs space-y-3 ${
                      p.status === 'HIDDEN'
                        ? 'border-amber-300 bg-amber-50/20'
                        : p.status === 'DELETED'
                        ? 'border-rose-200 bg-rose-50/20 opacity-70'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {p.category}
                        </span>
                        <span className="text-slate-400">·</span>
                        <div className="flex items-center gap-1.5">
                          <img
                            src={p.author.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-bold text-slate-800">{p.author.name}</span>
                          <span className="text-slate-400">({p.author.role})</span>
                          {isUserBanned && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              Đang bị Ban
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400">{new Date(p.createdAt).toLocaleString('vi-VN')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === 'PUBLISHED' && (
                          <span className="px-2.5 py-1 font-bold text-emerald-800 bg-emerald-50 rounded-lg flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> Đang hiển thị
                          </span>
                        )}
                        {p.status === 'HIDDEN' && (
                          <span className="px-2.5 py-1 font-bold text-amber-800 bg-amber-100 rounded-lg flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> Đã ẩn do vi phạm
                          </span>
                        )}
                        {p.status === 'DELETED' && (
                          <span className="px-2.5 py-1 font-bold text-rose-800 bg-rose-100 rounded-lg flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Đã xóa
                          </span>
                        )}
                        {p.flagsCount > 0 && (
                          <span className="px-2 py-0.5 font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded text-[10px]">
                            {p.flagsCount} lượt báo cáo
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{p.title}</h3>
                      <p className="text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                        {p.content}
                      </p>
                      {p.moderationNote && (
                        <p className="mt-2 text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                          <strong>Ghi chú kiểm duyệt:</strong> {p.moderationNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-slate-500 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <span>👁️ {p.views} lượt xem</span>
                        <span>💬 {p.repliesCount} phản hồi</span>
                        <span>❤️ {p.likes} thích</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Ban user button */}
                        <button
                          onClick={() => setBanModalUser({ id: p.author.id, name: p.author.name })}
                          className="px-3 py-1.5 font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1"
                          title="Khóa quyền đăng bài của người dùng này"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Chế tài thành viên</span>
                        </button>

                        {/* Hide / Unhide button */}
                        {p.status === 'PUBLISHED' ? (
                          <button
                            onClick={() => setHideModalPost(p)}
                            className="px-3 py-1.5 font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition flex items-center gap-1"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn bài</span>
                          </button>
                        ) : p.status === 'HIDDEN' ? (
                          <button
                            onClick={() => executeUnhide(p.id)}
                            className="px-3 py-1.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục hiển thị</span>
                          </button>
                        ) : null}

                        {/* Delete button */}
                        {p.status !== 'DELETED' && (
                          <button
                            onClick={() => executeDelete(p.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Danh sách Flags */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="animate-spin text-emerald-800" size={32} />
              <p className="text-xs font-bold">Đang tải danh sách báo cáo vi phạm...</p>
            </div>
          ) : flags.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
              Diễn đàn hoàn toàn sạch sẽ! Hiện không có báo cáo vi phạm nào.
            </div>
          ) : (
            <div className="space-y-4">
              {flags.map((f) => (
                <div
                  key={f.id}
                  className={`bg-white p-5 rounded-2xl border transition shadow-xs text-xs space-y-3 ${
                    f.status === 'OPEN' ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        🚩 Báo cáo vi phạm
                      </span>
                      <span className="text-slate-500">
                        Bởi: <strong>{f.reporter?.fullName || 'Người dùng ẩn danh'}</strong>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-400">{new Date(f.createdAt).toLocaleString('vi-VN')}</span>
                    </div>

                    <div>
                      {f.status === 'OPEN' ? (
                        <span className="px-2.5 py-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                          Chưa xử lý
                        </span>
                      ) : f.status === 'RESOLVED' ? (
                        <span className="px-2.5 py-1 font-bold text-emerald-800 bg-emerald-50 rounded-lg">
                          ✓ Đã xử lý gỡ bỏ
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 font-bold text-slate-600 bg-slate-100 rounded-lg">
                          Đã bỏ qua (Hợp lệ)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-slate-800">
                    <strong className="text-rose-900">Lý do báo cáo:</strong> {f.reason}
                  </div>

                  {f.post && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-slate-500 font-semibold">
                        Bài viết: <strong className="text-slate-900">{f.post.title}</strong> (Tác giả: {f.post.author?.fullName})
                      </div>
                      <p className="text-slate-600 line-clamp-2 italic">"{f.post.content}"</p>
                    </div>
                  )}

                  {f.status === 'OPEN' && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => executeHandleFlag(f.id, 'DISMISS')}
                        className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      >
                        Bỏ qua báo cáo
                      </button>
                      <button
                        onClick={() => executeHandleFlag(f.id, 'HIDE_POST')}
                        className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition"
                      >
                        Ẩn bài viết này
                      </button>
                      <button
                        onClick={() => executeHandleFlag(f.id, 'DELETE_POST')}
                        className="px-4 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition"
                      >
                        Xóa bài vĩnh viễn
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Ẩn Bài Viết */}
      {hideModalPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Xác nhận ẩn bài viết vi phạm</h3>
            </div>

            <p className="text-slate-600">
              Bài viết <strong>"{hideModalPost.title}"</strong> sẽ bị ẩn khỏi tất cả người dùng diễn đàn nhưng vẫn lưu trong hệ thống kiểm duyệt.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Lý do ẩn bài:</label>
              <textarea
                rows={3}
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-emerald-800 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setHideModalPost(null)}
                className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={executeHide}
                disabled={actionLoading}
                className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận ẩn bài</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Khóa Tài Khoản (Ban User) */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <UserX className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Chế tài & Khóa tài khoản thành viên</h3>
            </div>

            <p className="text-slate-600">
              Áp dụng chế tài cấm đăng bài và khóa đăng nhập đối với: <strong className="text-slate-900">{banModalUser.name}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Thời hạn chế tài:</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-emerald-800"
              >
                <option value={24}>Khóa tạm thời 24 giờ</option>
                <option value={168}>Khóa tạm thời 7 ngày (1 tuần)</option>
                <option value={720}>Khóa tạm thời 30 ngày (1 tháng)</option>
                <option value={-1}>Cấm vĩnh viễn (Khóa hoàn toàn tài khoản)</option>
                <option value={0}>Gỡ bỏ lệnh cấm (Mở khóa tài khoản)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Lý do xử lý kỷ luật:</label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Nhập lý do gửi đến người dùng..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-emerald-800 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBanModalUser(null)}
                className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={executeBanUser}
                disabled={actionLoading}
                className="px-5 py-2 font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Thực hiện chế tài</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
