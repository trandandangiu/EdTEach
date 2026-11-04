import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Award,
  Calendar,
  XCircle,
  FileText,
  History,
  X,
  Send,
  Eye,
  FileSpreadsheet,
  FileCheck2,
  Download,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  ExternalLink,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { api } from '../../../services/api';

interface ApplicantCard {
  id: string;
  code?: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  university: string;
  major?: string;
  gpa?: string;
  subject: string;
  allSubjects?: string[];
  customSubjects?: string;
  expectedRate?: number;
  bio?: string;
  stage: 'NEW' | 'TESTING' | 'INTERVIEW' | 'APPROVED' | 'REJECTED';
  rawStatus: string;
  score?: number;
  attemptId?: string;
  interviewAt?: string;
  interviewNote?: string;
  rejectReason?: string;
  submittedAt?: string;
  decidedAt?: string;
  attachments?: any[];
}

export default function AdminRecruitKanban() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Modal xem toàn bộ hồ sơ chi tiết
  const [detailModalApp, setDetailModalApp] = useState<ApplicantCard | null>(null);

  // 2. Modal Gửi đề thi qua email (Word/Excel)
  const [examModalApp, setExamModalApp] = useState<ApplicantCard | null>(null);
  const [testTitle, setTestTitle] = useState('Đề thi Nghiệp Vụ Sư Phạm & Năng Lực Dạy Kèm (Đề A)');
  const [examFileType, setExamFileType] = useState<'Word (.docx)' | 'Excel (.xlsx)'>('Word (.docx)');
  const [examFileUrl, setExamFileUrl] = useState('https://edtech.local/exams/De_Thi_Khao_Sat_Chuyen_Mon.docx');
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [examNotes, setExamNotes] = useState('Gia sư tải file đề thi đính kèm về làm bài trực tiếp trên máy tính. Sau khi hoàn thành, vui lòng lưu file và tải lên hệ thống để Ban Tuyển Dụng kiểm tra và sắp lịch phỏng vấn.');
  const [sendingExam, setSendingExam] = useState(false);

  // 3. Modal Đặt lịch phỏng vấn
  const [interviewModalApp, setInterviewModalApp] = useState<ApplicantCard | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('09:00');
  const [interviewNote, setInterviewNote] = useState('');

  // 4. Modal Từ chối
  const [rejectModalApp, setRejectModalApp] = useState<ApplicantCard | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 5. Drawer Timeline
  const [timelineApp, setTimelineApp] = useState<ApplicantCard | null>(null);

  const formatVND = (num?: number) => {
    if (!num) return 'Chưa cập nhật';
    return Number(num).toLocaleString('vi-VN') + ' đ/buổi';
  };

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const res = await api.tutors.getApplications();
      if (res.data) {
        const list: ApplicantCard[] = res.data.map((app: any) => {
          let stage: ApplicantCard['stage'] = 'NEW';
          if (app.status === 'APPROVED') stage = 'APPROVED';
          else if (app.status === 'REJECTED') stage = 'REJECTED';
          else if (app.status === 'INTERVIEW_SCHEDULED' || app.interviewAt) stage = 'INTERVIEW';
          else if (app.status === 'TESTING' || app.status === 'TEST_SUBMITTED' || (app.attempts && app.attempts.length > 0)) stage = 'TESTING';
          else stage = 'NEW';

          // Trích xuất các môn
          const subs = app.subjects?.map((s: any) => s.subjectLevel?.subject?.name).filter(Boolean) || [];

          return {
            id: app.id,
            code: app.code,
            name: app.fullName || app.user?.fullName || 'Ứng viên gia sư',
            username: app.user?.username,
            email: app.email || app.user?.email || '',
            phone: app.phone || app.user?.phone || '',
            avatarUrl: app.avatarUrl || app.user?.avatarUrl,
            university: app.school || 'Đại học Sư Phạm',
            major: app.major || 'Sư phạm',
            gpa: app.gpa || '3.5',
            subject: subs[0] || 'Toán Tiểu học',
            allSubjects: subs,
            customSubjects: app.customSubjects,
            expectedRate: app.expectedRate ? Number(app.expectedRate) : undefined,
            bio: app.bio,
            stage,
            rawStatus: app.status,
            score: app.attempts?.[0]?.percent || (stage === 'APPROVED' ? 88 : undefined),
            attemptId: app.attempts?.[0]?.id,
            interviewAt: app.interviewAt,
            interviewNote: app.interviewNote,
            rejectReason: app.rejectReason,
            submittedAt: app.submittedAt || app.createdAt,
            decidedAt: app.decidedAt,
            attachments: app.attachments || [],
          };
        });
        setApplicants(list);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tuyển dụng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, []);

  // Xử lý gửi đề thi (Word / Excel) qua email và chuyển stage sang TESTING
  const handleSendExamEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examModalApp) return;

    setSendingExam(true);
    try {
      await api.tutors.reviewApplication(examModalApp.id, {
        status: 'TESTING',
        examInfo: {
          testTitle: testTitle.trim(),
          examFileType,
          examFileUrl: examFileUrl.trim(),
          deadlineHours: Number(deadlineHours),
          notes: examNotes.trim(),
        },
      });

      alert(`Đã gửi đề thi "${testTitle}" (${examFileType}) thành công tới Gmail ${examModalApp.email}!\nHồ sơ ứng viên đã chuyển sang trạng thái "Khảo sát chuyên môn".`);
      setExamModalApp(null);
      await loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi email đề thi khảo sát');
    } finally {
      setSendingExam(false);
    }
  };

  // Điều hướng stage
  const moveStage = async (id: string, newStage: ApplicantCard['stage']) => {
    const app = applicants.find(a => a.id === id);
    if (!app) return;

    if (newStage === 'TESTING') {
      // Mở modal gửi đề thi Word/Excel qua email
      setExamModalApp(app);
      return;
    }

    if (newStage === 'INTERVIEW') {
      setInterviewModalApp(app);
      return;
    }

    if (newStage === 'REJECTED') {
      setRejectModalApp(app);
      return;
    }

    try {
      await api.tutors.reviewApplication(id, { status: newStage });
      await loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật giai đoạn');
    }
  };

  // Lên lịch phỏng vấn
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewModalApp || !interviewDate) return;

    try {
      const fullDateTime = `${interviewDate}T${interviewTime}:00`;
      await api.tutors.reviewApplication(interviewModalApp.id, {
        status: 'INTERVIEW_SCHEDULED',
        interviewAt: fullDateTime,
        interviewNote,
      });
      alert(`Đã lên lịch phỏng vấn ngày ${interviewDate} lúc ${interviewTime} cho gia sư ${interviewModalApp.name}!`);
      setInterviewModalApp(null);
      setInterviewDate('');
      setInterviewNote('');
      await loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt lịch phỏng vấn');
    }
  };

  // Từ chối hồ sơ
  const handleRejectApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalApp || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối hồ sơ');
      return;
    }

    try {
      await api.tutors.reviewApplication(rejectModalApp.id, {
        status: 'REJECTED',
        rejectReason: rejectReason.trim(),
      });
      alert(`Đã từ chối hồ sơ ứng viên ${rejectModalApp.name}.`);
      setRejectModalApp(null);
      setRejectReason('');
      await loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi từ chối hồ sơ');
    }
  };

  const columns: { stage: ApplicantCard['stage']; label: string; countColor: string; description: string }[] = [
    { 
      stage: 'NEW', 
      label: '1. Hồ sơ mới nộp', 
      countColor: 'text-slate-700 bg-slate-100',
      description: 'Hồ sơ chờ thẩm định sơ bộ & gửi đề thi'
    },
    { 
      stage: 'TESTING', 
      label: '2. Khảo sát chuyên môn', 
      countColor: 'text-amber-800 bg-amber-100',
      description: 'Đã gửi đề Word/Excel qua email & chờ bài làm'
    },
    { 
      stage: 'INTERVIEW', 
      label: '3. Phỏng vấn', 
      countColor: 'text-teal-800 bg-teal-100',
      description: 'Đã xếp lịch hẹn phỏng vấn sư phạm'
    },
    { 
      stage: 'APPROVED', 
      label: '4. Đã duyệt', 
      countColor: 'text-emerald-800 bg-emerald-100',
      description: 'Gia sư chính thức sẵn sàng nhận lớp'
    },
  ];

  const filteredApplicants = applicants.filter(a => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      a.phone.includes(term) ||
      a.university.toLowerCase().includes(term) ||
      (a.code && a.code.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Hội đồng tuyển dụng & Thẩm định gia sư
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quy Trình Tuyển Dụng & Khảo Thí Gia Sư
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem hồ sơ chi tiết → Gửi đề thi (Word/Excel) qua email → Kiểm tra bài làm → Hẹn phỏng vấn → Duyệt chính thức
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs px-3.5 py-2 pl-8 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <Link
            to="/apply"
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition shrink-0"
          >
            + Mở Biểu Mẫu Ứng Tuyển
          </Link>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {columns.map((col) => {
          const colApps = filteredApplicants.filter(a => a.stage === col.stage);
          return (
            <div key={col.stage} className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200 flex flex-col space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{col.label}</span>
                  <span className="text-[10px] text-slate-500">{col.description}</span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.countColor}`}>
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-[460px]">
                {colApps.length === 0 ? (
                  <div className="h-36 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[11px] text-slate-400">
                    Không có hồ sơ nào
                  </div>
                ) : (
                  colApps.map((app) => {
                    // Kiểm tra có bài nộp thi khảo sát (file submission)
                    const examSubmission = app.attachments?.find(
                      (att) => att.category === 'EXAM_SUBMISSION' || att.category === 'TEST_PAPER'
                    );

                    return (
                      <div
                        key={app.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-600 transition space-y-3 text-xs group"
                      >
                        {/* Header của Card: Avatar & Tên & Mã */}
                        <div className="flex items-start gap-3">
                          {app.avatarUrl ? (
                            <img
                              src={app.avatarUrl}
                              alt={app.name}
                              className="w-10 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-12 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {app.name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4
                                onClick={() => setDetailModalApp(app)}
                                className="font-bold text-slate-900 text-xs truncate hover:text-emerald-800 cursor-pointer"
                                title="Bấm để xem toàn bộ hồ sơ"
                              >
                                {app.name}
                              </h4>
                              <button
                                onClick={() => setTimelineApp(app)}
                                title="Xem lịch sử thẩm định"
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-800 hover:bg-slate-100 transition shrink-0"
                              >
                                <History size={14} />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{app.university}</p>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block truncate max-w-full">
                              {app.subject}
                            </span>
                          </div>
                        </div>

                        {/* Thù lao mong muốn & Nút xem chi tiết */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Thù lao:</span>
                          <strong className="text-slate-800 font-bold">{formatVND(app.expectedRate)}</strong>
                        </div>

                        {/* Thông tin ở cột TESTING (Khảo sát chuyên môn) */}
                        {col.stage === 'TESTING' && (
                          <div className="p-2.5 rounded-xl border space-y-1.5 text-[11px] bg-amber-50/70 border-amber-200">
                            {examSubmission || app.rawStatus === 'TEST_SUBMITTED' ? (
                              <div>
                                <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                                  <FileCheck2 size={13} className="text-emerald-700" />
                                  ĐÃ NỘP BÀI LÀM (Word/Excel)
                                </span>
                                {examSubmission && (
                                  <a
                                    href={examSubmission.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    <Download size={11} />
                                    Tải bài làm: {examSubmission.fileName || 'Bai_Lam_Gia_Su.docx'}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-amber-900 flex items-center gap-1">
                                  <Mail size={12} className="text-amber-700" />
                                  Đã gửi email mời thi Word/Excel
                                </span>
                                <span className="text-[10px] text-amber-700 block">
                                  Đang chờ gia sư nộp lại bài làm...
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Thông tin ở cột INTERVIEW (Lịch hẹn PV) */}
                        {app.interviewAt && (
                          <div className="bg-teal-50 border border-teal-200 p-2 rounded-xl text-[11px] text-teal-900 space-y-0.5">
                            <div className="font-bold flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Lịch PV: {new Date(app.interviewAt).toLocaleString('vi-VN')}</span>
                            </div>
                            {app.interviewNote && (
                              <p className="text-[10px] text-teal-700 italic truncate">{app.interviewNote}</p>
                            )}
                          </div>
                        )}

                        {/* Nút Xem Hồ Sơ Chi Tiết */}
                        <button
                          onClick={() => setDetailModalApp(app)}
                          className="w-full text-center py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold rounded-xl text-[11px] border border-slate-200 transition flex items-center justify-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Xem toàn bộ hồ sơ</span>
                        </button>

                        {/* Các nút hành động chính theo yêu cầu */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => moveStage(app.id, 'REJECTED')}
                            className="text-rose-600 hover:underline font-semibold flex items-center gap-0.5"
                          >
                            <XCircle size={12} />
                            <span>Từ chối</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {/* Ở cột 1 (Mới nộp): Nút "Thi" -> Mở modal gửi email đề Word/Excel */}
                            {col.stage === 'NEW' && (
                              <button
                                onClick={() => moveStage(app.id, 'TESTING')}
                                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold shadow-2xs flex items-center gap-1"
                              >
                                <Mail size={11} />
                                <span>Thi</span>
                              </button>
                            )}

                            {/* Ở cột 2 (Khảo sát chuyên môn): Nút "Hẹn PV" */}
                            {col.stage === 'TESTING' && (
                              <button
                                onClick={() => moveStage(app.id, 'INTERVIEW')}
                                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-2xs flex items-center gap-1"
                              >
                                <Calendar size={11} />
                                <span>Hẹn PV</span>
                              </button>
                            )}

                            {/* Ở cột 3 (Phỏng vấn): Nút "Duyệt ✓" */}
                            {col.stage === 'INTERVIEW' && (
                              <button
                                onClick={() => moveStage(app.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-2xs flex items-center gap-1"
                              >
                                <CheckCircle size={11} />
                                <span>Duyệt ✓</span>
                              </button>
                            )}

                            {/* Ở cột 4 (Đã duyệt): Đã hoàn tất */}
                            {col.stage === 'APPROVED' && (
                              <span className="text-emerald-800 font-bold flex items-center gap-0.5">
                                <CheckCircle size={12} />
                                Đã là gia sư
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. MODAL XEM TOÀN BỘ HỒ SƠ CHI TIẾT CỦA GIA SƯ */}
      {/* ======================================================== */}
      {detailModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                {detailModalApp.avatarUrl ? (
                  <img
                    src={detailModalApp.avatarUrl}
                    alt={detailModalApp.name}
                    className="w-16 h-20 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black border border-emerald-200">
                    {detailModalApp.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900">{detailModalApp.name}</h3>
                    {detailModalApp.code && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {detailModalApp.code}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    Tên đăng nhập: <strong>{detailModalApp.username || 'Chưa có'}</strong>
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-emerald-700" />
                      {detailModalApp.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-emerald-700" />
                      {detailModalApp.phone}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailModalApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Chi tiết học vấn & Thù lao */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">Trình độ & Học vấn:</span>
                <p className="font-bold text-slate-800 text-xs">{detailModalApp.university}</p>
                <p className="text-slate-600">Chuyên ngành: <strong>{detailModalApp.major}</strong></p>
                <p className="text-slate-600">Điểm GPA: <strong>{detailModalApp.gpa}</strong></p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">Thù lao mong muốn:</span>
                <p className="text-base font-extrabold text-emerald-800">
                  {formatVND(detailModalApp.expectedRate)}
                </p>
                <span className="text-[11px] text-slate-500 block">
                  Trạng thái hiện tại: <strong className="text-emerald-900">{detailModalApp.stage}</strong>
                </span>
              </div>
            </div>

            {/* Môn đăng ký giảng dạy */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">Các môn nhận dạy kèm:</span>
              <div className="flex flex-wrap gap-1.5">
                {detailModalApp.allSubjects && detailModalApp.allSubjects.length > 0 ? (
                  detailModalApp.allSubjects.map((sub, i) => (
                    <span
                      key={i}
                      className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold px-2.5 py-1 rounded-lg text-xs"
                    >
                      ✓ {sub}
                    </span>
                  ))
                ) : (
                  <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold px-2.5 py-1 rounded-lg text-xs">
                    ✓ {detailModalApp.subject}
                  </span>
                )}
              </div>
            </div>

            {/* Thông tin giới thiệu & môn tự nhập */}
            {detailModalApp.bio && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Ghi chú & Giới thiệu / Môn tự nhập:</span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {detailModalApp.bio}
                </p>
              </div>
            )}

            {/* Tệp đính kèm (CV, Bằng cấp, Bài nộp thi Word/Excel) */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">Tệp đính kèm trong hồ sơ:</span>
              {detailModalApp.attachments && detailModalApp.attachments.length > 0 ? (
                <div className="space-y-1.5">
                  {detailModalApp.attachments.map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <div>
                          <span className="font-bold text-slate-800">{att.fileName || 'Tài liệu đính kèm'}</span>
                          <span className="text-[10px] text-slate-400 block">Loại: {att.category}</span>
                        </div>
                      </div>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1"
                      >
                        <Download size={11} />
                        Tải xuống
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">Chưa có tệp đính kèm nào được tải lên.</p>
              )}
            </div>

            {/* Nút hành động nhanh trong modal chi tiết */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  const app = detailModalApp;
                  setDetailModalApp(null);
                  moveStage(app.id, 'REJECTED');
                }}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl border border-rose-200"
              >
                Từ chối hồ sơ
              </button>

              <div className="flex items-center gap-2">
                {detailModalApp.stage === 'NEW' && (
                  <button
                    onClick={() => {
                      const app = detailModalApp;
                      setDetailModalApp(null);
                      setExamModalApp(app);
                    }}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Mail size={13} />
                    <span>Thi (Gửi đề Word/Excel qua Email)</span>
                  </button>
                )}

                {detailModalApp.stage === 'TESTING' && (
                  <button
                    onClick={() => {
                      const app = detailModalApp;
                      setDetailModalApp(null);
                      setInterviewModalApp(app);
                    }}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Calendar size={13} />
                    <span>Lên lịch phỏng vấn</span>
                  </button>
                )}

                {detailModalApp.stage !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      const app = detailModalApp;
                      setDetailModalApp(null);
                      moveStage(app.id, 'APPROVED');
                    }}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle size={13} />
                    <span>Duyệt chính thức</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL GỬI ĐỀ THI KHẢO SÁT CHUYÊN MÔN (WORD / EXCEL) */}
      {/* ======================================================== */}
      {examModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-700" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Gửi Đề Thi Khảo Sát Chuyên Môn (Word / Excel)
                </h3>
              </div>
              <button onClick={() => setExamModalApp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
              <div>Ứng viên nhận đề: <strong>{examModalApp.name}</strong></div>
              <div>Gmail nhận bài thi: <strong>{examModalApp.email}</strong></div>
              <div className="text-[11px] text-amber-800">
                Hệ thống sẽ tự động gửi email chứa hướng dẫn làm bài và file đề thi Word/Excel tới hộp thư này. Trạng thái hồ sơ sẽ nhảy sang cột <strong>Khảo sát chuyên môn</strong>.
              </div>
            </div>

            <form onSubmit={handleSendExamEmail} className="space-y-3.5">
              {/* Chọn nhanh tên đề thi */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Tên đề thi khảo sát *
                </label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-amber-700 focus:outline-hidden"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 self-center">Chọn nhanh:</span>
                  {[
                    'Đề thi Toán Cấp 1 & Nghiệp Vụ (Word)',
                    'Đề thi Tiếng Việt & Sư Phạm (Word)',
                    'Bài kiểm tra Nghiệp Vụ & Thống Kê (Excel)',
                    'Đề thi Tiếng Anh Năng Lực (Word)',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTestTitle(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loại định dạng đề thi: Word hoặc Excel */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Định dạng bài thi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExamFileType('Word (.docx)')}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition ${
                      examFileType === 'Word (.docx)'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>File Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExamFileType('Excel (.xlsx)')}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition ${
                      examFileType === 'Excel (.xlsx)'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>File Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Đường dẫn / Link tải đề thi */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Link tải đề thi hoặc mã tệp đính kèm
                </label>
                <input
                  type="text"
                  value={examFileUrl}
                  onChange={(e) => setExamFileUrl(e.target.value)}
                  placeholder="https://edtech.local/exams/De_Thi_Toan.docx"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-amber-700 focus:outline-hidden"
                />
              </div>

              {/* Thời hạn nộp bài */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Thời hạn nộp bài (giờ)
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={168}
                    value={deadlineHours}
                    onChange={(e) => setDeadlineHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-amber-700 focus:outline-hidden"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[11px] text-slate-500 mb-2">
                    Tương đương: <strong>{Math.round(deadlineHours / 24)} ngày làm bài</strong>
                  </span>
                </div>
              </div>

              {/* Ghi chú & Hướng dẫn gửi kèm vào email */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Ghi chú & Hướng dẫn làm bài gửi kèm qua email
                </label>
                <textarea
                  rows={2}
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-amber-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExamModalApp(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingExam}
                  className="px-5 py-2 font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  {sendingExam ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang gửi email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Xác nhận & Gửi Email Cho Gia Sư</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL ĐẶT LỊCH PHỎNG VẤN */}
      {/* ======================================================== */}
      {interviewModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-slate-900">Lịch Phỏng Vấn Sư Phạm</h3>
              </div>
              <button onClick={() => setInterviewModalApp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-slate-600">
              Lên lịch phỏng vấn chuyên môn cho gia sư <strong>{interviewModalApp.name}</strong> ({interviewModalApp.email}):
            </p>

            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày phỏng vấn *</label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Giờ phỏng vấn *</label>
                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ghi chú & Link họp trực tuyến</label>
                <textarea
                  rows={2}
                  placeholder="https://meet.google.com/abc-xyz hoặc Phòng phỏng vấn P302"
                  value={interviewNote}
                  onChange={(e) => setInterviewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInterviewModalApp(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Xác nhận lịch hẹn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL TỪ CHỐI HỒ SƠ */}
      {/* ======================================================== */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">Từ Chối Đơn Ứng Tuyển</h3>
              </div>
              <button onClick={() => setRejectModalApp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-slate-600">
              Vui lòng nhập lý do từ chối hồ sơ ứng viên <strong>{rejectModalApp.name}</strong> để lưu vào hệ thống:
            </p>

            <form onSubmit={handleRejectApplication} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do từ chối *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Bài làm khảo sát chuyên môn chưa đạt yêu cầu, thiếu chứng chỉ bằng cấp..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-rose-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DRAWER TIMELINE LỊCH SỬ THẨM ĐỊNH */}
      {/* ======================================================== */}
      {timelineApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col space-y-6 text-xs overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Timeline Thẩm Định</h3>
                  <p className="text-[11px] text-slate-500">{timelineApp.name} ({timelineApp.phone})</p>
                </div>
              </div>
              <button
                onClick={() => setTimelineApp(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Timeline steps */}
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Mốc 1: Nộp hồ sơ */}
              <div className="relative pl-8">
                <div className="absolute left-1 top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs"></div>
                <h4 className="font-bold text-slate-900">1. Nộp hồ sơ ứng tuyển</h4>
                <p className="text-slate-500 text-[11px]">
                  Thời gian: {timelineApp.submittedAt ? new Date(timelineApp.submittedAt).toLocaleString('vi-VN') : 'Đã nộp'}
                </p>
                <p className="text-slate-600 mt-1">Môn đăng ký: <strong>{timelineApp.subject}</strong></p>
              </div>

              {/* Mốc 2: Khảo sát đề thi Word/Excel */}
              <div className="relative pl-8">
                <div className={`absolute left-1 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  ['TESTING', 'INTERVIEW', 'APPROVED'].includes(timelineApp.stage) ? 'bg-amber-600' : 'bg-slate-300'
                }`}></div>
                <h4 className="font-bold text-slate-900">2. Khảo sát chuyên môn (Word / Excel)</h4>
                {['TESTING', 'INTERVIEW', 'APPROVED'].includes(timelineApp.stage) ? (
                  <p className="text-amber-800 font-bold text-[11px]">
                    Đã gửi đề thi qua Gmail cho gia sư
                  </p>
                ) : (
                  <p className="text-slate-400 text-[11px]">Chưa gửi đề khảo sát</p>
                )}
              </div>

              {/* Mốc 3: Phỏng vấn */}
              <div className="relative pl-8">
                <div className={`absolute left-1 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  timelineApp.interviewAt ? 'bg-teal-600' : 'bg-slate-300'
                }`}></div>
                <h4 className="font-bold text-slate-900">3. Phỏng vấn sư phạm</h4>
                {timelineApp.interviewAt ? (
                  <div className="text-[11px] text-teal-800">
                    <p className="font-semibold">Lịch hẹn: {new Date(timelineApp.interviewAt).toLocaleString('vi-VN')}</p>
                    {timelineApp.interviewNote && <p className="text-slate-500 italic mt-0.5">{timelineApp.interviewNote}</p>}
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">Chưa đặt lịch phỏng vấn</p>
                )}
              </div>

              {/* Mốc 4: Kết quả cuối cùng */}
              <div className="relative pl-8">
                <div className={`absolute left-1 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  timelineApp.stage === 'APPROVED' ? 'bg-emerald-600' :
                  timelineApp.stage === 'REJECTED' ? 'bg-rose-600' : 'bg-slate-300'
                }`}></div>
                <h4 className="font-bold text-slate-900">4. Quyết định duyệt</h4>
                {timelineApp.stage === 'APPROVED' ? (
                  <span className="inline-block mt-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Đã chính thức duyệt làm gia sư
                  </span>
                ) : timelineApp.stage === 'REJECTED' ? (
                  <div className="mt-1 text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    <p className="font-bold">Đã từ chối hồ sơ</p>
                    {timelineApp.rejectReason && <p className="text-[11px] mt-0.5">Lý do: {timelineApp.rejectReason}</p>}
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">Đang trong quá trình thẩm định</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setTimelineApp(null)}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
