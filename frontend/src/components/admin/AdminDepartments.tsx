import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, Users, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        setLoading(true);
        const data: any = await api.admin.getDepartments();
        const list = Array.isArray(data) ? data : (data.departments || data.data || []);
        setDepartments(list);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Tổ Chức Doanh Nghiệp</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Cơ Cấu Phòng Ban & Trưởng Bộ Phận
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản trị các khối nghiệp vụ chuyên biệt: Tuyển dụng, Điều phối lớp, CSKH và Học thuật.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-emerald-800" size={32} />
          <p className="text-xs font-bold">Đang tải danh sách phòng ban...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Chưa có thông tin phòng ban.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept: any) => (
            <div
              key={dept.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {dept.code || `DEPT-${dept.id}`}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {dept.membersCount || dept._count?.users || 0} nhân sự
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trưởng ban: <strong>{dept.manager?.fullName || dept.manager?.username || dept.head || 'Chưa phân công'}</strong>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Nhiệm vụ đang mở:</span>
                <span className="font-bold text-emerald-800">{dept.openTasks || dept._count?.tasks || 0} công việc</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
