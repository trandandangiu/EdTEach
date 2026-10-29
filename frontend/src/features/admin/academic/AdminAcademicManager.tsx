import React, { useState } from 'react';
import { BookOpen, Plus, FileText, CheckCircle2, Search } from 'lucide-react';

export default function AdminAcademicManager() {
  const [examSets, setExamSets] = useState([
    { id: 'ex-01', code: 'TEST-TOAN-4A', title: 'Khảo Sát Năng Lực Toán Tiểu Học & Sư Phạm (Đề A)', questionsCount: 15, duration: 45, passScore: 80, active: true },
    { id: 'ex-02', code: 'TEST-TOAN-5B', title: 'Toán Tư Duy & Giải Toán Bằng Sơ Đồ Đoạn Thẳng (Đề B)', questionsCount: 20, duration: 60, passScore: 85, active: true },
    { id: 'ex-03', code: 'TEST-ENG-C1', title: 'Năng Lực Giảng Dạy Tiếng Anh Tiểu Học & TESOL', questionsCount: 25, duration: 45, passScore: 80, active: true },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setExamSets([
      ...examSets,
      {
        id: `ex-${Date.now()}`,
        code: newCode || 'TEST-NEW',
        title: newTitle,
        questionsCount: 15,
        duration: 45,
        passScore: 80,
        active: true,
      },
    ]);
    setModalOpen(false);
    setNewTitle('');
    setNewCode('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Học Thuật & Khảo Thí</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Ngân Hàng Đề Khảo Sát & Chuẩn Đầu Vào Gia Sư
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập câu hỏi trắc nghiệm, bài tập tình huống sư phạm và thang điểm chuẩn hóa.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo đề khảo sát mới</span>
        </button>
      </div>

      <div className="space-y-4">
        {examSets.map((ex) => (
          <div
            key={ex.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                  {ex.code}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Thời lượng: {ex.duration} phút · {ex.questionsCount} câu hỏi
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{ex.title}</h3>
              <p className="text-xs text-slate-500">
                Tiêu chuẩn đạt: Tối thiểu <strong>{ex.passScore}/100 điểm</strong> để được ban tuyển dụng duyệt hồ sơ.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Đang áp dụng
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Tạo đề thi khảo sát gia sư mới</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã đề thi</label>
                <input
                  type="text"
                  required
                  placeholder="TEST-TOAN-TIEUHOC"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bộ đề</label>
                <input
                  type="text"
                  required
                  placeholder="Khảo Sát Năng Lực Toán..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 text-white rounded-xl shadow-xs"
                >
                  Tạo đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
