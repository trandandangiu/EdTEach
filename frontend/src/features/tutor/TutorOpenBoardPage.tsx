import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { ClassRequest } from '../../types/edtech';
import { MapPin, Clock, DollarSign, Send, CheckCircle2, Search, Filter } from 'lucide-react';

export default function TutorOpenBoardPage() {
  const [requests, setRequests] = useState<ClassRequest[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBoard() {
      try {
        setLoading(true);
        const res = await api.classRequests.getRequests({ onBoard: true });
        if (res.data) setRequests(res.data);
      } catch (err) {
        console.error('Lỗi tải bảng lớp mở:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBoard();
  }, []);

  const handleApply = (id: string) => {
    setAppliedIds([...appliedIds, id]);
  };

  const filtered = requests.filter(r => {
    if (filterSubject !== 'ALL' && !r.subject.toLowerCase().includes(filterSubject.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-8 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300">Bàn Làm Việc Gia Sư</span>
          <h1 className="text-2xl font-black text-white mt-1">
            Bảng Lớp Mở Tuyển Dụng ({filtered.length} lớp mới)
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Danh sách yêu cầu tìm gia sư mới nhất từ phụ huynh. Bấm ứng tuyển để ban điều phối sắp xếp lịch gặp phụ huynh.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Lọc môn học:</span>
            <div className="flex items-center gap-1">
              {['ALL', 'Toán', 'Tiếng Anh', 'Tiểu Học'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSubject(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    filterSubject === s ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'ALL' ? 'Tất cả' : s}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Cập nhật thời gian thực</span>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((req) => {
            const hasApplied = appliedIds.includes(req.id);
            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 transition shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      {req.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${req.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {req.urgency === 'HIGH' ? 'Cần gấp' : 'Tiêu chuẩn'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{req.subject}</h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Học sinh: <strong className="text-slate-800">{req.studentName}</strong> ({req.grade})</div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.sessionsPerWeek} buổi / tuần ({req.durationMinutes} phút / buổi)</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <strong>Yêu cầu:</strong> {req.requirements}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Thù lao gia sư</span>
                    <span className="text-sm font-black text-emerald-800">
                      {req.budgetPerSession.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-[10px] text-slate-400"> / buổi</span>
                  </div>

                  {hasApplied ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã ứng tuyển</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(req.id)}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Nhận lớp này</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
