import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { TutorClass } from '../../types/edtech';
import { BookOpen, Calendar, Clock, ArrowRight, User, Phone } from 'lucide-react';

export default function TutorClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        const res = await api.tutors.getMyClasses();
        if (res.data) setClasses(res.data);
      } catch (err) {
        console.error('Lỗi tải danh sách lớp học:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-8 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300">Bàn Làm Việc Gia Sư</span>
          <h1 className="text-2xl font-black text-white mt-1">
            Danh Sách Lớp Học Của Tôi ({classes.length} lớp)
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Quản lý giáo án, tiến độ hoàn thành số buổi và nộp báo cáo từng buổi cho phụ huynh.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-emerald-600 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {cls.code}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                  {cls.status === 'ACTIVE' ? 'Đang diễn ra' : 'Đã kết thúc'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{cls.studentName}</h3>
                <p className="text-xs font-semibold text-emerald-800 mt-0.5">{cls.subject} ({cls.grade})</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lịch học cố định:</span>
                  <span className="font-bold text-slate-800">{cls.schedule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Buổi tiếp theo:</span>
                  <span className="font-bold text-emerald-800">{cls.nextLessonTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phụ huynh liên hệ:</span>
                  <span className="font-bold text-slate-800">{cls.parentName} ({cls.parentPhone})</span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tiến trình buổi dạy</span>
                  <span className="font-bold text-slate-800">{cls.completedLessons} / {cls.totalLessons} buổi</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${cls.currentProgress}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Link
                  to={`/tutor/classes/${cls.id}`}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  Xem chi tiết
                </Link>
                <Link
                  to={`/tutor/lessons/les-${cls.completedLessons + 1}/report`}
                  className="px-4 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Nộp báo cáo buổi {cls.completedLessons + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
