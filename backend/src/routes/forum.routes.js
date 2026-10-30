// backend/src/routes/forum.routes.js
import express from 'express';
import { forumController } from '../controllers/forum.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Public routes (xem diễn đàn)
router.get('/categories', forumController.getCategories);
router.get('/posts', forumController.getPosts);
router.get('/posts/:id', forumController.getPostDetail);

// Protected routes (đăng bài, bình luận, tương tác)
router.post('/posts', authenticate, forumController.createPost);
router.post('/posts/:id/comments', authenticate, forumController.addComment);
router.post('/posts/:id/like', authenticate, forumController.toggleLikePost);
router.post('/posts/:id/flag', authenticate, forumController.flagPost);

// Moderation routes (Dành cho ban Kiểm duyệt STAFF_FORUM & ADMIN)
router.get('/admin/posts', authenticate, forumController.getAdminPosts);
router.post('/posts/:id/hide', authenticate, forumController.hidePost);
router.post('/posts/:id/unhide', authenticate, forumController.unhidePost);
router.delete('/posts/:id', authenticate, forumController.deletePost);
router.get('/flags', authenticate, forumController.getFlags);
router.patch('/flags/:id/handle', authenticate, forumController.handleFlag);

export default router;
