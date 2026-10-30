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
  ChevronRight,
  ShieldCheck,
  Calendar,
  XCircle,
  FileText,
  History,
  X,
  Send
} from 'lucide-react';
import { api } from '../../../services/api';

interface ApplicantCard {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  subject: string;
  stage: 'NEW' | 'TESTING' | 'INTERVIEW' | 'APPROVED' | 'REJECTED';
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

  // Modals state
  const [interviewModalApp, setInterviewModalApp] = useState<ApplicantCard | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('09:00');
  const [interviewNote, setInterviewNote] = useState('');

  const [rejectModalApp, setRejectModalApp] = useState<ApplicantCard | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [timelineApp, setTimelineApp] = useState<ApplicantCard | null>(null);

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
          else if (app.attempts && app.attempts.length > 0) stage = 'TESTING';

          return {
            id: app.id,
            name: app.fullName || 'Ứng viên gia sư',
            email: app.email || '',
            phone: app.phone || '',
            university: app.school || 'ĐH Sư Phạm',
            subject: app.subjects?.[0]?.subjectLevel?.subject?.name || 'Toán Tiểu học',
            stage,
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

  const moveStage = async (id: string, newStage: ApplicantCard['stage']) => {
    if (newStage === 'INTERVIEW') {
      const app = applicants.find(a => a.id === id);
      if (app) {
        setInterviewModalApp(app);
        return;
      }
    }
    if (newStage === 'REJECTED') {
      const app = applicants.find(a => a.id === id);
      if (app) {
        setRejectModalApp(app);
        return;
      }
    }

    setApplicants(applicants.map(a => a.id === id ? { ...a, stage: newStage } : a));
    try {
      const backendStatus = newStage === 'APPROVED' ? 'APPROVED' : newStage === 'INTERVIEW' ? 'INTERVIEW_SCHEDULED' : 'PENDING';
      await api.tutors.reviewApplication(id, { status: backendStatus });
      await loadApplicants();
    } catch (err) {
      console.error('Lỗi cập nhật giai đoạn:', err);
    }
  };

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
      setInterviewModalApp(null);
      setInterviewDate('');
      setInterviewNote('');
      await loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt lịch phỏng vấn');
    }
  };

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
      setRejectModalApp(null);
      setRejectReason('');
      await loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi từ chối hồ sơ');
    }
  };

  const columns: { stage: ApplicantCard['stage']; label: string; countColor: string }[] = [
    { stage: 'NEW', label: '1. Hồ sơ mới nộp', countColor: 'text-slate-600 bg-slate-100' },
    { stage: 'TESTING', label: '2. Khảo sát chuyên môn', countColor: 'text-amber-800 bg-amber-100' },
    { stage: 'INTERVIEW', label: '3. Phỏng vấn tâm lý', countColor: 'text-teal-800 bg-teal-100' },
    { stage: 'APPROVED', label: '4. Đã duyệt chính thức', countColor: 'text-emerald-800 bg-emerald-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Tuyển Dụng & Thẩm Định</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quy Trình Thẩm Định Gia Sư 4 Vòng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kéo thả hoặc chuyển giai đoạn tuyển dụng. Bấm vào bài thi để chấm điểm tự luận.
          </p>
        </div>

        <Link
          to="/apply"
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          + Thử biểu mẫu ứng tuyển
        </Link>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colApps = applicants.filter(a => a.stage === col.stage);
          return (
            <div key={col.stage} className="bg-slate-200/50 p-4 rounded-3xl border border-slate-200 flex flex-col space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-800">{col.label}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.countColor}`}>
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-[400px]">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-600 transition space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{app.name}</h4>
                        <p className="text-[11px] text-slate-500">{app.university}</p>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                          {app.subject}
                        </span>
                      </div>
                      <button
                        onClick={() => setTimelineApp(app)}
                        title="Xem lịch sử thẩm định"
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-800 hover:bg-slate-100 transition"
                      >
                        <History size={15} />
                      </button>
                    </div>

                    {app.score !== undefined && (
                      <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500">Điểm test:</span>
                        <strong className="text-emerald-800 font-black">{app.score} / 100đ</strong>
                      </div>
                    )}

                    {app.interviewAt && (
                      <div className="bg-teal-50 border border-teal-200 p-2 rounded-xl text-[11px] text-teal-900 space-y-0.5">
                        <div className="font-bold flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Lịch PV: {new Date(app.interviewAt).toLocaleString('vi-VN')}</span>
                        </div>
                        {app.interviewNote && <p className="text-[10px] text-teal-700 italic">{app.interviewNote}</p>}
                      </div>
                    )}

                    {app.attemptId && (
                      <Link
                        to={`/admin/recruit/grade/${app.attemptId}`}
                        className="block w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold py-1.5 rounded-xl text-[11px] border border-emerald-200 transition"
                      >
                        Chấm bài tự luận & Hồ sơ →
                      </Link>
                    )}

                    {/* Quick stage switch */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => moveStage(app.id, 'REJECTED')}
                        className="text-rose-600 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <XCircle size={12} />
                        <span>Từ chối</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {col.stage !== 'NEW' && (
                          <button
                            onClick={() => moveStage(app.id, 'NEW')}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800"
                            title="Quay về hồ sơ mới"
                          >
                            ←
                          </button>
                        )}
                        {col.stage !== 'TESTING' && (
                          <button
                            onClick={() => moveStage(app.id, 'TESTING')}
                            className="px-1.5 py-0.5 text-amber-700 hover:underline"
                          >
                            Thi
                          </button>
                        )}
                        {col.stage !== 'INTERVIEW' && (
                          <button
                            onClick={() => moveStage(app.id, 'INTERVIEW')}
                            className="px-1.5 py-0.5 text-teal-700 hover:underline font-bold"
                          >
                            Hẹn PV
                          </button>
                        )}
                        {col.stage !== 'APPROVED' && (
                          <button
                            onClick={() => moveStage(app.id, 'APPROVED')}
                            className="px-1.5 py-0.5 text-emerald-700 font-bold hover:underline"
                          >
                            Duyệt ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Đặt lịch phỏng vấn */}
      {interviewModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-slate-900">Đặt Lịch Phỏng Vấn Gia Sư</h3>
              </div>
              <button onClick={() => setInterviewModalApp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-slate-600">
              Lên lịch phỏng vấn tâm lý & kỹ năng sư phạm cho ứng viên <strong>{interviewModalApp.name}</strong>:
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
                <label className="block text-slate-700 font-bold mb-1">Ghi chú / Link Google Meet</label>
                <textarea
                  rows={2}
                  placeholder="https://meet.google.com/... hoặc Phòng phỏng vấn P302"
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
                  <span>Xác Nhận & Gửi Thông Báo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bắt buộc nhập lý do từ chối */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">Từ Chối Đơn Ứng Tuyển</h3>
              </div>
              <button onClick={() => setRejectModalApp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-slate-600">
              Vui lòng nhập lý do từ chối hồ sơ ứng viên <strong>{rejectModalApp.name}</strong> để lưu vào hệ thống và gửi thông báo:
            </p>

            <form onSubmit={handleRejectApplication} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do từ chối *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Chưa đáp ứng chuẩn phát âm tiếng Anh, điểm thi chuyên môn dưới ngưỡng..."
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

      {/* Drawer Timeline Lịch Sử Ứng Viên */}
      {timelineApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col space-y-6 text-xs overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Timeline Lịch Sử Ứng Viên</h3>
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
                <p className="text-slate-600 mt-1">Đăng ký dạy môn: <strong>{timelineApp.subject}</strong></p>
              </div>

              {/* Mốc 2: Khảo sát & Chấm thi */}
              <div className="relative pl-8">
                <div className={`absolute left-1 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  timelineApp.score !== undefined ? 'bg-emerald-600' : 'bg-slate-300'
                }`}></div>
                <h4 className="font-bold text-slate-900">2. Khảo sát chuyên môn</h4>
                {timelineApp.score !== undefined ? (
                  <p className="text-emerald-800 font-bold text-[11px]">
                    Đạt {timelineApp.score} / 100 điểm (Đã chấm bài thi)
                  </p>
                ) : (
                  <p className="text-slate-400 text-[11px]">Chưa hoàn thành bài khảo sát</p>
                )}
              </div>

              {/* Mốc 3: Phỏng vấn */}
              <div className="relative pl-8">
                <div className={`absolute left-1 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  timelineApp.interviewAt ? 'bg-teal-600' : 'bg-slate-300'
                }`}></div>
                <h4 className="font-bold text-slate-900">3. Phỏng vấn tâm lý & kỹ năng</h4>
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
                <h4 className="font-bold text-slate-900">4. Quyết định thẩm định</h4>
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
