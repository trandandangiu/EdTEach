import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Clock, 
  ArrowRight,
  Upload,
  AlertCircle,
  Mail,
  Lock,
  KeyRound,
  Send,
  Loader2,
  Phone,
  User,
  Sparkles
} from 'lucide-react';

export default function TutorApplyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('Đại học Sư Phạm Hà Nội');
  const [major, setMajor] = useState('Sư phạm Tiểu học');
  const [gpa, setGpa] = useState('3.6/4.0');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Toán Tiểu Học', 'Toán Nâng Cao']);
  const [hourlyExpectation, setHourlyExpectation] = useState(300000);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Email Verification States
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpMsg, setOtpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setOtpMsg({ type: 'error', text: 'Vui lòng nhập đúng địa chỉ Gmail trước khi gửi mã.' });
      return;
    }

    setOtpLoading(true);
    setOtpMsg(null);

    try {
      const res: any = await api.auth.sendEmailOtp(email.trim(), 'TUTOR_APPLY');
      setIsOtpSent(true);
      setCountdown(60);
      const extraHint = res.debugOtp ? ` (Mã kiểm thử: ${res.debugOtp})` : '';
      setOtpMsg({ type: 'success', text: `Đã gửi mã xác nhận 6 số về Gmail "${email}". Vui lòng kiểm tra hộp thư!${extraHint}` });
    } catch (err: any) {
      setOtpMsg({ type: 'error', text: err?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ 6 chữ số mã xác nhận.' });
      return;
    }

    setOtpLoading(true);
    setOtpMsg(null);

    try {
      await api.auth.verifyEmailOtp(email.trim(), otpCode.trim());
      setIsOtpVerified(true);
      setOtpMsg({ type: 'success', text: 'Xác thực Gmail thành công!' });
    } catch (err: any) {
      setOtpMsg({ type: 'error', text: err?.message || 'Mã xác nhận không đúng hoặc đã hết hạn.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleCompleteApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isOtpVerified) {
      setErrorMsg('Vui lòng xác thực mã gửi về Gmail ở Bước 1 trước khi gửi hồ sơ.');
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const username = email.trim().toLowerCase();
      // Đăng ký tài khoản ứng viên
      const regRes: any = await api.auth.registerApplicant({
        username,
        password: password || 'password123',
        fullName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        school: university,
        major,
        degree: 'Đại học / Cao đẳng',
        experienceYears: 1,
        teachingMode: 'BOTH',
      });

      // Tạo đơn ứng tuyển chi tiết
      await api.tutors.apply({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        school: university,
        major,
        gpa,
        expectedRate: hourlyExpectation,
        subjects: selectedSubjects,
      });

      // Tự động đăng nhập
      try {
        await login(username, password || 'password123');
      } catch {
        // ignore
      }

      setSubmitted(true);
      setTimeout(() => {
        navigate('/apply/tests');
      }, 1500);
    } catch (err: any) {
      console.warn('Registration/Apply error:', err);
      // Fallback nếu tài khoản đã tồn tại -> vẫn ghi nhận apply
      try {
        await api.tutors.apply({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          school: university,
          major,
          gpa,
          expectedRate: hourlyExpectation,
          subjects: selectedSubjects,
        });
        setSubmitted(true);
        setTimeout(() => {
          navigate('/apply/tests');
        }, 1500);
      } catch (applyErr: any) {
        setErrorMsg(applyErr?.message || err?.message || 'Không thể hoàn thành đơn ứng tuyển. Vui lòng kiểm tra lại thông tin.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-10 border-b border-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Tuyển Dụng Gia Sư Tinh Hoa & Sư Phạm
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Đăng Ký Làm Gia Sư VietTutor
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Thu nhập hấp dẫn từ 250,000đ – 450,000đ/giờ. Được đào tạo phương pháp sư phạm hiện đại, xác thực uy tín và cấp nguồn lớp ổn định.
          </p>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-emerald-900 text-xs">
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${step >= 1 ? 'border-emerald-400 bg-emerald-900/60 text-white font-bold' : 'border-emerald-900 text-emerald-300'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px]">1</span>
              <span>Thông tin & Xác thực Gmail</span>
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
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-900">Hồ sơ ứng tuyển gia sư đã được gửi thành công!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tài khoản của bạn đã được kích hoạt. Bạn đang được chuyển tiếp tới phòng thi khảo sát năng lực đầu vào.
              </p>
              <div className="pt-3">
                <span className="text-xs text-emerald-800 font-bold animate-pulse">
                  Đang chuyển tới Phòng Khảo Thí...
                </span>
              </div>
            </div>
          ) : (
            <div>
              {/* BƯỚC 1: THÔNG TIN & XÁC THỰC GMAIL */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Bước 1: Thông tin liên hệ & Xác thực Gmail bảo mật</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên đầy đủ *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Trần Thị Thu Trang"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại Zalo *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0971 888 234"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu tài khoản gia sư *</label>
                        <input
                          type="password"
                          required
                          placeholder="Tối thiểu 6 ký tự"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* KHỐI XÁC THỰC GMAIL BẰNG OTP */}
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-emerald-950">
                          Địa chỉ Gmail nhận thông báo & Mã xác nhận OTP *
                        </label>
                        {isOtpVerified && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã xác thực Gmail
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="email"
                            required
                            disabled={isOtpVerified}
                            placeholder="giasu@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white disabled:bg-slate-100"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>

                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || countdown > 0 || isOtpVerified}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1.5"
                        >
                          {otpLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {countdown > 0 ? `Gửi lại (${countdown}s)` : isOtpSent ? 'Gửi lại mã' : 'Gửi mã về Gmail'}
                          </span>
                        </button>
                      </div>

                      {/* Ô nhập mã OTP */}
                      {isOtpSent && !isOtpVerified && (
                        <div className="pt-2 flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Nhập 6 số mã xác nhận từ Gmail..."
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="w-full text-xs font-mono font-bold tracking-widest text-center px-3 py-2.5 pl-9 border border-emerald-300 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                            />
                            <KeyRound className="w-4 h-4 text-emerald-700 absolute left-3 top-3" />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otpCode.trim().length !== 6}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition shrink-0"
                          >
                            Xác nhận mã
                          </button>
                        </div>
                      )}

                      {otpMsg && (
                        <p className={`text-[11px] font-medium ${otpMsg.type === 'error' ? 'text-rose-600' : 'text-emerald-800'}`}>
                          {otpMsg.text}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tải ảnh chụp Thẻ sinh viên hoặc Bằng cấp Sư phạm (Tùy chọn)</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-600 transition bg-slate-50 cursor-pointer">
                        <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-700 block">Kéo thả ảnh bằng cấp/thẻ SV hoặc bấm chọn tệp</span>
                        <span className="text-[11px] text-slate-400">Định dạng JPG, PNG hoặc PDF (Tối đa 5MB)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Đã có tài khoản?{' '}
                      <Link to="/login" className="font-bold text-emerald-800 hover:underline">
                        Đăng nhập ngay
                      </Link>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (!name.trim() || !phone.trim()) {
                          setErrorMsg('Vui lòng điền họ tên và số điện thoại.');
                          return;
                        }
                        if (!isOtpVerified) {
                          setErrorMsg('Vui lòng nhấn "Gửi mã về Gmail" và nhập mã xác thực trước khi sang bước tiếp theo.');
                          return;
                        }
                        setErrorMsg('');
                        setStep(2);
                      }}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      <span>Tiếp theo: Học vấn</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: HỌC VẤN & MÔN DẠY */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Bước 2: Trình độ học vấn & Môn đăng ký giảng dạy</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trường Đại học đang học hoặc đã tốt nghiệp *</label>
                      <input
                        type="text"
                        required
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên ngành *</label>
                        <input
                          type="text"
                          required
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Điểm GPA / Xếp loại học lực</label>
                        <input
                          type="text"
                          value={gpa}
                          onChange={(e) => setGpa(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Các môn bạn tự tin nhận dạy kèm</label>
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mức thù lao mong muốn (VNĐ / Buổi)</label>
                      <input
                        type="number"
                        step={10000}
                        value={hourlyExpectation}
                        onChange={(e) => setHourlyExpectation(Number(e.target.value))}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      <span>Tiếp theo: Cam kết & Nộp đơn</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 3: XÁC NHẬN & NỘP ĐƠN */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Bước 3: Cam kết chất lượng & Hoàn tất đơn ứng tuyển</h2>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
                    <div className="font-bold">Quy trình thẩm định 3 bước bắt buộc tại VietTutor:</div>
                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                      <li>Bước 1: Nộp đơn & Xác thực Gmail thành công (Đang thực hiện).</li>
                      <li>Bước 2: Hoàn thành bài kiểm tra Sư phạm & Nghiệp vụ môn học trực tuyến.</li>
                      <li>Bước 3: Phỏng vấn chuyên môn trực tuyến với Ban Học thuật để nhận lớp.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div>Ứng viên: <strong>{name}</strong></div>
                    <div>Gmail: <strong>{email}</strong> (Đã xác thực)</div>
                    <div>Số điện thoại: <strong>{phone}</strong></div>
                    <div>Trường: <strong>{university}</strong> - Chuyên ngành: <strong>{major}</strong></div>
                    <div>Môn đăng ký: <strong>{selectedSubjects.join(', ')}</strong></div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteApplication}
                      disabled={loading}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi hồ sơ...</span>
                        </>
                      ) : (
                        <>
                          <span>Xác nhận & Vào phòng khảo thí</span>
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
