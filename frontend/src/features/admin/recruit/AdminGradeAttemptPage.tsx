import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { ExamAttempt } from '../../../types/edtech';
import { ArrowLeft, CheckCircle2, ShieldCheck, Award, AlertCircle, Upload, FileText, Eye, X } from 'lucide-react';

export default function AdminGradeAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState('Ứng viên có tư duy sư phạm tốt.');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  useEffect(() => {
    async function loadAttempt() {
      if (!attemptId) return;
      try {
        setLoading(true);
        const res = await api.assessments.getAttemptDetail(attemptId);
        if (res.data) {
          setAttempt(res.data);
          setAnswers(res.data.answers || []);
          if (res.data.applicationId) {
            fetchApplicationAttachments(res.data.applicationId);
          }
        }
      } catch (err) {
        console.error('Lỗi tải bài thi:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();
  }, [attemptId]);

  const fetchApplicationAttachments = async (appId: string) => {
    try {
      const appRes = await api.tutors.getApplicationDetail(appId);
      if (appRes.data?.attachments) {
        setAttachments(appRes.data.attachments);
      }
    } catch (e) {
      console.warn('Không tải được danh sách hồ sơ đính kèm:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attempt?.applicationId) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'DEGREE_CERTIFICATE');

      await api.tutors.uploadApplicationAttachment(attempt.applicationId, formData);
      await fetchApplicationAttachments(attempt.applicationId);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải lên file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handlePointChange = (qId: number | string, points: number) => {
    setAnswers(answers.map(a => a.questionId === qId ? { ...a, pointsAwarded: points } : a));
  };

  const totalScore = answers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0) + 50;

  const handleSaveGrading = async (decision: 'PASSED' | 'FAILED') => {
    if (!attemptId) return;
    try {
      await api.assessments.gradeAttempt(attemptId, {
        grades: answers.map(a => ({ questionId: a.questionId, pointsEarned: a.pointsAwarded, graderNote: a.graderNote })),
        evaluatorNotes,
        passed: decision === 'PASSED',
      });
      setIsSaved(true);
      setTimeout(() => {
        navigate('/admin/recruit');
      }, 1000);
    } catch (err) {
      console.error('Lỗi lưu kết quả chấm:', err);
    }
  };

  if (loading || !attempt) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 font-semibold">
        Đang tải bài thi của ứng viên...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between text-xs font-bold">
        <Link to="/admin/recruit" className="text-emerald-800 hover:underline flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Kanban Tuyển Dụng</span>
        </Link>
        <span className="text-slate-500">Mã bài thi: {attempt.id}</span>
      </div>

      {/* Main Grading Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Khảo Thí & Thẩm Định Năng Lực</span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{attempt.applicantName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Môn: {attempt.subject} · Nộp lúc: {attempt.submittedAt} · Thời gian làm bài: {attempt.durationMinutes} phút
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block">TỔNG ĐIỂM DỰ KIẾN</span>
            <span className="text-2xl font-black text-emerald-800">{totalScore} / 100đ</span>
          </div>
        </div>

        {/* Hồ sơ đính kèm (CV & Bằng cấp) */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span>Hồ sơ minh chứng & Bằng cấp (CV / Bằng ĐH / Chứng chỉ)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Xem trước tài liệu PDF hoặc hình ảnh văn bằng do ứng viên cung cấp</p>
            </div>
            <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              isUploading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs'
            }`}>
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Đang tải lên...' : 'Tải lên tài liệu'}</span>
              <input
                type="file"
                disabled={isUploading}
                onChange={handleFileUpload}
                accept=".pdf,image/*,.doc,.docx"
                className="hidden"
              />
            </label>
          </div>

          {attachments.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs italic bg-white rounded-xl border border-dashed border-slate-200">
              Chưa có tài liệu đính kèm nào được tải lên cho ứng viên này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {attachments.map((att) => (
                <div key={att.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs hover:border-emerald-500 transition">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate" title={att.fileName}>{att.fileName}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {(att.fileSize / 1024).toFixed(1)} KB · {att.category || 'Văn bằng'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewUrl(`/api/attachments/${att.id}/download?inline=1`);
                      setPreviewTitle(att.fileName);
                    }}
                    title="Xem trước tài liệu"
                    className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg shrink-0 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isSaved ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-900">Đã lưu kết quả chấm thi!</h3>
            <p className="text-xs text-slate-500">Đang chuyển về ban tuyển dụng...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">Chi tiết câu hỏi tự luận & Đáp án ứng viên</h2>

            <div className="space-y-4">
              {answers.map((item, idx) => (
                <div key={item.questionId} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>Câu hỏi {idx + 1}: {item.questionText}</span>
                    <span className="text-slate-500">Tối đa: {item.maxPoints}đ</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-bold mb-1">BÀI LÀM CỦA ỨNG VIÊN:</span>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{item.applicantAnswer}</p>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60 text-emerald-950">
                    <span className="text-emerald-700 block text-[11px] font-bold mb-1">GỢI Ý CHẤM (RUBRIC):</span>
                    <p className="leading-relaxed">{item.expectedAnswer}</p>
                  </div>

                  {/* Grading score input */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-slate-700">Điểm chấm cho câu này:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={item.maxPoints}
                        value={item.pointsAwarded || 0}
                        onChange={(e) => handlePointChange(item.questionId, Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl text-center focus:border-emerald-700 focus:outline-hidden"
                      />
                      <span className="font-bold text-slate-500">/ {item.maxPoints}đ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét tổng kết của giám khảo</label>
              <textarea
                rows={3}
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleSaveGrading('FAILED')}
                className="px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200"
              >
                Không đạt (Yêu cầu thi lại)
              </button>
              <button
                type="button"
                onClick={() => handleSaveGrading('PASSED')}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Duyệt Đạt Điểm & Ký Hợp Đồng</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview PDF & Ảnh Minh Chứng */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-sm text-slate-900 truncate max-w-lg">{previewTitle}</h3>
              </div>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={previewUrl}
                title={previewTitle}
                className="w-full h-full rounded-2xl bg-white border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
