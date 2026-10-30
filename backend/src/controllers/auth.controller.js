// backend/src/controllers/auth.controller.js
import { authService } from '../services/auth.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { username, identifier, password } = req.body || {};
      const loginId = username || identifier;
      if (!loginId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên đăng nhập/email/SĐT và mật khẩu',
        });
      }
      const result = await authService.login({ username: loginId, password });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async registerParent(req, res, next) {
    try {
      const result = await authService.registerParent(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async registerApplicant(req, res, next) {
    try {
      const result = await authService.registerApplicant(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async createStudentSession(req, res, next) {
    try {
      const { studentId, pin } = req.body;
      const result = await authService.createStudentSession({
        parentUserId: req.user.id,
        studentId,
        pin,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async loginWithStudentCode(req, res, next) {
    try {
      const { code } = req.body;
      const result = await authService.loginWithStudentCode({ code });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async exitKidsMode(req, res, next) {
    try {
      const { pinOrPassword } = req.body;
      const result = await authService.exitKidsMode({
        parentUserId: req.user.id,
        pinOrPassword,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res) {
    res.json({ success: true, message: 'Đã đăng xuất' });
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};