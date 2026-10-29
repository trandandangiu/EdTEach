import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  GraduationCap, 
  ShieldCheck, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Upload,
  AlertCircle
} from 'lucide-react';

export default function TutorApplyPage() {
  const navigate = useNavigate();
  const { switchUserRole } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('Trần Thị Thu Trang');
  const [email, setEmail] = useState('thutrang.pedagogy@gmail.com');
  const [phone, setPhone] = useState('0971 888 234');
  const [university, setUniversity] = useState('Đại học Sư Phạm Hà Nội - Khoa Giáo Dục Tiểu Học');
  const [major, setMajor] = useState('Sư phạm Toán - Tiểu học');
  const [gpa, setGpa] = useState('3.65/4.0');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Toán Tiểu Học', 'Toán Nâng Cao']);
  const [hourlyExpectation, setHourlyExpectation] = useState(300000);
  const [submitted, setSubmitted] = useState(false);

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleCompleteApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tutors.apply({
        fullName: name,
        email,
        phone,
        school: university,
        major,
        gpa,
        subjects: selectedSubjects,
      });
    } catch (err) {
      console.warn('API apply fallback:', err);
    }
    setSubmitted(true);
    setTimeout(() => {
      switchUserRole('APPLICANT');
      navigate('/apply/tests');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-10 border-b border-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300">Tuyển Dụng Gia Sư Tinh Hoa</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Ứng Tuyển Gia Sư VietTutor
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Thu nhập hấp dẫn từ 250,000đ – 450,000đ/giờ. Được đào tạo phương pháp sư phạm hiện đại và cấp nguồn lớp ổn định.
          </p>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-emerald-900 text-xs">
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${step >= 1 ? 'border-emerald-400 bg-emerald-900/60 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px]">1</span>
              <span>Thông tin cá nhân</span>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${step >= 2 ? 'border-emerald-400 bg-emerald-900/60 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px]">2</span>
              <span>Học vấn & Chuyên môn</span>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${step >= 3 ? 'border-emerald-400 bg-emerald-900/60 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px]">3</span>
              <span>Xác nhận & Khảo sát</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-900">Hồ sơ ứng tuyển đã được ghi nhận!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bước tiếp theo: Bạn cần hoàn thành bài thi trắc nghiệm & tự luận chuyên môn tại Phòng thi để được hội đồng thẩm định duyệt.
              </p>
              <div className="pt-3">
                <span className="text-xs text-emerald-800 font-bold animate-pulse">
                  Đang chuyển tới Phòng Khảo Thí...
                </span>
              </div>
            </div>
          ) : (
            <div>
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Bước 1: Thông tin liên hệ & Hồ sơ pháp lý</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên đầy đủ</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại Zalo</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tải ảnh chụp CCCD 2 mặt (Thẩm định lý lịch an toàn)</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-600 transition bg-slate-50 cursor-pointer">
                        <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-700 block">Kéo thả ảnh hoặc bấm để chọn tệp</span>
                        <span className="text-[11px] text-slate-400">Định dạng JPG, PNG hoặc PDF (Tối đa 5MB)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      <span>Tiếp theo: Học vấn</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Bước 2: Trình độ học vấn & Môn đăng ký giảng dạy</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trường Đại học đang học hoặc đã tốt nghiệp</label>
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên ngành</label>
                        <input
                          type="text"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Điểm GPA / Xếp loại</label>
                        <input
                          type="text"
                          value={gpa}
                          onChange={(e) => setGpa(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Các môn bạn tự tin nhận dạy</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Toán Tiểu Học', 'Toán Nâng Cao', 'Tiếng Việt', 'Luyện Viết Chữ', 'Tiếng Anh Cấp 1', 'Cambridge Flyers', 'Toán 6-9', 'STEM / Lập trình'].map((sub) => {
                          const active = selectedSubjects.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleSubject(sub)}
                              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                                active ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {active ? '✓ ' : '+ '} {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      <span>Tiếp theo: Xác nhận</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Bước 3: Xác nhận cam kết & Quy định khảo thí</h2>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-xs text-emerald-950">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Quy trình thẩm định năng lực tại VietTutor:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Gia sư cam kết thông tin bằng cấp là chính xác, chịu trách nhiệm pháp lý nếu gian lận.</li>
                      <li>Sau khi bấm nộp hồ sơ, bạn sẽ được đưa vào Phòng Khảo Thí để thực hiện bài test chuyên môn 45 phút.</li>
                      <li>Điểm đạt tối thiểu: <strong>80/100 điểm</strong> để được mở cổng nhận lớp chính thức.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Ứng viên:</span>
                      <span className="font-bold text-slate-800">{name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Trường:</span>
                      <span className="font-bold text-slate-800">{university}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Môn đăng ký:</span>
                      <span className="font-bold text-slate-800">{selectedSubjects.join(', ')}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteApplication}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Xác nhận & Đi tới Phòng thi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
