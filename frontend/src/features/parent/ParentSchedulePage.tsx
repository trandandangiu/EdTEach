import React from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';

export default function ParentSchedulePage() {
  const scheduleItems = [
    {
      day: 'Thứ Ba (28/10)',
      time: '18:30 - 20:00',
      subject: 'Toán Nâng Cao Lớp 4',
      student: 'Bé Bảo Nam',
      tutor: 'ThS. Nguyễn Hoàng Nam',
      status: 'UPCOMING',
      mode: 'Học trực tiếp tại nhà',
    },
    {
      day: 'Thứ Năm (30/10)',
      time: '18:30 - 20:00',
      subject: 'Toán Nâng Cao Lớp 4',
      student: 'Bé Bảo Nam',
      tutor: 'ThS. Nguyễn Hoàng Nam',
      status: 'UPCOMING',
      mode: 'Học trực tiếp tại nhà',
    },
    {
      day: 'Thứ Bảy (01/11)',
      time: '09:00 - 10:30',
      subject: 'Tiếng Anh Giao Tiếp (Buổi thử)',
      student: 'Bé Bảo Nam',
      tutor: 'Cô Lê Thu Hà (IELTS 8.5)',
      status: 'TRIAL',
      mode: 'Học Online qua Zoom',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold text-emerald-700">VietTutor · Thời Khóa Biểu</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Thời Khóa Biểu & Lịch Học Của Con
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lịch học cập nhật tự động đồng bộ giữa gia sư và gia đình.
        </p>
      </div>

      <div className="space-y-4">
          {scheduleItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex flex-col items-center justify-center font-bold shrink-0 border border-emerald-200">
                  <Calendar className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-emerald-800">{item.day}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-700">{item.time}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.subject}</h3>
                  <div className="text-xs text-slate-500">
                    Học sinh: <strong>{item.student}</strong> · Gia sư: {item.tutor} · {item.mode}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  item.status === 'TRIAL' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  {item.status === 'TRIAL' ? '⭐ Buổi học thử' : '✓ Lịch chính thức'}
                </span>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
