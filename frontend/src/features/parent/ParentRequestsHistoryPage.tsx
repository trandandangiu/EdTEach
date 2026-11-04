import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ClassRequest } from '../../types/edtech';
import { Plus, Clock, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';

export default function ParentRequestsHistoryPage() {
  const [requests, setRequests] = useState<ClassRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const res = await api.classRequests.getRequests();
        if (res.data) setRequests(res.data);
      } catch (err) {
        console.error('Lỗi tải yêu cầu tìm gia sư:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700">VietTutor · Phụ Huynh Quản Lý</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Lịch Sử Yêu Cầu Tìm Gia Sư ({requests.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạng thái tìm kiếm, tiếp nhận ứng tuyển và xác nhận gia sư do trung tâm điều phối.
          </p>
        </div>

        <Link
          to="/parent/requests/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo yêu cầu mới</span>
        </Link>
      </div>

      <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    {req.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{req.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'OPEN' && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                      Đang tuyển gia sư
                    </span>
                  )}
                  {req.status === 'MATCHING' && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                      Đang thẩm định hồ sơ ứng viên
                    </span>
                  )}
                  {req.status === 'ASSIGNED' && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                      ✓ Đã khớp gia sư thành công
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 block">Học sinh & Lớp:</span>
                  <strong className="text-slate-900">{req.studentName} ({req.grade})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Thời lượng & Mức phí:</span>
                  <strong className="text-emerald-800">{req.budgetPerSession.toLocaleString('vi-VN')} đ / {req.durationMinutes}p</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Địa điểm & Hình thức:</span>
                  <strong className="text-slate-900">{req.location}</strong>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <strong>Yêu cầu đặc biệt:</strong> {req.requirements}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
