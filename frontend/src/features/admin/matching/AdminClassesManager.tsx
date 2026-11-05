import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { 
  Layers, CheckCircle2, AlertCircle, Clock, BookOpen, Search, 
  Users, Check, X, UserPlus, Filter, RefreshCw, Loader2, ArrowLeft, Trash2 
} from 'lucide-react';

interface ClassItem {
  id: string;
  code: string;
  name: string;
  format: 'ONE_ON_ONE' | 'GROUP';
  capacity: number;
  minStudents: number;
  status: string;
  teachingMode: string;
  defaultFeePerSession: number;
  sessionDurationMin: number;
  tutor?: {
    user?: { fullName: string; phone: string; avatarUrl: string };
  };
  subjectLevel?: {
    subject?: { name: string };
    gradeLevel?: { name: string };
  };
  students?: Array<{
    student: { id: string; fullName: string; nickname?: string };
  }>;
  schedules?: any[];
}

export default function AdminClassesManager() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING' | 'OPEN'>('ACTIVE');

  // Modal xếp học sinh vào lớp nhóm
  const [enrollModalClass, setEnrollModalClass] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await api.classes.getClasses();
      if (res.data) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách lớp học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleApproveClass = async (classId: string) => {
    if (!window.confirm('Phê duyệt mở lớp nhóm này?')) return;
    try {
      await api.classes.approveClass(classId);
      alert('Đã phê duyệt lớp nhóm!');
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phê duyệt lớp');
    }
  };

  const handleRejectClass = async (classId: string) => {
    const reason = window.prompt('Nhập lý do từ chối lớp nhóm:');
    if (!reason) return;
    try {
      await api.classes.rejectClass(classId, reason);
      alert('Đã từ chối lớp nhóm!');
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi từ chối lớp');
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    const confirmText = `Bạn có chắc chắn muốn XÓA vĩnh viễn lớp học "${cls.code}" (${cls.name || 'Lớp học'})? Toàn bộ lịch học, nhiệm vụ và báo cáo liên quan sẽ bị xóa.`;
    if (!window.confirm(confirmText)) return;

    try {
      await api.classes.deleteClass(cls.id);
      alert(`Đã xóa lớp học ${cls.code} thành công!`);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa lớp học');
    }
  };

  const openEnrollModal = async (cls: ClassItem) => {
    setEnrollModalClass(cls);
    setSelectedStudentId('');
    try {
      const res = await api.students.getStudents();
      if (res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải học sinh:', err);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModalClass || !selectedStudentId) return;

    try {
      setIsEnrolling(true);
      await api.classes.enrollStudent(enrollModalClass.id, {
        studentId: selectedStudentId,
        feePerSession: enrollModalClass.defaultFeePerSession,
      });
      alert('Đã xếp học sinh vào lớp nhóm thành công!');
      setEnrollModalClass(null);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi danh học sinh');
    } finally {
      setIsEnrolling(false);
    }
  };

  const filtered = classes.filter((c) => {
    const matchTab =
      activeTab === 'ACTIVE' ? c.status === 'ACTIVE' :
      activeTab === 'PENDING' ? c.status === 'PENDING_APPROVAL' :
      activeTab === 'OPEN' ? (c.status === 'OPEN' || (c.format === 'GROUP' && c.status === 'ACTIVE')) : true;

    const term = search.toLowerCase();
    const matchSearch =
      (c.code || '').toLowerCase().includes(term) ||
      (c.name || '').toLowerCase().includes(term) ||
      (c.tutor?.user?.fullName || '').toLowerCase().includes(term) ||
      (c.subjectLevel?.subject?.name || '').toLowerCase().includes(term);

    return matchTab && matchSearch;
  });

  const pendingCount = classes.filter(c => c.status === 'PENDING_APPROVAL').length;
  const openCount = classes.filter(c => c.status === 'OPEN').length;
  const activeCount = classes.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top back navigation */}
      <div>
        <Link 
          to="/admin/matching"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-emerald-800 hover:border-emerald-300 font-semibold text-xs shadow-2xs transition"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh sách Yêu cầu ghép lớp</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Điều Phối Lớp Học</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quản Lý & Duyệt Lớp Học Nhóm
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt các lớp nhóm do gia sư đề xuất, theo dõi sĩ số thực tế và xếp học sinh vào các slot còn trống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm theo mã lớp, gia sư, môn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
            />
          </div>
          <button
            onClick={() => loadClasses()}
            title="Làm mới dữ liệu"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ACTIVE' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Lớp Đang Diễn Ra</span>
          <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full">{activeCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'PENDING' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Lớp Chờ Duyệt (Gia sư tạo)</span>
          {pendingCount > 0 && (
            <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-black animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('OPEN')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'OPEN' 
              ? 'bg-teal-700 text-white shadow-xs' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Lớp Nhóm Cần Xếp Học Sinh</span>
          <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded-full">{openCount}</span>
        </button>
      </div>

      {/* Table / Kanban Card List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-emerald-800" size={32} />
            <p className="text-xs font-bold">Đang tải danh sách lớp học thực tế...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs italic">
            Không có lớp học nào trong danh mục này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Mã & Tên Lớp</th>
                  <th className="p-4">Gia Sư Phụ Trách</th>
                  <th className="p-4">Môn Học & Khối</th>
                  <th className="p-4">Hình Thức & Sĩ Số</th>
                  <th className="p-4">Học Phí</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cls) => {
                  const studentCount = cls.students?.length || 0;
                  const capacity = cls.capacity || 1;
                  const isFull = studentCount >= capacity;

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <span className="font-bold text-emerald-800 font-mono block">{cls.code}</span>
                        <span className="font-extrabold text-slate-900 text-xs">{cls.name || 'Lớp học'}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{cls.tutor?.user?.fullName || 'Chưa phân công'}</span>
                        <span className="text-slate-400 text-[11px]">{cls.tutor?.user?.phone || ''}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {cls.subjectLevel?.subject?.name || 'Môn học'} ({cls.subjectLevel?.gradeLevel?.name || 'Tiểu học'})
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            cls.format === 'GROUP' ? 'bg-purple-50 text-purple-800 border border-purple-200' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {cls.format === 'GROUP' ? 'Lớp Nhóm' : 'Kèm 1:1'}
                          </span>
                          <span className="text-[11px] text-slate-600 block font-semibold">
                            Sĩ số: {studentCount} / {capacity} học sinh {isFull ? '(Đầy)' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-emerald-800">
                        {Number(cls.defaultFeePerSession || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          cls.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          cls.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-900 animate-pulse' :
                          cls.status === 'OPEN' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cls.status === 'ACTIVE' ? 'Đang hoạt động' :
                           cls.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                           cls.status === 'OPEN' ? 'Đang tuyển sinh' : cls.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {cls.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleApproveClass(cls.id)}
                                title="Phê duyệt lớp"
                                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Check size={13} />
                                <span>Duyệt</span>
                              </button>
                              <button
                                onClick={() => handleRejectClass(cls.id)}
                                title="Từ chối lớp"
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold flex items-center gap-1 border border-rose-200 cursor-pointer"
                              >
                                <X size={13} />
                                <span>Từ chối</span>
                              </button>
                            </>
                          )}

                          {cls.format === 'GROUP' && !isFull && (
                            <button
                              onClick={() => openEnrollModal(cls)}
                              title="Xếp học sinh vào lớp nhóm này"
                              className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <UserPlus size={13} />
                              <span>Xếp Học Sinh</span>
                            </button>
                          )}

                          {/* Nút Xóa lớp học */}
                          <button
                            onClick={() => handleDeleteClass(cls)}
                            title="Xóa vĩnh viễn lớp học này"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
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

      {/* Modal Xếp Học Sinh Vào Lớp Nhóm */}
      {enrollModalClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-slate-900">Xếp Học Sinh Vào Lớp Nhóm</h3>
              </div>
              <button onClick={() => setEnrollModalClass(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <p className="text-slate-600">
              Lớp: <strong>{enrollModalClass.name}</strong> ({enrollModalClass.code}) · Sĩ số hiện tại: {enrollModalClass.students?.length || 0}/{enrollModalClass.capacity}
            </p>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Chọn học sinh cần ghép vào lớp *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-700 focus:outline-hidden bg-white"
                >
                  <option value="">-- Chọn học sinh trong danh sách --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.gradeLevel?.name || 'Khối lớp'}) - Phụ huynh: {st.parent?.user?.fullName || 'PH'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-900 space-y-1">
                <div className="font-bold">Mức học phí theo buổi:</div>
                <p>{Number(enrollModalClass.defaultFeePerSession || 0).toLocaleString('vi-VN')} đ / buổi</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEnrollModalClass(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isEnrolling ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  <span>Xác nhận xếp lớp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
