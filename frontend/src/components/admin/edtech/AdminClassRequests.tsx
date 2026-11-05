import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { 
  Layers, Send, CheckCircle2, UserCheck, Clock, MapPin, Sparkles, Loader2, 
  ArrowRightLeft, AlertTriangle, Check, X, ShieldAlert, Award, Phone, Users,
  Trash2, Search, Filter, CheckCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { PageHeader } from '../../ui/PageHeader';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'OFFERING' | 'MATCHED'>('ALL');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal gợi ý gia sư thật (Parallel Offers)
  const [activeReqForMatch, setActiveReqForMatch] = useState<ClassRequestItem | null>(null);
  const [suggestions, setSuggestions] = useState<TutorSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
  const [isSendingOffers, setIsSendingOffers] = useState(false);

  // Modal Duyệt Ghép Lớp Trực Tiếp (Direct Match)
  const [directMatchReq, setDirectMatchReq] = useState<ClassRequestItem | null>(null);
  const [directTutors, setDirectTutors] = useState<any[]>([]);
  const [loadingDirectTutors, setLoadingDirectTutors] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [negotiatedFee, setNegotiatedFee] = useState<number>(200000);
  const [customClassTitle, setCustomClassTitle] = useState('');
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

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

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

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

  // Mở modal gợi ý gia sư thông minh (Gửi offer song song)
  const openMatchModal = async (req: ClassRequestItem) => {
    setActiveReqForMatch(req);
    setSelectedTutorIds([]);
    try {
      setLoadingSuggestions(true);
      const res = await api.classRequests.getSuggestions(req.id);
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        const topPicks = res.data.suggestions
          .filter((s: TutorSuggestion) => !s.alreadyOffered)
          .slice(0, 3)
          .map((s: TutorSuggestion) => s.tutorId);
        setSelectedTutorIds(topPicks);
      }
    } catch (err: any) {
      console.error('Lỗi lấy gợi ý gia sư:', err);
      showToast('error', err.message || 'Lỗi lấy danh sách gợi ý gia sư');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Mở modal Duyệt Ghép Lớp Trực Tiếp
  const openDirectMatchModal = async (req: ClassRequestItem) => {
    setDirectMatchReq(req);
    setSelectedTutorId('');
    setNegotiatedFee(req.budgetPerSession || 200000);
    setCustomClassTitle(`Lớp ${req.subject} (${req.grade}) - ${req.studentName}`);
    try {
      setLoadingDirectTutors(true);
      // Lấy gợi ý gia sư hoặc danh sách gia sư sàn
      const [suggRes, tutorsRes] = await Promise.all([
        api.classRequests.getSuggestions(req.id).catch(() => ({ data: { suggestions: [] } })),
        api.tutors.getPublicTutors().catch(() => ({ data: [] })),
      ]);

      const suggList = suggRes.data?.suggestions || [];
      const publicList = tutorsRes.data || [];

      // Ưu tiên danh sách có score matching
      const combined = suggList.length > 0 ? suggList : publicList.map((t: any) => ({
        tutorId: t.id,
        name: t.user?.fullName || t.name || 'Gia sư',
        phone: t.user?.phone || '0988xxx',
        hourlyRate: t.hourlyRate || 200000,
        district: t.district || t.province || '',
        headline: t.headline || 'Gia sư chuyên nghiệp',
        matchScore: 90,
      }));

      setDirectTutors(combined);
      if (combined.length > 0) {
        setSelectedTutorId(combined[0].tutorId);
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách gia sư duyệt ghép:', err);
    } finally {
      setLoadingDirectTutors(false);
    }
  };

  // Xác nhận Duyệt Ghép Lớp Trực Tiếp
  const handleConfirmDirectMatch = async () => {
    if (!directMatchReq || !selectedTutorId) {
      showToast('error', 'Vui lòng chọn gia sư để duyệt ghép lớp');
      return;
    }

    try {
      setIsSubmittingDirect(true);
      await api.classRequests.directMatch(directMatchReq.id, {
        tutorId: selectedTutorId,
        feePerSession: Number(negotiatedFee),
        classTitle: customClassTitle.trim() || undefined,
      });

      showToast('success', `Đã duyệt ghép lớp thành công cho yêu cầu ${directMatchReq.code}!`);
      setDirectMatchReq(null);
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi duyệt ghép lớp');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  // Xóa yêu cầu ghép lớp
  const handleDeleteRequest = async (req: ClassRequestItem) => {
    const confirmText = `Bạn có chắc chắn muốn XÓA yêu cầu ghép lớp "${req.code}" (Môn ${req.subject} - Phụ huynh ${req.parentName})? Hành động này không thể hoàn tác.`;
    if (!window.confirm(confirmText)) return;

    try {
      await api.classRequests.deleteRequest(req.id);
      showToast('success', `Đã xóa yêu cầu ghép lớp ${req.code} thành công`);
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi xóa yêu cầu');
    }
  };

  const handleSendOffers = async () => {
    if (!activeReqForMatch || selectedTutorIds.length === 0) {
      showToast('error', 'Vui lòng chọn ít nhất 1 gia sư');
      return;
    }

    try {
      setIsSendingOffers(true);
      await api.classRequests.sendParallelOffers(activeReqForMatch.id, {
        tutorIds: selectedTutorIds,
        proposedFee: activeReqForMatch.budgetPerSession,
        note: `Lời mời ghép lớp từ Điều phối viên: Môn ${activeReqForMatch.subject}`,
      });
      showToast('success', `Đã gửi offer song song tới ${selectedTutorIds.length} gia sư!`);
      setActiveReqForMatch(null);
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi gửi offer');
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
      showToast('success', 'Đã chốt gia sư thành công và tự động tạo lớp học!');
      setCompareOffersReq(null);
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi chốt gia sư');
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
      showToast('success', 'Đã tạo phiếu yêu cầu đổi gia sư khẩn cấp vào hàng đợi điều phối!');
      setReplaceModalOpen(false);
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi tạo yêu cầu đổi gia sư');
    }
  };

  // Filter requests by status and search keyword
  const filteredRequests = requests.filter((req) => {
    const matchStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'NEW' ? ['NEW', 'OPEN', 'IN_PROGRESS'].includes(req.status) :
      statusFilter === 'OFFERING' ? req.status === 'OFFERING' :
      statusFilter === 'MATCHED' ? req.status === 'MATCHED' : true;

    const term = search.toLowerCase().trim();
    const matchSearch = !term ||
      (req.code || '').toLowerCase().includes(term) ||
      (req.studentName || '').toLowerCase().includes(term) ||
      (req.parentName || '').toLowerCase().includes(term) ||
      (req.subject || '').toLowerCase().includes(term) ||
      (req.location || '').toLowerCase().includes(term) ||
      (req.phone || '').toLowerCase().includes(term);

    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        eyebrow="Ban Điều Phối & Ghép Lớp"
        title="Danh Sách Yêu Cầu Ghép Lớp"
        description="Quản lý toàn bộ yêu cầu tìm gia sư từ phụ huynh, điều phối phát offer song song hoặc duyệt ghép trực tiếp nhanh chóng."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplaceModalOpen(true)}
              className="text-amber-800 border-amber-300 hover:bg-amber-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>Đổi Gia Sư Khẩn Cấp</span>
            </Button>
            <Link to="/admin/matching/classes">
              <Button variant="primary" size="sm">
                <span>Quản lý lớp học & duyệt →</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Notifications */}
      {toastMsg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
          toastMsg.type === 'success' 
            ? 'bg-brand-50 text-brand-900 border-brand-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-ink-400 hover:text-ink-700">✕</button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <Card variant="static" padding="md" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: `Tất cả (${requests.length})` },
            { key: 'NEW', label: `Chờ ghép (${requests.filter(r => ['NEW', 'OPEN', 'IN_PROGRESS'].includes(r.status)).length})` },
            { key: 'OFFERING', label: `Đang phát offer (${requests.filter(r => r.status === 'OFFERING').length})` },
            { key: 'MATCHED', label: `Đã ghép (${requests.filter(r => r.status === 'MATCHED').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-ink-900 text-white shadow-2xs'
                  : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-400" />
            <input
              type="text"
              placeholder="Tìm theo mã CR, tên PH, bé, môn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden bg-white"
            />
          </div>
          <button
            onClick={() => fetchRequests()}
            title="Làm mới danh sách"
            className="p-2 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-600 transition shrink-0 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </Card>

      {/* Requests List */}
      {loading ? (
        <Card variant="static" padding="lg" className="py-20 text-center flex flex-col items-center justify-center text-ink-400 gap-2">
          <Loader2 className="animate-spin text-brand-600" size={32} />
          <p className="text-xs font-semibold">Đang tải danh sách yêu cầu ghép lớp...</p>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card variant="static" padding="lg" className="py-16 text-center text-ink-400 text-xs">
          Không tìm thấy yêu cầu ghép lớp nào phù hợp bộ lọc.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const acceptedOffers = (req.offers || []).filter(o => o.status === 'ACCEPTED');
            const hasMultipleAccepted = acceptedOffers.length >= 2;
            const hasSentOffers = (req.offers || []).length > 0;
            const isMatched = req.status === 'MATCHED';

            return (
              <Card
                key={req.id}
                variant="interactive"
                padding="lg"
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-brand-800 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-lg">
                      {req.code}
                    </span>
                    <Badge variant={isMatched ? 'brand' : req.urgency === 'HIGH' ? 'danger' : 'neutral'}>
                      {isMatched ? 'Đã ghép lớp thành công' : req.urgency === 'HIGH' ? 'Cần gấp trong 24h' : 'Tiêu chuẩn'}
                    </Badge>
                    {hasSentOffers && !isMatched && (
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        {req.offers.length} Offer đã phát ({acceptedOffers.length} đã nhận dạy)
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-ink-900">{req.subject}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink-700 bg-ink-50/80 p-3.5 rounded-2xl border border-ink-100">
                    <div>
                      <span className="text-ink-400 block text-[11px]">Học sinh & Phụ huynh:</span>
                      <strong className="text-ink-900">{req.studentName} ({req.grade})</strong> · {req.parentName}
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[11px]">Thù lao & Thời lượng:</span>
                      <strong className="text-brand-700">{req.budgetPerSession?.toLocaleString('vi-VN')} đ</strong> / {req.durationMinutes}p
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[11px]">Khu vực / Địa điểm:</span>
                      <strong>{req.location || 'Tại nhà PH'}</strong>
                    </div>
                  </div>

                  {req.requirements && (
                    <p className="text-xs text-ink-600 line-clamp-2">
                      <strong className="text-ink-800">Yêu cầu PH:</strong> {req.requirements}
                    </p>
                  )}
                </div>

                {/* Action Buttons: Gợi ý | Duyệt Ghép | Xóa */}
                <div className="shrink-0 flex items-center lg:flex-col lg:items-end justify-between gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-ink-100">
                  {hasMultipleAccepted && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCompareOffersReq(req)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Sparkles size={13} />
                      <span>So Sánh ({acceptedOffers.length}) Gia Sư</span>
                    </Button>
                  )}

                  {!isMatched && (
                    <div className="flex items-center gap-2">
                      {/* Nút 1: Gợi ý gia sư thông minh (Gửi parallel offer) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMatchModal(req)}
                        title="Dùng thuật toán gợi ý gia sư phù hợp và phát offer song song"
                      >
                        <Send className="w-3.5 h-3.5 text-brand-600" />
                        <span>Gợi Ý</span>
                      </Button>

                      {/* Nút 2: Duyệt Ghép Lớp Trực Tiếp */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openDirectMatchModal(req)}
                        title="Ghép ngay lập tức với 1 gia sư đã liên hệ và tạo lớp học"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Duyệt Ghép</span>
                      </Button>

                      {/* Nút 3: Xóa yêu cầu */}
                      <button
                        onClick={() => handleDeleteRequest(req)}
                        title="Xóa yêu cầu ghép lớp này"
                        className="p-2 rounded-xl border border-ink-200 hover:bg-rose-50 hover:border-rose-300 text-ink-400 hover:text-danger-600 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {isMatched && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Đã ghép lớp
                      </span>
                      <button
                        onClick={() => handleDeleteRequest(req)}
                        title="Xóa hồ sơ yêu cầu đã hoàn tất"
                        className="p-2 rounded-xl border border-ink-200 hover:bg-rose-50 hover:border-rose-300 text-ink-400 hover:text-danger-600 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Duyệt Ghép Lớp Trực Tiếp (Direct Match) */}
      {directMatchReq && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-xl w-full shadow-2xl space-y-5 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                  <CheckCheck className="w-5 h-5 text-brand-600" />
                  <span>Duyệt Ghép Lớp Trực Tiếp</span>
                </h3>
                <p className="text-ink-500 text-[11px] mt-0.5">
                  Yêu cầu: <strong className="font-mono text-ink-800">{directMatchReq.code}</strong> · Môn {directMatchReq.subject} ({directMatchReq.studentName})
                </p>
              </div>
              <button
                onClick={() => setDirectMatchReq(null)}
                className="w-7 h-7 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Tên lớp */}
              <div>
                <label className="block text-ink-700 font-semibold mb-1">Tên lớp học khởi tạo *</label>
                <input
                  type="text"
                  value={customClassTitle}
                  onChange={(e) => setCustomClassTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              {/* Mức học phí thỏa thuận */}
              <div>
                <label className="block text-ink-700 font-semibold mb-1">Thù lao thỏa thuận (VNĐ / buổi) *</label>
                <input
                  type="number"
                  step={10000}
                  value={negotiatedFee}
                  onChange={(e) => setNegotiatedFee(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-ink-200 rounded-xl focus:border-brand-600 focus:outline-hidden font-semibold text-brand-800"
                />
              </div>

              {/* Chọn gia sư */}
              <div>
                <label className="block text-ink-700 font-semibold mb-1.5">
                  Chọn Gia Sư phân công nhận lớp *
                </label>
                {loadingDirectTutors ? (
                  <div className="py-8 text-center text-ink-400">
                    <Loader2 className="animate-spin text-brand-600 mx-auto mb-2" size={24} />
                    <span>Đang tải danh sách gia sư phù hợp...</span>
                  </div>
                ) : directTutors.length === 0 ? (
                  <p className="text-ink-400 py-4 text-center italic">Không tìm thấy gia sư nào khả dụng.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {directTutors.map((tutor) => {
                      const isSelected = selectedTutorId === tutor.tutorId;
                      return (
                        <div
                          key={tutor.tutorId || tutor.id}
                          onClick={() => setSelectedTutorId(tutor.tutorId)}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-brand-50/80 border-brand-500 shadow-2xs'
                              : 'bg-white border-ink-200 hover:border-brand-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="directTutor"
                              checked={isSelected}
                              onChange={() => setSelectedTutorId(tutor.tutorId)}
                              className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-ink-900 text-xs">{tutor.name}</span>
                                {tutor.matchScore && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                                    {tutor.matchScore}% Match
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-ink-500 mt-0.5">
                                {tutor.headline} · {tutor.district || tutor.province} · {tutor.hourlyRate?.toLocaleString('vi-VN')} đ/buổi
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-ink-100 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDirectMatchReq(null)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedTutorId || isSubmittingDirect}
                onClick={handleConfirmDirectMatch}
              >
                {isSubmittingDirect ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>Xác Nhận & Khởi Tạo Lớp</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal 2: Gợi ý gia sư thật từ Matching Service (Parallel Offers) */}
      {activeReqForMatch && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-2xl w-full shadow-2xl space-y-4 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <span>Thuật Toán Gợi Ý Gia Sư Thông Minh</span>
                </h3>
                <p className="text-ink-500 text-[11px] mt-0.5">
                  Yêu cầu: <strong>{activeReqForMatch.code}</strong> - Môn {activeReqForMatch.subject} ({activeReqForMatch.location})
                </p>
              </div>
              <button
                onClick={() => setActiveReqForMatch(null)}
                className="w-7 h-7 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-ink-600">
              Chọn các gia sư để <strong>phát offer song song</strong> (Gia sư nào phản hồi nhận lớp trước sẽ ưu tiên ghép lớp):
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingSuggestions ? (
                <div className="py-12 text-center text-ink-400 space-y-2">
                  <Loader2 className="animate-spin text-brand-600 mx-auto" size={28} />
                  <p className="font-semibold">Đang tính toán điểm matching gia sư...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-12 text-center text-ink-400 italic">
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
                        tutor.alreadyOffered ? 'bg-ink-100 border-ink-200 opacity-60 cursor-not-allowed' :
                        isChecked ? 'bg-brand-50/90 border-brand-600 shadow-2xs' : 'bg-white border-ink-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={tutor.alreadyOffered}
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink-900 text-sm">{tutor.name}</span>
                            <span className="font-semibold text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                              {tutor.matchScore}% Match
                            </span>
                            {tutor.alreadyOffered && (
                              <span className="text-[10px] font-semibold text-ink-500 bg-ink-200 px-2 py-0.5 rounded">
                                Đã gửi trước đó
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-500 mt-0.5">
                            {tutor.headline} · {tutor.district || tutor.province} · {tutor.hourlyRate?.toLocaleString('vi-VN')} đ/buổi
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tutor.matchReasons.map((r, i) => (
                              <span key={i} className="text-[10px] text-ink-600 bg-ink-100 px-1.5 py-0.5 rounded">
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

            <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
              <span className="font-semibold text-ink-700">
                Đã chọn: <strong className="text-brand-700">{selectedTutorIds.length}</strong> gia sư
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveReqForMatch(null)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedTutorIds.length === 0 || isSendingOffers}
                  onClick={handleSendOffers}
                >
                  {isSendingOffers ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>Phát Offer Ngay</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal 3: So sánh gia sư đã nhận offer side-by-side */}
      {compareOffersReq && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-4xl w-full shadow-2xl space-y-5 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>So Sánh Các Gia Sư Đã Chấp Nhận Lời Mời</span>
                </h3>
                <p className="text-ink-500 text-[11px] mt-0.5">
                  Yêu cầu: {compareOffersReq.code} · Học sinh: {compareOffersReq.studentName} ({compareOffersReq.grade})
                </p>
              </div>
              <button
                onClick={() => setCompareOffersReq(null)}
                className="w-7 h-7 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
              {compareOffersReq.offers.filter(o => o.status === 'ACCEPTED').map((offer) => {
                const tutorUser = offer.tutor?.user;
                return (
                  <div key={offer.id} className="p-5 rounded-2xl bg-ink-50 border border-ink-200 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-ink-900">{tutorUser?.fullName || 'Gia sư'}</span>
                        <span className="font-semibold text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                          ĐÃ ĐỒNG Ý DẠY
                        </span>
                      </div>

                      <div className="space-y-1.5 text-ink-600">
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-ink-400" />
                          <span>SĐT: <strong>{tutorUser?.phone || '0988 123 456'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-ink-400" />
                          <span>Khu vực: <strong>{offer.tutor?.district || offer.tutor?.province || 'Hà Nội'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Award size={13} className="text-ink-400" />
                          <span>Học phí đề xuất: <strong className="text-brand-700">{Number(offer.proposedPay || compareOffersReq.budgetPerSession).toLocaleString('vi-VN')} đ/buổi</strong></span>
                        </p>
                      </div>

                      {offer.tutorNote && (
                        <div className="p-2.5 bg-white rounded-xl border border-ink-200 text-[11px] text-ink-700 italic">
                          " {offer.tutorNote} "
                        </div>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      disabled={selectingOfferId === offer.id}
                      onClick={() => handleSelectOffer(compareOffersReq.id, offer.id)}
                    >
                      {selectingOfferId === offer.id ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      <span>Chọn Gia Sư Này & Khởi Tạo Lớp</span>
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-ink-100 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareOffersReq(null)}
              >
                Đóng
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal 4: Đổi gia sư khẩn cấp (URGENT_REPLACE) */}
      {replaceModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="static" padding="lg" className="max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-base text-ink-900">Tạo Phiếu Đổi Gia Sư Khẩn Cấp</h3>
              </div>
              <button onClick={() => setReplaceModalOpen(false)} className="text-ink-400 hover:text-ink-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateReplacement} className="space-y-3">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Tên học sinh *</label>
                <input
                  type="text"
                  required
                  value={replaceForm.studentName}
                  onChange={(e) => setReplaceForm({ ...replaceForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Môn học cần đổi gia sư *</label>
                <input
                  type="text"
                  required
                  value={replaceForm.subject}
                  onChange={(e) => setReplaceForm({ ...replaceForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Lý do đổi gia sư (Ghi nhận CSKH) *</label>
                <textarea
                  rows={3}
                  required
                  value={replaceForm.reason}
                  onChange={(e) => setReplaceForm({ ...replaceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-ink-100">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setReplaceModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Tạo Yêu Cầu Ưu Tiên
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
