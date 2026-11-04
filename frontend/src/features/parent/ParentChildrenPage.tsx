import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, Award, Star, Gamepad2, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

export default function ParentChildrenPage() {
  const navigate = useNavigate();
  const { switchUserRole } = useAuth();

  const [children, setChildren] = useState([
    {
      id: 'kid-01',
      name: 'Bảo Nam',
      grade: 'Lớp 4',
      school: 'Tiểu học Archimedes Academy',
      avatar: '🦁',
      stars: 185,
      streakDays: 7,
      classes: ['Toán Nâng Cao Lớp 4 (Thầy Hoàng Nam)'],
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('Lớp 1');

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    setChildren([
      ...children,
      {
        id: `kid-${Date.now()}`,
        name: newChildName,
        grade: newChildGrade,
        school: 'Tiểu học Đoàn Thị Điểm',
        avatar: '🐼',
        stars: 20,
        streakDays: 1,
        classes: [],
      },
    ]);
    setModalOpen(false);
    setNewChildName('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700">VietTutor · Phụ Huynh Quản Lý</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Hồ Sơ Học Tập Của Con
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến trình học tập, thông tin khối lớp và trường học của các con.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm hồ sơ con</span>
        </button>
      </div>

      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-3xl font-black shrink-0 border border-emerald-200">
                    {child.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{child.name}</h3>
                    <p className="text-xs text-slate-500">{child.grade} · {child.school}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-black text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{child.stars} Sao</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Chuỗi {child.streakDays} ngày 🔥</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900 block">Lớp học hiện tại:</span>
                {child.classes.length > 0 ? (
                  child.classes.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span>{c}</span>
                      <span className="text-[10px] font-bold text-emerald-800">Đang học</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-center">
                    Chưa đăng ký lớp học nào.
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    switchUserRole('STUDENT');
                    navigate('/kids');
                  }}
                  className="px-4 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-4 h-4 text-emerald-300" />
                  <span>Bật Góc Học Của {child.name}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Thêm hồ sơ con</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên thường gọi của bé</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Linh Chi, Minh Khôi..."
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp hiện tại</label>
                <select
                  value={newChildGrade}
                  onChange={(e) => setNewChildGrade(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                >
                  <option value="Tiền Tiểu Học">Tiền Tiểu Học (5-6 tuổi)</option>
                  <option value="Lớp 1">Lớp 1</option>
                  <option value="Lớp 2">Lớp 2</option>
                  <option value="Lớp 3">Lớp 3</option>
                  <option value="Lớp 4">Lớp 4</option>
                  <option value="Lớp 5">Lớp 5</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
