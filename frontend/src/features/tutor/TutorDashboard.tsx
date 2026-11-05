import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TutorClass, TutorOffer, LessonReport } from '../../types/edtech';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  BookOpen, 
  ArrowRight, 
  Inbox, 
  Users,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Send,
  BookOpenCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

export default function TutorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [offers, setOffers] = useState<TutorOffer[]>([]);
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Giao bài tập về nhà cho bé
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [selectedClassIdForHw, setSelectedClassIdForHw] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwSubmitting, setHwSubmitting] = useState(false);

  // Modal 2: Sắp xếp thời khóa biểu & lịch học cho từng bé
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedClassIdForSchedule, setSelectedClassIdForSchedule] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4]); // 2: Thứ 3, 4: Thứ 5
  const [startTime, setStartTime] = useState('18:30');
  const [endTime, setEndTime] = useState('20:00');
  const [teachingMode, setTeachingMode] = useState('OFFLINE');
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  // Modal 3: Danh sách lớp học đang phụ trách
  const [classesModalOpen, setClassesModalOpen] = useState(false);

  // Modal 4: Sổ liên lạc & Báo cáo buổi dạy
  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      const [clsRes, offRes, repRes] = await Promise.all([
        api.tutors.getMyClasses(),
        api.tutors.getMyOffers(),
        api.reports.getLessonReports(),
      ]);
      if (clsRes?.data) setClasses(clsRes.data);
      if (offRes?.data) setOffers(offRes.data);
      if (repRes?.data) setReports(repRes.data);

      if (clsRes?.data && clsRes.data.length > 0) {
        setSelectedClassIdForHw(clsRes.data[0].id);
        setSelectedClassIdForSchedule(clsRes.data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải bàn làm việc gia sư:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutorData();
  }, []);

  const activeClasses = classes.filter((c) => c.status === 'ACTIVE');
  const pendingOffers = offers.filter((o) => o.status === 'PENDING');

  // Submit Giao bài tập về nhà
  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassIdForHw) {
      alert('Vui lòng chọn lớp học để giao bài tập');
      return;
    }
    if (!hwTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    try {
      setHwSubmitting(true);
      await api.classes.assignHomework(selectedClassIdForHw, {
        title: hwTitle.trim(),
        description: hwDescription.trim() || undefined,
        dueDate: hwDueDate || undefined,
      });

      alert('Đã giao bài tập về nhà cho học sinh thành công!');
      setHomeworkModalOpen(false);
      setHwTitle('');
      setHwDescription('');
      setHwDueDate('');
    } catch (err: any) {
      console.error('Lỗi khi giao bài tập:', err);
      alert(err?.message || 'Có lỗi khi giao bài tập. Vui lòng thử lại.');
    } finally {
      setHwSubmitting(false);
    }
  };

  // Submit Sắp xếp thời khóa biểu cho từng bé
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassIdForSchedule) {
      alert('Vui lòng chọn lớp học của bé để xếp lịch');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thứ trong tuần');
      return;
    }

    try {
      setScheduleSubmitting(true);
      const schedulesPayload = selectedDays.map((d) => ({
        weekday: d,
        startTime,
        endTime,
      }));

      await api.classes.updateSchedule(selectedClassIdForSchedule, {
        schedules: schedulesPayload,
      });

      alert('Đã cập nhật thời khóa biểu cho bé thành công!');
      setScheduleModalOpen(false);
      await loadTutorData();
    } catch (err: any) {
      console.error('Lỗi khi lưu thời khóa biểu:', err);
      alert(err?.message || 'Lỗi khi cập nhật thời khóa biểu');
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const toggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayNum));
    } else {
      setSelectedDays([...selectedDays, dayNum].sort());
    }
  };

  const dayLabels = [
    { num: 1, label: 'Thứ 2' },
    { num: 2, label: 'Thứ 3' },
    { num: 3, label: 'Thứ 4' },
    { num: 4, label: 'Thứ 5' },
    { num: 5, label: 'Thứ 6' },
    { num: 6, label: 'Thứ 7' },
    { num: 0, label: 'Chủ Nhật' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="VietTutor Educator Portal"
        title={`Xin chào, ${currentUser?.name || 'Gia Sư'}`}
        description="Theo dõi tiến độ giảng dạy, lên thời khóa biểu cho từng bé, giao bài tập về nhà và nộp báo cáo buổi học."
        actions={
          <Link to="/tutor/offers">
            <Button variant="primary" size="md">
              <Inbox className="w-4 h-4" />
              <span>Hòm thư lời mời ({pendingOffers.length})</span>
            </Button>
          </Link>
        }
      />

      {/* Reminder Banner */}
      {activeClasses.length > 0 ? (
        <Card variant="static" padding="md" className="bg-brand-50/60 border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-900 block">
                Nhắc nhở cập nhật Báo cáo Buổi học
              </span>
              <span className="text-xs text-ink-600">
                Gia sư vui lòng hoàn thành sổ liên lạc số hoá sau mỗi buổi dạy để phụ huynh theo dõi sát sao sự tiến bộ của bé.
              </span>
            </div>
          </div>
          <Link to="/tutor/classes" className="shrink-0">
            <Button variant="primary" size="sm">
              Xem lớp & nộp báo cáo
            </Button>
          </Link>
        </Card>
      ) : (
        <Card variant="static" padding="md" className="bg-ink-50/80 border-ink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-ink-200 text-ink-700 flex items-center justify-center shrink-0">
              👋
            </div>
            <div>
              <span className="text-xs font-semibold text-ink-900 block">
                Chào mừng bạn gia nhập đội ngũ gia sư VietTutor!
              </span>
              <span className="text-xs text-ink-500">
                Hiện bạn chưa nhận lớp học nào. Hãy kiểm tra hòm thư lời mời để nhận đề xuất ghép lớp phù hợp nhất.
              </span>
            </div>
          </div>
          <Link to="/tutor/offers" className="shrink-0">
            <Button variant="outline" size="sm">
              <Inbox className="w-3.5 h-3.5" />
              <span>Kiểm tra lời mời nhận lớp</span>
            </Button>
          </Link>
        </Card>
      )}

      {/* 4 Thẻ KPI — Tất cả đều bấm được để tìm kiếm thông tin & thao tác */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Thẻ 1: Lớp đang giảng dạy — Bấm vào mở danh sách lớp */}
        <div
          onClick={() => {
            if (activeClasses.length > 0) setClassesModalOpen(true);
            else navigate('/tutor/classes');
          }}
          className="cursor-pointer group"
          title="Bấm để xem danh sách lớp học đang phụ trách"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Lớp đang giảng dạy</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:scale-105 transition">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-ink-900">
                {activeClasses.length} lớp
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  {activeClasses.length > 0 ? 'Bấm xem chi tiết lớp →' : 'Chưa có lớp nào'}
                </span>
                <span className="text-ink-400 text-[11px]">
                  {activeClasses.length > 0 ? 'Đang hoạt động' : 'Gia sư mới'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Giao bài tập cho học sinh (Thay thế thu nhập dự kiến tháng) — Bấm vào mở modal giao bài tập */}
        <div
          onClick={() => setHomeworkModalOpen(true)}
          className="cursor-pointer group"
          title="Bấm để giao bài tập về nhà cho học sinh"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Giao bài tập về nhà</span>
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-100 group-hover:scale-105 transition">
                <BookOpenCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-ink-900 flex items-center gap-1.5">
                <span>Giao bài tập</span>
                <Plus className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  Soạn bài cho bé tự học →
                </span>
                <span className="text-ink-400 text-[11px]">Nhiệm vụ tuần</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Sổ liên lạc & Báo cáo buổi dạy (Thay thế đánh giá phụ huynh) — Bấm vào xem báo cáo */}
        <div
          onClick={() => {
            if (reports.length > 0) setReportsModalOpen(true);
            else navigate('/tutor/classes');
          }}
          className="cursor-pointer group"
          title="Bấm để xem sổ liên lạc và báo cáo buổi dạy"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Sổ liên lạc & Báo cáo</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:scale-105 transition">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-ink-900">
                {reports.length} báo cáo
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  {reports.length > 0 ? 'Bấm xem các báo cáo →' : 'Nộp báo cáo mới →'}
                </span>
                <span className="text-ink-400 text-[11px]">
                  {reports.length > 0 ? 'Đã gửi' : 'Chưa có'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Thời khóa biểu & Lên lịch dạy — Bấm vào mở modal sắp xếp lịch học cho từng bé */}
        <div
          onClick={() => setScheduleModalOpen(true)}
          className="cursor-pointer group"
          title="Bấm để sắp xếp thời khóa biểu, lịch học cho từng bé"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Thời khóa biểu & Lịch dạy</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:scale-105 transition">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-ink-900 truncate">
                {activeClasses.length > 0 ? `${activeClasses.length} lịch học` : 'Chưa xếp lịch'}
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  Sắp xếp lịch học cho bé →
                </span>
                <span className="text-ink-400 text-[11px]">
                  {activeClasses.length > 0 ? 'Cố định' : 'Trống'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách lớp học đang phụ trách — LẤY DỮ LIỆU THẬT 100% */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <span>Danh sách lớp học đang phụ trách ({activeClasses.length})</span>
          </h3>
          {activeClasses.length > 0 && (
            <Link to="/tutor/classes" className="text-xs font-semibold text-brand-700 hover:underline">
              Quản lý tất cả lớp →
            </Link>
          )}
        </div>

        {loading ? (
          <Card variant="static" padding="lg" className="py-16 text-center flex flex-col items-center justify-center text-ink-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-sm font-medium">Đang tải danh sách lớp học từ hệ thống...</p>
          </Card>
        ) : activeClasses.length === 0 ? (
          <Card variant="static" padding="lg" className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-ink-100 text-ink-400 flex items-center justify-center mx-auto text-3xl">
              📚
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-ink-900">Chưa có lớp học nào đang phụ trách</h4>
              <p className="text-xs text-ink-500 max-w-md mx-auto">
                Khi ban điều phối VietTutor ghép học sinh hoặc phụ huynh gửi đề nghị học, lớp học của bạn sẽ hiển thị tại đây để bạn bắt đầu giảng dạy.
              </p>
            </div>
            <Link to="/tutor/offers">
              <Button variant="primary" size="sm">
                <Inbox className="w-3.5 h-3.5" />
                <span>Xem hòm thư lời mời ({pendingOffers.length})</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {activeClasses.map((cls) => (
              <Card key={cls.id} variant="interactive" padding="md" className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-sm text-ink-900">{cls.subject}</h4>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Học sinh: <strong>{cls.studentName}</strong> ({cls.grade}) · Phụ huynh: {cls.parentName}
                    </p>
                  </div>
                  <Badge variant="brand">Đang diễn ra</Badge>
                </div>

                <div className="p-3 bg-ink-50 rounded-2xl border border-ink-200/80 text-xs space-y-1.5 text-ink-600">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-ink-400" />
                      <span>Thời khóa biểu:</span>
                    </span>
                    <strong className="text-ink-900">{cls.schedule || 'Chưa xếp lịch'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiến độ buổi dạy:</span>
                    <strong className="text-brand-700">
                      {cls.completedLessons || 0} / {cls.totalLessons || 24} buổi
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedClassIdForSchedule(cls.id);
                      setScheduleModalOpen(true);
                    }}
                    className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sắp xếp lịch học</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedClassIdForHw(cls.id);
                        setHomeworkModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl transition cursor-pointer"
                    >
                      Giao bài tập
                    </button>
                    <Link to={`/tutor/lessons/${cls.id}/report`}>
                      <Button variant="secondary" size="sm">
                        Gửi báo cáo
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: GIAO BÀI TẬP VỀ NHÀ CHO HỌC SINH                    */}
      {/* ============================================================ */}
      {homeworkModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-lg font-semibold border border-brand-100">
                  <BookOpenCheck className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">Giao bài tập về nhà</h3>
                  <p className="text-xs text-ink-400">Tạo nhiệm vụ tự học gửi thẳng về portal của bé</p>
                </div>
              </div>
              <button
                onClick={() => setHomeworkModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignHomework} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">
                  Chọn lớp học & Học sinh <span className="text-danger-500">*</span>
                </label>
                {classes.length > 0 ? (
                  <select
                    value={selectedClassIdForHw}
                    onChange={(e) => setSelectedClassIdForHw(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 font-semibold focus:border-brand-500 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.studentName} — {c.subject} ({c.grade})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-ink-50 rounded-xl text-ink-500 text-xs border border-ink-200">
                    Bạn chưa có lớp học nào để giao bài.
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">
                  Tiêu đề bài tập <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phiếu bài tập phân số buổi 3"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-ink-900 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">
                  Nội dung bài tập & Lời dặn tự học cho bé và phụ huynh
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Làm bài 1, 2 trang 45 vở bài tập toán. Nhờ phụ huynh nhắc bé hoàn thành trước tối thứ 4."
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                  className="w-full p-3 border border-ink-200 rounded-xl text-ink-900 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">Hạn hoàn thành (tuỳ chọn)</label>
                <input
                  type="date"
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-ink-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHomeworkModalOpen(false)}
                  disabled={hwSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={hwSubmitting || classes.length === 0}
                >
                  {hwSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi bài tập cho bé</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: SẮP XẾP THỜI KHÓA BIỂU & LỊCH HỌC TỪNG BÉ           */}
      {/* ============================================================ */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-lg font-semibold border border-brand-100">
                  <Calendar className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">Sắp xếp thời khóa biểu</h3>
                  <p className="text-xs text-ink-400">Thiết lập lịch dạy cố định cho từng học sinh</p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">
                  Chọn học sinh & Lớp học <span className="text-danger-500">*</span>
                </label>
                {classes.length > 0 ? (
                  <select
                    value={selectedClassIdForSchedule}
                    onChange={(e) => setSelectedClassIdForSchedule(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 font-semibold focus:border-brand-500 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.studentName} — {c.subject} ({c.grade})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-ink-50 rounded-xl text-ink-500 text-xs border border-ink-200">
                    Bạn chưa có lớp học nào để sắp xếp lịch.
                  </div>
                )}
              </div>

              {/* Chọn các thứ trong tuần */}
              <div>
                <label className="block font-semibold text-ink-800 mb-1.5">
                  Chọn các buổi trong tuần <span className="text-danger-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {dayLabels.map((d) => {
                    const isSelected = selectedDays.includes(d.num);
                    return (
                      <button
                        type="button"
                        key={d.num}
                        onClick={() => toggleDay(d.num)}
                        className={`py-2 px-2.5 rounded-xl border font-semibold text-xs transition cursor-pointer text-center ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-2xs'
                            : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khung giờ học */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1.5">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 font-semibold focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-800 mb-1.5">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl bg-white text-ink-900 font-semibold focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-ink-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={scheduleSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={scheduleSubmitting || classes.length === 0}
                >
                  {scheduleSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lưu thời khóa biểu</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: DANH SÁCH LỚP HỌC ĐANG PHỤ TRÁCH                    */}
      {/* ============================================================ */}
      {classesModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-lg font-semibold border border-brand-100">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">Lớp học đang phụ trách</h3>
                  <p className="text-xs text-ink-400">Danh sách các lớp học hiện tại của gia sư</p>
                </div>
              </div>
              <button
                onClick={() => setClassesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {activeClasses.map((cls) => (
                <div key={cls.id} className="p-4 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900 text-sm">{cls.subject}</span>
                    <Badge variant="brand">Đang diễn ra</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-ink-600 pt-1">
                    <div>Học sinh: <strong className="text-ink-900">{cls.studentName}</strong></div>
                    <div>Khối lớp: <strong className="text-ink-900">{cls.grade}</strong></div>
                    <div>Phụ huynh: <strong className="text-ink-900">{cls.parentName}</strong></div>
                    <div>Lịch học: <strong className="text-ink-900">{cls.schedule || 'Thỏa thuận'}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
              <Link to="/tutor/classes" onClick={() => setClassesModalOpen(false)}>
                <Button variant="outline" size="sm">
                  Quản lý tất cả lớp học
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setClassesModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: SỔ LIÊN LẠC & BÁO CÁO BUỔI DẠY                     */}
      {/* ============================================================ */}
      {reportsModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-lg font-semibold border border-brand-100">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">Báo cáo buổi học đã gửi</h3>
                  <p className="text-xs text-ink-400">Danh sách sổ liên lạc gia sư đã cập nhật</p>
                </div>
              </div>
              <button
                onClick={() => setReportsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3.5 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900">
                      Buổi {rep.lessonNumber || 1} · {rep.subject || 'Môn học'}
                    </span>
                    <span className="text-[11px] text-ink-400">{rep.date}</span>
                  </div>
                  <p className="text-ink-600 line-clamp-2">{rep.topic || rep.contentCovered}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-ink-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setReportsModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
