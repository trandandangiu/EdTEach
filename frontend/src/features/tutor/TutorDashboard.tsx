import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TutorClass, TutorOffer, LessonReport } from '../../types/edtech';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  FileEdit, 
  BookOpen, 
  ArrowRight, 
  Inbox, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function TutorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [offers, setOffers] = useState<TutorOffer[]>([]);
  const [reports, setReports] = useState<LessonReport[]>([]);

  useEffect(() => {
    async function loadTutorData() {
      try {
        const [clsRes, offRes, repRes] = await Promise.all([
          api.tutors.getMyClasses(),
          api.tutors.getMyOffers(),
          api.reports.getLessonReports(),
        ]);
        if (clsRes.data) setClasses(clsRes.data);
        if (offRes.data) setOffers(offRes.data);
        if (repRes.data) setReports(repRes.data);
      } catch (err) {
        console.error('Lỗi tải bàn làm việc gia sư:', err);
      }
    }
    loadTutorData();
  }, []);

  const activeClasses = classes.filter(c => c.status === 'ACTIVE');
  const pendingOffers = offers.filter(o => o.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Tutor Portal Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700">VietTutor · Bàn Làm Việc Gia Sư</span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Xin chào, {currentUser?.name || 'Thầy Gia Sư'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trạng thái giảng dạy: <span className="text-emerald-700 font-bold">Sẵn sàng nhận lớp & giảng dạy</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/tutor/offers"
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Hòm Thư Lời Mời ({pendingOffers.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
        {/* Urgent Alert Banner (If report pending) */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950 block">Nhắc nhở cập nhật Báo cáo Buổi học</span>
              <span className="text-xs text-slate-600">Buổi 15 lớp &quot;Bé Bảo Nam&quot; vừa kết thúc tối qua. Vui lòng gửi đánh giá trong vòng 24h.</span>
            </div>
          </div>
          <Link
            to="/tutor/lessons/les-15/report"
            className="shrink-0 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
          >
            Điền báo cáo ngay
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Lớp đang giảng dạy</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{activeClasses.length} lớp</span>
              <span className="text-xs font-bold text-emerald-700">4 buổi / tuần</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Thu nhập dự kiến tháng này</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-800">8.400.000 đ</span>
              <span className="text-xs font-semibold text-slate-400">16 buổi hoàn thành</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Điểm đánh giá trung bình</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-500">4.95 ⭐</span>
              <span className="text-xs text-slate-400">Top 1% Tinh Hoa</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Offer lớp chờ bạn xác nhận</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-800">{pendingOffers.length} offer</span>
              <Link to="/tutor/offers" className="text-xs font-bold text-emerald-800 hover:underline">
                Xem ngay →
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Classes & Active Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Lớp học đang phụ trách ({activeClasses.length})</h2>
              <Link to="/tutor/classes" className="text-xs font-bold text-emerald-800 hover:underline">
                Quản lý chi tiết
              </Link>
            </div>

            <div className="space-y-4">
              {activeClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-emerald-800">{cls.code}</span>
                      <span>·</span>
                      <span>{cls.subject}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{cls.studentName}</h3>
                    <p className="text-xs text-slate-600">
                      Lịch học: <strong>{cls.schedule}</strong> · Phụ huynh: {cls.parentName} ({cls.parentPhone})
                    </p>

                    {/* Progress bar */}
                    <div className="pt-2 max-w-md">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Tiến độ chương trình</span>
                        <span className="font-bold">{cls.completedLessons}/{cls.totalLessons} buổi ({cls.currentProgress}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${cls.currentProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                    <Link
                      to={`/tutor/classes/${cls.id}`}
                      className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    >
                      Hồ sơ lớp
                    </Link>
                    <Link
                      to={`/tutor/lessons/les-${cls.completedLessons + 1}/report`}
                      className="px-4 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition shadow-xs"
                    >
                      Gửi báo cáo
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Pending Offers Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Offer lớp chờ nhận</h2>
              <Link to="/tutor/offers" className="text-xs font-bold text-emerald-800 hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-3">
              {pendingOffers.map((offer) => (
                <div key={offer.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-900">{offer.requestTitle}</h4>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Còn {offer.deadlineHours}h
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Học sinh: {offer.studentName} ({offer.grade})</div>
                    <div>Thù lao: <strong className="text-emerald-800">{offer.ratePerSession.toLocaleString('vi-VN')} đ</strong> / buổi</div>
                    <div>Hình thức: {offer.mode}</div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      to="/tutor/offers"
                      className="w-full text-center bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2 rounded-xl transition"
                    >
                      Xem chi tiết & Đồng ý
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
