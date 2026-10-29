import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Star, Timer, RefreshCw, Trophy, Zap } from 'lucide-react';

export default function KidsGamePlayPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { addKidStars } = useAuth();

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Generate simple math question
  const [numA, setNumA] = useState(7);
  const [numB, setNumB] = useState(8);
  const [operator, setOperator] = useState<'+' | '-' | 'x'>('x');
  const [options, setOptions] = useState<number[]>([56, 48, 54, 64]);
  const [streak, setStreak] = useState(0);

  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;
    const op = Math.random() > 0.5 ? 'x' : '+';
    const correct = op === 'x' ? a * b : a + b;

    const fakeOptions = new Set<number>();
    fakeOptions.add(correct);
    while (fakeOptions.size < 4) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
      const val = Math.max(1, correct + delta);
      fakeOptions.add(val);
    }

    setNumA(a);
    setNumB(b);
    setOperator(op as any);
    setOptions(Array.from(fakeOptions).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      addKidStars(Math.max(10, score * 2));
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft, score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setStreak(0);
    setGameOver(false);
    setGameStarted(true);
    generateQuestion();
  };

  const handleAnswer = (choice: number) => {
    const correct = operator === 'x' ? numA * numB : numA + numB;
    if (choice === correct) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      generateQuestion();
    } else {
      setStreak(0);
      generateQuestion();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/70 text-slate-800">
      <Navbar />

      <div className="bg-white border-b border-emerald-100 py-3">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-xs font-bold">
          <Link to="/kids/games" className="text-emerald-800 hover:underline flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát khỏi trò chơi</span>
          </Link>
          <span className="text-emerald-700 font-extrabold uppercase">Đấu Trường Tính Nhanh</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full flex items-center justify-center">
        <div className="w-full bg-white p-6 sm:p-10 rounded-3xl border border-emerald-100 shadow-xl space-y-6 text-center">
          {!gameStarted ? (
            <div className="py-6 space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-800 text-4xl flex items-center justify-center mx-auto shadow-inner">
                🚀
              </div>
              <h2 className="text-2xl font-black text-emerald-950">Đấu Trường Tính Nhanh!</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Giải càng nhiều phép tính càng tốt trong vòng 30 giây. Mỗi câu đúng được <strong>+10 điểm</strong>. Sẵn sàng chưa nào?
              </p>
              <button
                onClick={startGame}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg transition transform hover:scale-105"
              >
                Bắt đầu ngay 🚀
              </button>
            </div>
          ) : gameOver ? (
            <div className="py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 text-4xl flex items-center justify-center mx-auto animate-bounce">
                🏆
              </div>
              <h2 className="text-2xl font-black text-slate-900">Hết giờ rồi!</h2>
              <p className="text-sm text-slate-600">
                Con đã đạt được <strong className="text-emerald-800 text-lg">{score} điểm</strong>!
              </p>

              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 font-black px-6 py-3 rounded-2xl text-base shadow-xs">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>Thưởng +{Math.max(10, Math.floor(score / 5))} Sao vào Kho Cúp! ⭐</span>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Chơi lại ván mới</span>
                </button>
                <button
                  onClick={() => navigate('/kids/trophy')}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Xem Kho Cúp
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Game Stats Header */}
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <Timer className="w-4 h-4 text-emerald-700" />
                  <span>Thời gian: <strong className="text-sm text-rose-600">{timeLeft}s</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Chuỗi: {streak} câu đúng</span>
                </div>
                <div className="text-emerald-800 text-sm font-black">
                  Điểm: {score}
                </div>
              </div>

              {/* Big Math Expression */}
              <div className="py-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center gap-4 text-4xl sm:text-5xl font-black text-slate-900 tracking-wider">
                <span>{numA}</span>
                <span className="text-emerald-700">{operator}</span>
                <span>{numB}</span>
                <span className="text-slate-400">=</span>
                <span className="text-emerald-800">?</span>
              </div>

              {/* 4 Clickable Answer Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className="p-5 rounded-2xl bg-white border-2 border-emerald-100 hover:border-emerald-600 hover:bg-emerald-50 text-2xl font-black text-slate-800 transition transform active:scale-95 shadow-xs"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
