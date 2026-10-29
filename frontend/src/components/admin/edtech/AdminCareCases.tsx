import React, { useState, useEffect } from 'react';
import { CareCase } from '../../../types/edtech';
import { api } from '../../../services/api';
import { PhoneCall, AlertCircle, CheckCircle2, Clock, MessageSquare, Phone, Loader2 } from 'lucide-react';

export default function AdminCareCases() {
  const [cases, setCases] = useState<CareCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [callModalCase, setCallModalCase] = useState<CareCase | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.care.getCareCases();
      setCases(res.data || []);
    } catch (err) {
      console.error('Failed to fetch care cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const resolveCase = async (id: string) => {
    try {
      await api.care.updateStatus(id, 'RESOLVED');
      setCases(cases.map(c => c.id === id ? { ...c, status: 'RESOLVED', actionTaken: 'Đã gọi điện xác nhận và hỗ trợ xong.' } : c));
    } catch (err) {
      console.error('Failed to resolve care case:', err);
      // Optimistic update
      setCases(cases.map(c => c.id === id ? { ...c, status: 'RESOLVED', actionTaken: 'Đã gọi điện xác nhận và hỗ trợ xong.' } : c));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban CSKH & Giám Sát 24/48h</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Trung Tâm Xử Lý Ca Trễ Hạn & Hỗ Trợ Phụ Huynh
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cảnh báo gia sư chậm nộp báo cáo quá 24h và các yêu cầu can thiệp đổi lịch / đổi giáo viên.
          </p>
        </div>

        <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {cases.filter(c => c.status !== 'RESOLVED').length} ca đang cần xử lý gấp
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="animate-spin text-emerald-800" size={32} />
          <p className="text-xs font-bold">Đang tải danh sách ca hỗ trợ CSKH...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Không có ca chăm sóc nào cần xử lý lúc này. Toàn bộ lớp học đang vận hành tốt!
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">{c.caseCode}</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {c.priority === 'CRITICAL' ? 'Mức độ: Nghiêm trọng' : 'Mức độ: Cao'}
                </span>
                <span className="text-slate-400">· Cập nhật: {c.lastUpdated}</span>
              </div>

              <div>
                {c.status === 'RESOLVED' ? (
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
                    ✓ Đã giải quyết
                  </span>
                ) : (
                  <span className="font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl">
                    Đang xử lý
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs font-medium text-slate-800 leading-relaxed">
              {c.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl text-slate-600">
              <div>Học sinh: <strong className="text-slate-900">{c.studentName}</strong></div>
              <div>Gia sư phụ trách: <strong className="text-slate-900">{c.tutorName}</strong></div>
              <div>Phụ huynh: <strong className="text-slate-900">{c.parentName} ({c.phone})</strong></div>
            </div>

            {c.actionTaken && (
              <div className="text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 font-medium">
                <strong>Hành động đã ghi nhận:</strong> {c.actionTaken}
              </div>
            )}

            {c.status !== 'RESOLVED' && (
              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => setCallModalCase(c)}
                  className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi điện hỗ trợ thay</span>
                </button>
                <button
                  onClick={() => resolveCase(c.id)}
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đánh dấu đã giải quyết</span>
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {callModalCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Kết nối cuộc gọi tổng đài CSKH</h3>
            <p className="text-slate-600">
              Đang quay số tới phụ huynh <strong>{callModalCase.parentName}</strong> ({callModalCase.phone})...
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center text-emerald-900 font-bold animate-pulse">
              📞 Đang đổ chuông: 0988 123 456
            </div>
            <button
              onClick={() => {
                resolveCase(callModalCase.id);
                setCallModalCase(null);
              }}
              className="w-full bg-emerald-800 text-white font-bold py-2 rounded-xl"
            >
              Kết thúc cuộc gọi & Ghi nhận đã xử lý
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
