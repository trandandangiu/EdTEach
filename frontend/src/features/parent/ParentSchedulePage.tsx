import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { TutorClass } from '../../types/edtech';
import { Calendar, Clock, MapPin, User, CheckCircle2, Plus, Loader2, BookOpen } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

export default function ParentSchedulePage() {
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        const res = await api.classes.getClasses();
        if (res?.data) {
          setClasses(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải lịch học:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="VietTutor · Thời Khóa Biểu"
        title={`Thời Khóa Biểu & Lịch Học Của Con (${classes.length} lớp)`}
        description="Lịch học được đồng bộ thời gian thực giữa gia sư và gia đình sau khi lớp học được kích hoạt."
        actions={
          <Link to="/parent/requests/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              <span>Đăng ký thêm lớp mới</span>
            </Button>
          </Link>
        }
      />

      {loading ? (
        <Card variant="static" padding="lg" className="py-20 text-center flex flex-col items-center justify-center text-ink-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium">Đang tải lịch học của các con...</p>
        </Card>
      ) : classes.length === 0 ? (
        <Card variant="static" padding="lg" className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mx-auto text-3xl">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink-900">Hiện tại chưa có lịch học nào</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Lịch học sẽ tự động hiển thị sau khi yêu cầu tìm gia sư của bạn được trung tâm kết nối và xếp lớp thành công.
            </p>
          </div>
          <Link to="/parent/requests/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Đăng yêu cầu tìm gia sư ngay</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <Card key={cls.id} variant="static" padding="md" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold shrink-0 border border-brand-100">
                    <Calendar className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-100">
                        {cls.schedule || 'Lịch học thỏa thuận'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-ink-900">
                      {cls.name || cls.subject}
                    </h3>
                    <div className="text-xs text-ink-500 flex items-center gap-2 flex-wrap">
                      <span>Gia sư: <strong>{cls.tutorName}</strong></span>
                      <span>·</span>
                      <span>
                        Hình thức: <strong>{cls.mode === 'ONLINE' ? 'Online qua Zoom' : 'Dạy kèm tại nhà'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Badge variant="brand">✓ Đang diễn ra</Badge>
                  <Link to="/parent/reports">
                    <Button variant="outline" size="sm">
                      Xem sổ liên lạc
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
