import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { FileText, Clock, Award, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function TutorTestsPage() {
  const navigate = useNavigate();

  const exams = [
    {
      id: 'att-901',
      title: 'Bài Khảo Sát Năng Lực Chuyên Môn Toán Cấp 1 (Đề A)',
      subject: 'Toán Tiểu Học & Nghiệp Vụ Sư Phạm',
      durationMinutes: 45,
      totalQuestions: 15,
      status: 'AVAILABLE', // AVAILABLE, COMPLETED, PENDING
      score: null,
      description: 'Gồm 10 câu trắc nghiệm tư duy Toán tiểu học và 5 câu tự luận giải pháp sư phạm (Scaffolding, Giả thiết tạm, Sơ đồ đoạn thẳng).',
    },
    {
      id: 'att-902',
      title: 'Khảo Sát Tâm Lý Trẻ & Nghiệp Vụ Xử Lý Tình Huống Sư Phạm',
      subject: 'Tâm lý & Giao tiếp',
      durationMinutes: 30,
      totalQuestions: 10,
      status: 'AVAILABLE',
      score: null,
      description: 'Đánh giá khả năng lắng nghe thấu cảm, xử lý tình huống khi trẻ mất tập trung hoặc chống đối bài tập.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-emerald-950 text-white py-8 border-b border-emerald-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-semibold text-emerald-300">Cổng Khảo Thí & Đánh Giá</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Danh Sách Bài Thi Năng Lực Chuyên Môn
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Ứng viên cần vượt qua tối thiểu 1 bài khảo sát chuyên môn để được xếp lịch phỏng vấn và mở nhận lớp.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Lưu ý trong phòng thi trực tuyến:</span>
            <p className="leading-relaxed">
              Hệ thống sẽ tự động tính giờ đếm ngược khi bạn bấm &quot;Bắt đầu làm bài&quot;. Không tải lại trang (F5) hoặc chuyển tab quá 3 lần trong khi làm bài thi.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-600 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-emerald-800">{exam.subject}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.durationMinutes} phút</span>
                  </span>
                  <span>·</span>
                  <span>{exam.totalQuestions} câu hỏi</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{exam.description}</p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={() => navigate(`/apply/tests/${exam.id}`)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <span>Bắt đầu vào phòng thi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
