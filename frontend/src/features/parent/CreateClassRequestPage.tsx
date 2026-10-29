import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Sparkles, MapPin, Calendar, Clock, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CreateClassRequestPage() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('Bé Bảo Nam');
  const [grade, setGrade] = useState('Lớp 4');
  const [subject, setSubject] = useState('Toán Nâng Cao & Bồi Dưỡng');
  const [mode, setMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [location, setLocation] = useState('Nghĩa Tân, Cầu Giấy, Hà Nội');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [budgetPerSession, setBudgetPerSession] = useState(350000);
  const [requirements, setRequirements] = useState('Tìm gia sư kiên nhẫn, có phương pháp dạy tư duy trực quan, giúp bé tự giác làm bài tập về nhà.');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/parent/requests');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-8 border-b border-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300">Phụ Huynh Đăng Lớp</span>
          <h1 className="text-2xl font-black text-white mt-1">
            Đăng Ký Yêu Cầu Tìm Gia Sư Riêng
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Hệ thống sẽ tự động ghép đôi (Matching) và gửi danh sách 2-3 hồ sơ gia sư phù hợp nhất qua Zalo / SMS cho bạn trong vòng 2 giờ.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-900">Yêu cầu tìm gia sư đã được đăng thành công!</h2>
              <p className="text-xs text-slate-500">Mã yêu cầu của bạn: YCY-8899. Ban điều phối đang tìm kiếm giáo viên phù hợp...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên học sinh</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:border-emerald-700 focus:outline-hidden"
                  >
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                    <option value="Lớp 6">Lớp 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn học cần tìm</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức dạy học</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setMode('OFFLINE')}
                      className={`p-2.5 rounded-xl border font-bold transition ${
                        mode === 'OFFLINE' ? 'border-emerald-700 bg-emerald-50 text-emerald-950' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Dạy tại nhà phụ huynh
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('ONLINE')}
                      className={`p-2.5 rounded-xl border font-bold transition ${
                        mode === 'ONLINE' ? 'border-emerald-700 bg-emerald-50 text-emerald-950' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Học Online qua Zoom
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ học (Quận / Huyện / Phường)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số buổi / tuần</label>
                  <select
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:border-emerald-700 focus:outline-hidden"
                  >
                    <option value={1}>1 buổi / tuần</option>
                    <option value={2}>2 buổi / tuần</option>
                    <option value={3}>3 buổi / tuần</option>
                    <option value={4}>4 buổi / tuần</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng mỗi buổi</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:border-emerald-700 focus:outline-hidden"
                  >
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút (Khuyên dùng)</option>
                    <option value={120}>120 phút (2 tiếng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Học phí đề xuất / buổi</label>
                  <select
                    value={budgetPerSession}
                    onChange={(e) => setBudgetPerSession(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:border-emerald-700 focus:outline-hidden"
                  >
                    <option value={250000}>250,000 đ / buổi</option>
                    <option value={300000}>300,000 đ / buổi</option>
                    <option value={350000}>350,000 đ / buổi</option>
                    <option value={400000}>400,000 đ / buổi</option>
                    <option value={500000}>500,000 đ / buổi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu học tập & Yêu cầu cụ thể với gia sư</label>
                <textarea
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/parent/dashboard')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đăng yêu cầu & Tìm gia sư ngay</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
