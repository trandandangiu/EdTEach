import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { TutorClass, LessonReport } from '../../types/edtech';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  BookOpen, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Star, 
  SlidersHorizontal, 
  Send, 
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function TutorClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<TutorClass | null>(null);
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Homework modal
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwSubmitting, setHwSubmitting] = useState(false);

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4]);
  const [startTime, setStartTime] = useState('18:30');
  const [endTime, setEndTime] = useState('20:00');
  const [teachingMode, setTeachingMode] = useState('OFFLINE');
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [clsRes, repRes] = await Promise.all([
        api.classes.getClassDetail(id),
        api.reports.getLessonReports({ classId: id }),
      ]);
      if (clsRes.data) {
        const c = clsRes.data;
        const firstStudent = c.students?.[0]?.student;
        const total = c.sessionsPerWeek ? c.sessionsPerWeek * 12 : 24;
        const completed = c.lessons?.filter((l: any) => l.status === 'CONFIRMED' || l.status === 'REPORTED').length || 0;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const scheduleText = (c.schedules && c.schedules.length > 0)
          ? c.schedules.map((s: any) => {
              const dayName = s.weekday === 0 ? 'Chủ nhật' : `Thứ ${s.weekday + 1}`;
              return `${dayName} (${s.startTime} - ${s.endTime})`;
            }).join(', ')
          : `${c.sessionsPerWeek || 2} buổi/tuần`;

        setCls({
          id: c.id,
          code: c.code,
          studentName: firstStudent?.fullName || 'Học sinh',
          parentName: firstStudent?.parent?.user?.fullName || 'Phụ huynh',
          parentPhone: firstStudent?.parent?.user?.phone || '',
          subject: c.subjectLevel?.subject?.name || 'Môn học',
          grade: c.subjectLevel?.gradeLevel?.name || 'Tiểu học',
          schedule: scheduleText,
          schedules: c.schedules || [],
          totalLessons: total,
          completedLessons: completed,
          currentProgress: progress,
          status: c.status,
          nextLessonTime: 'Theo lịch xếp',
          tutorNotes: c.notes || 'Học sinh chăm chỉ, tiếp thu tốt.',
        });

        if (c.schedules && c.schedules.length > 0) {
          setSelectedDays(c.schedules.map((s: any) => s.weekday));
          setStartTime(c.schedules[0].startTime || '18:30');
          setEndTime(c.schedules[0].endTime || '20:00');
        }
      }
      if (repRes.data) setReports(repRes.data);
    } catch (err) {
      console.error('Lỗi tải chi tiết lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setScheduleSubmitting(true);
      const schedules = selectedDays.map((d) => ({
        weekday: d,
        startTime,
        endTime,
      }));
      await api.classes.updateSchedule(id, {
        schedules,
        teachingMode,
      });
      alert('Đã cập nhật thời khóa biểu thành công!');
      setScheduleModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật thời khóa biểu');
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setHwSubmitting(true);
      await api.classes.assignHomework(id, {
        title: hwTitle,
        description: hwDescription,
        dueDate: hwDueDate || undefined,
      });
      alert(`Đã giao bài tập thành công cho học sinh ${cls?.studentName}!`);
      setHomeworkModalOpen(false);
      setHwTitle('');
      setHwDescription('');
      setHwDueDate('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi giao bài tập');
    } finally {
      setHwSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const dayLabels = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ nhật' },
  ];

  if (loading || !cls) {
    return (
      <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-ink-600">Đang tải thông tin lớp học...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back nav */}
      <div className="flex items-center justify-between text-xs">
        <Link to="/tutor/classes" className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách lớp học</span>
        </Link>
        <span className="text-ink-400 font-medium">Mã lớp: {cls.code}</span>
      </div>

      {/* Class Overview Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-5">
          <div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md uppercase tracking-wider">
              {cls.subject} ({cls.grade})
            </span>
            <h1 className="text-2xl font-semibold text-ink-900 mt-2">{cls.studentName}</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              Phụ huynh: <strong className="text-ink-700">{cls.parentName}</strong> {cls.parentPhone && `· SĐT: ${cls.parentPhone}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sắp xếp lịch học</span>
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setHomeworkModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Giao bài tập</span>
            </Button>
            <Link
              to={`/tutor/lessons/les-${cls.completedLessons + 1}/report`}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition"
            >
              + Tạo báo cáo buổi mới
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-ink-50 rounded-2xl border border-ink-100">
            <span className="text-ink-400 block mb-1">Lịch học hàng tuần:</span>
            <strong className="text-ink-900 text-sm">{cls.schedule}</strong>
          </div>
          <div className="p-4 bg-ink-50 rounded-2xl border border-ink-100">
            <span className="text-ink-400 block mb-1">Tiến độ bài học:</span>
            <strong className="text-emerald-800 text-sm">{cls.completedLessons} / {cls.totalLessons} buổi ({cls.currentProgress}%)</strong>
          </div>
          <div className="p-4 bg-ink-50 rounded-2xl border border-ink-100">
            <span className="text-ink-400 block mb-1">Trạng thái lớp:</span>
            <Badge variant={cls.status === 'ACTIVE' ? 'emerald' : 'neutral'}>
              {cls.status === 'ACTIVE' ? 'Đang diễn ra' : 'Đã kết thúc'}
            </Badge>
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-2xl text-xs space-y-1">
          <strong className="text-emerald-950 font-semibold">Ghi chú & Phương pháp giảng dạy cho học sinh:</strong>
          <p className="text-ink-700 leading-relaxed">{cls.tutorNotes}</p>
        </div>
      </Card>

      {/* Lesson Reports History */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>Lịch sử Báo Cáo Buổi Học ({reports.length} báo cáo)</span>
          </h2>
          <Link
            to={`/tutor/lessons/les-${cls.completedLessons + 1}/report`}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            + Viết báo cáo mới
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500">
            Chưa có báo cáo buổi dạy nào cho lớp học này. Sau mỗi buổi dạy, bạn hãy nộp báo cáo để phụ huynh nắm được tình hình học tập của bé.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div key={rep.id} className="p-5 rounded-2xl border border-ink-200 bg-ink-50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-200/60 pb-3 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-800">Buổi số {rep.lessonNumber}</span>
                    <span className="text-ink-400 mx-2">·</span>
                    <span className="text-ink-600 font-medium">{rep.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-800 font-semibold">Tiếp thu: {rep.comprehensionScore}/10</span>
                    <span className="text-amber-600 font-semibold">Thưởng: +{rep.starsAwarded} ⭐</span>
                  </div>
                </div>

                <div className="text-xs text-ink-700 space-y-1.5">
                  <div><strong>Chủ đề đã học:</strong> {rep.topic}</div>
                  <div><strong>Nhận xét của gia sư:</strong> {rep.teacherFeedback}</div>
                  <div><strong>Bài tập về nhà:</strong> {rep.homeworkAssigned}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Sắp xếp Thời khóa biểu */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-ink-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-ink-900">Sắp xếp Thời khóa biểu & Lịch học</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Lớp {cls.code} · Học sinh: <strong className="text-ink-800">{cls.studentName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setScheduleModalOpen(false)}
                className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-2">Chọn ngày học trong tuần:</label>
                <div className="grid grid-cols-4 gap-2">
                  {dayLabels.map((day) => {
                    const active = selectedDays.includes(day.value);
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                          active
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Giờ bắt đầu:</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Giờ kết thúc:</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Hình thức giảng dạy:</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="OFFLINE">Dạy kèm trực tiếp tại nhà</option>
                  <option value="ONLINE">Dạy kèm trực tuyến (Online Video)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
                <span className="font-semibold block">Tóm tắt lịch học đã chọn:</span>
                <p>
                  {selectedDays.map((d) => dayLabels.find((l) => l.value === d)?.label).join(', ')} hàng tuần ({startTime} - {endTime})
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
                <Button type="button" variant="secondary" onClick={() => setScheduleModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={scheduleSubmitting}>
                  {scheduleSubmitting ? 'Đang lưu...' : 'Lưu lịch học'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Giao Bài Tập */}
      {homeworkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-ink-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-ink-900">Giao Bài Tập Về Nhà Cho Bé</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Lớp {cls.code} · Học sinh: <strong className="text-ink-800">{cls.studentName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setHomeworkModalOpen(false)}
                className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignHomework} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Tiêu đề bài tập / Nhiệm vụ: *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bài tập luyện giải phương trình bậc nhất (trang 42)"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nội dung chi tiết & Hướng dẫn: *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi chú các bài tập cần làm, dạng bài hoặc link tài liệu đính kèm..."
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-emerald-600 focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Hạn nộp bài:</label>
                <input
                  type="datetime-local"
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
                <Button type="button" variant="secondary" onClick={() => setHomeworkModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={hwSubmitting}>
                  {hwSubmitting ? 'Đang gửi...' : 'Giao bài tập'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
