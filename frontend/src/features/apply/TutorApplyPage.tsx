import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Upload,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  User,
  Sparkles,
  DollarSign,
  BookOpen,
  Home,
  Check,
  FileCheck
} from 'lucide-react';

const subjectCategories = [
  {
    category: '1. Bậc Tiểu học (Lớp 1 - 5)',
    subjects: ['Toán Tiểu Học', 'Toán Tư Duy Lớp 1-5', 'Tiếng Việt', 'Luyện Viết Chữ Đẹp', 'Tiếng Anh Tiểu Học', 'Hành Trang Vào Lớp 1']
  },
  {
    category: '2. Bậc THCS (Lớp 6 - 9)',
    subjects: ['Toán 6-9', 'Ngữ Văn THCS', 'Tiếng Anh THCS', 'Vật Lý 6-9', 'Hóa Học 8-9', 'Khoa Học Tự Nhiên', 'Luyện Thi Vào Lớp 10']
  },
  {
    category: '3. Bậc THPT & Ôn thi đại học',
    subjects: ['Toán THPT', 'Ngữ Văn THPT', 'Tiếng Anh 10-12', 'Vật Lý THPT', 'Hóa Học THPT', 'Sinh Học THPT', 'Luyện Thi ĐGNL / ĐH']
  },
  {
    category: '4. Ngoại ngữ & Kỹ năng đặc thù',
    subjects: ['Tiếng Anh Giao Tiếp', 'IELTS / TOEIC', 'Cambridge (Starters/Movers/Flyers)', 'Toán Olympic Kangaroo/Timo', 'Lập trình Trẻ em / STEM']
  }
];

export default function TutorApplyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);

  // Bước 1: Tài khoản & Thông tin gia sư
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Bước 2: Học vấn, môn dạy & thù lao
  const [university, setUniversity] = useState('Đại học Sư Phạm');
  const [major, setMajor] = useState('Sư phạm');
  const [gpa, setGpa] = useState('3.5/4.0');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Toán Tiểu Học', 'Tiếng Việt']);
  const [customSubjects, setCustomSubjects] = useState('');
  const [hourlyExpectation, setHourlyExpectation] = useState<number>(250000);

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý upload ảnh thẻ 3x4
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Ảnh thẻ không được vượt quá 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const formatVND = (num: number) => {
    return Number(num || 0).toLocaleString('vi-VN') + ' đ/buổi';
  };

  // Bước 1 Validation
  const handleNextStep1 = () => {
    setErrorMsg('');
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên đầy đủ.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }
    setStep(2);
  };

  // Bước 2 Validation
  const handleNextStep2 = () => {
    setErrorMsg('');
    if (selectedSubjects.length === 0 && !customSubjects.trim()) {
      setErrorMsg('Vui lòng chọn hoặc tự nhập ít nhất một môn nhận dạy.');
      return;
    }
    if (!hourlyExpectation || hourlyExpectation < 50000) {
      setErrorMsg('Vui lòng nhập mức thù lao hợp lệ (tối thiểu 50.000 đ/buổi).');
      return;
    }
    setStep(3);
  };

  // Hoàn tất nộp đơn ở Bước 3
  const handleCompleteApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const finalUsername = username.trim().toLowerCase();

    try {
      // 1. Tạo tài khoản ứng viên (hoặc update nếu đã có)
      try {
        await api.auth.registerApplicant({
          username: finalUsername,
          password: password.trim(),
          fullName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          avatarUrl: avatarPreview || undefined,
          school: university,
          major,
          degree: 'Đại học / Cao đẳng',
          experienceYears: 1,
          teachingMode: 'BOTH',
        });
      } catch (regErr: any) {
        console.log('Applicant register notice:', regErr?.message);
      }

      // 2. Gửi đơn ứng tuyển chính thức
      await api.tutors.apply({
        username: finalUsername,
        password: password.trim(),
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUrl: avatarPreview || undefined,
        school: university,
        major,
        gpa,
        expectedRate: hourlyExpectation,
        subjects: selectedSubjects,
        customSubjects: customSubjects.trim(),
      });

      // 3. Tự động đăng nhập
      try {
        await login(finalUsername, password.trim());
      } catch {
        // ignore
      }

      // 4. Hiển thị thông báo thành công (KHÔNG TỰ NHẢY SANG CỔNG TEST)
      setSubmitted(true);
    } catch (err: any) {
      console.error('Registration/Apply error:', err);
      setErrorMsg(err?.message || 'Không thể hoàn thành đơn ứng tuyển. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-emerald-950 text-white py-10 border-b border-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Gia Nhập Đội Ngũ Gia Sư Chuyên Nghiệp VietTutor
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Đăng Ký Hồ Sơ Ứng Tuyển Gia Sư
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Kết nối cùng hàng nghìn học sinh & phụ huynh tin cậy với mức thù lao xứng đáng
          </p>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-emerald-900 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${step >= 1 ? 'border-emerald-400 bg-emerald-900/70 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step > 1 ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-700 text-white'}`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span>1. Thông tin cá nhân & Ảnh thẻ</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${step >= 2 ? 'border-emerald-400 bg-emerald-900/70 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step > 2 ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-700 text-white'}`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span>2. Chuyên môn & Thù lao</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${step >= 3 ? 'border-emerald-400 bg-emerald-900/70 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] text-white">3</span>
              <span>3. Xác nhận & Chờ duyệt</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            /* MÀN HÌNH SAU KHI NỘP: THÔNG BÁO CHỜ DUYỆT ĐỂ BƯỚC TIẾP TỚI THI */
            <div className="py-10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold shadow-inner">
                ✓
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Hồ sơ ứng tuyển gia sư đã được gửi thành công!
              </h2>
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-left text-xs text-slate-700 space-y-3">
                <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  Quy trình tiếp theo dành cho gia sư:
                </div>
                <ul className="space-y-2 list-disc list-inside text-slate-600 leading-relaxed">
                  <li>
                    <strong>Bước 1 (Đã hoàn tất):</strong> Ban Tuyển Dụng VietTutor đang tiếp nhận và thẩm định hồ sơ của bạn.
                  </li>
                  <li>
                    <strong>Bước 2 (Khảo sát chuyên môn):</strong> Khi hồ sơ đạt yêu cầu sơ loại, Admin sẽ tự động gửi email thông báo và <strong>đề thi chuyên môn (dạng file Word hoặc Excel)</strong> tới địa chỉ Gmail <strong>{email}</strong> của bạn.
                  </li>
                  <li>
                    <strong>Bước 3 (Làm bài & Phỏng vấn):</strong> Bạn tải đề thi từ email về làm bài, sau đó tải bài làm lên hệ thống để Admin kiểm tra và xếp lịch phỏng vấn trước khi nhận lớp.
                  </li>
                </ul>
                <div className="text-[11px] text-emerald-800 font-medium bg-emerald-100/60 p-2.5 rounded-xl">
                  💡 <em>Lưu ý:</em> Vui lòng thường xuyên kiểm tra hộp thư đến (và mục Thư rác/Spam) của Gmail <strong>{email}</strong> để không bỏ lỡ thông báo thi từ trung tâm.
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Home className="w-4 h-4" />
                  <span>Về trang chủ</span>
                </Link>
                <Link
                  to="/tutor/dashboard"
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Vào cổng Gia Sư</span>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* ======================================================== */}
              {/* BƯỚC 1: TÊN ĐĂNG NHẬP, MẬT KHẨU, HỌ TÊN, SĐT, GMAIL & ẢNH THẺ */}
              {/* ======================================================== */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Bước 1: Tài khoản, Thông tin liên hệ & Ảnh thẻ 3x4
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Điền chính xác các thông tin định danh để tạo tài khoản gia sư (không yêu cầu OTP xác nhận).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Cột Upload ảnh thẻ 3x4 */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Ảnh thẻ gia sư (3x4) *
                      </label>
                      <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl p-4 text-center bg-emerald-50/30 flex flex-col items-center justify-center transition min-h-[220px]">
                        {avatarPreview ? (
                          <div className="relative group w-32 h-40 rounded-xl overflow-hidden shadow-md border border-slate-200 bg-white">
                            <img
                              src={avatarPreview}
                              alt="Ảnh thẻ 3x4"
                              className="w-full h-full object-cover"
                            />
                            <label
                              htmlFor="photo-upload"
                              className="absolute inset-0 bg-black/50 text-white text-[11px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              Đổi ảnh khác
                            </label>
                          </div>
                        ) : (
                          <label
                            htmlFor="photo-upload"
                            className="cursor-pointer flex flex-col items-center justify-center w-full h-full py-4"
                          >
                            <div className="w-14 h-18 border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center bg-white text-emerald-700 mb-2">
                              <Upload className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-emerald-900">Chọn ảnh thẻ 3x4</span>
                            <span className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG (tối đa 5MB)</span>
                          </label>
                        )}
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-center">
                        Ảnh thẻ nghiêm túc, nhìn rõ mặt để in vào hồ sơ tuyển dụng
                      </span>
                    </div>

                    {/* Cột các trường nhập thông tin */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Tên đăng nhập & Mật khẩu */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Tên đăng nhập *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: giasutrang99"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                            />
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Mật khẩu tài khoản *
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required
                              placeholder="Tối thiểu 6 ký tự"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                        </div>
                      </div>

                      {/* Họ tên đầy đủ */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Họ và tên đầy đủ của gia sư *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Trần Thị Thu Trang"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden font-medium"
                        />
                      </div>

                      {/* Số điện thoại & Gmail */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Số điện thoại liên hệ *
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              placeholder="0987 654 321"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                            />
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Địa chỉ Gmail (nhận đề thi) *
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              placeholder="giasu@gmail.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                            />
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Đề thi Word/Excel sẽ được gửi trực tiếp tới hòm thư này.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Đã có tài khoản gia sư?{' '}
                      <Link to="/login" className="font-bold text-emerald-800 hover:underline">
                        Đăng nhập ngay
                      </Link>
                    </span>

                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <span>Tiếp tục: Môn dạy & Thù lao</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* BƯỚC 2: HỌC VẤN, MÔN DẠY (CÁC CATEGORY + Ô NHẬP TEXT) & THÙ LAO VNĐ */}
              {/* ======================================================== */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Bước 2: Các môn nhận dạy kèm & Mức thù lao mong muốn
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chọn các môn theo danh mục, nhập thêm môn nếu cần, và đề xuất thù lao dạy kèm.
                    </p>
                  </div>

                  {/* Học vấn cơ bản */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Trường Đại học *
                      </label>
                      <input
                        type="text"
                        required
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chuyên ngành *
                      </label>
                      <input
                        type="text"
                        required
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Điểm GPA / Học lực
                      </label>
                      <input
                        type="text"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>

                  {/* CÁC MÔN NHẬN DẠY THEO CATEGORY */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-800">
                      Chọn các môn nhận dạy kèm theo nhóm:
                    </label>

                    <div className="space-y-3">
                      {subjectCategories.map((cat, idx) => (
                        <div key={idx} className="p-3.5 border border-slate-200 rounded-2xl bg-white space-y-2">
                          <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                            {cat.category}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {cat.subjects.map((sub) => {
                              const active = selectedSubjects.includes(sub);
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => toggleSubject(sub)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border flex items-center gap-1.5 ${
                                    active
                                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {active ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  ) : (
                                    <span className="text-slate-400">+</span>
                                  )}
                                  <span>{sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ô NHẬP TEXT TỰ DO CHO MÔN KHÁC */}
                    <div className="p-3.5 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 space-y-1.5">
                      <label className="block text-xs font-bold text-emerald-950">
                        Ô nhập text: Môn hoặc kỹ năng đặc thù khác (nếu có)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Luyện chữ đẹp, Bồi dưỡng học sinh giỏi Toán cấp huyện, Toán song ngữ Singapore..."
                        value={customSubjects}
                        onChange={(e) => setCustomSubjects(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-emerald-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                      />
                      <span className="text-[10px] text-slate-500">
                        Bạn có thể gõ thêm các môn học, cấp lớp hoặc chứng chỉ chuyên sâu mà danh mục trên chưa liệt kê.
                      </span>
                    </div>
                  </div>

                  {/* MỨC THÙ LAO MONG MUỐN THỂ HIỆN DẠNG VNĐ 000,000 */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Mức thù lao mong muốn (VNĐ / buổi dạy) *
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Đề xuất mức học phí cho 1 buổi dạy kèm (khoảng 90 - 120 phút).
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-xl">
                          {formatVND(hourlyExpectation)}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step={10000}
                        min={50000}
                        max={2000000}
                        value={hourlyExpectation}
                        onChange={(e) => setHourlyExpectation(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold px-3.5 py-2.5 pl-9 border border-slate-300 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                      />
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 self-center">Gợi ý nhanh:</span>
                      {[150000, 200000, 250000, 300000, 400000, 500000].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setHourlyExpectation(rate)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                            hourlyExpectation === rate
                              ? 'border-emerald-700 bg-emerald-800 text-white font-bold'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {rate.toLocaleString('vi-VN')} đ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                    >
                      Quay lại Bước 1
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <span>Tiếp tục: Xác nhận hồ sơ</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* BƯỚC 3: XÁC NHẬN THÔNG TIN & NỘP ĐƠN (CHỜ ADMIN DUYỆT THI) */}
              {/* ======================================================== */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Bước 3: Xác nhận toàn bộ thông tin đăng ký
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kiểm tra lại hồ sơ trước khi nộp. Sau khi nộp, hồ sơ sẽ được Admin thẩm định và gửi đề thi khảo sát chuyên môn qua Gmail.
                    </p>
                  </div>

                  {/* THẺ TỔNG HỢP HỒ SƠ CHI TIẾT */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-200">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Ảnh thẻ"
                          className="w-20 h-24 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-24 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">
                          Chưa có ảnh
                        </div>
                      )}
                      <div className="space-y-1 text-center sm:text-left flex-1">
                        <div className="text-base font-extrabold text-slate-900">{name}</div>
                        <div className="text-xs text-slate-500">
                          Tên đăng nhập: <strong className="text-slate-700">{username}</strong>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 justify-center sm:justify-start">
                          <span>📧 Gmail: <strong>{email}</strong></span>
                          <span>📞 SĐT: <strong>{phone}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">Trường & Chuyên ngành</span>
                        <span className="font-bold text-slate-800">{university}</span>
                        <span className="text-slate-600 block mt-0.5">{major} (GPA: {gpa})</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">Mức thù lao mong muốn</span>
                        <span className="font-extrabold text-emerald-800 text-sm block">
                          {formatVND(hourlyExpectation)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <span className="text-slate-400 block text-[11px]">Các môn nhận dạy kèm:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSubjects.map((sub, i) => (
                          <span
                            key={i}
                            className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium px-2 py-0.5 rounded-lg text-[11px]"
                          >
                            ✓ {sub}
                          </span>
                        ))}
                      </div>
                      {customSubjects && (
                        <div className="pt-1.5 border-t border-slate-100 text-slate-700">
                          <span className="font-semibold text-slate-900">Môn tự nhập: </span>
                          <span className="italic">{customSubjects}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông báo cam kết & quy trình tiếp theo */}
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Quy trình tiếp nhận & khảo sát chuyên môn:
                    </div>
                    <p className="text-emerald-900/90 leading-relaxed text-[11px]">
                      Sau khi bạn bấm <strong>"Xác nhận nộp đơn ứng tuyển"</strong>, thông tin sẽ được gửi đến Ban Tuyển Dụng. Bạn không cần phải thi ngay bây giờ. Bộ phận tuyển dụng sẽ gửi đề thi khảo sát (file Word/Excel) và hướng dẫn làm bài vào hộp thư Gmail <strong>{email}</strong> của bạn khi hồ sơ sơ loại đạt yêu cầu.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                    >
                      Quay lại Bước 2
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteApplication}
                      disabled={loading}
                      className="px-7 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang gửi hồ sơ...</span>
                        </>
                      ) : (
                        <>
                          <span>Xác nhận nộp đơn ứng tuyển</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
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
