import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { KidTask } from '../../types/edtech';
import { Plus, CheckCircle2, Clock, Award, Trash2 } from 'lucide-react';

export default function TutorTasksManagerPage() {
  const [tasks, setTasks] = useState<KidTask[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán Học');
  const [desc, setDesc] = useState('');
  const [stars, setStars] = useState(20);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await api.kids.getTodayTasks();
        if (res.data?.tasks) {
          setTasks(res.data.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            subject: t.class?.subjectLevel?.subject?.name || 'Toán Học',
            icon: '⚡',
            deadline: 'Cuối tuần này',
            starsReward: t.starsReward || 20,
            completed: t.status === 'SUBMITTED' || t.status === 'REVIEWED',
            type: 'MATH_QUIZ',
            description: t.description || 'Nhiệm vụ rèn luyện.',
            questionCount: 5,
          })));
        }
      } catch (err) {
        console.error('Lỗi tải bài tập:', err);
      }
    }
    loadTasks();
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: KidTask = {
      id: `task-${Date.now()}`,
      title,
      subject,
      icon: subject === 'Toán Học' ? '⚡' : subject === 'Tiếng Anh' ? '🦁' : '📖',
      deadline: 'Cuối tuần này',
      starsReward: stars,
      completed: false,
      type: 'MATH_QUIZ',
      description: desc || 'Nhiệm vụ rèn luyện do gia sư thiết kế.',
      questionCount: 5,
    };

    setTasks([newTask, ...tasks]);
    setModalOpen(false);
    setTitle('');
    setDesc('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-8 border-b border-emerald-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-300">Bàn Làm Việc Gia Sư</span>
              <h1 className="text-2xl font-black text-white mt-1">
                Quản Lý Nhiệm Vụ & Bài Tập Về Nhà Cho Bé
              </h1>
              <p className="text-xs text-emerald-200 mt-1">
                Các bài tập được giao tại đây sẽ xuất hiện sinh động trong &quot;Góc Học Của Bé&quot; kèm điểm sao thưởng.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Giao nhiệm vụ mới cho bé</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-2xl flex items-center justify-center shrink-0 border border-emerald-100">
                  {task.icon}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-emerald-800">{task.subject}</span>
                    <span>·</span>
                    <span>Hạn nộp: {task.deadline}</span>
                    <span>·</span>
                    <span className="font-bold text-amber-600">Thưởng: +{task.starsReward} ⭐</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                  <p className="text-xs text-slate-600">{task.description}</p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                {task.completed ? (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bé đã hoàn thành</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Bé đang làm</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal create task */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Giao nhiệm vụ ôn tập cho bé</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                >
                  <option value="Toán Học">Toán Học (Toán đố, Tính nhanh)</option>
                  <option value="Tiếng Anh">Tiếng Anh (Từ vựng, Ngữ pháp)</option>
                  <option value="Tiếng Việt">Tiếng Việt & Tập đọc</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên nhiệm vụ / Thử thách</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thử thách giải 5 bài toán chia phân số..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lời nhắn khích lệ bé</label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Giúp chú Sóc Nâu nhặt 5 hạt dẻ bằng cách giải đúng 5 câu nhé Bảo Nam!"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số sao thưởng khi hoàn thành</label>
                <div className="flex gap-2">
                  {[10, 15, 20, 30].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition ${
                        stars === s ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      +{s} ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Giao bài ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
