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
  Award, 
  Clock, 
  GraduationCap,
  Users
} from 'lucide-react';

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
    navigate(`/tutors?subject=${encodeURIComponent(selectedSubject)}&location=${encodeURIComponent(selectedLocation)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Hero Section: Deep Emerald Banner with White Highlights */}
      <section className="relative bg-emerald-950 text-white pt-14 pb-20 overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Nền tảng Gia sư & EdTech Tiểu Học - THCS Chuẩn Mực</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Tìm Gia Sư Giỏi, <br />
                <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy">
                  Đồng Hành Tiến Bộ
                </span> Mỗi Buổi Học.
              </h1>

              <p className="text-base text-emerald-100/90 max-w-xl font-normal leading-relaxed">
                Hơn 1,200+ thầy cô và sinh viên xuất sắc từ ĐH Sư Phạm, ĐH Ngoại Thương, ĐH Bách Khoa. Báo cáo buổi học số hóa gửi phụ huynh sau mỗi buổi kèm.
              </p>

              {/* Search Widget */}
              <form onSubmit={handleSearch} className="bg-white p-2.5 rounded-2xl shadow-xl max-w-2xl text-slate-800 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 px-3 py-2 flex items-center gap-2.5 border-b sm:border-b-0 sm:border-r border-slate-200">
                  <BookOpen className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="w-full">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Môn học cần tìm</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="Toán">Toán Tiểu Học & Nâng Cao</option>
                      <option value="Tiếng Anh">Tiếng Anh (Cambridge / Giao tiếp)</option>
                      <option value="Tiếng Việt">Tiếng Việt & Rèn Chữ Đẹp</option>
                      <option value="Khoa Học">Khoa học vui & STEM</option>
                      <option value="Toán 6-9">Toán THCS & Luyện thi vào 10</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 px-3 py-2 flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="w-full">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Khu vực / Hình thức</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="Hà Nội">Hà Nội (Trực tiếp & Online)</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (Trực tiếp & Online)</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Online">Học Online toàn quốc (Zoom tương tác)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shrink-0 text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm Gia Sư</span>
                </button>
              </form>

              {/* Quick stats unboxed */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Dạy thử 01 buổi trải nghiệm</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Hồ sơ thẩm định 4 bước</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Đổi gia sư miễn phí nếu không hợp</span>
                </div>
              </div>
            </div>

            {/* Right Hero Card Showcase */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 text-slate-800 shadow-2xl border border-emerald-800/20">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Hồ sơ Gia sư nổi bật</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4.98 / 5.0 (2,400+ đánh giá)</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {tutors.slice(0, 2).map((tutor) => (
                    <div
                      key={tutor.id}
                      onClick={() => navigate(`/tutors/${tutor.id}`)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition cursor-pointer bg-white group"
                    >
                      <div className="flex gap-3.5">
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition truncate">
                              {tutor.name}
                            </h3>
                            <span className="text-xs font-bold text-emerald-800">
                              {tutor.hourlyRate.toLocaleString('vi-VN')} đ/h
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{tutor.title}</p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-emerald-700">{tutor.badge}</span>
                            <span>·</span>
                            <span>{tutor.studentsTaught} học sinh</span>
                            <span>·</span>
                            <span>{tutor.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Phụ huynh cần tìm nhanh?
                  </div>
                  <Link
                    to="/parent/requests/new"
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <span>Tạo yêu cầu tìm gia sư</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars: Deep green & crisp white */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Tiêu Chuẩn VietTutor</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Khác biệt của nền tảng quản trị gia sư chất lượng cao
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Thẩm định 4 Vòng</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kiểm tra CCCD, bằng cấp sư phạm/chứng chỉ quốc tế, bài test chuyên môn và phỏng vấn kỹ năng xử lý tâm lý trẻ.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Báo Cáo Từng Buổi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gia sư bắt buộc gửi nhận xét chi tiết sau mỗi buổi dạy: bài tập về nhà, mức độ tập trung và nội dung buổi tới.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Góc Học Của Bé (Kids)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống trò chơi tương tác, làm nhiệm vụ nhận sao đổi huy hiệu, kích thích trẻ tự giác ôn bài không cần nhắc nhở.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Điều Phối & CSKH 24h</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Đội ngũ điều phối ghép lớp song song, can thiệp xử lý khi gia sư chậm nộp báo cáo hoặc phụ huynh cần đổi ca học.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tutors (Superprof style) */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Đội Ngũ Tiêu Biểu</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Gia sư được đánh giá cao nhất
              </h2>
            </div>
            <Link
              to="/tutors"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
            >
              <span>Xem toàn bộ 1,200+ hồ sơ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tutors.map((tutor) => (
              <div
                key={tutor.id}
                onClick={() => navigate(`/tutors/${tutor.id}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-lg transition flex flex-col p-5 cursor-pointer group"
              >
                <div className="relative mb-4">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  {tutor.freeTrial && (
                    <div className="absolute top-2.5 left-2.5 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Buổi đầu thử miễn phí
                    </div>
                  )}
                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 text-slate-900 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{tutor.rating}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition">
                      {tutor.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-1">{tutor.title}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tutor.subjects.slice(0, 2).map((s, idx) => (
                      <span key={idx} className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 flex-1">
                    {tutor.bio}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Học phí</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {tutor.hourlyRate.toLocaleString('vi-VN')} đ/h
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 group-hover:underline">
                      Xem chi tiết →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Forum Snippet */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Cộng Đồng Học Tập</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Diễn đàn thảo luận & Tài liệu đề thi
              </h2>
            </div>
            <Link
              to="/forum"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
            >
              <span>Xem diễn đàn</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forumPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/forum/${post.id}`)}
                className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50/50 hover:bg-white transition cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-emerald-800">{post.category}</span>
                  <span>·</span>
                  <span>{post.createdAt}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-2 hover:text-emerald-800 transition">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed flex-1">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-medium">{post.author.name}</span>
                  </div>
                  <span>{post.repliesCount} câu trả lời</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-emerald-900 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ba mẹ đang tìm kiếm gia sư phù hợp nhất cho con?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto">
            Chỉ mất 2 phút gửi yêu cầu, ban điều phối VietTutor sẽ liên hệ tư vấn lộ trình và giới thiệu 2-3 hồ sơ phù hợp nhất trong 2 giờ.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/parent/requests/new"
              className="bg-white text-emerald-950 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-emerald-50 transition text-sm"
            >
              Đăng ký tìm gia sư ngay
            </Link>
            <Link
              to="/apply"
              className="border border-emerald-400 text-emerald-100 font-bold px-6 py-3 rounded-xl hover:bg-emerald-800 transition text-sm"
            >
              Bạn muốn trở thành Gia sư?
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
