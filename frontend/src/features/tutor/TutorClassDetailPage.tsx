import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { TutorClass, LessonReport } from '../../types/edtech';
import { ArrowLeft, User, Calendar, BookOpen, Clock, FileText, CheckCircle2, Star } from 'lucide-react';

export default function TutorClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<TutorClass | null>(null);
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [clsRes, repRes] = await Promise.all([
          api.classes.getClassDetail(id),
          api.reports.getLessonReports({ classId: id }),
        ]);
        if (clsRes.data) {
          const c = clsRes.data;
          setCls({
            id: c.id,
            code: c.code,
            studentName: c.students?.[0]?.student?.fullName || 'Học sinh',
            parentName: c.students?.[0]?.student?.parent?.user?.fullName || 'Phụ huynh',
            parentPhone: c.students?.[0]?.student?.parent?.user?.phone || '',
            subject: c.subjectLevel?.subject?.name || 'Môn học',
            grade: c.subjectLevel?.gradeLevel?.name || 'Tiểu học',
            schedule: `${c.sessionsPerWeek || 2} buổi/tuần`,
            totalLessons: 24,
            completedLessons: c.lessons?.length || 0,
            currentProgress: 50,
            status: c.status,
            nextLessonTime: 'Theo lịch',
            tutorNotes: c.notes || 'Học sinh tiếp thu tốt.',
          });
        }
        if (repRes.data) setReports(repRes.data);
      } catch (err) {
        console.error('Lỗi tải chi tiết lớp:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading || !cls) {
    return (
      <div className="p-8 text-center">
        <p className="text-xs text-slate-500 font-semibold">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs">
          <Link to="/tutor/classes" className="text-emerald-800 hover:underline flex items-center gap-1.5 font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách lớp học</span>
          </Link>
          <span className="text-slate-400">Mã lớp: {cls.code}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Class Overview Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{cls.subject}</span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">{cls.studentName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Phụ huynh: {cls.parentName} · SĐT: {cls.parentPhone}</p>
            </div>

            <Link
              to={`/tutor/lessons/les-${cls.completedLessons + 1}/report`}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition"
            >
              + Tạo báo cáo buổi mới
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Lịch học hàng tuần:</span>
              <strong className="text-slate-900 text-sm">{cls.schedule}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Tiến độ bài học:</span>
              <strong className="text-emerald-800 text-sm">{cls.completedLessons} / {cls.totalLessons} buổi</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Buổi tiếp theo:</span>
              <strong className="text-slate-900 text-sm">{cls.nextLessonTime}</strong>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1">
            <strong className="text-emerald-950">Ghi chú phương pháp sư phạm cho bé:</strong>
            <p className="text-slate-700 leading-relaxed">{cls.tutorNotes}</p>
          </div>
        </div>

        {/* Lesson Reports History */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <span>Lịch sử Báo Cáo Buổi Học ({reports.length} báo cáo)</span>
          </h2>

          <div className="space-y-4">
            {reports.map((rep) => (
              <div key={rep.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3 text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-800">Buổi số {rep.lessonNumber}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-600 font-semibold">{rep.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-800 font-bold">Tiếp thu: {rep.comprehensionScore}/10</span>
                    <span className="text-amber-600 font-bold">Thưởng: +{rep.starsAwarded} ⭐</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-1.5">
                  <div><strong>Chủ đề đã học:</strong> {rep.topic}</div>
                  <div><strong>Nhận xét của thầy:</strong> {rep.teacherFeedback}</div>
                  <div><strong>Bài tập về nhà:</strong> {rep.homeworkAssigned}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
