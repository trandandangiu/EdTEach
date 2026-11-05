import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Plus, 
  Star, 
  BookOpen, 
  Calendar, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertCircle, 
  X,
  FileText,
  UserCheck,
  Camera
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

interface ChildStudent {
  id: string;
  fullName: string;
  nickname?: string;
  dob?: string;
  gender?: string;
  gradeLevelId: number;
  gradeLevel?: { id: number; name: string };
  school?: string;
  avatarKey?: string;
  streakDays?: number;
  tasksCompleted?: number;
  enrollments?: Array<{
    class: {
      id: string;
      name: string;
      code: string;
      tutor?: { user?: { fullName: string } };
    };
  }>;
}

interface HomeworkItem {
  id: string;
  title?: string;
  description?: string;
  homeworkNote?: string;
  lessonContent?: string;
  tutorName?: string;
  subjectName?: string;
  dueDate?: string;
  submittedAt?: string;
  status?: string;
}

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<ChildStudent[]>([]);
  const [gradeLevels, setGradeLevels] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Modal Thêm / Chỉnh sửa hồ sơ con
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildStudent | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    age: '9',
    gender: 'Nam',
    gradeLevelId: 4,
    school: '',
    avatarKey: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Xử lý chọn ảnh avatar bé từ thiết bị
  const handleChildAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Kích thước ảnh đại diện của bé không được vượt quá 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatarKey: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal Bài tập về nhà của bé
  const [tasksModalChild, setTasksModalChild] = useState<ChildStudent | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);

  // Tải danh sách con và danh mục khối lớp từ DB
  const loadChildren = async () => {
    try {
      setLoading(true);
      const [studentsRes, gradesRes] = await Promise.all([
        api.students.getStudents(),
        api.catalog.getGradeLevels(),
      ]);

      if (studentsRes?.data) {
        setChildren(studentsRes.data);
      }
      if (gradesRes?.data) {
        setGradeLevels(gradesRes.data);
        if (gradesRes.data.length > 0 && !formData.gradeLevelId) {
          setFormData((prev) => ({ ...prev, gradeLevelId: gradesRes.data[0].id }));
        }
      }
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu hồ sơ con:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  // Tính tuổi từ ngày sinh
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 9;
    const birthYear = new Date(dobString).getFullYear();
    const currentYear = new Date().getFullYear();
    return Math.max(1, currentYear - birthYear);
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingChild(null);
    setFormData({
      fullName: '',
      nickname: '',
      age: '9',
      gender: 'Nam',
      gradeLevelId: gradeLevels[3]?.id || gradeLevels[0]?.id || 4,
      school: '',
      avatarKey: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (child: ChildStudent) => {
    setEditingChild(child);
    setFormData({
      fullName: child.fullName || '',
      nickname: child.nickname || '',
      age: String(calculateAge(child.dob)),
      gender: child.gender || 'Nam',
      gradeLevelId: child.gradeLevelId || child.gradeLevel?.id || 1,
      school: child.school || '',
      avatarKey: child.avatarKey || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  // Lưu hồ sơ con vào Database
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên đi học của bé');
      return;
    }
    if (!formData.gradeLevelId) {
      setFormError('Vui lòng chọn khối lớp học hiện tại của bé');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        fullName: formData.fullName.trim(),
        nickname: formData.nickname.trim() || undefined,
        age: parseInt(formData.age, 10) || 9,
        gender: formData.gender,
        gradeLevelId: Number(formData.gradeLevelId),
        school: formData.school.trim() || undefined,
        avatarKey: formData.avatarKey || undefined,
      };

      if (editingChild) {
        // Cập nhật
        await api.students.updateStudent(editingChild.id, payload);
      } else {
        // Tạo mới
        await api.students.createStudent(payload);
      }

      setModalOpen(false);
      await loadChildren();
    } catch (err: any) {
      console.error('Lỗi khi lưu hồ sơ con:', err);
      setFormError(err?.message || 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa hồ sơ con
  const handleDeleteChild = async (child: ChildStudent) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ của bé "${child.fullName}" không?`)) {
      return;
    }
    try {
      await api.students.deleteStudent(child.id);
      await loadChildren();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa hồ sơ con');
    }
  };

  // Mở modal xem bài tập về nhà
  const handleOpenTasksModal = async (child: ChildStudent) => {
    setTasksModalChild(child);
    setTasksLoading(true);
    setHomeworkList([]);

    try {
      const res = await api.students.getStudentTasks(child.id);
      const rawTasks = res?.data?.tasks || [];
      const rawReports = res?.data?.reportsWithHomework || [];

      // Tổng hợp danh sách bài tập từ bảng AssignmentTask và LessonReport
      const combined: HomeworkItem[] = [];

      rawTasks.forEach((t: any) => {
        combined.push({
          id: t.id,
          title: t.title || 'Bài tập rèn luyện',
          description: t.description,
          dueDate: t.dueDate,
          submittedAt: t.submittedAt,
          status: t.status,
          tutorName: t.class?.tutor?.user?.fullName,
          subjectName: t.class?.subjectLevel?.subject?.name,
        });
      });

      rawReports.forEach((r: any) => {
        combined.push({
          id: r.id,
          title: `Bài tập sau buổi học: ${r.lessonContent || 'Luyện tập'}`,
          homeworkNote: r.homeworkNote,
          tutorName: r.tutorName,
          subjectName: r.subjectName,
          submittedAt: r.submittedAt,
          status: 'ASSIGNED',
        });
      });

      setHomeworkList(combined);
    } catch (err) {
      console.error('Lỗi tải bài tập của bé:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="VietTutor · Cổng Phụ Huynh"
        title="Hồ Sơ Học Tập Của Con"
        description="Quản lý thông tin họ tên, tuổi, khối lớp và theo sát các bài tập về nhà gia sư giao cho bé."
        actions={
          <Button variant="primary" size="md" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4" />
            <span>Thêm hồ sơ con mới</span>
          </Button>
        }
      />

      {/* Danh sách con */}
      {loading ? (
        <Card variant="static" padding="lg" className="py-20 text-center flex flex-col items-center justify-center text-ink-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium">Đang tải danh sách hồ sơ con từ hệ thống...</p>
        </Card>
      ) : children.length === 0 ? (
        <Card variant="static" padding="lg" className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mx-auto text-3xl">
            👶
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink-900">Chưa có hồ sơ con cái nào</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Thêm thông tin bé để yêu cầu ghép gia sư và theo dõi sổ liên lạc, bài tập về nhà mỗi buổi học.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4" />
            <span>Thêm hồ sơ con ngay</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => {
            const age = calculateAge(child.dob);
            const gradeName =
              child.gradeLevel?.name ||
              gradeLevels.find((g) => g.id === child.gradeLevelId)?.name ||
              `Lớp ${child.gradeLevelId}`;

            return (
              <Card key={child.id} variant="interactive" padding="md" className="space-y-4 flex flex-col justify-between">
                <div>
                  {/* Header bé */}
                  <div className="flex items-start justify-between border-b border-ink-100 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-50 text-brand-800 flex items-center justify-center text-2xl font-semibold shrink-0 border border-brand-100 shadow-2xs">
                        {child.avatarKey && (child.avatarKey.startsWith('data:image') || child.avatarKey.startsWith('http')) ? (
                          <img src={child.avatarKey} alt={child.fullName} className="w-full h-full object-cover" />
                        ) : child.avatarKey && child.avatarKey.length <= 4 ? (
                          <span>{child.avatarKey}</span>
                        ) : (
                          child.gender === 'Nữ' ? '👧' : '👦'
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-ink-900">{child.fullName}</h3>
                          {child.nickname && (
                            <span className="text-xs text-ink-400 italic">({child.nickname})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                          <Badge variant="brand">{gradeName}</Badge>
                          <span>·</span>
                          <span>{age} tuổi</span>
                          <span>·</span>
                          <span>{child.gender || 'Nam'}</span>
                        </div>
                        {child.school && (
                          <p className="text-[11px] text-ink-400 truncate max-w-xs">{child.school}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(child)}
                        className="p-2 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded-xl transition cursor-pointer"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChild(child)}
                        className="p-2 text-ink-400 hover:text-danger-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Xóa hồ sơ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lớp học đang tham gia */}
                  <div className="pt-3 space-y-2 text-xs">
                    <span className="font-semibold text-ink-800 block">Lớp kèm hiện tại:</span>
                    {child.enrollments && child.enrollments.length > 0 ? (
                      child.enrollments.map((enr, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-ink-50 rounded-xl border border-ink-200/80 flex items-center justify-between text-xs text-ink-700"
                        >
                          <span className="font-medium">{enr.class.name}</span>
                          <span className="text-[10px] font-semibold text-brand-700">Đang học</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-ink-50/50 rounded-xl border border-dashed border-ink-200 text-ink-400 text-center text-xs">
                        Chưa ghép lớp học nào.
                      </div>
                    )}
                  </div>
                </div>

                {/* Nút: Bài tập về nhà của bé */}
                <div className="pt-2 border-t border-ink-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-ink-500">Nhiệm vụ tự học</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenTasksModal(child)}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Bài tập về nhà của bé</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL: Thêm / Sửa hồ sơ con */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <h3 className="text-base font-semibold text-ink-900">
                {editingChild ? 'Chỉnh sửa hồ sơ con' : 'Thêm hồ sơ con mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-danger-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Chọn ảnh đại diện từ thiết bị hoặc biểu tượng */}
              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">Ảnh đại diện của bé</label>
                <div className="flex items-center gap-4 p-3 bg-ink-50/50 rounded-2xl border border-ink-100">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white text-brand-800 flex items-center justify-center text-2xl font-semibold shrink-0 border border-ink-200 shadow-2xs">
                    {formData.avatarKey && (formData.avatarKey.startsWith('data:image') || formData.avatarKey.startsWith('http')) ? (
                      <img src={formData.avatarKey} alt="Preview" className="w-full h-full object-cover" />
                    ) : formData.avatarKey && formData.avatarKey.length <= 4 ? (
                      <span>{formData.avatarKey}</span>
                    ) : (
                      formData.gender === 'Nữ' ? '👧' : '👦'
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-ink-100 border border-ink-200 text-ink-800 rounded-xl cursor-pointer font-medium text-xs transition shadow-2xs">
                        <Camera className="w-3.5 h-3.5 text-brand-600" />
                        <span>Chọn ảnh từ thiết bị</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleChildAvatarChange}
                        />
                      </label>
                      {formData.avatarKey && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarKey: '' })}
                          className="text-[11px] text-danger-500 hover:underline cursor-pointer"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-ink-400 mr-1">Hoặc icon nhanh:</span>
                      {['👦', '👧', '🧒', '👶', '🦁', '🐱', '🐼', '🚀', '⭐'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarKey: emoji })}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition cursor-pointer ${
                            formData.avatarKey === emoji
                              ? 'border-brand-500 bg-brand-50 scale-105'
                              : 'border-ink-200 bg-white hover:bg-ink-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">
                  Tên đi học (Họ và tên đầy đủ) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Bảo Nam"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-ink-900 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1.5">Tên ở nhà (biệt danh)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bắp, Tít, Sóc..."
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-ink-900 focus:border-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1.5">
                    Tuổi của bé <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="18"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-ink-900 focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1.5">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 focus:border-brand-500 focus:outline-hidden"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1.5">
                    Khối lớp hiện tại <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.gradeLevelId}
                    onChange={(e) => setFormData({ ...formData, gradeLevelId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 focus:border-brand-500 focus:outline-hidden"
                  >
                    {gradeLevels.length > 0 ? (
                      gradeLevels.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Lớp 1</option>
                        <option value={2}>Lớp 2</option>
                        <option value={3}>Lớp 3</option>
                        <option value={4}>Lớp 4</option>
                        <option value={5}>Lớp 5</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">Trường học đang theo học (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiểu học Archimedes Academy"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-ink-900 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-ink-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingChild ? 'Lưu thay đổi' : 'Lưu vào hệ thống'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bài tập về nhà của bé (Gia sư chuyển về) */}
      {tasksModalChild && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-lg font-semibold border border-brand-100">
                  📚
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">
                    Bài tập về nhà của {tasksModalChild.fullName}
                  </h3>
                  <p className="text-xs text-ink-400">
                    Nhiệm vụ tự học được gia sư tạo và giao về cho bé sau mỗi buổi kèm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTasksModalChild(null)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông báo trách nhiệm phụ huynh */}
            <div className="p-3.5 bg-brand-50/60 border border-brand-100 rounded-2xl text-xs text-brand-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-brand-800">
                <UserCheck className="w-4 h-4 text-brand-600" />
                <span>Trách nhiệm đồng hành của phụ huynh:</span>
              </div>
              <p className="text-ink-600 leading-relaxed text-[11px]">
                Phụ huynh hãy mở các bài tập dưới đây để hướng dẫn con rèn luyện thói quen tự giác học tập và làm bài trước khi buổi học tiếp theo diễn ra.
              </p>
            </div>

            {/* Danh sách bài tập */}
            {tasksLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-ink-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                <span className="text-xs">Đang tải danh sách bài tập của bé...</span>
              </div>
            ) : homeworkList.length === 0 ? (
              <div className="py-10 text-center text-xs text-ink-400 border border-dashed border-ink-200 rounded-2xl space-y-1">
                <p className="font-medium text-ink-600">Hiện bé chưa có bài tập về nhà nào còn tồn đọng.</p>
                <p className="text-[11px]">Gia sư sẽ giao bài tập mới sau khi hoàn thành buổi dạy và gửi sổ liên lạc.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {homeworkList.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-4 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-900">{item.title}</span>
                        {item.subjectName && (
                          <Badge variant="brand">{item.subjectName}</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-400">
                        Gia sư: <strong>{item.tutorName || 'Gia sư'}</strong>
                      </span>
                    </div>

                    {/* Nội dung bài tập / dặn dò */}
                    <div className="p-3 bg-white rounded-xl border border-ink-100 text-ink-700 leading-relaxed">
                      {item.homeworkNote || item.description || 'Hoàn thành phiếu bài tập toán đã gửi.'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-400" />
                        <span>
                          {item.dueDate
                            ? `Hạn nộp: ${new Date(item.dueDate).toLocaleDateString('vi-VN')}`
                            : 'Cần làm trước buổi học kế tiếp'}
                        </span>
                      </div>
                      <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                        {item.status === 'SUBMITTED' || item.status === 'REVIEWED'
                          ? '✓ Bé đã nộp bài'
                          : 'Đang chờ bé làm bài'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-ink-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setTasksModalChild(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
