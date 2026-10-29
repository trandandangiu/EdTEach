import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { TutorClass } from '../../../types/edtech';
import { Layers, CheckCircle2, AlertCircle, Clock, BookOpen, Search } from 'lucide-react';

export default function AdminClassesManager() {
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        const res = await api.classes.getClasses();
        if (res.data) {
          const list: TutorClass[] = res.data.map((c: any) => ({
            id: c.id,
            code: c.code,
            studentName: c.students?.[0]?.student?.fullName || 'Học sinh',
            parentName: c.students?.[0]?.student?.parent?.user?.fullName || 'Phụ huynh',
            parentPhone: c.students?.[0]?.student?.parent?.user?.phone || '',
            subject: c.subjectLevel?.subject?.name || 'Toán Tiểu Học',
            grade: c.subjectLevel?.gradeLevel?.name || 'Tiểu học',
            schedule: `${c.sessionsPerWeek || 2} buổi/tuần`,
            totalLessons: 24,
            completedLessons: c.lessons?.length || 0,
            currentProgress: 50,
            status: c.status,
            nextLessonTime: 'Theo lịch',
            tutorNotes: c.notes || 'Lớp học đang diễn ra đúng tiến độ.',
          }));
          setClasses(list);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách lớp học:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  const filtered = classes.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Điều Phối Lớp Học</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quản Lý Toàn Bộ Lớp Học Đang Diễn Ra
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát số buổi dạy, tiến độ chương trình và tình hình nộp báo cáo của từng gia sư.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo mã lớp, học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Mã Lớp</th>
                <th className="p-4">Học Sinh / Phụ Huynh</th>
                <th className="p-4">Môn Học</th>
                <th className="p-4">Tiến Độ Buổi Dạy</th>
                <th className="p-4">Lịch Cố Định</th>
                <th className="p-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-4 font-bold text-emerald-800">{cls.code}</td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{cls.studentName}</span>
                    <span className="text-slate-400 text-[11px]">{cls.parentName} ({cls.parentPhone})</span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{cls.subject} ({cls.grade})</td>
                  <td className="p-4">
                    <div className="space-y-1 w-36">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{cls.completedLessons}/{cls.totalLessons} buổi</span>
                        <span className="font-bold">{cls.currentProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${cls.currentProgress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{cls.schedule}</td>
                  <td className="p-4">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Đang hoạt động
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
