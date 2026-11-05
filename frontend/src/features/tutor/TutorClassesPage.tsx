import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { TutorClass } from '../../types/edtech';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  ArrowRight, 
  User, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  Inbox, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

export default function TutorClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Sắp xếp thời khóa biểu modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4]);
  const [startTime, setStartTime] = useState('18:30');
  const [endTime, setEndTime] = useState('20:00');
  const [teachingMode, setTeachingMode] = useState('OFFLINE');
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await api.tutors.getMyClasses();
      if (res.data) setClasses(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách lớp học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const openScheduleModal = (cls: TutorClass) => {
    setSelectedClass(cls);
    if (cls.schedules && cls.schedules.length > 0) {
      setSelectedDays(cls.schedules.map((s) => s.weekday));
      setStartTime(cls.schedules[0].startTime || '18:30');
      setEndTime(cls.schedules[0].endTime || '20:00');
    } else {
      setSelectedDays([2, 4]);
      setStartTime('18:30');
      setEndTime('20:00');
    }
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      setSubmitting(true);
      const schedules = selectedDays.map((d) => ({
        weekday: d,
        startTime,
        endTime,
      }));
      await api.classes.updateSchedule(selectedClass.id, {
        schedules,
        teachingMode,
      });
      alert('Đã cập nhật lịch học cố định thành công!');
      setScheduleModalOpen(false);
      loadClasses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật thời khóa biểu');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // keep at least 1 day
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

  return (
    <div className="space-y-6">
      <PageHeader
        badge="VietTutor · Quản Lý Giảng Dạy"
        title={`Danh Sách Lớp Học Của Tôi (${classes.length} lớp)`}
        subtitle="Quản lý giáo án, thiết lập lịch học cố định và nộp báo cáo sổ liên lạc từng buổi cho phụ huynh."
      />

      {loading ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-ink-600">Đang tải danh sách lớp học thực tế...</p>
        </Card>
      ) : classes.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center text-ink-400">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-ink-900">Hiện tại bạn chưa được phân công lớp học nào</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              Khi ban tuyển dụng và điều phối viên ghép nối lớp học phù hợp với hồ sơ chuyên môn của bạn, các lớp học đang hoạt động sẽ xuất hiện tại đây.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/tutor/offers')}>
            Xem các đề nghị mời dạy mới
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="p-6 space-y-4 hover:border-emerald-600/40 transition">
              <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md">
                  {cls.code}
                </span>
                <Badge variant={cls.status === 'ACTIVE' ? 'emerald' : 'neutral'}>
                  {cls.status === 'ACTIVE' ? 'Đang diễn ra' : 'Đã kết thúc'}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-ink-900">{cls.studentName}</h3>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">{cls.subject} ({cls.grade})</p>
              </div>

              <div className="space-y-2 text-xs text-ink-600 bg-ink-50 p-4 rounded-2xl border border-ink-100">
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Lịch học cố định:</span>
                  <span className="font-semibold text-ink-800 text-right">{cls.schedule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Buổi tiếp theo:</span>
                  <span className="font-semibold text-emerald-800">{cls.nextLessonTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Phụ huynh liên hệ:</span>
                  <span className="font-semibold text-ink-800">{cls.parentName} {cls.parentPhone && `(${cls.parentPhone})`}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Tiến trình buổi dạy</span>
                  <span className="font-semibold text-ink-800">{cls.completedLessons} / {cls.totalLessons} buổi</span>
                </div>
                <div className="w-full bg-ink-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(cls.currentProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-ink-100/80">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => openScheduleModal(cls)}
                  className="flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Xếp thời khóa biểu</span>
                </Button>
                <Link
                  to={`/tutor/classes/${cls.id}`}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl transition"
                >
                  Xem chi tiết
                </Link>
                <Link
                  to={`/tutor/lessons/les-${cls.completedLessons + 1}/report`}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Nộp báo cáo buổi {cls.completedLessons + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Sắp xếp Thời khóa biểu */}
      {scheduleModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-ink-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-ink-900">Sắp xếp Thời khóa biểu & Lịch học</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Lớp {selectedClass.code} · Học sinh: <strong className="text-ink-800">{selectedClass.studentName}</strong>
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
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu lịch học'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
