import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { KidTask } from '../../types/edtech';
import { Star, CheckCircle2, Gamepad2, Award, ArrowRight, Sparkles, Flame } from 'lucide-react';

export default function KidsTodayTasksPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<KidTask[]>([]);
  const [loading, setLoading] = useState(true);

  const profile = currentUser?.kidProfile || {
    name: 'Bảo Nam',
    grade: 'Lớp 4',
    stars: 185,
    gems: 42,
    level: 5,
    streakDays: 7,
  };

  useEffect(() => {
    async function loadKidsTasks() {
      try {
        setLoading(true);
        const res = await api.kids.getTodayTasks();
        if (res.data?.tasks && res.data.tasks.length > 0) {
          setTasks(res.data.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            subject: t.class?.subjectLevel?.subject?.name || 'Toán Học',
            icon: '⚡',
            deadline: 'Hôm nay, 21:00',
            starsReward: t.starsReward || 20,
            completed: t.status === 'SUBMITTED' || t.status === 'REVIEWED',
            type: 'MATH_QUIZ',
            description: t.description || 'Thử thách bài tập của bé.',
            questionCount: 5,
          })));
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('Lỗi tải bài tập của bé:', err);
      } finally {
        setLoading(false);
      }
    }
    loadKidsTasks();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/50 text-slate-800">
      <Navbar />

      {/* Cheerful Kids Banner */}
      <div className="bg-emerald-800 text-white py-8 border-b border-emerald-900 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white text-emerald-900 flex items-center justify-center text-4xl shadow-md border-2 border-emerald-300">
                🦁
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-200">Chào bạn nhỏ dũng cảm!</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Bảo Nam ơi, cùng ôn bài nhé!
                </h1>
                <p className="text-xs text-emerald-100">
                  Cấp độ {profile.level} · Đang duy trì chuỗi học chăm chỉ 7 ngày!
                </p>
              </div>
            </div>

            {/* Star & Streak badges */}
            <div className="flex items-center gap-3">
              <div className="bg-emerald-900/80 border border-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 animate-bounce" />
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase font-bold block">Sao Tích Lũy</span>
                  <span className="text-lg font-black text-white">{profile.stars} ⭐</span>
                </div>
              </div>

              <div className="bg-emerald-900/80 border border-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase font-bold block">Chuỗi Ngày</span>
                  <span className="text-lg font-black text-white">{profile.streakDays} ngày 🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Daily Quests Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Nhiệm vụ hôm nay của con ({tasks.length})</span>
            </h2>
            <p className="text-xs text-slate-500">Hoàn thành bài tập để nhận thêm Sao mở khóa Huy Hiệu Hiệp Sĩ!</p>
          </div>

          <Link
            to="/kids/games"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs"
          >
            <Gamepad2 className="w-4 h-4 text-emerald-700" />
            <span>Khu Trò Chơi Toán & Từ Vựng →</span>
          </Link>
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between shadow-xs ${
                task.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 text-2xl flex items-center justify-center font-bold shadow-inner">
                    {task.icon}
                  </span>
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                    +{task.starsReward} ⭐
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{task.subject}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{task.title}</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Hạn: {task.deadline}</span>

                {task.completed ? (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã xong!</span>
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(`/kids/tasks/${task.id}`)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>Làm bài ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Fun encouragement card */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Thử Thách Tuần Này</span>
            <h3 className="text-xl font-black text-white">Chinh phục 200 Sao để nhận Danh hiệu &quot;Thần Đồng Toán Học&quot;!</h3>
            <p className="text-xs text-emerald-100 max-w-lg">
              Chỉ còn 15 sao nữa thôi là bạn Bảo Nam sẽ mở khóa được cúp vàng tuần thứ 4 liên tiếp!
            </p>
          </div>

          <Link
            to="/kids/trophy"
            className="bg-white text-emerald-950 font-black text-xs px-5 py-3 rounded-2xl shadow-md hover:bg-emerald-50 transition shrink-0 text-center"
          >
            Mở Kho Cúp Thưởng 🏆
          </Link>
        </div>
      </div>
    </div>
  );
}
