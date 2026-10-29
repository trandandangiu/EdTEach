import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TutorExamRoomPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { switchUserRole } = useAuth();

  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Sample Exam Questions
  const questions = [
    {
      id: 1,
      type: 'MULTIPLE_CHOICE',
      question: 'Dạng toán "Tìm hai số khi biết Tổng và Tỉ số của hai số đó" bắt đầu được đưa vào chương trình Toán lớp mấy?',
      options: ['Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 2'],
      correctIndex: 1, // Lớp 4
    },
    {
      id: 2,
      type: 'MULTIPLE_CHOICE',
      question: 'Khi giải bài toán chuyển động đều, nếu hai chuyển động cùng chiều xuất phát cùng một lúc thì công thức tính thời gian gặp nhau là:',
      options: [
        'Thời gian = Khoảng cách ban đầu : (Vận tốc 1 + Vận tốc 2)',
        'Thời gian = Khoảng cách ban đầu : (Vận tốc 1 - Vận tốc 2)',
        'Thời gian = (Vận tốc 1 x Vận tốc 2) : Quãng đường',
        'Thời gian = Khoảng cách ban đầu x Hiệu hai vận tốc',
      ],
      correctIndex: 1,
    },
    {
      id: 3,
      type: 'ESSAY',
      question: 'Nêu các bước sư phạm hướng dẫn học sinh lớp 3 tiếp cận khái niệm "Diện tích một hình" một cách trực quan, tránh việc học vẹt công thức?',
    },
    {
      id: 4,
      type: 'ESSAY',
      question: 'Tình huống: Học sinh làm sai bài tập nhiều lần, tỏ ra nản lòng và muốn bỏ học giữa chừng. Bạn sẽ làm gì trong 10 phút tiếp theo của buổi học?',
    },
  ];

  const [answers, setAnswers] = useState<Record<number, any>>({
    1: 1,
    2: 1,
    3: '1. Sử dụng giấy màu cắt thành các ô vuông đơn vị 1cm².\n2. Cho bé đếm số ô cần xếp để phủ kín hình chữ nhật.\n3. Hướng dẫn nhận xét số hàng x số cột để tự rút ra quy tắc Dài x Rộng.',
    4: 'Tạm dừng bài khó, khen ngợi sự cố gắng của con, kể một câu chuyện ngắn tạo tiếng cười hoặc cho con giải một câu đố vui dễ đạt điểm để lấy lại tự tin trước khi quay lại bài học.',
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: number, optIdx: number) => {
    setAnswers({ ...answers, [qId]: optIdx });
  };

  const handleTextAnswer = (qId: number, text: string) => {
    setAnswers({ ...answers, [qId]: text });
  };

  const handleSubmitExam = () => {
    setSubmitted(true);
    setTimeout(() => {
      // Elevate or route to dashboard
      switchUserRole('TUTOR');
      navigate('/tutor/dashboard');
    }, 2000);
  };

  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Exam Header */}
      <header className="bg-emerald-950 text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-emerald-900 sticky top-0 z-40">
        <div>
          <span className="text-xs font-semibold text-emerald-300">Phòng Khảo Thí Trực Tuyến</span>
          <h1 className="text-sm sm:text-base font-bold text-white">
            Bài Khảo Sát Năng Lực Chuyên Môn Toán Cấp 1 (Đề A)
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-800 font-mono text-sm font-bold text-emerald-100">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleSubmitExam}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
          >
            Nộp bài thi
          </button>
        </div>
      </header>

      {/* Main Exam Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Navigator */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 mb-3">Mục lục câu hỏi ({questions.length})</h3>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCurrent = idx === currentQIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      isCurrent
                        ? 'bg-emerald-800 text-white'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                <span>Câu đang chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 border border-emerald-400" />
                <span>Đã trả lời</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Question Canvas */}
        <div className="md:col-span-3">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h2 className="text-lg font-bold text-slate-900">Đã nộp bài thi thành công!</h2>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động chấm điểm trắc nghiệm (100%) và chuyển phần tự luận sang Hội Đồng Chuyên Môn chấm duyệt trong 2 giờ.
                </p>
                <div className="text-xs text-emerald-700 font-bold animate-pulse pt-2">
                  Đang chuyển tới Bàn làm việc Gia sư...
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Câu hỏi {currentQIndex + 1} / {questions.length} ({currentQ.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Tự luận sư phạm'})
                  </span>
                  <span className="text-xs text-slate-400">Thang điểm: 25 điểm</span>
                </div>

                <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </div>

                {/* Multiple choice options */}
                {currentQ.type === 'MULTIPLE_CHOICE' && currentQ.options && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = answers[currentQ.id] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`p-3.5 rounded-2xl border text-xs font-semibold cursor-pointer transition flex items-center gap-3 ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-300'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Essay textarea */}
                {currentQ.type === 'ESSAY' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Trình bày phương án giải quyết và các bước sư phạm cụ thể:
                    </label>
                    <textarea
                      rows={6}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                      placeholder="Nhập câu trả lời chi tiết của bạn tại đây..."
                      className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:border-emerald-700 focus:outline-hidden leading-relaxed"
                    />
                  </div>
                )}

                {/* Question Next/Prev controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((prev) => prev - 1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-xl flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Câu trước</span>
                  </button>

                  {currentQIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="px-6 py-2.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất & Nộp bài</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
