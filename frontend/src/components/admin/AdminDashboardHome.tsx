import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  Clock,
  AlertTriangle,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [careCases, setCareCases] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, careRes, reqRes, attRes] = await Promise.all([
          api.admin.getStats(),
          api.care.getCareCases(),
          api.classRequests.getRequests(),
          api.assessments.getAttempts(),
        ]);
        setStats(statsRes);
        if (careRes?.data) setCareCases(careRes.data);
        if (reqRes?.data) setRequests(reqRes.data);
        if (attRes?.data) setAttempts(attRes.data);
      } catch (err) {
        console.error('Lỗi tải thống kê admin:', err);
      }
    }
    loadStats();
  }, []);

  const pendingAttempts = attempts.filter(a => a.status === 'PENDING_REVIEW');
  const criticalCare = careCases.filter(
    c => c.priority === 'CRITICAL' || c.status === 'PENDING' || c.status === 'OPEN'
  );
  const openRequests = requests.filter(
    r => ['OPEN', 'MATCHING', 'NEW', 'OFFERING'].includes(r.status)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Hệ Thống Vận Hành </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Bảng Điều Khiển</h1>
          <p className="text-xs text-slate-500 mt-0.5">

          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/matching"
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
          Trường hợp đợi ghép lớp ({openRequests.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Gia sư chờ chấm thi</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{pendingAttempts.length} bài thi</span>
            <Link to="/admin/recruit" className="text-xs font-bold text-emerald-800 hover:underline">
              Chấm ngay →
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Lớp học cần điều phối</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-800">{openRequests.length} yêu cầu</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Cảnh báo chăm sóc phụ huynh</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-600">{criticalCare.length} trường hợp</span>
            <Link to="/admin/care" className="text-xs font-bold text-rose-600 hover:underline">
              Xử lý →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Care Cases */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Trường hợp cần xử lý</h2>
            </div>
            <Link to="/admin/care" className="text-xs font-bold text-emerald-800 hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {careCases.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Không có ca CSKH nào đang mở</p>
            ) : (
              careCases.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      {c.caseCode ?? c.code ?? `CASE-${c.id}`} ·{' '}
                      {c.type === 'LATE_REPORT_24H' ? 'Trễ báo cáo 24h' : 'Yêu cầu phụ huynh'}
                    </span>
                    <span className="text-slate-400">{c.lastUpdated ?? c.updatedAt ?? ''}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{c.description ?? c.note ?? '—'}</p>
                  <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                    <span>
                      Học sinh: {c.studentName ?? c.student?.fullName ?? '—'} · Gia sư:{' '}
                      {c.tutorName ?? c.tutor?.fullName ?? '—'}
                    </span>
                    <Link to="/admin/care" className="text-emerald-800 font-bold hover:underline">
                      Xử lý ca →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tutor Exam Attempts Pending Review */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Bài khảo sát năng lực</h2>
            </div>
            <Link to="/admin/recruit" className="text-xs font-bold text-emerald-800 hover:underline">
              Vào quy trình tuyển dụng
            </Link>
          </div>

          <div className="space-y-3">
            {pendingAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Không có bài thi nào chờ chấm</p>
            ) : (
              pendingAttempts.map((att) => (
                <div key={att.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">
                      {att.applicantName ?? att.applicant?.fullName ?? att.user?.fullName ?? 'Ứng viên'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold ${att.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {att.status === 'PASSED' ? 'Đã duyệt' : 'Chờ chấm tự luận'}
                    </span>
                  </div>
                  <p className="text-slate-600">{att.examTitle ?? att.test?.title ?? '—'}</p>
                  <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                    <span>Nộp lúc: {att.submittedAt ?? att.createdAt ?? '—'}</span>
                    <Link
                      to={`/admin/recruit/grade/${att.id}`}
                      className="text-emerald-800 font-bold hover:underline"
                    >
                      Xem bài làm & Chấm điểm →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}