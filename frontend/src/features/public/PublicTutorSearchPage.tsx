import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { TutorProfile } from '../../types/edtech';
import { Search, Filter, Star, CheckCircle, MapPin, Award, ChevronRight, SlidersHorizontal, BookOpen } from 'lucide-react';

export default function PublicTutorSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [priceMax, setPriceMax] = useState(500000);
  const [trialOnly, setTrialOnly] = useState(false);

  useEffect(() => {
    async function fetchTutors() {
      try {
        setLoading(true);
        const res = await api.tutors.getPublicTutors();
        if (res.data) setTutors(res.data);
      } catch (err) {
        console.error('Lỗi tải danh sách gia sư:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTutors();
  }, []);

  const filteredTutors = useMemo(() => {
    return tutors.filter((tut) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        const matchesName = tut.name.toLowerCase().includes(q);
        const matchesSubj = tut.subjects.some(s => s.toLowerCase().includes(q));
        const matchesBio = tut.bio.toLowerCase().includes(q);
        if (!matchesName && !matchesSubj && !matchesBio) return false;
      }
      if (selectedSubject !== 'ALL') {
        if (!tut.subjects.some(s => s.toLowerCase().includes(selectedSubject.toLowerCase()))) {
          return false;
        }
      }
      if (selectedGrade !== 'ALL') {
        if (!tut.grades.some(g => g.includes(selectedGrade))) return false;
      }
      if (selectedMode !== 'ALL') {
        if (selectedMode === 'ONLINE' && tut.teachingMode === 'OFFLINE') return false;
        if (selectedMode === 'OFFLINE' && tut.teachingMode === 'ONLINE') return false;
      }
      if (tut.hourlyRate > priceMax) return false;
      if (trialOnly && !tut.freeTrial) return false;

      return true;
    });
  }, [tutors, keyword, selectedSubject, selectedGrade, selectedMode, priceMax, trialOnly]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-emerald-950 text-white py-8 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-300">Sàn Gia Sư Tiêu Chuẩn Cao</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Tìm kiếm Gia sư ({filteredTutors.length} hồ sơ khả dụng)
              </h1>
              <p className="text-xs text-emerald-200 mt-1">
                Tất cả hồ sơ đã được xác minh lý lịch, kiểm tra văn bằng và trải qua bài khảo sát năng lực sư phạm.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/parent/requests/new')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                + Đăng yêu cầu tìm gia sư giúp tôi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Sidebar Filters & Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
                  <span>Bộ lọc tìm kiếm</span>
                </span>
                <button
                  onClick={() => {
                    setKeyword('');
                    setSelectedSubject('ALL');
                    setSelectedGrade('ALL');
                    setSelectedMode('ALL');
                    setPriceMax(500000);
                    setTrialOnly(false);
                  }}
                  className="text-xs text-emerald-800 hover:underline font-medium"
                >
                  Xóa lọc
                </button>
              </div>

              {/* Keyword search input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Từ khóa / Tên giáo viên</label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Ví dụ: Hoàng Nam, Toán 4..."
                    className="w-full text-xs px-3 py-2 pl-8 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 bg-slate-50"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Môn học</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 bg-white"
                >
                  <option value="ALL">Tất cả các môn</option>
                  <option value="Toán">Toán Tiểu học & Nâng cao</option>
                  <option value="Tiếng Anh">Tiếng Anh & Cambridge</option>
                  <option value="Tiếng Việt">Tiếng Việt & Rèn chữ</option>
                  <option value="Khoa học">Khoa học & STEM</option>
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Khối lớp</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 bg-white"
                >
                  <option value="ALL">Tất cả các khối</option>
                  <option value="Lớp 1">Lớp 1</option>
                  <option value="Lớp 2">Lớp 2</option>
                  <option value="Lớp 3">Lớp 3</option>
                  <option value="Lớp 4">Lớp 4</option>
                  <option value="Lớp 5">Lớp 5</option>
                </select>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hình thức dạy</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                  <button
                    onClick={() => setSelectedMode('ALL')}
                    className={`py-1.5 rounded-lg font-medium transition ${selectedMode === 'ALL' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedMode('OFFLINE')}
                    className={`py-1.5 rounded-lg font-medium transition ${selectedMode === 'OFFLINE' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
                  >
                    Tại nhà
                  </button>
                  <button
                    onClick={() => setSelectedMode('ONLINE')}
                    className={`py-1.5 rounded-lg font-medium transition ${selectedMode === 'ONLINE' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
                  >
                    Online
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700">Mức học phí tối đa</span>
                  <span className="font-extrabold text-emerald-800">{priceMax.toLocaleString('vi-VN')} đ/h</span>
                </div>
                <input
                  type="range"
                  min={200000}
                  max={600000}
                  step={25000}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-emerald-800"
                />
              </div>

              {/* Checkboxes */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trialOnly}
                    onChange={(e) => setTrialOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  <span>Chỉ hiện gia sư có buổi học thử</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results List (Superprof style card layout) */}
          <div className="lg:col-span-3 space-y-4">
            {filteredTutors.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Không tìm thấy gia sư phù hợp tiêu chí</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hãy thử điều chỉnh mức giá hoặc chọn &quot;Tất cả các môn&quot; để tìm thấy nhiều thầy cô hơn.
                </p>
                <button
                  onClick={() => {
                    setSelectedSubject('ALL');
                    setSelectedGrade('ALL');
                    setSelectedMode('ALL');
                    setPriceMax(500000);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-xl"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              filteredTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  onClick={() => navigate(`/tutors/${tutor.id}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row gap-5 group"
                >
                  {/* Tutor Avatar & Quick stats */}
                  <div className="shrink-0 flex md:flex-col items-center gap-3">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border border-slate-100 shadow-xs"
                    />
                    <div className="text-center md:w-32">
                      <div className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{tutor.rating}</span>
                        <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tutor.studentsTaught} học viên đã học
                      </div>
                    </div>
                  </div>

                  {/* Tutor Main Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                            {tutor.name}
                          </h2>
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {tutor.badge}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-800">
                            {tutor.hourlyRate.toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-xs text-slate-400"> / giờ</span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-600 mb-2">{tutor.title}</p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tutor.location}</span>
                        </span>
                        <span>·</span>
                        <span>Hình thức: {tutor.teachingMode === 'BOTH' ? 'Trực tiếp & Online' : tutor.teachingMode}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">Phản hồi: {tutor.responseRate}</span>
                      </div>

                      {/* Bio snippet */}
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                        {tutor.bio}
                      </p>

                      {/* Subjects & Grades */}
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.subjects.map((sub, idx) => (
                          <span key={idx} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-emerald-800 font-semibold flex items-center gap-1">
                        {tutor.freeTrial && (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                            ✓ Học thử 01 buổi miễn phí
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-800 group-hover:translate-x-1 transition flex items-center gap-1">
                        <span>Xem hồ sơ & Đặt lịch</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
