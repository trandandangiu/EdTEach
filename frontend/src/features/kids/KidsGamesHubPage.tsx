import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Gamepad2, Play, Star, Trophy, Sparkles } from 'lucide-react';

export default function KidsGamesHubPage() {
  const navigate = useNavigate();

  const games = [
    {
      code: 'math-speed',
      title: 'Đấu Trường Tính Nhanh',
      icon: '🚀',
      category: 'Toán Học Phản Xạ',
      desc: 'Giải nhanh 10 phép tính cộng trừ nhân chia trong 60 giây để ghi điểm cao kỷ lục!',
      starsReward: 15,
      bg: 'bg-emerald-600',
    },
    {
      code: 'word-match',
      title: 'Ghép Thẻ Từ Vựng Tiếng Anh',
      icon: '🧩',
      category: 'Tiếng Anh Cambridge',
      desc: 'Tìm các cặp hình và từ vựng tương ứng (Animals, Colors, School).',
      starsReward: 15,
      bg: 'bg-teal-600',
    },
    {
      code: 'memory-flip',
      title: 'Thử Thách Trí Nhớ Thần Đồng',
      icon: '🧠',
      category: 'Tư Duy & Tập Trung',
      desc: 'Ghi nhớ vị trí các ô số bí mật và lật mở đúng thứ tự tăng dần.',
      starsReward: 20,
      bg: 'bg-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-800 text-white py-8 border-b border-emerald-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-200">Góc Trò Chơi Trí Tuệ</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Vừa Chơi Vừa Học - Rinh Ngay Sao Vàng!
          </h1>
          <p className="text-xs text-emerald-100 mt-1">
            Luyện phản xạ tính nhẩm và vốn từ vựng ngoại ngữ qua các mini-game giáo dục bổ ích.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((g) => (
            <div
              key={g.code}
              className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-14 h-14 rounded-2xl bg-emerald-100 text-3xl flex items-center justify-center shadow-inner">
                    {g.icon}
                  </span>
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                    +{g.starsReward} ⭐
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{g.category}</span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{g.title}</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {g.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/kids/games/${g.code}`)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Chơi ngay bây giờ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
