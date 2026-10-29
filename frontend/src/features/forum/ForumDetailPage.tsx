import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { ForumPost } from '../../types/edtech';
import { ArrowLeft, ThumbsUp, MessageCircle, Share2, Send } from 'lucide-react';

export default function ForumDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.forum.getPostDetail(id);
        if (res.data) {
          setPost(res.data);
          setReplies(res.data.replies || []);
          setLikes(res.data.likes || 0);
        }
      } catch (err) {
        console.error('Lỗi tải bài viết diễn đàn:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  const handleLike = async () => {
    if (!id) return;
    try {
      const res = await api.forum.toggleLike(id);
      if (res.liked) {
        setLikes(likes + 1);
        setHasLiked(true);
      } else {
        setLikes(Math.max(0, likes - 1));
        setHasLiked(false);
      }
    } catch {
      // fallback
      setLikes(hasLiked ? likes - 1 : likes + 1);
      setHasLiked(!hasLiked);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !id) return;

    try {
      const res = await api.forum.addComment(id, { content: newReply });
      if (res.data) {
        setReplies([...replies, res.data]);
      }
      setNewReply('');
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
    }
  };

  if (loading || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500 font-semibold">Đang tải thảo luận...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link to="/forum" className="text-emerald-800 hover:underline flex items-center gap-1.5 text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh mục Diễn đàn</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Main Post Content */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="font-bold text-sm text-slate-900">{post.author.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-emerald-800">{post.author.role}</span>
                <span>·</span>
                <span>{post.createdAt}</span>
                <span>·</span>
                <span className="text-slate-600 font-medium">{post.category}</span>
              </div>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {post.title}
          </h1>

          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {post.tags.map((t, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
                #{t}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                hasLiked ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{likes} Hữu ích</span>
            </button>

            <span className="text-slate-400">
              {post.views} lượt xem · {replies.length} phản hồi
            </span>
          </div>
        </div>

        {/* Replies Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-800" />
            <span>Ý kiến đóng góp ({replies.length})</span>
          </h2>

          <div className="space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={reply.author.avatar}
                      alt={reply.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{reply.author.name}</div>
                      <div className="text-[10px] text-emerald-800 font-semibold">{reply.author.role}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">{reply.createdAt}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-10 whitespace-pre-line">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-700">Gửi câu trả lời của bạn</label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Viết chia sẻ hoặc câu trả lời hữu ích..."
                className="flex-1 text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
              />
              <button
                type="submit"
                className="self-end bg-emerald-800 hover:bg-emerald-900 text-white font-bold p-3 rounded-xl transition shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
