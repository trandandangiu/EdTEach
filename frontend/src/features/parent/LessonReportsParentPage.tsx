import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { LessonReport } from '../../types/edtech';
import { FileText, Star, ArrowRight, CheckCircle2, Loader2, Plus, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

export default function LessonReportsParentPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.reports.getLessonReports();
        if (res?.data) setReports(res.data);
      } catch (err) {
        console.error('Lỗi tải báo cáo buổi học:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="VietTutor · Cổng Phụ Huynh"
        title={`Sổ Theo Dõi Báo Cáo Buổi Học (${reports.length} buổi)`}
        description="Gia sư cập nhật nội dung bài học, nhận xét tiếp thu và bài tập về nhà sau từng buổi dạy để phụ huynh xác nhận."
      />

      {loading ? (
        <Card variant="static" padding="lg" className="py-20 text-center flex flex-col items-center justify-center text-ink-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium">Đang tải danh sách báo cáo buổi học...</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card variant="static" padding="lg" className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mx-auto text-3xl">
            📖
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink-900">Chưa có báo cáo buổi học nào</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Sau khi gia sư hoàn thành buổi học và gửi sổ liên lạc, báo cáo sẽ tự động hiển thị tại đây để bạn xem nhận xét và đánh giá.
            </p>
          </div>
          <Link to="/parent/dashboard">
            <Button variant="outline" size="sm">
              <span>Về bảng điều khiển</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              variant="interactive"
              padding="md"
              onClick={() => navigate(`/parent/reports/${report.id}`)}
              className="space-y-4 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-100 pb-3 text-xs">
                <div>
                  <span className="font-semibold text-brand-700">
                    Buổi số {report.lessonNumber || 1}
                  </span>
                  <span className="text-ink-300 mx-2">·</span>
                  <span className="text-ink-600 font-medium">Ngày {report.date}</span>
                  <span className="text-ink-300 mx-2">·</span>
                  <span>Gia sư: <strong>{report.tutorName}</strong></span>
                </div>

                <div>
                  <Badge variant={report.status === 'CONFIRMED' ? 'brand' : 'gold'}>
                    {report.status === 'CONFIRMED' ? '✓ Đã xác nhận' : '⏳ Chờ phụ huynh xác nhận'}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-ink-700 space-y-1.5">
                <div>
                  <strong className="text-ink-900">Nội dung bài học:</strong> {report.topic || 'Ôn tập kiến thức'}
                </div>
                {report.teacherFeedback && (
                  <div className="text-ink-500 italic line-clamp-2 bg-ink-50 p-3 rounded-xl border border-ink-200/80">
                    "{report.teacherFeedback}"
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <span className="text-xs font-semibold text-brand-700 group-hover:translate-x-1 transition flex items-center gap-1">
                  <span>Xem chi tiết sổ liên lạc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
