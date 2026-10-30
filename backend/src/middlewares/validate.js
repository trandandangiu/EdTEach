// backend/src/middlewares/validate.js
import prisma from '../config/prisma.js';

// ============================================
// VALIDATE TẠO USER
// ============================================
export function validateCreateUser(req, res, next) {
  const {
    username,
    fullName,
    email,
    phone,
    roleIds,       // (array<int>) - dạng nội bộ
    role,          // (string)    - dạng cũ 1 role
    roleCode,      // (string)    - alias 1 role
    roleCodes,     // (array<str>) - FE AdminUsers đang gửi
  } = req.body || {};
  const errors = [];

  // 1. Username
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    errors.push('Username phải có ít nhất 3 ký tự');
  } else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
    errors.push('Username chỉ được chứa chữ, số, dấu chấm, gạch dưới, gạch ngang');
  }

  // 2. Full name
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Họ tên phải có ít nhất 2 ký tự');
  }

  // 3. Email (nếu có)
  if (email && typeof email === 'string' && email.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Email không hợp lệ');
    }
  }

  // 4. Phone (nếu có)
  if (phone && typeof phone === 'string' && phone.trim() !== '') {
    if (!/^[0-9]{10,11}$/.test(phone.trim())) {
      errors.push('Số điện thoại phải là 10-11 chữ số');
    }
  }

  // 5. Password (nếu có)
  if (req.body.password !== undefined) {
    if (typeof req.body.password !== 'string' || req.body.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }
  }

  // 6. Role — chấp nhận cả 4 dạng: roleIds | roleCodes | roleCode | role
  const hasRoleIds =
    Array.isArray(roleIds) && roleIds.length > 0 &&
    roleIds.every((id) => Number.isInteger(id) && id > 0);

  const hasRoleCodes =
    Array.isArray(roleCodes) && roleCodes.length > 0 &&
    roleCodes.every((c) => typeof c === 'string' && c.trim().length > 0);

  const hasRoleCode =
    typeof roleCode === 'string' && roleCode.trim().length > 0;

  const hasRole =
    typeof role === 'string' && role.trim().length > 0;

  if (!hasRoleIds && !hasRoleCodes && !hasRoleCode && !hasRole) {
    errors.push('Phải chọn ít nhất 1 vai trò');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors,
    });
  }

  next();
}

// ============================================
// VALIDATE UPDATE USER
// ============================================
export function validateUpdateUser(req, res, next) {
  const { fullName, email, phone } = req.body || {};

  if (fullName !== undefined) {
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên phải có ít nhất 2 ký tự',
      });
    }
  }

  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }
  }

  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string' || !/^[0-9]{10,11}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ',
      });
    }
  }

  next();
}

// ============================================
// VALIDATE RESET PASSWORD
// ============================================
export function validateResetPassword(req, res, next) {
  const { newPassword } = req.body || {};

  if (newPassword !== undefined) {
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }
  }

  next();
}