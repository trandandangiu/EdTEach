import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Upload,
  AlertCircle,
  Mail,
  Phone,
  User,
  Sparkles,
  DollarSign,
  BookOpen,
  Home,
  Check,
  FileCheck,
  MapPin,
  Clock
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

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

  const [step, setStep] = useState(1);

  // Bước 1: Thông tin liên lạc & Ảnh thẻ (Không cần username, password)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(''); // Khu vực sinh sống
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Bước 2: Học vấn, môn dạy, thù lao, thời gian dạy & khu vực nhận dạy
  const [university, setUniversity] = useState('Đại học Sư Phạm');
  const [major, setMajor] = useState('Sư phạm');
  const [gpa, setGpa] = useState('3.5/4.0');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Toán Tiểu Học', 'Tiếng Việt']);
  const [customSubjects, setCustomSubjects] = useState('');
  const [hourlyExpectation, setHourlyExpectation] = useState<number>(250000);
  const [teachingTime, setTeachingTime] = useState('Các buổi tối trong tuần (18h30 - 20h30) & Cuối tuần');
  const [preferredArea, setPreferredArea] = useState('');

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

  // Bước 1: Validation
  const handleNextStep1 = () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên đầy đủ của gia sư.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại liên lạc.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Gmail hợp lệ để nhận bài thi khảo sát chuyên môn.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Vui lòng nhập khu vực sinh sống hiện tại.');
      return;
    }

    setStep(2);
  };

  // Bước 2: Validation
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
    if (!teachingTime.trim()) {
      setErrorMsg('Vui lòng nhập thời gian rảnh có thể dạy.');
      return;
    }
    setStep(3);
  };

  // Hoàn tất nộp đơn ở Bước 3
  const handleCompleteApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await api.tutors.apply({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        teachingTime: teachingTime.trim(),
        avatarUrl: avatarPreview || undefined,
        school: university,
        major,
        gpa,
        expectedRate: hourlyExpectation,
        subjects: selectedSubjects,
        customSubjects: customSubjects.trim(),
        province: preferredArea.trim() || location.trim(),
      });

      setSubmitted(true);

      // Tự động chuyển hướng về trang chủ sau 5 giây theo yêu cầu
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err: any) {
      console.error('Registration/Apply error:', err);
      setErrorMsg(err?.message || 'Không thể hoàn thành đơn ứng tuyển. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900 antialiased">
      <Navbar />

      {/* Hero Header Banner */}
      <section className="relative overflow-hidden bg-white border-b border-ink-200 py-10 lg:py-14">
        <div className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3.5 py-1 text-xs font-semibold text-brand-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Tuyển dụng gia sư tiêu chuẩn sư phạm VietTutor
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
            Đăng Ký Hồ Sơ{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Ứng Tuyển Gia Sư
            </span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-500 max-w-xl leading-relaxed">
            Điền hồ sơ thông tin và chuyên môn giảng dạy. Ban Tuyển Dụng sẽ tiếp nhận, gửi đề khảo sát và tự động cấp tài khoản khi hồ sơ được duyệt.
          </p>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-ink-100 text-xs">
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              step >= 1 ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold' : 'border-ink-200 text-ink-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 1 ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-600'
              }`}>
                1
              </span>
              <span className="hidden sm:inline">1. Thông tin cá nhân</span>
              <span className="sm:hidden">1. Thông tin</span>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              step >= 2 ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold' : 'border-ink-200 text-ink-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 2 ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-600'
              }`}>
                2
              </span>
              <span className="hidden sm:inline">2. Môn dạy & Thù lao</span>
              <span className="sm:hidden">2. Chuyên môn</span>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              step >= 3 ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold' : 'border-ink-200 text-ink-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === 3 ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-600'
              }`}>
                3
              </span>
              <span className="hidden sm:inline">3. Xác nhận hồ sơ</span>
              <span className="sm:hidden">3. Xác nhận</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 flex-1 w-full">
        <Card variant="static" padding="lg" className="shadow-lg shadow-ink-200/50">
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-danger-600 text-xs rounded-2xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            /* Submission Success Screen */
            <div className="py-10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-3xl font-semibold border border-brand-200 shadow-xs">
                ✓
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
                Hồ sơ ứng tuyển gia sư đã được gửi thành công!
              </h2>
              <p className="text-xs text-ink-500">
                Hệ thống sẽ tự động chuyển hướng về trang chủ sau vài giây...
              </p>

              <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 text-left text-xs text-ink-700 space-y-3">
                <div className="font-semibold text-ink-900 text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-600" />
                  Quy trình tiếp theo dành cho bạn:
                </div>
                <ul className="space-y-2 list-disc list-inside text-ink-600 leading-relaxed">
                  <li>
                    <strong>Bước 1 (Đã hoàn tất):</strong> Ban Tuyển Dụng VietTutor đang tiếp nhận hồ sơ của bạn.
                  </li>
                  <li>
                    <strong>Bước 2 (Khảo sát chuyên môn):</strong> Quản trị viên sẽ gửi thông báo và <strong>đề thi chuyên môn (file Word/Excel)</strong> trực tiếp tới Gmail <strong>{email}</strong>.
                  </li>
                  <li>
                    <strong>Bước 3 (Duyệt & Cấp tài khoản):</strong> Sau khi nộp bài khảo sát và đạt thẩm định, hệ thống sẽ <strong>tự động cấp tài khoản gia sư chính thức</strong> gắn liền với hồ sơ này để bạn bắt đầu nhận lớp.
                  </li>
                </ul>
                <div className="text-[11px] text-brand-800 font-medium bg-brand-50 p-3 rounded-xl border border-brand-100">
                  💡 <em>Lưu ý:</em> Vui lòng theo dõi hộp thư đến (và thư mục Spam) của Gmail <strong>{email}</strong> để nhận hướng dẫn và đề thi.
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <Button variant="primary" size="md" onClick={() => navigate('/')}>
                  <Home className="w-4 h-4" />
                  <span>Quay về trang chủ ngay</span>
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* STEP 1: Personal Info & Photo (Không cần username, password) */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-ink-900">
                      Bước 1: Thông tin liên lạc & Ảnh thẻ gia sư
                    </h2>
                    <p className="text-xs text-ink-500 mt-1">
                      Cung cấp họ tên đầy đủ, số điện thoại, Gmail chính xác và khu vực sinh sống. Tài khoản đăng nhập sẽ được cấp tự động sau khi duyệt hồ sơ.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Họ tên */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                        Họ và tên đầy đủ gia sư *
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Thị Mai Linh"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* SĐT */}
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                        Số điện thoại liên lạc *
                      </label>
                      <Input
                        type="tel"
                        required
                        placeholder="VD: 0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    {/* Gmail */}
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                        Địa chỉ Gmail (nhận đề thi chuyên môn) *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="VD: mailinh.edu@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {/* Khu vực sinh sống */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-ink-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        <span>Khu vực sinh sống hiện tại *</span>
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="VD: Quận Cầu Giấy, Hà Nội hoặc Quận 10, TP. Hồ Chí Minh"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <span className="text-[11px] text-ink-400 mt-1 block">
                        Khu vực này giúp hệ thống ghép nối các lớp học gia sư gần nơi bạn sinh sống nhất.
                      </span>
                    </div>
                  </div>

                  {/* Upload Ảnh thẻ 3x4 */}
                  <div className="pt-4 border-t border-ink-100">
                    <label className="block text-xs font-semibold text-ink-700 mb-2">
                      Ảnh thẻ chân dung 3x4 (Khuyến khích trang phục lịch sự, phông nền sáng)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-24 h-32 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center shrink-0">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Ảnh thẻ preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] text-ink-400 text-center px-2">Ảnh 3x4</span>
                        )}
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="avatar-file-input"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <label
                          htmlFor="avatar-file-input"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-800 text-xs font-semibold rounded-xl cursor-pointer transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải ảnh từ máy tính</span>
                        </label>
                        <p className="text-[11px] text-ink-400">
                          Hỗ trợ JPG, PNG (tối đa 5MB). Ảnh thẻ sẽ hiển thị trên hồ sơ gia sư uy tín gửi tới phụ huynh.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-ink-100 flex justify-end">
                    <Button type="button" variant="primary" onClick={handleNextStep1}>
                      <span>Tiếp tục: Môn dạy & Thù lao</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Academic, Subjects, Expected Rate, Teaching Time & Preferred Area */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-ink-900">
                      Bước 2: Môn nhận dạy kèm, Thù lao & Thời gian dạy
                    </h2>
                    <p className="text-xs text-ink-500 mt-1">
                      Chọn các môn bạn có thể giảng dạy, thiết lập mức thù lao mong muốn và khung thời gian rảnh.
                    </p>
                  </div>

                  {/* Học vấn */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Trường ĐH / Cao đẳng</label>
                      <Input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="Đại học Sư phạm..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Chuyên ngành đào tạo</label>
                      <Input
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Sư phạm Toán, Ngoại ngữ..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Điểm GPA / Học lực</label>
                      <Input
                        type="text"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="3.5/4.0 hoặc Giỏi..."
                      />
                    </div>
                  </div>

                  {/* Danh mục Môn học */}
                  <div className="space-y-4 pt-2">
                    <label className="block text-xs font-semibold text-ink-900">
                      Chọn các môn bạn nhận dạy kèm: *
                    </label>

                    <div className="space-y-4">
                      {subjectCategories.map((group, idx) => (
                        <div key={idx} className="bg-ink-50/70 p-4 rounded-2xl border border-ink-200/80 space-y-2.5">
                          <span className="text-xs font-semibold text-brand-900 block">{group.category}</span>
                          <div className="flex flex-wrap gap-2">
                            {group.subjects.map((sub, sIdx) => {
                              const active = selectedSubjects.includes(sub);
                              return (
                                <button
                                  type="button"
                                  key={sIdx}
                                  onClick={() => toggleSubject(sub)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                                    active
                                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs font-semibold'
                                      : 'bg-white text-ink-700 border-ink-200 hover:border-ink-300'
                                  }`}
                                >
                                  {active && <Check className="w-3 h-3 stroke-[3]" />}
                                  <span>{sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ô nhập môn tự do */}
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">
                        Môn hoặc kỹ năng khác muốn dạy (nhập tự do):
                      </label>
                      <Input
                        type="text"
                        placeholder="VD: Cờ vua nâng cao, Luyện thi HSG Tỉnh, Tiếng Trung HSK3..."
                        value={customSubjects}
                        onChange={(e) => setCustomSubjects(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Thù lao mong muốn & Thời gian dạy (Bên cạnh nhau) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-ink-100">
                    {/* Ô Thù lao */}
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center justify-between">
                        <span>Mức thù lao mong muốn *</span>
                        <span className="text-brand-700 font-bold">{formatVND(hourlyExpectation)}</span>
                      </label>
                      <Input
                        type="number"
                        step={10000}
                        min={50000}
                        value={hourlyExpectation}
                        onChange={(e) => setHourlyExpectation(Number(e.target.value))}
                        placeholder="250000"
                      />
                      <span className="text-[11px] text-ink-400 mt-1 block">
                        Đơn vị: VNĐ / buổi (1 buổi kéo dài 90 - 120 phút).
                      </span>
                    </div>

                    {/* Ô Thời gian dạy */}
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                        <span>Thời gian có thể dạy *</span>
                      </label>
                      <Input
                        type="text"
                        required
                        value={teachingTime}
                        onChange={(e) => setTeachingTime(e.target.value)}
                        placeholder="VD: Tối 2-4-6 (18h-20h), Thứ 7 & CN"
                      />
                      <span className="text-[11px] text-ink-400 mt-1 block">
                        Khung giờ hoặc các buổi bạn có thể nhận dạy kèm.
                      </span>
                    </div>
                  </div>

                  {/* Khu vực nhận dạy thêm (nếu có ưu tiên) */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>Khu vực ưu tiên nhận lớp dạy kèm:</span>
                    </label>
                    <Input
                      type="text"
                      value={preferredArea}
                      onChange={(e) => setPreferredArea(e.target.value)}
                      placeholder={`Mặc định: ${location || 'Toàn thành phố / Dạy Online'}`}
                    />
                  </div>

                  <div className="pt-4 border-t border-ink-100 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Quay lại Bước 1
                    </Button>
                    <Button type="button" variant="primary" onClick={handleNextStep2}>
                      <span>Tiếp tục: Xác nhận hồ sơ</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Confirm & Submit */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-ink-900">
                      Bước 3: Xác nhận toàn bộ thông tin đăng ký
                    </h2>
                    <p className="text-xs text-ink-500 mt-1">
                      Kiểm tra lại hồ sơ trước khi nộp. Sau khi nộp đơn, bạn đợi thông báo đạt để bước tiếp tới chức năng thi trực tuyến; không cần nhảy qua cổng test ngay.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-6 bg-ink-50 rounded-2xl border border-ink-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-ink-200/60">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Ảnh thẻ"
                          className="w-20 h-24 object-cover rounded-xl border border-ink-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-24 bg-ink-200 text-ink-400 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0">
                          Chưa có ảnh
                        </div>
                      )}
                      <div className="space-y-1 text-center sm:text-left flex-1">
                        <div className="text-base font-semibold text-ink-900">{name}</div>
                        <div className="text-xs text-ink-500 flex items-center gap-1.5 justify-center sm:justify-start">
                          <MapPin className="w-3.5 h-3.5 text-brand-600" />
                          <span>Khu vực sinh sống: <strong>{location}</strong></span>
                        </div>
                        <div className="text-xs text-ink-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 justify-center sm:justify-start">
                          <span>📧 Gmail: <strong>{email}</strong></span>
                          <span>📞 SĐT: <strong>{phone}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3.5 rounded-xl border border-ink-200">
                        <span className="text-ink-400 block text-[11px]">Trường & Chuyên ngành:</span>
                        <span className="font-semibold text-ink-900">{university}</span>
                        <span className="text-ink-500 block mt-0.5">{major} (GPA: {gpa})</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-ink-200">
                        <span className="text-ink-400 block text-[11px]">Thù lao mong muốn:</span>
                        <span className="font-semibold text-brand-700 text-sm block">
                          {formatVND(hourlyExpectation)}
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-ink-200">
                        <span className="text-ink-400 block text-[11px]">Thời gian rảnh dạy:</span>
                        <span className="font-semibold text-ink-900 text-xs block leading-tight">
                          {teachingTime}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-ink-200 text-xs space-y-2">
                      <span className="text-ink-400 block text-[11px]">Môn đăng ký giảng dạy:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSubjects.map((sub, i) => (
                          <span
                            key={i}
                            className="bg-brand-50 text-brand-900 border border-brand-100 font-medium px-2.5 py-1 rounded-lg text-xs"
                          >
                            ✓ {sub}
                          </span>
                        ))}
                      </div>
                      {customSubjects && (
                        <div className="pt-2 border-t border-ink-100 text-ink-700">
                          <span className="font-semibold text-ink-900">Môn tự nhập: </span>
                          <span className="italic">{customSubjects}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs text-brand-950 space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5 text-brand-900">
                      <CheckCircle2 className="w-4 h-4 text-brand-600" />
                      Quy trình tiếp nhận & cấp tài khoản:
                    </div>
                    <p className="text-ink-600 text-xs leading-relaxed">
                      Sau khi bấm <strong>"Xác nhận nộp đơn"</strong>, hồ sơ sẽ chuyển về cho Admin. Bạn không cần làm bài kiểm tra ngay. Khi hồ sơ được duyệt và chuyển sang khảo sát chuyên môn, bạn sẽ nhận được email đề thi (file Word/Excel). Sau khi chấm thi đạt và phỏng vấn, Admin sẽ tự động cấp tài khoản đăng nhập gắn liền với hồ sơ của bạn.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-ink-100 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Quay lại Bước 2
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleCompleteApplication}
                      disabled={loading}
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
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
}
