import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ClassRequest } from '../../types/edtech';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  BookOpen, 
  User, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

export default function ParentRequestsHistoryPage() {
  const [requests, setRequests] = useState<ClassRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const res = await api.classRequests.getRequests();
        if (res?.data) {
          setRequests(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải yêu cầu tìm gia sư:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="gold">⏳ Đang chờ điều phối</Badge>;
      case 'IN_PROGRESS':
      case 'OPEN':
        return <Badge variant="info">🔍 Đang kết nối gia sư</Badge>;
      case 'OFFERING':
        return <Badge variant="brand">📩 Đã gửi hồ sơ gia sư</Badge>;
      case 'MATCHED':
        return <Badge variant="brand">✓ Đã ghép lớp thành công</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">✕ Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="VietTutor · Cổng Phụ Huynh"
        title={`Lịch Sử Yêu Cầu Tìm Gia Sư (${requests.length})`}
        description="Theo dõi trạng thái tìm kiếm gia sư cho các bé, danh sách hồ sơ giáo viên được gửi tới và tiến trình xếp lớp."
        actions={
          <Link to="/parent/requests/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              <span>Đăng yêu cầu tìm gia sư mới</span>
            </Button>
          </Link>
        }
      />

      {loading ? (
        <Card variant="static" padding="lg" className="py-20 text-center flex flex-col items-center justify-center text-ink-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium">Đang tải lịch sử các phiếu tìm gia sư...</p>
        </Card>
      ) : requests.length === 0 ? (
        <Card variant="static" padding="lg" className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mx-auto text-3xl">
            📝
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink-900">Bạn chưa đăng yêu cầu tìm gia sư nào</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Hãy gửi thông tin môn học và mục tiêu của con để ban học vụ VietTutor chọn lọc gia sư phù hợp nhất cho bé.
            </p>
          </div>
          <Link to="/parent/requests/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Đăng yêu cầu ngay</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} variant="static" padding="md" className="space-y-4">
              {/* Header phiếu: Mã phiếu, môn học, ngày tạo, trạng thái */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-100 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-xl">
                    {req.code}
                  </span>
                  <h3 className="text-base font-semibold text-ink-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-brand-600" />
                    <span>Môn học: {req.subject || 'Dạy kèm theo yêu cầu'}</span>
                  </h3>
                  <span className="text-xs text-ink-400">
                    · Ngày đăng: <strong>{req.createdAt || 'Hôm nay'}</strong>
                  </span>
                </div>

                <div>{getStatusBadge(req.status)}</div>
              </div>

              {/* Thông tin chi tiết: Bé nào, học phí, thời lượng, địa điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-ink-50 p-4 rounded-2xl border border-ink-200/80 text-xs text-ink-600">
                <div className="space-y-1">
                  <span className="text-ink-400 flex items-center gap-1 text-[11px]">
                    <User className="w-3.5 h-3.5" />
                    <span>Tìm cho học sinh:</span>
                  </span>
                  <div className="font-semibold text-ink-900 text-sm">
                    {req.studentName || 'Bé của gia đình'} {req.grade ? `(${req.grade})` : ''}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-ink-400 flex items-center gap-1 text-[11px]">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Học phí đề xuất & Thời lượng:</span>
                  </span>
                  <div className="font-semibold text-brand-700 text-sm">
                    {req.budgetPerSession
                      ? `${Number(req.budgetPerSession).toLocaleString('vi-VN')} đ / buổi`
                      : 'Thương lượng'}
                    <span className="text-xs font-normal text-ink-500">
                      {' '}
                      ({req.durationMinutes || 90} phút · {req.sessionsPerWeek || 2} buổi/tuần)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-ink-400 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Hình thức & Địa điểm:</span>
                  </span>
                  <div className="font-semibold text-ink-900">
                    <Badge variant={req.mode === 'ONLINE' ? 'info' : 'neutral'}>
                      {req.mode === 'ONLINE' ? 'Học Online qua Zoom' : 'Dạy kèm tại nhà'}
                    </Badge>
                    <span className="block text-[11px] text-ink-500 mt-1 truncate">
                      {req.location || 'Tại nhà phụ huynh'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Yêu cầu cụ thể */}
              {req.requirements && (
                <div className="text-xs text-ink-600 space-y-1 pt-1">
                  <span className="font-semibold text-ink-800">Yêu cầu đặc biệt với gia sư:</span>
                  <p className="text-ink-500 leading-relaxed italic bg-white p-3 rounded-xl border border-ink-100">
                    "{req.requirements}"
                  </p>
                </div>
              )}

              {/* Thông tin ứng viên gia sư nếu có */}
              {req.offers && req.offers.length > 0 && (
                <div className="pt-2 border-t border-ink-100 flex items-center justify-between text-xs text-brand-700">
                  <span className="font-semibold">
                    Đã có {req.offers.length} gia sư phản hồi ứng tuyển cho yêu cầu này!
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
