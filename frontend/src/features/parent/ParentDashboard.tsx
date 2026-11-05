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
  Star, 
  ArrowRight, 
  BookOpen,
  Award,
  ChevronRight,
  UserX
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

interface ChildStudent {
  id: string;
  fullName: string;
  nickname?: string;
  dob?: string;
  gender?: string;
  gradeLevelId?: number;
  gradeLevel?: { id: number; name: string };
  school?: string;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [reports, setReports] = useState<LessonReport[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [children, setChildren] = useState<ChildStudent[]>([]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [classesModalOpen, setClassesModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [repRes, clsRes, stuRes] = await Promise.all([
          api.reports.getLessonReports(),
          api.classes.getClasses(),
          api.students.getStudents(),
        ]);
        if (repRes?.data) setReports(repRes.data);
        if (clsRes?.data) setClasses(clsRes.data);
        if (stuRes?.data) setChildren(stuRes.data);
      } catch (err) {
        console.error('Lỗi tải dữ liệu phụ huynh:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const activeChild = children[activeChildIndex] || null;
  const latestReport = reports.length > 0 ? reports[0] : null;
  const activeClass = classes.length > 0 ? classes[0] : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Khu vực quản lý học tập của bé"
        title={`Chào mừng, ${currentUser?.name || 'Phụ Huynh'}`}
        description="Đồng hành cùng con yêu và theo dõi tiến độ các buổi kèm cặp gia sư một cách minh bạch, hiệu quả."
        actions={
          <Link to="/parent/requests/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              <span>Tìm gia sư cho bé</span>
            </Button>
          </Link>
        }
      />

      {/* Child Profile Banner — Hoàn toàn dựa vào dữ liệu DB thật */}
      {activeChild ? (
        <Card variant="static" padding="lg" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center text-3xl font-semibold shrink-0 border border-brand-100 shadow-xs">
              {activeChild.gender === 'Nữ' ? '👧' : '👦'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-semibold tracking-tight text-ink-900">
                  {activeChild.fullName}
                </h2>
                {activeChild.nickname && (
                  <span className="text-xs text-ink-400 italic">({activeChild.nickname})</span>
                )}
                <Badge variant="brand">
                  {activeChild.gradeLevel?.name || `Lớp ${activeChild.gradeLevelId}`}
                </Badge>
              </div>

              <p className="text-xs text-ink-500">
                {activeClass ? (
                  <>Đang học cùng <strong>{activeClass.tutorName}</strong> (Môn {activeClass.subject})</>
                ) : (
                  <>Trường: <strong>{activeChild.school || 'Chưa cập nhật trường'}</strong></>
                )}
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs text-ink-500">
                <span className="text-brand-700 font-medium">
                  {classes.length > 0
                    ? `Đang tham gia ${classes.length} lớp học`
                    : 'Chưa đăng ký lớp học nào'}
                </span>
                <span>·</span>
                <span>Hồ sơ con đã sẵn sàng</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {children.length > 1 && (
              <select
                value={activeChildIndex}
                onChange={(e) => setActiveChildIndex(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-ink-200 bg-white text-ink-700 focus:outline-hidden"
              >
                {children.map((c, idx) => (
                  <option key={c.id} value={idx}>
                    Bé: {c.fullName}
                  </option>
                ))}
              </select>
            )}
            <Link to="/parent/schedule">
              <Button variant="outline" size="sm">
                <Calendar className="w-3.5 h-3.5 text-ink-400" />
                <span>Thời khóa biểu tuần</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card variant="static" padding="md" className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-50/40 border-brand-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center text-xl shrink-0">
              👶
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Bạn chưa thêm hồ sơ con cái</h3>
              <p className="text-xs text-ink-500">
                Thêm thông tin của con để theo dõi tiến độ học tập và đăng yêu cầu tìm gia sư phù hợp.
              </p>
            </div>
          </div>
          <Link to="/parent/children">
            <Button variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm hồ sơ con ngay</span>
            </Button>
          </Link>
        </Card>
      )}

      {/* 4 Thẻ KPI — 100% dữ liệu thực tế, KHÔNG MOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Thẻ 1: Lớp học đang diễn ra */}
        <div
          onClick={() => {
            if (classes.length > 0) setClassesModalOpen(true);
            else navigate('/parent/requests/new');
          }}
          className="cursor-pointer group"
          title="Bấm để xem danh sách các lớp học của bé"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Lớp học đang diễn ra</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:scale-105 transition">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-ink-900">
                {classes.length} Lớp
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  {classes.length > 0 ? 'Bấm xem chi tiết lớp →' : 'Đăng ký tìm lớp ngay →'}
                </span>
                <span className="text-ink-400 text-[11px]">
                  {classes.length > 0 ? 'Đang học' : 'Chưa có lớp'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Buổi học — bấm vào hiển thị lịch mà buổi học diễn ra */}
        <div
          onClick={() => navigate('/parent/schedule')}
          className="cursor-pointer group"
          title="Bấm để xem lịch các buổi học diễn ra"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Buổi học</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:scale-105 transition">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-ink-900">
                {reports.length} Buổi
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  Bấm xem lịch buổi học →
                </span>
                <span className="text-ink-400 text-[11px]">
                  {reports.length > 0 ? 'Đã hoàn thành' : 'Chưa có buổi'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Thời khóa biểu (Thay thế cho thời lượng học tích lũy) */}
        <div
          onClick={() => navigate('/parent/schedule')}
          className="cursor-pointer group"
          title="Bấm để mở thời khóa biểu trong tuần"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Thời khóa biểu</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-50 group-hover:scale-105 transition">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight text-ink-900 truncate">
                {classes.length > 0 ? (classes[0].schedule || 'Đã xếp lịch') : 'Chưa có lịch học'}
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline">
                  {classes.length > 0 ? 'Xem thời khóa biểu →' : 'Xem lịch tuần →'}
                </span>
                <span className="text-ink-400 text-[11px]">
                  {classes.length > 0 ? 'Lịch cố định' : 'Chưa có lớp'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Đánh giá từ gia sư của bé */}
        <div
          onClick={() => {
            if (reports.length > 0) navigate('/parent/reports');
          }}
          className="cursor-pointer group"
          title="Bấm để xem chi tiết nhận xét & sổ liên lạc"
        >
          <div className="bg-white p-5 rounded-3xl border border-ink-200/80 shadow-2xs hover:border-brand-400 hover:shadow-xs transition duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Đánh giá từ gia sư của bé</span>
              <div className="w-8 h-8 rounded-xl bg-ink-50 text-gold-500 flex items-center justify-center group-hover:bg-amber-50 group-hover:scale-105 transition">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight text-ink-900">
                {latestReport ? 'Đã có đánh giá' : 'Chưa có đánh giá'}
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-brand-700 font-medium group-hover:underline truncate max-w-[150px]">
                  {latestReport?.teacherFeedback || latestReport?.feedback || (reports.length > 0 ? 'Có nhận xét mới' : 'Chưa có buổi học')}
                </span>
                <span className="text-ink-400 text-[11px] shrink-0">
                  {reports.length > 0 ? 'Xem sổ →' : 'Trống'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections: Latest Report & Active Class */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Report */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Báo cáo buổi học gần nhất {latestReport ? `(Buổi ${latestReport.lessonNumber || 1})` : ''}</span>
            </h3>
            {reports.length > 0 && (
              <Link to="/parent/reports" className="text-xs font-semibold text-brand-700 hover:underline">
                Xem tất cả báo cáo ({reports.length}) →
              </Link>
            )}
          </div>

          {latestReport ? (
            <Card variant="static" padding="md" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-100 pb-3 text-xs">
                <div>
                  <span className="font-semibold text-brand-700">{latestReport.subject}</span>
                  <span className="text-ink-300 mx-2">·</span>
                  <span className="text-ink-500">Ngày {latestReport.date}</span>
                  {latestReport.duration && (
                    <>
                      <span className="text-ink-300 mx-2">·</span>
                      <span className="text-ink-500">{latestReport.duration}</span>
                    </>
                  )}
                </div>
                <Badge variant={latestReport.parentConfirmed ? 'brand' : 'gold'}>
                  {latestReport.parentConfirmed ? '✓ Đã xác nhận' : '⏳ Chờ phụ huynh xác nhận'}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold text-ink-900 block">Nội dung buổi học:</span>
                <p className="text-ink-600 leading-relaxed bg-ink-50 p-3.5 rounded-2xl border border-ink-200/80">
                  {latestReport.topic || latestReport.contentCovered || 'Chưa cập nhật nội dung chi tiết buổi học.'}
                </p>
              </div>

              {(latestReport.teacherFeedback || latestReport.feedback) && (
                <div className="space-y-2 text-xs">
                  <span className="font-semibold text-ink-900 block">Đánh giá từ gia sư của bé:</span>
                  <p className="text-ink-600 leading-relaxed italic bg-brand-50/40 p-3.5 rounded-2xl border border-brand-100">
                    "{latestReport.teacherFeedback || latestReport.feedback}"
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Link to={`/parent/reports/${latestReport.id}`}>
                  <Button variant="outline" size="sm">
                    Xem chi tiết sổ liên lạc →
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card variant="static" padding="lg" className="text-center py-12 text-xs text-ink-400 space-y-2">
              <FileText className="w-8 h-8 text-ink-300 mx-auto" />
              <p className="font-medium text-ink-600">Chưa có báo cáo buổi học nào được ghi nhận.</p>
              <p className="text-[11px] text-ink-400">
                Sau khi gia sư hoàn thành buổi dạy và gửi báo cáo, bạn sẽ nhận được thông báo để xác nhận sổ liên lạc.
              </p>
            </Card>
          )}
        </div>

        {/* Active Class / Tutor Info — KHÔNG HIỂN THỊ MẪU GIẢ ĐỊNH KHI CHƯA CÓ LỚP */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            <span>Gia sư đang giảng dạy</span>
          </h3>

          {activeClass ? (
            <Card variant="static" padding="md" className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-xl font-semibold border border-brand-200 shrink-0">
                  👨‍🏫
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-ink-900 truncate">
                    {activeClass.tutorName}
                  </h4>
                  <p className="text-xs text-ink-500 truncate">{activeClass.subject}</p>
                  <div className="flex items-center gap-1 text-xs text-brand-700 font-medium mt-1">
                    <Badge variant="brand">Đang phụ trách</Badge>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-ink-50 rounded-2xl border border-ink-200/80 text-xs space-y-1.5 text-ink-600">
                <div className="flex justify-between">
                  <span>Môn học:</span>
                  <strong className="text-ink-900">{activeClass.subject}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hình thức:</span>
                  <strong className="text-ink-900">{activeClass.mode === 'ONLINE' ? 'Online qua Zoom' : 'Dạy tại nhà'}</strong>
                </div>
                {activeClass.feePerSession && (
                  <div className="flex justify-between">
                    <span>Học phí:</span>
                    <strong className="text-brand-700">
                      {Number(activeClass.feePerSession).toLocaleString()} đ / buổi
                    </strong>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link to="/parent/schedule" className="block">
                  <Button variant="secondary" size="sm" fullWidth>
                    Xem thời khóa biểu
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card variant="static" padding="lg" className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-ink-100 text-ink-400 flex items-center justify-center mx-auto">
                <UserX className="w-6 h-6 text-ink-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-ink-900">Chưa có gia sư đang giảng dạy</h4>
                <p className="text-xs text-ink-500 max-w-xs mx-auto">
                  Hiện tại bạn chưa có lớp học nào đang diễn ra. Hãy tạo yêu cầu tìm gia sư để được kết nối giáo viên phù hợp cho bé.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/parent/requests/new">
                  <Button variant="primary" size="sm">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tìm gia sư cho bé ngay</span>
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* MODAL: Danh sách lớp học đang diễn ra (chỉ hiển thị khi có lớp thực tế) */}
      {classesModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-ink-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center text-lg font-semibold border border-brand-100">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">Lớp học đang diễn ra</h3>
                  <p className="text-xs text-ink-400">Các lớp kèm cặp gia sư hiện tại của bé</p>
                </div>
              </div>
              <button
                onClick={() => setClassesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <div key={cls.id} className="p-4 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-900 text-sm">{cls.name || cls.subject}</span>
                      <Badge variant="brand">Đang diễn ra</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-ink-600 pt-1">
                      <div>Gia sư: <strong className="text-ink-900">{cls.tutorName}</strong></div>
                      <div>Lịch học: <strong className="text-ink-900">{cls.schedule || 'Thỏa thuận'}</strong></div>
                      <div>Hình thức: <strong className="text-ink-900">{cls.mode === 'ONLINE' ? 'Online' : 'Tại nhà'}</strong></div>
                      {cls.feePerSession && (
                        <div>Học phí: <strong className="text-brand-700">{Number(cls.feePerSession).toLocaleString()} đ/buổi</strong></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-ink-400 space-y-2">
                  <p>Hiện chưa có lớp học nào đang diễn ra.</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
              <Link to="/parent/schedule" onClick={() => setClassesModalOpen(false)}>
                <Button variant="outline" size="sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Xem lịch học các lớp</span>
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setClassesModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
