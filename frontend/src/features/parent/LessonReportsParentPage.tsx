import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { LessonReport } from '../../types/edtech';
import { FileText, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LessonReportsParentPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.reports.getLessonReports();
        if (res.data) setReports(res.data);
      } catch (err) {
        console.error('Lỗi tải báo cáo buổi học:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold text-emerald-700">VietTutor · Phụ Huynh Quản Lý</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Sổ Theo Dõi Báo Cáo Buổi Học ({reports.length} buổi)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gia sư cập nhật nhận xét, điểm tiếp thu kiến thức và bài tập về nhà sau mỗi buổi dạy.
        </p>
      </div>

      <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/parent/reports/${report.id}`)}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-600 transition shadow-xs cursor-pointer space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                <div>
                  <span className="font-extrabold text-emerald-800">Buổi số {report.lessonNumber}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-600 font-semibold">Ngày {report.date}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span>Gia sư: <strong>{report.tutorName}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>+{report.starsAwarded} Sao</span>
                  </span>
                </div>
              </div>

              {/* 3 Metric Scores */}
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">TIẾP THU</span>
                  <span className="text-base font-black text-emerald-800">{report.comprehensionScore}/10</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">TẬP TRUNG</span>
                  <span className="text-base font-black text-emerald-800">{report.focusScore}/10</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">BÀI VỀ NHÀ</span>
                  <span className="text-base font-black text-emerald-800">{report.homeworkScore}/10</span>
                </div>
              </div>

              <div className="text-xs text-slate-700 space-y-1">
                <div><strong>Nội dung bài học:</strong> {report.topic}</div>
                <div className="text-slate-500 italic line-clamp-1">
                  &quot;{report.teacherFeedback}&quot;
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <span className="text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition flex items-center gap-1">
                  <span>Xem chi tiết phiếu báo cáo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
