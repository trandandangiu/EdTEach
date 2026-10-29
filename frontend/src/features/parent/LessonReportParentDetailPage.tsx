import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { LessonReport } from '../../types/edtech';
import { ArrowLeft, Star, CheckCircle, FileText, Sparkles, MessageSquare } from 'lucide-react';

export default function LessonReportParentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<LessonReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.reports.getReportDetail(id);
        if (res.data) setReport(res.data);
      } catch (err) {
        console.error('Lỗi tải chi tiết báo cáo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading || !report) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500 font-semibold">Đang tải báo cáo buổi học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs">
          <Link to="/parent/reports" className="text-emerald-800 hover:underline flex items-center gap-1.5 font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách báo cáo</span>
          </Link>
          <span className="text-slate-400">Mã phiếu: {report.id}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Phiếu Báo Cáo Buổi Học Số {report.lessonNumber}
              </span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Thưởng +{report.starsAwarded} Sao ⭐</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2">{report.topic}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Học sinh: <strong>{report.studentName}</strong> · Ngày học: {report.date} · Gia sư: <strong>{report.tutorName}</strong>
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">MỨC TIẾP THU</span>
              <span className="text-3xl font-black text-emerald-800">{report.comprehensionScore}/10</span>
              <span className="text-[11px] text-emerald-600 block mt-1">Xuất sắc</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">ĐỘ TẬP TRUNG</span>
              <span className="text-3xl font-black text-emerald-800">{report.focusScore}/10</span>
              <span className="text-[11px] text-emerald-600 block mt-1">Hào hứng</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">BÀI TẬP VỀ NHÀ CŨ</span>
              <span className="text-3xl font-black text-emerald-800">{report.homeworkScore}/10</span>
              <span className="text-[11px] text-emerald-600 block mt-1">Làm đầy đủ</span>
            </div>
          </div>

          {/* Feedback Body */}
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5">Nhận xét chi tiết từ gia sư:</h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                &quot;{report.teacherFeedback}&quot;
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <span className="text-xs font-bold text-emerald-950 block">Bài tập giao về nhà:</span>
                <p className="text-xs text-emerald-900 leading-relaxed">{report.homeworkAssigned}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">Kế hoạch buổi học tiếp theo:</span>
                <p className="text-xs text-slate-700 leading-relaxed">{report.nextSteps}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Phụ huynh có thắc mắc về buổi học này?</span>
            <button
              onClick={() => alert('Đã gửi yêu cầu kết nối với chuyên viên điều phối để hỗ trợ bạn.')}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Liên hệ trao đổi với gia sư / CSKH
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
