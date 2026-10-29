import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { KidTask } from '../../types/edtech';
import { ArrowLeft, Star, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function KidsSubmitTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addKidStars } = useAuth();

  const [task, setTask] = useState<KidTask | null>(null);
  const questions = [
    {
      id: 1,
      question: 'Tổng hai số bằng 45, hiệu bằng 15. Số lớn là?',
      options: ['25', '30', '35', '20'],
      correctIndex: 1,
      explanation: 'Số lớn = (Tổng + Hiệu) : 2 = (45 + 15) : 2 = 30.',
    },
    {
      id: 2,
      question: 'Hai bạn có 24 cái kẹo, Lan nhiều hơn Mai 6 cái. Hỏi Mai có mấy cái kẹo?',
      options: ['9 cái', '12 cái', '15 cái', '8 cái'],
      correctIndex: 0,
      explanation: 'Số kẹo của Mai = (24 - 6) : 2 = 9 cái.',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: optIdx });
  };

  const handleSubmitAll = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });
    setScore(correctCount);
    setSubmitted(true);
    addKidStars(task.starsReward);
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/60 text-slate-800">
      <Navbar />

      {/* Top breadcrumb */}
      <div className="bg-white border-b border-emerald-100 py-3">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-xs font-bold">
          <Link to="/kids" className="text-emerald-800 hover:underline flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách nhiệm vụ</span>
          </Link>
          <span className="text-amber-600 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Phần thưởng: +{task.starsReward} Sao</span>
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-emerald-100 shadow-md space-y-6">
          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 text-4xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
                🎉
              </div>
              <h2 className="text-2xl font-black text-emerald-950">
                Chúc mừng con đã hoàn thành!
              </h2>
              <p className="text-sm text-slate-600">
                Con đã trả lời đúng <strong>{score} / {questions.length}</strong> câu hỏi.
              </p>

              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 font-black px-6 py-3 rounded-2xl text-base shadow-xs">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                <span>Đã nhận +{task.starsReward} Sao thưởng! ⭐</span>
              </div>

              <div className="pt-6 flex justify-center gap-3">
                <button
                  onClick={() => navigate('/kids')}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition"
                >
                  Về danh sách bài tập
                </button>
                <button
                  onClick={() => navigate('/kids/trophy')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition"
                >
                  Xem Kho Cúp Thưởng 🏆
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{task.subject}</span>
                  <h1 className="text-lg font-black text-slate-900 mt-0.5">{task.title}</h1>
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
                  Câu {currentIdx + 1} / {questions.length}
                </span>
              </div>

              {/* Question */}
              <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-base font-bold text-emerald-950 leading-relaxed">
                {currentQ.question}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-2xl border text-sm font-bold text-left transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-600 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-emerald-300 text-slate-800'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        isSelected ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress & Next/Prev */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((p) => p - 1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-xl"
                >
                  Câu trước
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span>Câu tiếp theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAll}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nộp bài & Nhận Sao ⭐</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
