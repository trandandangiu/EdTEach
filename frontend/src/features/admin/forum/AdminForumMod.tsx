import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { ForumPost } from '../../../types/edtech';
import { MessageSquare, Trash2, CheckCircle2, ShieldCheck, Flag } from 'lucide-react';

export default function AdminForumMod() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        const res = await api.forum.getPosts();
        if (res.data) setPosts(res.data);
      } catch (err) {
        console.error('Lỗi tải bài viết:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const handleDelete = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Ban Kiểm Duyệt Nội Dung</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Kiểm Duyệt Diễn Đàn & Bài Thảo Luận
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt bài đăng, gỡ bỏ spam hoặc các nội dung vi phạm tiêu chuẩn cộng đồng giáo dục.
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          {posts.length} bài viết đang hiển thị
        </span>
      </div>

      <div className="space-y-4">
        {posts.map((p) => (
          <div
            key={p.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-800">{p.category}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">Tác giả: {p.author.name} ({p.author.role})</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">{p.createdAt}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
              <p className="text-slate-600 line-clamp-1">{p.content}</p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1.5 font-bold text-emerald-800 bg-emerald-50 rounded-xl">
                Đã duyệt an toàn
              </span>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Gỡ bài viết"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
