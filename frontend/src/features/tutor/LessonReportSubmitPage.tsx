import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle2, Star, Sparkles, Send } from 'lucide-react';

export default function LessonReportSubmitPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { addKidStars } = useAuth();

  const [studentName, setStudentName] = useState('Bé Bảo Nam (Lớp 4)');
  const [topic, setTopic] = useState('Ôn tập bài toán Tìm hai số khi biết Tổng và Tỉ số & Rèn tính nhanh');
  const [attendance, setAttendance] = useState<'PRESENT' | 'ABSENT' | 'LATE'>('PRESENT');
  const [comprehensionScore, setComprehensionScore] = useState(9);
  const [focusScore, setFocusScore] = useState(8.5);
  const [homeworkScore, setHomeworkScore] = useState(9);
  const [teacherFeedback, setTeacherFeedback] = useState('Bảo Nam hôm nay làm bài rất tốt, hào hứng tương tác. Con tính nhẩm dạng tỉ số nhanh hơn tuần trước.');
  const [nextSteps, setNextSteps] = useState('Buổi tới sẽ chuyển sang dạng toán chuyển động đều và vẽ sơ đồ.');
  const [homeworkAssigned, setHomeworkAssigned] = useState('Hoàn thành Thử Thách Toán Sấm Sét 5 câu trên ứng dụng Góc Học Sinh.');
  const [starsAwarded, setStarsAwarded] = useState(15);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addKidStars(starsAwarded);
    setIsSuccess(true);
    setTimeout(() => {
      navigate('/tutor/classes');
    }, 1500);
  };

  return (
    <div className="space-y-6">

      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs">
          <Link to="/tutor/classes" className="text-emerald-800 hover:underline flex items-center gap-1.5 font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại lớp học</span>
          </Link>
          <span className="text-slate-400">Buổi dạy: {lessonId || 'les-15'}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Báo Cáo Tiến Độ Sau Buổi Học</span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Nhập Đánh Giá Buổi Dạy Cho Phụ Huynh
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Báo cáo này sẽ được gửi trực tiếp tới điện thoại của phụ huynh và cộng điểm sao vào tài khoản của bé.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-900">Báo cáo đã gửi thành công!</h2>
              <p className="text-xs text-slate-500">
                Đã cộng <strong>+{starsAwarded} Sao ⭐</strong> vào Góc Học Sinh của bé và thông báo tới phụ huynh.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Học sinh</label>
                  <input
                    type="text"
                    readOnly
                    value={studentName}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm danh buổi học</label>
                  <select
                    value={attendance}
                    onChange={(e: any) => setAttendance(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:border-emerald-700 focus:outline-hidden"
                  >
                    <option value="PRESENT">Đúng giờ & Đầy đủ</option>
                    <option value="LATE">Vào lớp muộn</option>
                    <option value="ABSENT">Vắng có phép</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề & Nội dung trọng tâm bài học hôm nay</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              {/* 3 Key metric scores slider */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">Tiếp thu bài:</span>
                    <span className="font-black text-emerald-800">{comprehensionScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={comprehensionScore}
                    onChange={(e) => setComprehensionScore(Number(e.target.value))}
                    className="w-full accent-emerald-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">Độ tập trung:</span>
                    <span className="font-black text-emerald-800">{focusScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={focusScore}
                    onChange={(e) => setFocusScore(Number(e.target.value))}
                    className="w-full accent-emerald-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">Bài tập về nhà:</span>
                    <span className="font-black text-emerald-800">{homeworkScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={homeworkScore}
                    onChange={(e) => setHomeworkScore(Number(e.target.value))}
                    className="w-full accent-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét chi tiết của gia sư cho phụ huynh</label>
                <textarea
                  rows={3}
                  required
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bài tập giao về nhà cho bé</label>
                  <textarea
                    rows={2}
                    value={homeworkAssigned}
                    onChange={(e) => setHomeworkAssigned(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Định hướng buổi học kế tiếp</label>
                  <textarea
                    rows={2}
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Award Stars to Kids */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Thưởng Sao Động Viên Cho Bé</span>
                    <span className="text-[11px] text-slate-600">Bé sẽ nhận được sao này trong Kho Cúp trên ứng dụng.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {[10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStarsAwarded(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        starsAwarded === num ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      +{num} ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/tutor/classes')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo ngay</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
