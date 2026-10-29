import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Star, Award, Shield, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export default function KidsTrophyPage() {
  const { currentUser } = useAuth();
  const profile = currentUser?.kidProfile || {
    name: 'Bảo Nam',
    grade: 'Lớp 4',
    stars: 185,
    gems: 42,
    level: 5,
    streakDays: 7,
  };

  const trophies = [
    {
      id: 't-1',
      title: 'Hiệp Sĩ Toán Đố',
      icon: '⚡',
      desc: 'Giải đúng liên tiếp 10 câu đố tìm hai số.',
      unlocked: true,
      unlockedAt: '25/10/2026',
    },
    {
      id: 't-2',
      title: 'Chiến Binh 7 Ngày Bất Bại',
      icon: '🔥',
      desc: 'Hoàn thành bài tập về nhà 7 ngày liên tiếp không ngắt quãng.',
      unlocked: true,
      unlockedAt: 'Hôm qua',
    },
    {
      id: 't-3',
      title: 'Thần Tốc Bảng Cửu Chương',
      icon: '🚀',
      desc: 'Đạt trên 100 điểm tại Đấu Trường Tính Nhanh.',
      unlocked: true,
      unlockedAt: 'Hôm nay',
    },
    {
      id: 't-4',
      title: 'Bậc Thầy Cambridge Flyers',
      icon: '🦁',
      desc: 'Chinh phục trọn vẹn 50 thẻ từ vựng Tiếng Anh.',
      unlocked: false,
      starsNeeded: 220,
    },
    {
      id: 't-5',
      title: 'Đại Sứ Chăm Chỉ Vàng',
      icon: '👑',
      desc: 'Đạt mốc 300 Sao tích lũy từ các buổi học của thầy cô.',
      unlocked: false,
      starsNeeded: 300,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/60 text-slate-800">
      <Navbar />

      <div className="bg-emerald-800 text-white py-10 border-b border-emerald-900 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-400 text-emerald-950 text-3xl flex items-center justify-center mx-auto shadow-lg font-black animate-bounce">
            🏆
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Kho Cúp & Huy Hiệu Của {profile.name}!
          </h1>
          <p className="text-xs text-emerald-100 max-w-md mx-auto">
            Mỗi bài tập giải đúng và mỗi buổi học chăm chỉ đều được tích lũy vào đây.
          </p>

          <div className="inline-flex items-center gap-3 bg-emerald-900/80 border border-emerald-600 px-6 py-2.5 rounded-2xl text-base font-black text-amber-300">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>Tổng số sao hiện tại: {profile.stars} ⭐</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <span>Huy hiệu đã đạt được</span>
          </h2>
          <Link to="/kids" className="text-xs font-bold text-emerald-800 hover:underline">
            ← Quay lại làm thêm nhiệm vụ
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {trophies.map((t) => (
            <div
              key={t.id}
              className={`rounded-3xl p-6 border transition flex flex-col justify-between space-y-4 ${
                t.unlocked
                  ? 'bg-white border-emerald-200 shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-14 h-14 rounded-2xl bg-emerald-50 text-3xl flex items-center justify-center shadow-inner border border-emerald-100">
                    {t.icon}
                  </span>
                  {t.unlocked ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã đạt</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Cần {t.starsNeeded} ⭐</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{t.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                {t.unlocked ? `Mở khóa: ${t.unlockedAt}` : `Còn thiếu ${t.starsNeeded! - profile.stars} Sao nữa`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
