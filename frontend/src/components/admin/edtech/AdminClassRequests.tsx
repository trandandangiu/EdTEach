import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { 
  Layers, Send, CheckCircle2, UserCheck, Clock, MapPin, Sparkles, Loader2, 
  ArrowRightLeft, AlertTriangle, Check, X, ShieldAlert, Award, Phone, Users
} from 'lucide-react';

interface TutorSuggestion {
  id: string;
  tutorId: string;
  name: string;
  phone: string;
  avatar: string;
  headline: string;
  province: string;
  district: string;
  hourlyRate: number;
  teachingMode: string;
  activeClassesCount: number;
  maxClasses: number;
  matchScore: number;
  matchReasons: string[];
  alreadyOffered: boolean;
}

interface ClassRequestItem {
  id: string;
  code: string;
  studentName: string;
  parentName: string;
  phone: string;
  subject: string;
  grade: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  budgetPerSession: number;
  location: string;
  mode: string;
  status: string;
  requirements: string;
  createdAt: string;
  urgency: string;
  offers: any[];
}

export default function AdminClassRequests() {
  const [requests, setRequests] = useState<ClassRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal gợi ý gia sư thật
  const [activeReqForMatch, setActiveReqForMatch] = useState<ClassRequestItem | null>(null);
  const [suggestions, setSuggestions] = useState<TutorSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
  const [isSendingOffers, setIsSendingOffers] = useState(false);

  // Modal so sánh offer side-by-side
  const [compareOffersReq, setCompareOffersReq] = useState<ClassRequestItem | null>(null);
  const [selectingOfferId, setSelectingOfferId] = useState<string | null>(null);

  // Modal đổi gia sư khẩn cấp (URGENT_REPLACE)
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [replaceForm, setReplaceForm] = useState({
    parentPhone: '',
    studentName: 'Bé Minh',
    subject: 'Toán Lớp 4',
    reason: 'Gia sư cũ bận việc cá nhân đột xuất, cần đổi gấp trong 24h',
    budgetPerSession: 250000,
  });

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

  const openMatchModal = async (req: ClassRequestItem) => {
    setActiveReqForMatch(req);
    setSelectedTutorIds([]);
    try {
      setLoadingSuggestions(true);
      const res = await api.classRequests.getSuggestions(req.id);
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        // Tự động chọn 2-3 gia sư điểm cao nhất chưa được gửi
        const topPicks = res.data.suggestions
          .filter((s: TutorSuggestion) => !s.alreadyOffered)
          .slice(0, 3)
          .map((s: TutorSuggestion) => s.tutorId);
        setSelectedTutorIds(topPicks);
      }
    } catch (err: any) {
      console.error('Lỗi lấy gợi ý gia sư:', err);
      alert(err.message || 'Lỗi lấy danh sách gợi ý gia sư');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendOffers = async () => {
    if (!activeReqForMatch || selectedTutorIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 gia sư');
      return;
    }

    try {
      setIsSendingOffers(true);
      await api.classRequests.sendParallelOffers(activeReqForMatch.id, {
        tutorIds: selectedTutorIds,
        proposedFee: activeReqForMatch.budgetPerSession,
        note: `Lời mời ghép lớp từ Điều phối viên: Môn ${activeReqForMatch.subject}`,
      });
      alert(`Đã gửi lời mời nhận lớp song song tới ${selectedTutorIds.length} gia sư!`);
      setActiveReqForMatch(null);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi offer');
    } finally {
      setIsSendingOffers(false);
    }
  };

  const handleSelectOffer = async (requestId: string, offerId: string) => {
    if (!window.confirm('Chốt lựa chọn gia sư này và khởi tạo lớp học chính thức?')) return;
    try {
      setSelectingOfferId(offerId);
      await api.classRequests.selectOffer(requestId, {
        offerId,
        createClassDirectly: true,
      });
      alert('Đã chốt gia sư thành công và tự động tạo lớp học!');
      setCompareOffersReq(null);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chốt gia sư');
    } finally {
      setSelectingOfferId(null);
    }
  };

  const handleCreateReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.classRequests.createRequest({
        preferredFormat: 'ONE_ON_ONE',
        sessionsPerWeek: 2,
        sessionDurationMin: 90,
        budgetPerSession: Number(replaceForm.budgetPerSession),
        teachingMode: 'OFFLINE',
        preferredSlots: [{ dayOfWeek: 2, slot: 'EVENING' }, { dayOfWeek: 4, slot: 'EVENING' }],
        note: `[ĐỔI GIA SƯ KHẨN CẤP] ${replaceForm.reason}`,
        isReplacement: true,
      });
      alert('Đã tạo phiếu yêu cầu đổi gia sư khẩn cấp vào hàng đợi điều phối!');
      setReplaceModalOpen(false);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo yêu cầu đổi gia sư');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Điều Phối & Ghép Lớp</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Hàng Đợi Ghép Lớp & Bắn Offer Song Song
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thuật toán tính điểm matching theo môn, khu vực, lịch rảnh & gửi offer song song không cần chờ đợi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReplaceModalOpen(true)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-700" />
            <span>+ Đổi Gia Sư Khẩn Cấp</span>
          </button>
          <Link
            to="/admin/matching/classes"
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            Quản lý lớp học & duyệt lớp →
          </Link>
        </div>
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
            const acceptedOffers = (req.offers || []).filter(o => o.status === 'ACCEPTED');
            const hasMultipleAccepted = acceptedOffers.length >= 2;
            const hasSentOffers = (req.offers || []).length > 0;

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
                      req.status === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' :
                      req.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {req.status === 'MATCHED' ? 'Đã ghép lớp thành công' : req.urgency === 'HIGH' ? 'Cần gấp trong 24h' : 'Tiêu chuẩn'}
                    </span>
                    {hasSentOffers && (
                      <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {req.offers.length} Offer đã phát ({acceptedOffers.length} đã nhận)
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{req.subject}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <div>
                      <span className="text-slate-400 block">Học sinh & Phụ huynh:</span>
                      <strong>{req.studentName} ({req.grade})</strong> · {req.parentName}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Thù lao & Thời lượng:</span>
                      <strong className="text-emerald-800">{req.budgetPerSession?.toLocaleString('vi-VN')} đ</strong> / {req.durationMinutes}p
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

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2.5">
                  {hasMultipleAccepted && (
                    <button
                      onClick={() => setCompareOffersReq(req)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>So Sánh {acceptedOffers.length} Gia Sư Nhận Lớp</span>
                    </button>
                  )}

                  {req.status !== 'MATCHED' && (
                    <button
                      onClick={() => openMatchModal(req)}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gợi Ý & Bắn Offer Thật</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Gợi ý gia sư thật từ Matching Service */}
      {activeReqForMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-800" />
                  <span>Thuật Toán Gợi Ý Gia Sư Thông Minh</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Yêu cầu: <strong>{activeReqForMatch.code}</strong> - Môn {activeReqForMatch.subject} ({activeReqForMatch.location})
                </p>
              </div>
              <button
                onClick={() => setActiveReqForMatch(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600">
              Chọn các gia sư để <strong>bắn offer song song</strong> (Gia sư nào phản hồi trước sẽ ưu tiên ghép lớp hoặc so sánh):
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingSuggestions ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="animate-spin text-emerald-800 mx-auto" size={28} />
                  <p className="font-bold">Đang tính toán điểm matching gia sư...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">
                  Không tìm thấy gia sư nào khả dụng cho yêu cầu này.
                </div>
              ) : (
                suggestions.map((tutor) => {
                  const isChecked = selectedTutorIds.includes(tutor.tutorId);
                  return (
                    <div
                      key={tutor.id}
                      onClick={() => {
                        if (tutor.alreadyOffered) return;
                        setSelectedTutorIds(prev => 
                          prev.includes(tutor.tutorId) 
                            ? prev.filter(x => x !== tutor.tutorId) 
                            : [...prev, tutor.tutorId]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        tutor.alreadyOffered ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' :
                        isChecked ? 'bg-emerald-50/90 border-emerald-600 shadow-xs' : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={tutor.alreadyOffered}
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{tutor.name}</span>
                            <span className="font-black text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {tutor.matchScore}% Match
                            </span>
                            {tutor.alreadyOffered && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                Đã gửi trước đó
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {tutor.headline} · {tutor.district || tutor.province} · {tutor.hourlyRate?.toLocaleString('vi-VN')} đ/buổi
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tutor.matchReasons.map((r, i) => (
                              <span key={i} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                ✓ {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Đã chọn: <strong className="text-emerald-800">{selectedTutorIds.length}</strong> gia sư
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReqForMatch(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedTutorIds.length === 0 || isSendingOffers}
                  onClick={handleSendOffers}
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {isSendingOffers ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>Bắn Offer Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: So sánh gia sư đã nhận offer side-by-side */}
      {compareOffersReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>So Sánh Các Gia Sư Đã Chấp Nhận Lời Mời (Side-by-Side)</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Yêu cầu: {compareOffersReq.code} · Học sinh: {compareOffersReq.studentName} ({compareOffersReq.grade})
                </p>
              </div>
              <button
                onClick={() => setCompareOffersReq(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
              {compareOffersReq.offers.filter(o => o.status === 'ACCEPTED').map((offer) => {
                const tutorUser = offer.tutor?.user;
                return (
                  <div key={offer.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{tutorUser?.fullName || 'Gia sư'}</span>
                        <span className="font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          ĐÃ ĐỒNG Ý DẠY
                        </span>
                      </div>

                      <div className="space-y-1.5 text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" />
                          <span>SĐT: <strong>{tutorUser?.phone || '0988 123 456'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <span>Khu vực: <strong>{offer.tutor?.district || offer.tutor?.province || 'Hà Nội'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Award size={13} className="text-slate-400" />
                          <span>Học phí đề xuất: <strong className="text-emerald-800">{Number(offer.proposedPay || compareOffersReq.budgetPerSession).toLocaleString('vi-VN')} đ/buổi</strong></span>
                        </p>
                      </div>

                      {offer.tutorNote && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 italic">
                          " {offer.tutorNote} "
                        </div>
                      )}
                    </div>

                    <button
                      disabled={selectingOfferId === offer.id}
                      onClick={() => handleSelectOffer(compareOffersReq.id, offer.id)}
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                    >
                      {selectingOfferId === offer.id ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      <span>Chọn Gia Sư Này & Khởi Tạo Lớp</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCompareOffersReq(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Đổi gia sư khẩn cấp (URGENT_REPLACE) */}
      {replaceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-slate-900">Tạo Phiếu Đổi Gia Sư Khẩn Cấp</h3>
              </div>
              <button onClick={() => setReplaceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateReplacement} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên học sinh *</label>
                <input
                  type="text"
                  required
                  value={replaceForm.studentName}
                  onChange={(e) => setReplaceForm({ ...replaceForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Môn học cần đổi gia sư *</label>
                <input
                  type="text"
                  required
                  value={replaceForm.subject}
                  onChange={(e) => setReplaceForm({ ...replaceForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do đổi gia sư (Ghi nhận CSKH) *</label>
                <textarea
                  rows={3}
                  required
                  value={replaceForm.reason}
                  onChange={(e) => setReplaceForm({ ...replaceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplaceModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Tạo Yêu Cầu Ưu Tiên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
