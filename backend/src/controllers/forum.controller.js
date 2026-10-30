// backend/src/controllers/forum.controller.js
import prisma from '../config/prisma.js';

export const forumController = {
  // Lấy danh sách chuyên mục diễn đàn
  async getCategories(req, res, next) {
    try {
      const categories = await prisma.forumCategory.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { posts: true } },
        },
      });
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách bài viết (hỗ trợ lọc category, search, tag, sort)
  async getPosts(req, res, next) {
    try {
      const { categoryId, categoryCode, search, tag, sort = 'latest' } = req.query;
      const where = { status: 'PUBLISHED' };

      if (categoryId) {
        where.categoryId = Number(categoryId);
      } else if (categoryCode) {
        const cat = await prisma.forumCategory.findUnique({ where: { code: categoryCode } });
        if (cat) where.categoryId = cat.id;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tag) {
        where.tags = { has: tag };
      }

      let orderBy = { createdAt: 'desc' };
      if (sort === 'popular') {
        orderBy = { viewCount: 'desc' };
      } else if (sort === 'replies') {
        orderBy = { commentCount: 'desc' };
      }

      const posts = await prisma.forumPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, fullName: true, avatarUrl: true, userType: true },
          },
          category: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy,
        take: 50,
      });

      const formatted = posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category?.name || 'Chung',
        categoryCode: p.category?.code,
        author: {
          id: p.author?.id,
          name: p.author?.fullName || 'Người dùng VietTutor',
          avatar: p.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          role: p.author?.userType === 'STAFF' ? 'Quản trị viên' : 'Thành viên',
        },
        createdAt: p.createdAt,
        views: p.viewCount || 0,
        repliesCount: p.commentCount || 0,
        likes: p.likeCount || 0,
        tags: p.tags || [],
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Chi tiết bài viết và danh sách bình luận
  async getPostDetail(req, res, next) {
    try {
      const { id } = req.params;

      // Tăng view count
      const post = await prisma.forumPost.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        include: {
          author: {
            select: { id: true, fullName: true, avatarUrl: true, userType: true },
          },
          category: {
            select: { id: true, name: true, code: true },
          },
          comments: {
            where: { status: 'PUBLISHED' },
            include: {
              author: {
                select: { id: true, fullName: true, avatarUrl: true, userType: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          attachments: true,
        },
      });

      if (!post || post.status === 'DELETED') {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      const formatted = {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category?.name,
        categoryCode: post.category?.code,
        author: {
          id: post.author?.id,
          name: post.author?.fullName || 'Thành viên',
          avatar: post.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          role: post.author?.userType === 'STAFF' ? 'Gia sư Tinh Hoa' : 'Phụ huynh',
        },
        createdAt: post.createdAt,
        views: post.viewCount,
        likes: post.likeCount,
        repliesCount: post.comments.length,
        tags: post.tags || [],
        replies: post.comments.map((c) => ({
          id: c.id,
          author: {
            name: c.author?.fullName || 'Thành viên',
            avatar: c.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
            role: c.author?.userType === 'STAFF' ? 'Gia sư' : 'Phụ huynh',
          },
          content: c.content,
          createdAt: c.createdAt,
          likes: c.likeCount || 0,
        })),
      };

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Tạo bài viết mới
  async createPost(req, res, next) {
    try {
      const { title, content, categoryId, categoryCode, tags = [] } = req.body;
      const authorId = req.user.id;

      let catId = categoryId ? Number(categoryId) : null;
      if (!catId && categoryCode) {
        const cat = await prisma.forumCategory.findUnique({ where: { code: categoryCode } });
        if (cat) catId = cat.id;
      }

      if (!catId) {
        const firstCat = await prisma.forumCategory.findFirst();
        catId = firstCat ? firstCat.id : 1;
      }

      const post = await prisma.forumPost.create({
        data: {
          title,
          content,
          categoryId: catId,
          authorId,
          tags,
          status: 'PUBLISHED',
        },
      });

      res.status(201).json({ success: true, data: post, message: 'Đăng bài viết thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Gửi bình luận
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { content, parentCommentId } = req.body;
      const authorId = req.user.id;

      const comment = await prisma.$transaction(async (tx) => {
        const c = await tx.forumComment.create({
          data: {
            postId: id,
            authorId,
            content,
            parentId: parentCommentId || null,
            status: 'PUBLISHED',
          },
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true, userType: true } },
          },
        });

        await tx.forumPost.update({
          where: { id },
          data: { commentCount: { increment: 1 } },
        });

        return c;
      });

      res.status(201).json({
        success: true,
        data: {
          id: comment.id,
          author: {
            name: comment.author?.fullName,
            avatar: comment.author?.avatarUrl,
            role: 'Thành viên',
          },
          content: comment.content,
          createdAt: comment.createdAt,
          likes: 0,
        },
        message: 'Đã gửi phản hồi',
      });
    } catch (err) {
      next(err);
    }
  },

  // Thích bài viết
  async toggleLikePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existingReaction = await prisma.forumReaction.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });

      if (existingReaction) {
        await prisma.$transaction([
          prisma.forumReaction.delete({ where: { id: existingReaction.id } }),
          prisma.forumPost.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
        ]);
        return res.json({ success: true, liked: false });
      } else {
        await prisma.$transaction([
          prisma.forumReaction.create({
            data: { postId: id, userId, type: 'LIKE' },
          }),
          prisma.forumPost.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
        ]);
        return res.json({ success: true, liked: true });
      }
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // CÁC TÍNH NĂNG KIỂM DUYỆT (MODERATION)
  // ============================================

  // Lấy toàn bộ bài viết cho kiểm duyệt viên (bao gồm HIDDEN, PUBLISHED, DELETED)
  async getAdminPosts(req, res, next) {
    try {
      const { status, search } = req.query;
      const where = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      const posts = await prisma.forumPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, fullName: true, username: true, avatarUrl: true, userType: true, active: true, bannedUntil: true },
          },
          category: { select: { id: true, name: true, code: true } },
          _count: { select: { comments: true, flags: true, reactions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = posts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category?.name || 'Chung',
        categoryCode: p.category?.code,
        status: p.status,
        moderationNote: p.moderationNote,
        createdAt: p.createdAt,
        views: p.viewCount,
        likes: p.likeCount,
        repliesCount: p._count.comments,
        flagsCount: p._count.flags,
        author: {
          id: p.author?.id,
          name: p.author?.fullName || p.author?.username || 'Thành viên',
          avatar: p.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          role: p.author?.userType === 'STAFF' ? 'Quản trị viên' : 'Thành viên',
          active: p.author?.active,
          bannedUntil: p.author?.bannedUntil,
        },
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Ẩn bài viết vi phạm
  async hidePost(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const moderatorId = req.user.id;

      const post = await prisma.forumPost.update({
        where: { id },
        data: {
          status: 'HIDDEN',
          moderatedById: moderatorId,
          moderationNote: reason || 'Vi phạm tiêu chuẩn cộng đồng giáo dục',
        },
      });

      res.json({ success: true, message: 'Đã ẩn bài viết khỏi diễn đàn', data: post });
    } catch (err) {
      next(err);
    }
  },

  // Mở ẩn / Khôi phục bài viết
  async unhidePost(req, res, next) {
    try {
      const { id } = req.params;

      const post = await prisma.forumPost.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          moderatedById: req.user.id,
          moderationNote: null,
        },
      });

      res.json({ success: true, message: 'Đã hiển thị lại bài viết trên diễn đàn', data: post });
    } catch (err) {
      next(err);
    }
  },

  // Xóa vĩnh viễn hoặc đánh dấu DELETED
  async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await prisma.forumPost.update({
        where: { id },
        data: {
          status: 'DELETED',
          moderatedById: req.user.id,
        },
      });

      res.json({ success: true, message: 'Đã xóa bài viết thành công', data: post });
    } catch (err) {
      next(err);
    }
  },

  // Báo cáo vi phạm (Dành cho thành viên hoặc học viên)
  async flagPost(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, commentId } = req.body;
      const reporterId = req.user.id;

      if (!reason) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do báo cáo' });
      }

      const flag = await prisma.forumFlag.create({
        data: {
          reporterId,
          postId: id,
          commentId: commentId || null,
          reason,
          status: 'OPEN',
        },
      });

      res.status(201).json({ success: true, message: 'Đã gửi báo cáo vi phạm tới Ban kiểm duyệt', data: flag });
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách báo cáo vi phạm
  async getFlags(req, res, next) {
    try {
      const { status = 'OPEN' } = req.query;
      const where = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const flags = await prisma.forumFlag.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, fullName: true, username: true },
          },
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              status: true,
              author: {
                select: { id: true, fullName: true, username: true, bannedUntil: true },
              },
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
              status: true,
              author: {
                select: { id: true, fullName: true, username: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: flags });
    } catch (err) {
      next(err);
    }
  },

  // Xử lý báo cáo vi phạm (RESOLVED / DISMISSED)
  async handleFlag(req, res, next) {
    try {
      const { id } = req.params;
      const { status = 'RESOLVED', action } = req.body; // action: 'HIDE_POST', 'DELETE_POST', 'DISMISS'
      const handledById = req.user.id;

      const flag = await prisma.forumFlag.findUnique({
        where: { id },
        include: { post: true, comment: true },
      });

      if (!flag) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo vi phạm' });
      }

      if (action === 'HIDE_POST' && flag.postId) {
        await prisma.forumPost.update({
          where: { id: flag.postId },
          data: { status: 'HIDDEN', moderatedById: handledById, moderationNote: `Ẩn do vi phạm: ${flag.reason}` },
        });
      } else if (action === 'DELETE_POST' && flag.postId) {
        await prisma.forumPost.update({
          where: { id: flag.postId },
          data: { status: 'DELETED', moderatedById: handledById },
        });
      }

      const updatedFlag = await prisma.forumFlag.update({
        where: { id },
        data: {
          status,
          handledById,
        },
      });

      res.json({ success: true, message: 'Đã xử lý báo cáo vi phạm', data: updatedFlag });
    } catch (err) {
      next(err);
    }
  },
};
