import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, Clock, User, Globe, Loader2 } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res: any = await api.admin.getAuditLogs();
        const logsList = Array.isArray(res) ? res : (res.logs || res.data || []);
        setLogs(logsList);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">An Toàn & Bảo Mật</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ghi nhận toàn bộ thao tác quan trọng: duyệt gia sư, bắn offer, thanh toán và gửi báo cáo học tập.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-emerald-800" size={32} />
            <p className="text-xs font-bold">Đang tải nhật ký kiểm toán...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Chưa có bản ghi nhật ký kiểm toán nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Thời Gian</th>
                  <th className="p-4">Hành Động (Action)</th>
                  <th className="p-4">Người Thực Hiện</th>
                  <th className="p-4">Đối Tượng (Target)</th>
                  <th className="p-4">Địa Chỉ IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : log.time || '-'}
                    </td>
                    <td className="p-4 font-bold text-emerald-800">{log.action}</td>
                    <td className="p-4 text-slate-800 font-sans font-medium">
                      {log.user?.fullName || log.user?.username || log.userId || log.user || 'Hệ thống'}
                    </td>
                    <td className="p-4 text-slate-600 font-sans">{log.entityType ? `${log.entityType} #${log.entityId}` : (log.target || '-')}</td>
                    <td className="p-4 text-slate-400">{log.ipAddress || log.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
