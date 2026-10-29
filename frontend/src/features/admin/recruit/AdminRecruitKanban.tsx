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
  ShieldCheck
} from 'lucide-react';
import { api } from '../../../services/api';

interface ApplicantCard {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  subject: string;
  stage: 'NEW' | 'TESTING' | 'INTERVIEW' | 'APPROVED';
  score?: number;
  attemptId?: string;
}

export default function AdminRecruitKanban() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplicants() {
      try {
        setLoading(true);
        const res = await api.tutors.getApplications();
        if (res.data) {
          const list: ApplicantCard[] = res.data.map((app: any) => {
            let stage: 'NEW' | 'TESTING' | 'INTERVIEW' | 'APPROVED' = 'NEW';
            if (app.status === 'APPROVED') stage = 'APPROVED';
            else if (app.status === 'INTERVIEW_SCHEDULED') stage = 'INTERVIEW';
            else if (app.attempts && app.attempts.length > 0) stage = 'TESTING';

            return {
              id: app.id,
              name: app.fullName || 'Ứng viên gia sư',
              email: app.email || '',
              phone: app.phone || '',
              university: app.school || 'ĐH Sư Phạm',
              subject: app.subjects?.[0]?.subjectLevel?.subject?.name || 'Toán Tiểu học',
              stage,
              score: app.attempts?.[0]?.percent || 85,
              attemptId: app.attempts?.[0]?.id,
            };
          });
          setApplicants(list);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách tuyển dụng:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApplicants();
  }, []);

  const moveStage = async (id: string, newStage: ApplicantCard['stage']) => {
    setApplicants(applicants.map(a => a.id === id ? { ...a, stage: newStage } : a));
    try {
      const backendStatus = newStage === 'APPROVED' ? 'APPROVED' : newStage === 'INTERVIEW' ? 'INTERVIEW_SCHEDULED' : 'PENDING';
      await api.tutors.reviewApplication(id, { status: backendStatus });
    } catch (err) {
      console.error('Lỗi cập nhật giai đoạn:', err);
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
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{app.name}</h4>
                      <p className="text-[11px] text-slate-500">{app.university}</p>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                        {app.subject}
                      </span>
                    </div>

                    {app.score !== undefined && (
                      <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500">Điểm test:</span>
                        <strong className="text-emerald-800 font-black">{app.score} / 100đ</strong>
                      </div>
                    )}

                    {app.attemptId && (
                      <Link
                        to={`/admin/recruit/grade/${app.attemptId}`}
                        className="block w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold py-1.5 rounded-xl text-[11px] border border-emerald-200 transition"
                      >
                        Chấm bài tự luận →
                      </Link>
                    )}

                    {/* Quick stage switch */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Chuyển:</span>
                      <div className="flex gap-1">
                        {col.stage !== 'NEW' && (
                          <button
                            onClick={() => moveStage(app.id, 'NEW')}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800"
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
                            className="px-1.5 py-0.5 text-teal-700 hover:underline"
                          >
                            PV
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
    </div>
  );
}
