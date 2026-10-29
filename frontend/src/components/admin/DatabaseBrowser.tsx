import React, { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function DatabaseBrowser() {
  const [selectedTable, setSelectedTable] = useState<'tutors' | 'class_requests' | 'classes' | 'lesson_reports'>('tutors');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTableData = async (table: string) => {
    try {
      setLoading(true);
      let res: any = [];
      if (table === 'tutors') {
        const r = await api.tutors.getPublicTutors();
        res = r.data || [];
      } else if (table === 'class_requests') {
        const r = await api.classRequests.getRequests();
        res = r.data || [];
      } else if (table === 'classes') {
        const r = await api.classes.getClasses();
        res = r.data || [];
      } else if (table === 'lesson_reports') {
        const r = await api.reports.getLessonReports();
        res = r.data || [];
      }
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load table data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable]);

  const keys = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Hệ Thống Dữ Liệu</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Trình Duyệt Cơ Sở Dữ Liệu (Database Tables)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem trực tiếp bản ghi các bảng thực thể trong hệ sinh thái EdTech.
          </p>
        </div>

        {/* Table Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedTable('tutors')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedTable === 'tutors' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
          >
            tutors {selectedTable === 'tutors' && !loading && `(${data.length})`}
          </button>
          <button
            onClick={() => setSelectedTable('class_requests')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedTable === 'class_requests' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
          >
            class_requests {selectedTable === 'class_requests' && !loading && `(${data.length})`}
          </button>
          <button
            onClick={() => setSelectedTable('classes')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedTable === 'classes' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
          >
            classes {selectedTable === 'classes' && !loading && `(${data.length})`}
          </button>
          <button
            onClick={() => setSelectedTable('lesson_reports')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedTable === 'lesson_reports' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
          >
            lesson_reports {selectedTable === 'lesson_reports' && !loading && `(${data.length})`}
          </button>
          <button
            onClick={() => fetchTableData(selectedTable)}
            title="Tải lại dữ liệu"
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 ml-1"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0 z-10">
              <tr>
                {keys.map((k) => (
                  <th key={k} className="p-3.5 whitespace-nowrap">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {data.map((row: any, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition">
                  {keys.map((k) => (
                    <td key={k} className="p-3.5 max-w-xs truncate text-slate-700">
                      {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
