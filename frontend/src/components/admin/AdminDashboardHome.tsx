import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatCard } from '../ui/StatCard';
import { PageHeader } from '../ui/PageHeader';

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
      {/* Top Page Header */}
      <PageHeader
        eyebrow="Hệ thống vận hành VietTutor"
        title="Bảng Điều Khiển Quản Trị"
        description="Tổng quan chỉ số hoạt động toàn nền tảng: tuyển dụng gia sư, điều phối lớp học và hỗ trợ phụ huynh."
        actions={
          <Link to="/admin/matching">
            <Button variant="primary" size="md">
              <Layers className="w-4 h-4" />
              <span>Chờ ghép lớp ({openRequests.length})</span>
            </Button>
          </Link>
        }
      />

      {/* KPI Cards — Clickable with links to respective portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/admin/recruit" className="block group">
          <StatCard
            label="Gia sư chờ chấm thi / thẩm định"
            value={`${stats?.pendingApplicants ?? pendingAttempts.length ?? 0} hồ sơ`}
            icon={<UserCheck className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />}
            trend="Cần duyệt"
            trendType="neutral"
            subtext="Khảo sát chuyên môn & hồ sơ"
            className="group-hover:border-brand-300 group-hover:shadow-md transition-all cursor-pointer h-full"
          />
        </Link>

        <Link to="/admin/matching" className="block group">
          <StatCard
            label="Lớp học cần điều phối"
            value={`${stats?.openRequests ?? openRequests.length ?? 0} yêu cầu`}
            icon={<Layers className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />}
            trend="Đang tìm gia sư"
            trendType="positive"
            subtext="Ưu tiên ghép trong 2h"
            className="group-hover:border-brand-300 group-hover:shadow-md transition-all cursor-pointer h-full"
          />
        </Link>

        <Link to="/admin/care" className="block group">
          <StatCard
            label="Cảnh báo chăm sóc phụ huynh"
            value={`${stats?.criticalCare ?? criticalCare.length ?? 0} ca`}
            icon={<PhoneCall className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />}
            trend={(stats?.criticalCare ?? criticalCare.length) > 0 ? 'Cần xử lý' : 'Đã ổn định'}
            trendType={(stats?.criticalCare ?? criticalCare.length) > 0 ? 'negative' : 'positive'}
            subtext="Trễ báo cáo hoặc đổi lịch"
            className="group-hover:border-brand-300 group-hover:shadow-md transition-all cursor-pointer h-full"
          />
        </Link>

        <Link to="/admin/system/users" className="block group">
          <StatCard
            label="Tổng người dùng hệ thống"
            value={stats?.totalUsers ?? 0}
            icon={<Users className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />}
            trend="Dữ liệu thực tế"
            trendType="positive"
            subtext="Phân bổ theo vai trò chính:"
            className="group-hover:border-brand-300 group-hover:shadow-md transition-all cursor-pointer h-full"
          >
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-100">
              <div className="bg-brand-50/70 border border-brand-100/80 px-2.5 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-brand-700 font-medium block">Gia sư</span>
                <span className="text-xs font-semibold text-brand-900">{stats?.totalTutors ?? 0}</span>
              </div>
              <div className="bg-ink-100/70 border border-ink-200/80 px-2.5 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-ink-600 font-medium block">Phụ huynh</span>
                <span className="text-xs font-semibold text-ink-900">{stats?.totalParents ?? 0}</span>
              </div>
            </div>
          </StatCard>
        </Link>
      </div>

      {/* Quick Action Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Care Cases */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-semibold text-ink-900">Trường hợp chăm sóc cần xử lý</h2>
            </div>
            <Link to="/admin/care" className="text-xs font-semibold text-brand-700 hover:underline">
              Xem tất cả ({careCases.length}) →
            </Link>
          </div>

          <Card variant="static" padding="md" className="space-y-3">
            {careCases.length === 0 ? (
              <p className="text-xs text-ink-500 py-6 text-center">Không có ca CSKH nào đang mở</p>
            ) : (
              careCases.slice(0, 4).map((c) => (
                <div key={c.id} className="p-4 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <Badge variant={c.priority === 'CRITICAL' ? 'danger' : 'gold'}>
                      {c.caseCode ?? c.code ?? `CASE-${c.id}`} ·{' '}
                      {c.type === 'LATE_REPORT_24H' ? 'Trễ báo cáo 24h' : 'Yêu cầu phụ huynh'}
                    </Badge>
                    <span className="text-ink-400 text-[11px]">{c.lastUpdated ?? c.updatedAt ?? 'Vừa xong'}</span>
                  </div>
                  <p className="text-ink-700 font-medium">{c.description ?? c.note ?? '—'}</p>
                  <div className="flex justify-between items-center pt-1 text-[11px] text-ink-500">
                    <span>
                      Học sinh: {c.studentName ?? c.student?.fullName ?? 'Bé Bảo Nam'} · Gia sư:{' '}
                      {c.tutorName ?? c.tutor?.fullName ?? 'Thầy Nam'}
                    </span>
                    <Link to="/admin/care" className="text-brand-700 font-semibold hover:underline">
                      Xử lý ca →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Pending Matching Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-semibold text-ink-900">Yêu cầu tìm gia sư mới</h2>
            </div>
            <Link to="/admin/matching" className="text-xs font-semibold text-brand-700 hover:underline">
              Vào bảng điều phối →
            </Link>
          </div>

          <Card variant="static" padding="md" className="space-y-3">
            {openRequests.length === 0 ? (
              <p className="text-xs text-ink-500 py-6 text-center">Tất cả yêu cầu đã được ghép lớp thành công</p>
            ) : (
              openRequests.slice(0, 4).map((r) => (
                <div key={r.id} className="p-4 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-ink-900 text-xs">
                      {r.subject?.name || r.subjectLevel?.subject?.name || 'Toán Nâng Cao'} · Lớp {r.gradeLevel?.name || '4'}
                    </span>
                    <Badge variant="brand">{r.status}</Badge>
                  </div>
                  <p className="text-ink-600">
                    Phụ huynh: <strong>{r.parent?.fullName || r.parentName || 'Chị Lan'}</strong> ({r.phone || '0987xxx'})
                  </p>
                  <div className="flex justify-between items-center pt-1 text-[11px] text-ink-500">
                    <span>Khu vực: {r.district || 'Cầu Giấy, Hà Nội'}</span>
                    <Link to="/admin/matching" className="text-brand-700 font-semibold hover:underline">
                      Ghép gia sư →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}