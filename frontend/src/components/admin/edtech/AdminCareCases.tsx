import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import {
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Loader2,
  AlertTriangle,
  UserCheck,
  Calendar,
  FileCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Award,
  TrendingUp,
  Trash2,
} from 'lucide-react';

interface CareCaseItem {
  id: string;
  code: string;
  team: 'CS_PARENT' | 'CS_TUTOR' | 'ACADEMIC';
  type: string;
  priority: number;
  title: string;
  detail?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_RESPONSE' | 'RESOLVED' | 'CLOSED';
  dueAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    user?: { fullName: string; phone: string; email: string };
  };
  tutor?: {
    id: string;
    user?: { fullName: string; phone: string; email: string };
    status?: string;
  };
  class?: {
    id: string;
    title: string;
    code: string;
  };
  lessonReportId?: string;
  lessonReport?: {
    id: string;
    topic?: string;
    submittedAt?: string;
    status?: string;
  };
  contactLogs?: Array<{
    id: string;
    channel: string;
    outcome: string;
    note: string;
    followUpAt?: string;
    createdAt: string;
    staff?: { fullName: string };
  }>;
}

interface UnconfirmedReport {
  id: string;
  classId: string;
  topic?: string;
  submittedAt: string;
  hoursElapsed: number;
  class?: { title: string; code: string };
  tutor?: { user?: { fullName: string; phone: string } };
  student?: { fullName: string; parent?: { user?: { fullName: string; phone: string } } };
}

interface TutorPerfData {
  tutor: { id: string; fullName: string; phone: string; status: string; hourlyRate?: number };
  stats: {
    totalReports: number;
    onTimeReports: number;
    onTimeRate: number;
    totalClasses: number;
    violationCount: number;
  };
  violations: Array<{ id: string; type: string; note: string; severity: number; createdAt: string }>;
}

export default function AdminCareCases() {
  const location = useLocation();

  // Xác định bộ phận dựa trên URL
  const defaultTeam = location.pathname.includes('/staff/tutor-care')
    ? 'CS_TUTOR'
    : location.pathname.includes('/staff/academic')
      ? 'ACADEMIC'
      : location.pathname.includes('/staff/care')
        ? 'CS_PARENT'
        : 'ALL';

  const [currentTeam, setCurrentTeam] = useState<string>(defaultTeam);
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'unconfirmed' | 'tutors'>('tickets');
  const [cases, setCases] = useState<CareCaseItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'OVERDUE' | 'RESOLVED'>('ALL');
  const [unconfirmedReports, setUnconfirmedReports] = useState<UnconfirmedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ open: number; overdue: number; resolved: number }>({ open: 0, overdue: 0, resolved: 0 });

  // Modal Ghi nhật ký cuộc gọi
  const [contactModalCase, setContactModalCase] = useState<CareCaseItem | null>(null);
  const [contactForm, setContactForm] = useState({
    target: 'PARENT' as 'PARENT' | 'TUTOR',
    channel: 'PHONE' as 'PHONE' | 'ZALO' | 'SMS',
    outcome: 'REACHED' as 'REACHED' | 'NO_ANSWER' | 'CALLBACK_LATER',
    note: '',
    followUpAt: '',
  });

  // Modal Xác nhận thay phụ huynh
  const [confirmModalReport, setConfirmModalReport] = useState<{ id: string; topic?: string; tutorName?: string } | null>(null);
  const [confirmNote, setConfirmNote] = useState('Đã liên hệ điện thoại với phụ huynh xác nhận buổi học tốt đẹp');

  // Modal Xem & Xử lý Gia sư (Performance & Violations)
  const [perfModalTutorId, setPerfModalTutorId] = useState<string | null>(null);
  const [tutorPerf, setTutorPerf] = useState<TutorPerfData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [violationForm, setViolationForm] = useState({ type: 'LATE_REPORT', note: '', severity: 1 });

  const fetchStats = async () => {
    try {
      const res = await api.care.getStats({ team: currentTeam === 'ALL' ? undefined : currentTeam });
      if (res.data) setStats(res.data);
    } catch (err) {
      console.error('Lỗi tải thống kê care:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.care.getCareCases({ team: currentTeam === 'ALL' ? undefined : currentTeam });
      setCases(res.raw || res.data || []);
    } catch (err) {
      console.error('Failed to fetch care cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnconfirmed = async () => {
    try {
      setLoading(true);
      const res = await api.care.getUnconfirmedReports(24);
      if (res.data) setUnconfirmedReports(res.data);
    } catch (err) {
      console.error('Failed to fetch unconfirmed reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeSubTab === 'tickets') {
      fetchCases();
    } else if (activeSubTab === 'unconfirmed') {
      fetchUnconfirmed();
    }
  }, [currentTeam, activeSubTab]);

  // Submit Contact Log
  const handleSaveContactLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactModalCase) return;

    try {
      await api.care.addContactLog(contactModalCase.id, {
        target: contactForm.target,
        channel: contactForm.channel,
        outcome: contactForm.outcome,
        note: contactForm.note,
        followUpAt: contactForm.followUpAt || undefined,
      });

      // Nếu cuộc gọi thành công, tự động cập nhật status sang RESOLVED hoặc IN_PROGRESS
      if (contactForm.outcome === 'REACHED') {
        await api.care.updateStatus(contactModalCase.id, 'RESOLVED');
      }

      alert('Đã lưu nhật ký cuộc gọi thành công!');
      setContactModalCase(null);
      fetchCases();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu nhật ký liên hệ');
    }
  };

  // Submit Confirm on Behalf
  const handleConfirmOnBehalf = async () => {
    if (!confirmModalReport) return;
    try {
      await api.reports.confirmOnBehalf(confirmModalReport.id, {
        note: confirmNote,
      });
      alert('Đã xác nhận sổ liên lạc thay phụ huynh thành công!');
      setConfirmModalReport(null);
      fetchUnconfirmed();
      fetchCases();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận báo cáo');
    }
  };

  // Fetch Tutor Performance
  const openTutorPerformance = async (tutorId: string) => {
    try {
      setPerfModalTutorId(tutorId);
      setPerfLoading(true);
      const res = await api.tutors.getPerformance(tutorId);
      if (res.data) setTutorPerf(res.data);
    } catch (err: any) {
      alert(err.message || 'Lỗi tải hồ sơ gia sư');
    } finally {
      setPerfLoading(false);
    }
  };

  // Submit Violation
  const handleRecordViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfModalTutorId) return;
    try {
      await api.tutors.recordViolation(perfModalTutorId, violationForm);
      alert('Đã ghi nhận biên bản vi phạm gia sư thành công!');
      openTutorPerformance(perfModalTutorId);
      setViolationForm({ type: 'LATE_REPORT', note: '', severity: 1 });
    } catch (err: any) {
      alert(err.message || 'Lỗi ghi nhận vi phạm');
    }
  };

  // Toggle Tutor Status
  const handleUpdateTutorStatus = async (status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED') => {
    if (!perfModalTutorId) return;
    try {
      await api.tutors.updateStatus(perfModalTutorId, status);
      alert(`Đã chuyển trạng thái gia sư sang "${status}"`);
      openTutorPerformance(perfModalTutorId);
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái gia sư');
    }
  };

  // Xóa phiếu chăm sóc
  const handleDeleteCase = async (careCase: CareCaseItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phiếu "${careCase.code} - ${careCase.title}" không? Hành động này sẽ xóa toàn bộ nhật ký liên hệ và không thể hoàn tác.`)) {
      return;
    }
    try {
      await api.care.deleteCareCase(careCase.id);
      alert('Đã xóa phiếu hỗ trợ thành công!');
      fetchCases();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa phiếu hỗ trợ');
    }
  };

  // Danh sách phiếu sau khi lọc theo thẻ KPI
  const filteredCases = cases.filter((c) => {
    const isOverdue = Boolean(c.dueAt && new Date(c.dueAt) < new Date() && c.status !== 'RESOLVED' && c.status !== 'CLOSED');
    if (filterStatus === 'OPEN') {
      return c.status === 'OPEN' || c.status === 'IN_PROGRESS' || c.status === 'WAITING_RESPONSE';
    }
    if (filterStatus === 'OVERDUE') {
      return isOverdue;
    }
    if (filterStatus === 'RESOLVED') {
      return c.status === 'RESOLVED' || c.status === 'CLOSED';
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            {currentTeam === 'CS_TUTOR'
              ? 'Ban Chăm Sóc Gia Sư & Giám Sát Giảng Dạy'
              : currentTeam === 'ACADEMIC'
                ? 'Ban Giám Sát '
                : ''}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Trung Tâm chăm sóc 
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">

          </p>
        </div>

        {/* Team switch if admin view */}
        {defaultTeam === 'ALL' && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setCurrentTeam('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${currentTeam === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setCurrentTeam('CS_PARENT')}
              className={`px-3 py-1.5 rounded-xl transition ${currentTeam === 'CS_PARENT' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
            >
              Phụ Huynh
            </button>
            <button
              onClick={() => setCurrentTeam('CS_TUTOR')}
              className={`px-3 py-1.5 rounded-xl transition ${currentTeam === 'CS_TUTOR' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
            >
              Gia Sư
            </button>
            <button
              onClick={() => setCurrentTeam('ACADEMIC')}
              className={`px-3 py-1.5 rounded-xl transition ${currentTeam === 'ACADEMIC' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
            >
              Học Thuật
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterStatus((prev) => (prev === 'OPEN' ? 'ALL' : 'OPEN'))}
          className={`bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition select-none ${
            filterStatus === 'OPEN'
              ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
              : 'border-slate-200 hover:border-brand-300'
          }`}
          title="Bấm để lọc phiếu đang mở"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phiếu Đang Mở</span>
              {filterStatus === 'OPEN' && (
                <span className="text-[9px] bg-brand-600 text-white font-semibold px-1.5 py-0.2 rounded-full">Đang lọc</span>
              )}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.open}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setFilterStatus((prev) => (prev === 'OVERDUE' ? 'ALL' : 'OVERDUE'))}
          className={`bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition select-none ${
            filterStatus === 'OVERDUE'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
              : 'border-rose-200 bg-rose-50/10 hover:border-rose-400'
          }`}
          title="Bấm để lọc phiếu quá hạn"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Quá Hạn</span>
              {filterStatus === 'OVERDUE' && (
                <span className="text-[9px] bg-rose-600 text-white font-semibold px-1.5 py-0.2 rounded-full">Đang lọc</span>
              )}
            </div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">{stats.overdue}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setFilterStatus((prev) => (prev === 'RESOLVED' ? 'ALL' : 'RESOLVED'))}
          className={`bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition select-none ${
            filterStatus === 'RESOLVED'
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/30'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
          title="Bấm để lọc phiếu đã xử lý"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Đã Xử Lý Xong</span>
              {filterStatus === 'RESOLVED' && (
                <span className="text-[9px] bg-emerald-700 text-white font-semibold px-1.5 py-0.2 rounded-full">Đang lọc</span>
              )}
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">{stats.resolved}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter status banner */}
      {filterStatus !== 'ALL' && activeSubTab === 'tickets' && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Đang lọc:</span>
            <span className="font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              {filterStatus === 'OPEN' && 'Phiếu Đang Mở'}
              {filterStatus === 'OVERDUE' && 'Phiếu Quá Hạn'}
              {filterStatus === 'RESOLVED' && 'Phiếu Đã Xử Lý Xong'}
            </span>
            <span className="text-slate-400">({filteredCases.length} phiếu phù hợp)</span>
          </div>
          <button
            onClick={() => setFilterStatus('ALL')}
            className="text-xs text-emerald-800 hover:text-emerald-900 font-bold underline cursor-pointer"
          >
            Hiển thị tất cả
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'tickets' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Danh Sách Phiếu Hỗ Trợ</span>
        </button>

        {(currentTeam === 'CS_PARENT' || currentTeam === 'ALL') && (
          <button
            onClick={() => setActiveSubTab('unconfirmed')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'unconfirmed' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Báo Cáo Chưa Xác Nhận</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: TICKETS LIST */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="animate-spin text-emerald-800" size={32} />
              <p className="text-xs font-bold">Đang tải danh sách ca hỗ trợ CSKH...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200 space-y-2">
              <p>
                {filterStatus !== 'ALL'
                  ? 'Không tìm thấy phiếu nào theo bộ lọc đang chọn.'
                  : 'Hiện không có trường hợp nào cần xử lý lúc này. Toàn bộ lớp học đang vận hành ổn định.'}
              </p>
              {filterStatus !== 'ALL' && (
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((c) => {
                const isOverdue = c.dueAt && new Date(c.dueAt) < new Date() && c.status !== 'RESOLVED' && c.status !== 'CLOSED';

                return (
                  <div
                    key={c.id}
                    className={`bg-white p-6 rounded-3xl border shadow-xs space-y-4 text-xs transition ${
                      isOverdue ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900">{c.code}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            c.priority >= 3 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.priority >= 3 ? 'Mức độ: Khẩn cấp' : 'Mức độ: Cao'}
                        </span>
                        <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {c.team}
                        </span>
                        {isOverdue && (
                          <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded animate-pulse">
                            Quá hạn SLA
                          </span>
                        )}
                        <span className="text-slate-400">· Tạo lúc: {new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                      </div>

                      <div>
                        {c.status === 'RESOLVED' ? (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
                            ✓ Đã giải quyết
                          </span>
                        ) : (
                          <span className="font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl">
                            Đang xử lý
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-1">{c.title}</h4>
                      <p className="text-slate-600 leading-relaxed">{c.detail || 'Không có mô tả chi tiết'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl text-slate-600">
                      <div>
                        Lớp học: <strong className="text-slate-900">{c.class?.title || c.class?.code || '1:1'}</strong>
                      </div>
                      <div>
                        Gia sư: <strong className="text-slate-900">{c.tutor?.user?.fullName || 'Gia sư'}</strong>
                        {c.tutor?.id && (
                          <button
                            onClick={() => openTutorPerformance(c.tutor!.id)}
                            className="ml-2 text-emerald-800 hover:underline font-bold"
                          >
                            [Xem hồ sơ]
                          </button>
                        )}
                      </div>
                      <div>
                        Phụ huynh: <strong className="text-slate-900">{c.parent?.user?.fullName || 'Phụ huynh'}</strong> ({c.parent?.user?.phone || '0988xxx'})
                      </div>
                    </div>

                    {c.contactLogs && c.contactLogs.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-bold text-slate-700 block">Lịch sử liên hệ gần nhất:</span>
                        {c.contactLogs.slice(-2).map((log) => (
                          <div key={log.id} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-emerald-950 flex items-center justify-between">
                            <div>
                              <strong>{log.channel} ({log.outcome}):</strong> {log.note}
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => handleDeleteCase(c)}
                        className="px-3.5 py-2 font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="Xóa phiếu hỗ trợ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa phiếu</span>
                      </button>

                      <button
                        onClick={() => {
                          setContactModalCase(c);
                          setContactForm({
                            target: c.team === 'CS_TUTOR' ? 'TUTOR' : 'PARENT',
                            channel: 'PHONE',
                            outcome: 'REACHED',
                            note: '',
                            followUpAt: '',
                          });
                        }}
                        className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi điện / Ghi nhật ký liên hệ</span>
                      </button>

                      {c.lessonReportId && (
                        <button
                          onClick={() => setConfirmModalReport({ id: c.lessonReportId!, topic: c.title, tutorName: c.tutor?.user?.fullName })}
                          className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Xác nhận sổ thay</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: UNCONFIRMED REPORTS > 24H */}
      {activeSubTab === 'unconfirmed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Danh sách các buổi học gia sư đã nộp báo cáo quá 24h nhưng phụ huynh chưa ấn xác nhận.</span>
            <button onClick={fetchUnconfirmed} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="animate-spin text-emerald-800" size={32} />
              <p className="text-xs font-bold">Đang quét báo cáo trễ hạn...</p>
            </div>
          ) : unconfirmedReports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
              Không có báo cáo nào tồn đọng quá 24h chưa xác nhận!
            </div>
          ) : (
            <div className="space-y-3">
              {unconfirmedReports.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                        Chờ xác nhận: {r.hoursElapsed} giờ
                      </span>
                      <span className="font-bold text-slate-900">{r.class?.title || 'Lớp học'}</span>
                      <span className="text-slate-400">· Nộp lúc: {new Date(r.submittedAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Bài học:</strong> {r.topic || 'Buổi học'} | <strong>Gia sư:</strong> {r.tutor?.user?.fullName} | <strong>Học sinh:</strong> {r.student?.fullName}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Phụ huynh: {r.student?.parent?.user?.fullName || 'Phụ huynh'} ({r.student?.parent?.user?.phone || '0988xxx'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setConfirmModalReport({ id: r.id, topic: r.topic, tutorName: r.tutor?.user?.fullName })}
                      className="px-4 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xác nhận thay phụ huynh</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL GHI NHẬT KÝ LIÊN HỆ */}
      {contactModalCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Ghi Nhật Ký Liên Hệ: {contactModalCase.code}
              </h3>
              <button onClick={() => setContactModalCase(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveContactLog} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đối tượng liên hệ</label>
                  <select
                    value={contactForm.target}
                    onChange={(e) => setContactForm({ ...contactForm, target: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="PARENT">Phụ huynh học sinh</option>
                    <option value="TUTOR">Gia sư phụ trách</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kênh liên lạc</label>
                  <select
                    value={contactForm.channel}
                    onChange={(e) => setContactForm({ ...contactForm, channel: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="PHONE">Cuộc gọi điện thoại</option>
                    <option value="ZALO">Tin nhắn Zalo</option>
                    <option value="SMS">Tin nhắn SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kết quả cuộc gọi</label>
                <select
                  value={contactForm.outcome}
                  onChange={(e) => setContactForm({ ...contactForm, outcome: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="REACHED">Đã kết nối thành công & trao đổi xong</option>
                  <option value="NO_ANSWER">Không nghe máy / Máy bận</option>
                  <option value="CALLBACK_LATER">Hẹn gọi lại sau</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung trao đổi *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi chú phản hồi của phụ huynh/gia sư..."
                  value={contactForm.note}
                  onChange={(e) => setContactForm({ ...contactForm, note: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hẹn liên hệ lại (nếu cần)</label>
                <input
                  type="datetime-local"
                  value={contactForm.followUpAt}
                  onChange={(e) => setContactForm({ ...contactForm, followUpAt: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContactModalCase(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Lưu Nhật Ký Cuộc Gọi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN THAY PHỤ HUYNH */}
      {confirmModalReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-slate-900">Xác Nhận Sổ Liên Lạc Thay Phụ Huynh</h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Bạn đang thực hiện thao tác CSKH xác nhận buổi học thay cho phụ huynh. Học phí buổi dạy sẽ được duyệt và chuyển sang trạng thái đã hoàn thành.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <div>Bài học: <strong>{confirmModalReport.topic || 'Buổi học'}</strong></div>
              <div>Gia sư: <strong>{confirmModalReport.tutorName}</strong></div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ghi chú xác nhận thay:</label>
              <textarea
                rows={2}
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-emerald-800"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModalReport(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmOnBehalf}
                className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
              >
                Xác Nhận Thay Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HỒ SƠ NĂNG LỰC & VI PHẠM GIA SƯ */}
      {perfModalTutorId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                Hồ Sơ Năng Lực & Quản Lý Kỷ Luật Gia Sư
              </h3>
              <button onClick={() => setPerfModalTutorId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {perfLoading || !tutorPerf ? (
              <div className="py-16 text-center flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin text-emerald-800 mb-2" size={24} />
                <span>Đang tải thông tin năng lực...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tutor Info & Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{tutorPerf.tutor.fullName}</h4>
                    <span className="text-slate-500">SĐT: {tutorPerf.tutor.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl font-bold ${tutorPerf.tutor.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tutorPerf.tutor.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                      Trạng thái: {tutorPerf.tutor.status}
                    </span>

                    <select
                      value={tutorPerf.tutor.status}
                      onChange={(e) => handleUpdateTutorStatus(e.target.value as any)}
                      className="border border-slate-200 rounded-xl px-2 py-1 font-bold text-slate-700 bg-white"
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="PAUSED">Tạm dừng nhận lớp (PAUSED)</option>
                      <option value="SUSPENDED">Đình chỉ giảng dạy (SUSPENDED)</option>
                    </select>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 font-bold block">Tỉ Lệ Đúng Hạn</span>
                    <strong className="text-lg font-black text-emerald-900">{tutorPerf.stats.onTimeRate}%</strong>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-[10px] text-blue-800 font-bold block">Tổng Báo Cáo</span>
                    <strong className="text-lg font-black text-blue-900">{tutorPerf.stats.totalReports}</strong>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-[10px] text-purple-800 font-bold block">Lớp Đang Dạy</span>
                    <strong className="text-lg font-black text-purple-900">{tutorPerf.stats.totalClasses}</strong>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <span className="text-[10px] text-rose-800 font-bold block">Số Lần Vi Phạm</span>
                    <strong className="text-lg font-black text-rose-900">{tutorPerf.stats.violationCount}</strong>
                  </div>
                </div>

                {/* Form Ghi nhận vi phạm */}
                <form onSubmit={handleRecordViolation} className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200 space-y-3">
                  <span className="font-extrabold text-rose-900 block">Ghi Nhận Vi Phạm / Khiếu Nại Mới:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Loại vi phạm</label>
                      <select
                        value={violationForm.type}
                        onChange={(e) => setViolationForm({ ...violationForm, type: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="LATE_REPORT">Trễ hạn nộp báo cáo buổi học</option>
                        <option value="MISSED_LESSON">Vắng dạy không báo trước</option>
                        <option value="PARENT_COMPLAINT">Phụ huynh phàn nàn thái độ / kỹ năng</option>
                        <option value="UNCONFIRMED_STREAK">Chậm xác nhận yêu cầu đổi lịch</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Mức độ nghiêm trọng</label>
                      <select
                        value={violationForm.severity}
                        onChange={(e) => setViolationForm({ ...violationForm, severity: Number(e.target.value) })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value={1}>Mức 1: Nhắc nhở</option>
                        <option value={2}>Mức 2: Cảnh cáo trừ điểm uy tín</option>
                        <option value={3}>Mức 3: Tạm đình chỉ tài khoản</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Mô tả cụ thể biên bản vi phạm..."
                      value={violationForm.note}
                      onChange={(e) => setViolationForm({ ...violationForm, note: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl transition"
                  >
                    Lập Biên Bản Vi Phạm
                  </button>
                </form>

                {/* Danh sách vi phạm đã lưu */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">Lịch sử vi phạm ({tutorPerf.violations.length}):</span>
                  {tutorPerf.violations.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-xl">
                      Gia sư có hồ sơ trong sạch, chưa có vi phạm nào.
                    </div>
                  ) : (
                    tutorPerf.violations.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900">[{v.type}]</strong> {v.note}
                          <span className="text-slate-400 ml-2">({new Date(v.createdAt).toLocaleDateString('vi-VN')})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                          Mức {v.severity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
