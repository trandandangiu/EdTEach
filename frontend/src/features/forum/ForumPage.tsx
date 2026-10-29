import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { ForumPost } from '../../types/edtech';
import { MessageSquare, Plus, Search, Eye, ThumbsUp, MessageCircle, Sparkles } from 'lucide-react';

export default function ForumPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostModal, setNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Góc học tập' | 'Kinh nghiệm dạy học' | 'Phụ huynh tâm sự' | 'Tài liệu đề thi'>('Góc học tập');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.forum.getPosts({ sort: 'latest' });
      if (res.data) setPosts(res.data);
    } catch (err) {
      console.error('Lỗi tải bài viết diễn đàn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const res = await api.forum.createPost({
        title: newTitle,
        content: newContent,
        categoryCode: newCategory === 'Góc học tập' ? 'QA' : newCategory === 'Kinh nghiệm dạy học' ? 'TUTOR_CORNER' : 'PARENT_CORNER',
      });
      if (res.data) {
        fetchPosts();
      }
      setNewPostModal(false);
      setNewTitle('');
      setNewContent('');
    } catch (err) {
      console.error('Lỗi đăng bài viết:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Header */}
      <div className="bg-emerald-950 text-white py-10 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-300">Cộng Đồng Gia Sư & Phụ Huynh</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Diễn Đàn Học Thuật & Giáo Dục
              </h1>
              <p className="text-xs text-emerald-200 mt-1">
                Nơi phụ huynh trao đổi tâm sự, chia sẻ giáo án, đề thi và kinh nghiệm đồng hành cùng con.
              </p>
            </div>

            <button
              onClick={() => setNewPostModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng chủ đề mới</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Search & Categories */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Unboxed Segmented category tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto">
            {['ALL', 'Góc học tập', 'Tài liệu đề thi', 'Kinh nghiệm dạy học', 'Phụ huynh tâm sự'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === cat ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-2 pl-8 bg-white border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Post List */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/forum/${post.id}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-xs transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-emerald-800">{post.category}</span>
                  <span>·</span>
                  <span>{post.createdAt}</span>
                  <span>·</span>
                  <span>bởi {post.author.name} ({post.author.role})</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((t, i) => (
                    <span key={i} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>{post.likes}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.repliesCount}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{post.views}</span>
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:underline">
                  Xem thảo luận →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Post Modal */}
      {newPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tạo chủ đề thảo luận mới</h3>
              <button
                onClick={() => setNewPostModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên mục</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-white"
                >
                  <option value="Góc học tập">Góc học tập & Hỏi bài</option>
                  <option value="Tài liệu đề thi">Tài liệu & Đề thi mẫu</option>
                  <option value="Kinh nghiệm dạy học">Kinh nghiệm dạy học</option>
                  <option value="Phụ huynh tâm sự">Phụ huynh tâm sự</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bài viết</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xin tài liệu ôn thi Violympic lớp 4..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả cụ thể câu hỏi hoặc nội dung chia sẻ..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Đăng bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
