// backend/src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export async function authenticate(req, res, next) {
  let token = null;

  // 1. Header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Query param (cho SSE EventSource)
  if (!token && req.query.token) {
    token = String(req.query.token);
  }

  // 3. Cookie
  if (!token) {
    token = req.cookies?.accessToken
      || req.cookies?.token
      || req.cookies?.jwt;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Chưa đăng nhập',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hỗ trợ phiên Kids Mode (Học sinh)
    if (decoded.actorType === 'STUDENT' && decoded.studentId) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: decoded.studentId },
        include: { parent: { include: { user: true } } },
      });

      if (!student || !student.active || !student.parent?.user?.active) {
        return res.status(401).json({
          success: false,
          message: 'Hồ sơ học sinh không hợp lệ hoặc đã bị khóa',
        });
      }

      // Lấy permissions của role STUDENT
      const studentRole = await prisma.role.findUnique({
        where: { code: 'STUDENT' },
        include: { rolePermissions: { include: { permission: true } } },
      });

      const permissions = studentRole
        ? studentRole.rolePermissions.map(rp => rp.permission.code)
        : ['game:play', 'task:submit', 'task:view:own'];

      req.user = {
        id: student.parent.user.id,
        parentId: student.parentId,
        studentId: student.id,
        actorType: 'STUDENT',
        fullName: student.fullName,
        username: student.nickname || student.fullName,
        roles: ['STUDENT'],
        role: 'STUDENT',
        permissions,
      };

      return next();
    }

    // Tài khoản thông thường (User)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không hợp lệ hoặc đã bị khóa',
      });
    }

    let roles = user.userRoles.map(ur => ur.role.code);
    if (roles.length === 0 && user.userType) {
      roles = [user.userType];
    }

    const permsSet = new Set(
      user.userRoles.flatMap(ur =>
        ur.role.rolePermissions.map(rp => rp.permission.code)
      )
    );

    // Fallback default permissions theo userType nếu chưa được cấu hình RolePermission trong DB
    if (roles.includes('PARENT') || user.userType === 'PARENT') {
      [
        'student:manage:own',
        'student:view:all',
        'class_request:create',
        'class_request:view:own',
        'lesson_report:view:own',
        'lesson_report:confirm',
      ].forEach(p => permsSet.add(p));
    }

    if (roles.includes('TUTOR') || user.userType === 'TUTOR') {
      [
        'tutor:profile:manage',
        'class:view:own',
        'lesson:report:submit',
        'task:create',
        'task:review',
      ].forEach(p => permsSet.add(p));
    }

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      userType: user.userType,
      departmentId: user.departmentId,
      actorType: user.userType,
      roles,
      role: roles[0],
      permissions: Array.from(permsSet),
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(r));

    if (!hasRole && !userRoles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    next();
  };
}

export async function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token && req.query.token) {
    token = String(req.query.token);
  }
  if (!token) {
    token = req.cookies?.accessToken
      || req.cookies?.token
      || req.cookies?.jwt;
  }

  if (!token) {
    req.user = null;
    req.isGuest = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.actorType === 'STUDENT' && decoded.studentId) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: decoded.studentId },
        include: { parent: { include: { user: true } } },
      });

      if (!student || !student.active || !student.parent?.user?.active) {
        req.user = null;
        req.isGuest = true;
        return next();
      }

      req.user = {
        id: student.parent.user.id,
        parentId: student.parentId,
        studentId: student.id,
        actorType: 'STUDENT',
        fullName: student.fullName,
        roles: ['STUDENT'],
        role: 'STUDENT',
        permissions: ['game:play', 'task:submit', 'task:view:own'],
      };
      req.isGuest = false;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt || !user.active) {
      req.user = null;
      req.isGuest = true;
      return next();
    }

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      userType: user.userType,
      departmentId: user.departmentId,
      actorType: user.userType,
      roles: user.userRoles.map(ur => ur.role.code),
      role: user.userRoles[0]?.role.code,
      permissions: Array.from(
        new Set(
          user.userRoles.flatMap(ur =>
            ur.role.rolePermissions.map(rp => rp.permission.code)
          )
        )
      ),
    };
    req.isGuest = false;
    next();
  } catch (err) {
    req.user = null;
    req.isGuest = true;
    next();
  }
}
