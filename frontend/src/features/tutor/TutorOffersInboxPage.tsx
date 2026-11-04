import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TutorOffer } from '../../types/edtech';
import { Inbox, CheckCircle2, XCircle, Clock, MapPin, DollarSign, AlertCircle } from 'lucide-react';

export default function TutorOffersInboxPage() {
  const [offers, setOffers] = useState<TutorOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.tutors.getMyOffers();
      if (res.data) setOffers(res.data);
    } catch (err) {
      console.error('Lỗi tải lời mời nhận lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleAction = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await api.tutors.respondOffer(id, status);
      setOffers(offers.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error('Lỗi phản hồi lời mời:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold text-emerald-700">VietTutor · Điều Phối Lớp Học</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Hòm Thư Lớp Được Điều Phối Riêng
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Các lớp học được thuật toán Matching & chuyên viên điều phối ghép riêng theo hồ sơ và địa điểm của bạn.
        </p>
      </div>

      <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {offer.id} · Nhận lúc: {offer.createdAt}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{offer.requestTitle}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {offer.status === 'PENDING' && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hạn phản hồi: {offer.deadlineHours} giờ tới</span>
                    </span>
                  )}
                  {offer.status === 'ACCEPTED' && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                      ✓ Đã chấp nhận lớp
                    </span>
                  )}
                  {offer.status === 'DECLINED' && (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                      ✕ Đã từ chối
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 block">Học sinh & Lớp:</span>
                  <strong className="text-slate-900">{offer.studentName} ({offer.grade})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Thù lao:</span>
                  <strong className="text-emerald-800">{offer.ratePerSession.toLocaleString('vi-VN')} đ / buổi</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Hình thức & Địa điểm:</span>
                  <strong className="text-slate-900">{offer.location}</strong>
                </div>
              </div>

              {offer.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleAction(offer.id, 'DECLINED')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Bận / Từ chối
                  </button>
                  <button
                    onClick={() => handleAction(offer.id, 'ACCEPTED')}
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Chấp nhận & Mở phòng học</span>
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
