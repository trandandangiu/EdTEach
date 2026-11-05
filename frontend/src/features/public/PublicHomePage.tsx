import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { TutorProfile, ForumPost } from '../../types/edtech';
import {
  Search,
  ShieldCheck,
  Star,
  MapPin,
  Sparkles,
  CheckCircle,
  BookOpen,
  ArrowRight,
  Users,
  MessageCircle,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function PublicHomePage() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('Toán');
  const [selectedLocation, setSelectedLocation] = useState('Hà Nội');
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [tutorsRes, forumRes] = await Promise.all([
          api.tutors.getPublicTutors(),
          api.forum.getPosts({ sort: 'popular' }),
        ]);
        if (tutorsRes.data) setTutors(tutorsRes.data);
        if (forumRes.data) setForumPosts(forumRes.data);
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/tutors?subject=${encodeURIComponent(selectedSubject)}&location=${encodeURIComponent(selectedLocation)}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink-900 antialiased">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-ink-50">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-amber-100/60 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div className="lg:col-span-7">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-ink-200 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                Nền tảng gia sư thẩm định 4 vòng
              </div>

              {/* Heading — 1 dòng chính + 1 dòng accent gradient */}
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-ink-900">
                Tìm gia sư giỏi
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  đồng hành cùng con.
                </span>
              </h1>

              {/* Subhead */}
              <p className="mt-6 text-base sm:text-lg text-ink-600 max-w-xl leading-relaxed">
                Hơn 1.200 thầy cô và sinh viên xuất sắc từ các trường sư phạm top đầu.
                Báo cáo buổi học số hoá gửi phụ huynh sau mỗi buổi kèm.
              </p>

              {/* Search — pill lớn, gộp khối */}
              <form
                onSubmit={handleSearch}
                className="mt-8 flex flex-col sm:flex-row bg-white rounded-2xl sm:rounded-full border border-ink-200 shadow-lg shadow-ink-200/50 p-2 focus-within:ring-2 focus-within:ring-brand-400/50 transition"
              >
                <label className="flex-1 flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                  <BookOpen className="w-5 h-5 text-brand-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] uppercase tracking-wide font-semibold text-ink-400">
                      Môn học
                    </span>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-ink-900 focus:outline-hidden cursor-pointer truncate"
                    >
                      <option value="Toán">Toán tiểu học & nâng cao</option>
                      <option value="Tiếng Anh">Tiếng Anh (Cambridge)</option>
                      <option value="Tiếng Việt">Tiếng Việt & rèn chữ</option>
                      <option value="Khoa Học">Khoa học vui & STEM</option>
                      <option value="Toán 6-9">Toán THCS & luyện thi 10</option>
                    </select>
                  </div>
                </label>

                <div className="hidden sm:block w-px bg-ink-200 my-2" />

                <label className="flex-1 flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                  <MapPin className="w-5 h-5 text-brand-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] uppercase tracking-wide font-semibold text-ink-400">
                      Khu vực
                    </span>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-ink-900 focus:outline-hidden cursor-pointer truncate"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Online">Online toàn quốc</option>
                    </select>
                  </div>
                </label>

                <button
                  type="submit"
                  className="mt-2 sm:mt-0 sm:ml-2 flex items-center justify-center gap-2 rounded-xl sm:rounded-full bg-ink-900 hover:bg-ink-800 active:scale-[0.98] text-white font-semibold text-sm px-6 py-3 transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm gia sư</span>
                </button>
              </form>

              {/* Trust bar gọn — 1 hàng */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-brand-600" /> Dạy thử 1 buổi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600" /> Hồ sơ thẩm định
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-brand-600" /> Đổi gia sư miễn phí
                </span>
              </div>
            </div>

            {/* Right — preview card kiểu Airbnb */}
            <div className="lg:col-span-5">
              <div className="relative">
                <Card variant="static" padding="md" className="relative shadow-xl shadow-ink-300/30">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="brand">Gia sư nổi bật</Badge>
                    <div className="flex items-center gap-1 text-xs font-medium text-ink-700">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      4.98 · 2.400+ đánh giá
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tutors.slice(0, 2).map((tutor) => (
                      <button
                        key={tutor.id}
                        onClick={() => navigate(`/tutors/${tutor.id}`)}
                        className="w-full text-left flex gap-3 p-3 rounded-2xl hover:bg-ink-50 transition group cursor-pointer"
                      >
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink-900 truncate group-hover:text-brand-600 transition">
                              {tutor.name}
                            </h3>
                            <span className="text-xs font-semibold text-brand-700 shrink-0">
                              {tutor.hourlyRate.toLocaleString('vi-VN')}đ/h
                            </span>
                          </div>
                          <p className="text-xs text-ink-500 truncate mt-0.5">{tutor.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-ink-500">
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {tutor.rating}
                            </span>
                            <span>·</span>
                            <span>{tutor.studentsTaught} học sinh</span>
                            <span>·</span>
                            <span>{tutor.location}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-ink-100 flex items-center justify-between">
                    <span className="text-xs text-ink-500">Cần tìm nhanh?</span>
                    <Link
                      to="/parent/requests/new"
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                    >
                      Tạo yêu cầu <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>

                {/* Floating badge */}
                <div className="hidden sm:flex absolute -bottom-4 -left-4 items-center gap-2 bg-ink-900 text-white rounded-2xl px-4 py-2.5 shadow-xl">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  <div className="text-xs">
                    <div className="font-semibold">98% phụ huynh hài lòng</div>
                    <div className="text-[10px] text-ink-300">sau buổi học đầu tiên</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUE PILLARS — Bento ============ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
              Tiêu chuẩn VietTutor
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              Khác biệt của một nền tảng gia sư chất lượng cao
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
            {/* Bento lớn */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-teal-700 text-white p-8 flex flex-col justify-between min-h-[280px]">
              <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold">Thẩm định 4 vòng</h3>
                <p className="mt-2 text-brand-50/90 text-sm leading-relaxed max-w-md">
                  Kiểm tra CCCD, bằng cấp sư phạm / chứng chỉ quốc tế, bài test chuyên môn và
                  phỏng vấn kỹ năng xử lý tâm lý trẻ.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {['CCCD', 'Bằng cấp', 'Chuyên môn', 'Tâm lý'].map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* 2 card nhỏ */}
            <Card variant="interactive" padding="md" className="flex flex-col justify-center">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-gold-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">Báo cáo từng buổi</h3>
              <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">
                Nhận xét chi tiết sau mỗi buổi: bài tập, mức độ tập trung, nội dung buổi tới.
              </p>
            </Card>

            <Card variant="interactive" padding="md" className="flex flex-col justify-center">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-info-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">Góc học thông minh</h3>
              <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">
                Nhiệm vụ tương tác, nhận sao đổi huy hiệu — kích thích trẻ tự giác ôn bài.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ TUTORS ============ */}
      <section className="py-20 lg:py-24 bg-ink-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                Đội ngũ tiêu biểu
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
                Gia sư được đánh giá cao
              </h2>
            </div>
            <Link
              to="/tutors"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-brand-600 transition"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tutors.map((tutor) => (
              <button
                key={tutor.id}
                onClick={() => navigate(`/tutors/${tutor.id}`)}
                className="group text-left bg-white rounded-3xl p-6 border border-ink-200 hover:border-transparent hover:shadow-xl hover:shadow-ink-300/30 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-brand-50"
                  />
                  {tutor.freeTrial && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-brand-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                      Thử miễn phí
                    </span>
                  )}
                </div>

                <h3 className="mt-5 font-semibold text-ink-900 group-hover:text-brand-600 transition">
                  {tutor.name}
                </h3>
                <p className="mt-0.5 text-xs text-ink-500 line-clamp-1">{tutor.title}</p>

                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {tutor.subjects.slice(0, 2).map((s, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium text-ink-600 bg-ink-100 px-2 py-0.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs text-ink-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-gold-400" />
                  <span className="font-semibold text-ink-900">{tutor.rating}</span>
                  <span className="text-ink-400">· {tutor.studentsTaught} học sinh</span>
                </div>

                <div className="mt-5 pt-4 border-t border-ink-100 w-full flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">
                    {tutor.hourlyRate.toLocaleString('vi-VN')}đ
                    <span className="text-xs font-normal text-ink-400">/h</span>
                  </span>
                  <span className="text-xs font-semibold text-brand-700 group-hover:underline">
                    Xem →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="pointer-events-none absolute -top-32 right-0 w-[36rem] h-[36rem] rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-0 w-[28rem] h-[28rem] rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-20 lg:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
            Ba mẹ đang tìm gia sư
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
              phù hợp nhất cho con?
            </span>
          </h2>
          <p className="mt-5 text-base text-ink-300 max-w-xl mx-auto leading-relaxed">
            Chỉ mất 2 phút gửi yêu cầu — ban điều phối sẽ liên hệ và giới thiệu
            2–3 hồ sơ phù hợp nhất trong vòng 2 giờ.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/parent/requests/new"
              className="w-full sm:w-auto rounded-full bg-white text-ink-900 font-semibold px-7 py-3.5 hover:bg-ink-100 active:scale-[0.98] transition shadow-lg shadow-ink-950/20"
            >
              Đăng ký tìm gia sư
            </Link>
            <Link
              to="/apply"
              className="w-full sm:w-auto rounded-full border border-ink-700 text-white font-semibold px-7 py-3.5 hover:bg-ink-800 active:scale-[0.98] transition"
            >
              Trở thành gia sư
            </Link>
          </div>

          <p className="mt-6 text-xs text-ink-400 inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            2.400+ phụ huynh đã tin tưởng VietTutor
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}