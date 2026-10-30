import express from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import { requireDepartment } from '../middlewares/department.js';
import prisma from '../config/prisma.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
} from '../middlewares/validate.js';

const router = express.Router();

// ⚠️ KHÔNG dùng router.use(authenticate) — vì GET cần public

// ============================================
// GET /api/users — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/',
  optionalAuth,
  usersController.getUsers
);

// ============================================
// GET /api/users/:id — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/:id',
  optionalAuth,
  usersController.getUserById
);

// ============================================
// ⭐ POST /api/users — CẦN LOGIN + QUYỀN
// Thứ tự: authenticate → validateCreateUser → requirePermission → controller
// ============================================
router.post(
  '/',
  authenticate,
  validateCreateUser,
  requirePermission('user:create', 'user:create:department'),
  usersController.createUser
);

// ============================================
// POST /api/users/verify-pvt-username — Public
// ============================================
router.post(
  '/verify-pvt-username',
  async (req, res) => {
    try {
      const { username, pvtId } = req.body || {};

      if (!username || !pvtId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin xác thực',
        });
      }

      const user = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
        include: {
          userRoles: { include: { role: true } },
        },
      });

      if (!user || user.deletedAt || !user.active) {
        return res.json({ success: false, message: 'Tên đăng nhập không tồn tại' });
      }

      // Check đúng PVT này
      if (user.id !== pvtId) {
        return res.json({
          success: false,
          message: 'Tên đăng nhập không khớp với lãnh đạo đã chọn',
        });
      }

      // Check có role PHO_VIEN_TRUONG
      const isPvt = user.userRoles.some(ur => ur.role.code === 'PHO_VIEN_TRUONG');
      if (!isPvt) {
        return res.json({ success: false, message: 'Tài khoản không phải Phó Viện trưởng' });
      }

      return res.json({
        success: true,
        message: 'Xác thực thành công',
        pvt: {
          id: user.id,
          fullName: user.fullName,
          roomCode: user.roomCode,
        },
      });
    } catch (err) {
      console.error('[VERIFY_PVT]', err);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }
);

// ============================================
// PUT /api/users/:id — CẦN LOGIN + CÙNG BỘ PHẬN
// ============================================
router.put(
  '/:id',
  authenticate,
  requireDepartment,
  requirePermission('user:update:all', 'user:update:own', 'user:update:department'),
  validateUpdateUser,
  usersController.updateUser
);

// ============================================
// DELETE /api/users/:id — CẦN LOGIN + CÙNG BỘ PHẬN
// ============================================
router.delete(
  '/:id',
  authenticate,
  requireDepartment,
  requirePermission('user:delete', 'user:delete:department'),
  usersController.deleteUser
);

// ============================================
// PUT /api/users/:id/roles — CẦN LOGIN
// ============================================
router.put(
  '/:id/roles',
  authenticate,
  requireDepartment,
  requirePermission('user:assign-role'),
  usersController.assignRoles
);

// ============================================
// POST /api/users/:id/reset-password — CẦN LOGIN
// ============================================
router.post(
  '/:id/reset-password',
  authenticate,
  requireDepartment,
  requirePermission('user:reset-password', 'user:update:department'),
  validateResetPassword,
  usersController.resetPassword
);

// ============================================
// PATCH /api/users/:id/toggle-active — CẦN LOGIN
// ============================================
router.patch(
  '/:id/toggle-active',
  authenticate,
  requireDepartment,
  requirePermission('user:update:all', 'user:update:department'),
  usersController.toggleActive
);

// ============================================
// POST /api/users/:id/ban — CẦN LOGIN (Ban / Khóa người dùng)
// ============================================
router.post(
  '/:id/ban',
  authenticate,
  requirePermission('user:update:all', 'user:update:department', 'forum:moderate'),
  usersController.banUser
);

export default router;