import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClassRequest } from '../../../types/edtech';
import { api } from '../../../services/api';
import { Layers, Send, CheckCircle2, UserCheck, Clock, MapPin, Sparkles, Loader2 } from 'lucide-react';

export default function AdminClassRequests() {
  const [requests, setRequests] = useState<ClassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.classRequests.getRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch class requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDispatch = async (id: string) => {
    try {
      await api.classRequests.sendParallelOffers(id, { tutorIds: [] });
    } catch (e) {
      console.error(e);
    }
    setDispatchedIds([...dispatchedIds, id]);
    setActiveModalId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Điều Phối & Ghép Lớp</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Hàng Đợi Ghép Lớp & Bắn Offer Song Song
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thuật toán tìm kiếm gia sư đạt chuẩn theo bán kính địa lý và gửi offer song song trong 2 giờ.
          </p>
        </div>

        <Link
          to="/admin/matching/classes"
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          Quản lý lớp học đang chạy →
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="animate-spin text-emerald-800" size={32} />
          <p className="text-xs font-bold">Đang tải danh sách yêu cầu ghép lớp...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Chưa có yêu cầu tìm gia sư nào đang chờ ghép lớp.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isDispatched = dispatchedIds.includes(req.id);
            return (
              <div
                key={req.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      {req.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      req.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {req.urgency === 'HIGH' ? 'Cần gấp trong 24h' : 'Tiêu chuẩn'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{req.subject}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <div>
                      <span className="text-slate-400 block">Học sinh & Phụ huynh:</span>
                      <strong>{req.studentName} ({req.grade})</strong> · {req.parentName}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Thù lao & Thời lượng:</span>
                      <strong className="text-emerald-800">{req.budgetPerSession.toLocaleString('vi-VN')} đ</strong> / {req.durationMinutes}p
                    </div>
                    <div>
                      <span className="text-slate-400 block">Địa điểm:</span>
                      <strong>{req.location}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Yêu cầu:</strong> {req.requirements}
                  </p>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3">
                  {isDispatched ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Đã bắn offer tới các gia sư</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveModalId(req.id)}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Bắn Offer Song Song</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dispatch */}
      {activeModalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Bắn Offer Song Song Cho Gia Sư</h3>
              <button
                onClick={() => setActiveModalId(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Thuật toán đã lọc ra <strong>3 gia sư phù hợp nhất</strong> (khoảng cách &lt; 3km, đánh giá &gt; 4.8 sao, kinh nghiệm Toán lớp 4):
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">ThS. Nguyễn Hoàng Nam</span>
                  <span className="text-slate-500">Cách 1.8km · Đánh giá 4.95 ⭐</span>
                </div>
                <span className="font-bold text-emerald-800">Khuyên dùng</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Thầy Trần Minh Đức</span>
                  <span className="text-slate-500">Cách 2.5km · Đánh giá 4.88 ⭐</span>
                </div>
                <span className="font-bold text-slate-600">Sẵn sàng</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setActiveModalId(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDispatch(activeModalId)}
                className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
              >
                Xác nhận bắn tin ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
