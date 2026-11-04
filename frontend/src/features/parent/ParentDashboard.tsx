import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LessonReport, TutorClass } from '../../types/edtech';
import { 
  Users, 
  Calendar, 
  FileText, 
  Plus, 
  CheckCircle, 
  Sparkles, 
  Star, 
  ArrowRight, 
  Clock, 
  Gamepad2,
  BookOpen
} from 'lucide-react';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { currentUser, switchUserRole } = useAuth();

  const [reports, setReports] = useState<LessonReport[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [repRes, clsRes] = await Promise.all([
          api.reports.getLessonReports(),
          api.classes.getClasses(),
        ]);
        if (repRes.data) setReports(repRes.data);
        if (clsRes.data) setClasses(clsRes.data);
      } catch (err) {
        console.error('Lỗi tải dữ liệu phụ huynh:', err);
      }
    }
    loadDashboard();
  }, []);

  const latestReport = reports[0];
  const activeClass = classes[0];

  return (
    <div className="space-y-6">
      {/* Parent Welcome Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700">VietTutor · Khu Vực Quản Lý Học Tập</span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Chào mừng, {currentUser?.name || 'Phụ Huynh'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Đồng hành học tập & quản lý sổ liên lạc các con
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/parent/requests/new"
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Đăng Lớp Học Mới</span>
          </Link>
        </div>
      </div>
        {/* Child Progress Hero Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-3xl font-black shrink-0 border border-emerald-200 shadow-inner">
              🦁
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Bảo Nam</h2>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Lớp 4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Đang học cùng <strong>ThS. Nguyễn Hoàng Nam</strong> (Môn Toán Nâng Cao)
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>185 Sao tích lũy</span>
                </span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">Chuỗi 7 ngày làm bài liên tiếp 🔥</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/parent/schedule"
              className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              Lịch học: Thứ Ba, Thứ Năm (18:30)
            </Link>
            <button
              onClick={() => {
                switchUserRole('STUDENT');
                navigate('/kids');
              }}
              className="px-4 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4 text-emerald-300" />
              <span>Chuyển sang Góc của Bé</span>
            </button>
          </div>
        </div>

        {/* Latest Lesson Report & Active Class Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Lesson Report */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span>Báo cáo buổi học gần nhất {latestReport ? `(Buổi ${latestReport.lessonNumber})` : ''}</span>
              </h2>
              {reports.length > 0 && (
                <Link to="/parent/reports" className="text-xs font-bold text-emerald-800 hover:underline">
                  Xem tất cả báo cáo ({reports.length}) →
                </Link>
              )}
            </div>

            {latestReport ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-800">{latestReport.subject}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-500">Ngày {latestReport.date}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span>Gia sư: <strong>{latestReport.tutorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Thưởng +{latestReport.starsAwarded || 1} ⭐
                    </span>
                  </div>
                </div>

                {/* 3 Metric Pills/Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">TIẾP THU</span>
                    <span className="text-lg font-black text-emerald-800">{latestReport.comprehensionScore || 9}/10</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">TẬP TRUNG</span>
                    <span className="text-lg font-black text-emerald-800">{latestReport.focusScore || 9}/10</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">BÀI TẬP</span>
                    <span className="text-lg font-black text-emerald-800">{latestReport.homeworkScore || 10}/10</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900">Nội dung đã học: </span>
                    {latestReport.topic}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Nhận xét của thầy: </span>
                    <span className="italic text-slate-600">&quot;{latestReport.teacherFeedback}&quot;</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-950">
                    <span className="font-bold">Bài tập về nhà: </span>
                    {latestReport.homeworkAssigned || 'Xem trong phiếu bài tập đính kèm'}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/parent/reports/${latestReport.id}`}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <span>Xem chi tiết phiếu báo cáo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Chưa có báo cáo buổi học nào</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sổ liên lạc điện tử sẽ được hiển thị chi tiết tại đây ngay sau khi gia sư kết thúc và gửi đánh giá buổi học.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Class status & Quick CTAs */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Thông tin lớp học</h2>
            
            {activeClass ? (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {activeClass.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{activeClass.subject}</h3>
                  <p className="text-xs text-slate-500">Gia sư: ThS. Nguyễn Hoàng Nam</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Số buổi đã học:</span>
                    <strong className="text-slate-900">{activeClass.completedLessons} / {activeClass.totalLessons} buổi</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${activeClass.currentProgress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Buổi kế tiếp:</span>
                    <strong className="text-emerald-800">{activeClass.nextLessonTime || 'Đang cập nhật'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <Link
                    to="/parent/requests/new"
                    className="w-full text-center block bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
                  >
                    Tìm thêm gia sư môn Tiếng Anh / Tiếng Việt
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-500">Hiện chưa có lớp học nào đang hoạt động</p>
                <Link
                  to="/parent/requests/new"
                  className="w-full text-center block bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
                >
                  + Đăng Lớp Học Mới
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
