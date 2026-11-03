import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { TutorProfile } from '../../types/edtech';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Award, 
  Clock, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  MessageSquare,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PublicTutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.actorType === 'ADMIN' || (currentUser?.roles && currentUser.roles.includes('ADMIN'));

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [studentGrade, setStudentGrade] = useState('Lớp 4');
  const [parentName, setParentName] = useState('Chị Mai Anh');
  const [parentPhone, setParentPhone] = useState('0988 123 456');
  const [parentNote, setParentNote] = useState('Bé hơi nhút nhát dạng toán giải đố, muốn thầy kèm 2 buổi/tuần.');
  const [submitted, setSubmitted] = useState(false);

  const handleToggleVisibility = async () => {
    if (!tutor?.id) return;
    try {
      setActionLoading(true);
      const res: any = await api.tutors.toggleVisibility(tutor.id);
      if (res?.data) {
        setTutor((prev) => prev ? { ...prev, status: res.data.status } : null);
        setAdminNotice(res.message || 'Cập nhật trạng thái hiển thị thành công!');
        setTimeout(() => setAdminNotice(null), 4000);
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi thay đổi trạng thái gia sư');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTutor = async () => {
    if (!tutor?.id) return;
    const confirmDel = window.confirm(
      `Bạn có chắc chắn muốn xóa/thu hồi hồ sơ của gia sư "${tutor.name}" không?\n\n- Nếu gia sư đã có lớp/báo cáo: Hệ thống sẽ chuyển trạng thái đình chỉ (SUSPENDED) và ẩn hoàn toàn khỏi sàn.\n- Nếu chưa có dữ liệu lịch sử: Hồ sơ sẽ được xóa vĩnh viễn.`
    );
    if (!confirmDel) return;

    try {
      setActionLoading(true);
      const res: any = await api.tutors.deleteTutor(tutor.id);
      alert(res?.message || 'Đã xử lý hồ sơ gia sư thành công!');
      navigate('/tutors');
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa hồ sơ gia sư');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    async function loadTutor() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.tutors.getPublicTutorDetail(id);
        if (res.data) setTutor(res.data);
      } catch (err) {
        console.error('Lỗi tải chi tiết gia sư:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTutor();
  }, [id]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitted(true);
      await api.classRequests.createRequest({
        parentName,
        phone: parentPhone,
        grade: studentGrade,
        note: parentNote,
        tutorId: id,
        budgetPerSession: tutor?.hourlyRate || 300000,
      });
      setTimeout(() => {
        setBookingModalOpen(false);
        setSubmitted(false);
        navigate('/parent/requests');
      }, 1200);
    } catch {
      setBookingModalOpen(false);
      navigate('/parent/requests');
    }
  };

  if (loading || !tutor) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải hồ sơ gia sư...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs">
          <Link to="/tutors" className="text-emerald-800 hover:underline flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách gia sư</span>
          </Link>
          <span className="text-slate-400">Mã gia sư: {tutor.id}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Admin Controls Panel */}
        {isAdmin && (
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 mb-8 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-900 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-md">
                      Bảng Quản Trị Viên (Admin Moderation)
                    </span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      tutor.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : tutor.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {tutor.status === 'ACTIVE'
                        ? '● Đang công khai trên sàn'
                        : tutor.status === 'PAUSED'
                          ? '● Đang tạm ẩn khỏi sàn'
                          : '● Đã bị khóa / đình chỉ'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-1">
                    Quản trị viên có quyền ẩn gia sư khỏi sàn tìm kiếm hoặc thu hồi / xóa hồ sơ gia sư này khỏi hệ thống.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <button
                  onClick={handleToggleVisibility}
                  disabled={actionLoading}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                    tutor.status === 'ACTIVE'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {tutor.status === 'ACTIVE' ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Tạm ẩn khỏi sàn</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Mở công khai trên sàn</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeleteTutor}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa hồ sơ gia sư</span>
                </button>
              </div>
            </div>

            {adminNotice && (
              <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{adminNotice}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tutor Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Profile Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img
                  src={tutor.avatar}
                  alt={tutor.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm"
                />
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white bg-emerald-800 px-2.5 py-1 rounded-lg">
                      {tutor.badge}
                    </span>
                    {tutor.verified && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã thẩm định hồ sơ</span>
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {tutor.name}
                  </h1>

                  <p className="text-sm font-semibold text-slate-700">{tutor.title}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{tutor.rating}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount} đánh giá)</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{tutor.location}</span>
                    </div>
                    <span>·</span>
                    <span>Tốc độ phản hồi: {tutor.responseRate}</span>
                  </div>
                </div>
              </div>

              {/* Bio & Philosophy */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Giới thiệu & Phương pháp giảng dạy</span>
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {tutor.bio}
                </p>
              </div>

              {/* Education & Qualifications */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>Học vấn & Bằng cấp chuyên môn</span>
                </h2>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-900">{tutor.education}</div>
                  <div className="text-xs text-slate-500">Đã đối chiếu căn cước công dân và bằng tốt nghiệp chính quy tại trụ sở VietTutor.</div>
                </div>
              </div>

              {/* Key Achievements */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>Thành tích tiêu biểu & Giải thưởng</span>
                </h2>
                <div className="space-y-2">
                  {tutor.achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parent Reviews Snippet */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Nhận xét từ phụ huynh ({tutor.reviewCount})
                  </h2>
                  <span className="text-xs font-bold text-emerald-800">100% đánh giá thật từ học viên</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Chị Hoàng Yến (Mẹ bé Minh Anh - Lớp 4)</span>
                      <span className="text-slate-400">2 tuần trước</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Thầy dạy rất truyền cảm hứng, kiên nhẫn với bạn nhỏ hiếu động. Sau 1 tháng bé đã tự giác làm bài tập về nhà và đạt điểm 9 bài thi giữa kỳ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Booking Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Học phí kèm 1:1</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-emerald-800">
                    {tutor.hourlyRate.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ giờ (60 phút)</span>
                </div>
              </div>

              {tutor.freeTrial && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Miễn phí 01 buổi học thử để đánh giá mức độ phù hợp của con</span>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hình thức dạy</span>
                  <span className="font-bold text-slate-800">
                    {tutor.teachingMode === 'BOTH' ? 'Trực tiếp tại nhà & Online' : tutor.teachingMode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Khối lớp nhận dạy</span>
                  <span className="font-bold text-slate-800">{tutor.grades.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cam kết chất lượng</span>
                  <span className="font-bold text-emerald-700">Đổi gia sư 100% nếu không hài lòng</span>
                </div>
              </div>

              <button
                onClick={() => setBookingModalOpen(true)}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition text-sm flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Học Với Thầy/Cô</span>
              </button>

              <button
                onClick={() => navigate('/parent/requests/new')}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition text-xs"
              >
                Gửi yêu cầu ghép gia sư tổng thể
              </button>

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                Sau khi gửi yêu cầu, ban điều phối VietTutor sẽ liên hệ xác nhận lịch hẹn trong vòng 30 phút.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Đặt lịch học với {tutor.name}</h3>
                <p className="text-xs text-slate-500">Môn {tutor.subjects[0]} · {tutor.hourlyRate.toLocaleString('vi-VN')} đ/h</p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-900">Đã gửi yêu cầu thành công!</h4>
                <p className="text-xs text-slate-500">Hệ thống đang chuyển bạn đến mục Lịch sử yêu cầu...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp của bé</label>
                    <select
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                    >
                      <option value="Lớp 1">Lớp 1</option>
                      <option value="Lớp 2">Lớp 2</option>
                      <option value="Lớp 3">Lớp 3</option>
                      <option value="Lớp 4">Lớp 4</option>
                      <option value="Lớp 5">Lớp 5</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu & Yêu cầu học tập</label>
                  <textarea
                    rows={3}
                    value={parentNote}
                    onChange={(e) => setParentNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                  >
                    Xác nhận gửi thông tin
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
