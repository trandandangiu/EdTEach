import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authService = {
  // ============================================
  // LOGIN THÔNG THƯỜNG
  // ============================================
  async login({ username, password }) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
          { phone: username },
        ],
      },
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
        department: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!user) {
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    if (!user.active || user.deletedAt) {
      throw { status: 403, message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa' };
    }

    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      throw {
        status: 403,
        message: `Tài khoản đã bị tạm khóa đến ${new Date(user.bannedUntil).toLocaleString('vi-VN')}. Lý do: ${user.banReason || 'Vi phạm tiêu chuẩn cộng đồng'}`,
      };
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    const roles = user.userRoles.map(ur => ur.role.code);
    const permissions = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        userType: user.userType,
        roles,
        departmentId: user.departmentId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash, totpSecret, parentPinHash, userRoles, ...userSafe } = user;

    return {
      success: true,
      user: userSafe,
      roles,
      permissions: Array.from(permissions),
      token,
    };
  },

  // ============================================
  // ĐĂNG KÝ PHỤ HUYNH
  // ============================================
  async registerParent({ username, password, fullName, phone, email, address, province, district, parentPin }) {
    if (!username || !password || !fullName || !phone) {
      throw { status: 400, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' };
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { phone }, ...(email ? [{ email }] : [])] },
    });

    if (existing) {
      throw { status: 400, message: 'Tên đăng nhập, số điện thoại hoặc email đã được sử dụng' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parentPinHash = parentPin ? await bcrypt.hash(String(parentPin), 10) : null;

    const parentRole = await prisma.role.findUnique({ where: { code: 'PARENT' } });

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          parentPinHash,
          fullName,
          phone,
          email,
          userType: 'PARENT',
          active: true,
        },
      });

      if (parentRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: parentRole.id },
        });
      }

      await tx.parentProfile.create({
        data: {
          userId: user.id,
          address,
          province,
          district,
        },
      });

      return user;
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        userType: 'PARENT',
        roles: ['PARENT'],
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'Đăng ký tài khoản phụ huynh thành công',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        userType: 'PARENT',
      },
    };
  },

  // ============================================
  // ĐĂNG KÝ ỨNG VIÊN GIA SƯ
  // ============================================
  async registerApplicant({ username, password, fullName, phone, email, province, district, occupation, school, major, degree, experienceYears, teachingMode, subjectLevelIds }) {
    if (!username || !password || !fullName || !phone || !email) {
      throw { status: 400, message: 'Vui lòng điền đầy đủ các thông tin ứng viên bắt buộc' };
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { phone }, { email }] },
    });

    if (existing) {
      throw { status: 400, message: 'Tên đăng nhập, số điện thoại hoặc email đã được sử dụng' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const applicantRole = await prisma.role.findUnique({ where: { code: 'APPLICANT' } });

    const appCode = `HS-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          fullName,
          phone,
          email,
          userType: 'TUTOR',
          active: true,
        },
      });

      if (applicantRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: applicantRole.id },
        });
      }

      const application = await tx.tutorApplication.create({
        data: {
          code: appCode,
          userId: user.id,
          fullName,
          phone,
          email,
          province,
          district,
          occupation,
          school,
          major,
          degree,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
          teachingMode: teachingMode || 'BOTH',
          status: 'DRAFT',
        },
      });

      if (Array.isArray(subjectLevelIds) && subjectLevelIds.length > 0) {
        for (const sId of subjectLevelIds) {
          await tx.tutorApplicationSubject.create({
            data: { applicationId: application.id, subjectLevelId: parseInt(sId, 10) },
          });
        }
      }

      return user;
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        userType: 'TUTOR',
        roles: ['APPLICANT'],
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'Đăng ký hồ sơ ứng viên thành công. Vui lòng tải lên CV và hoàn tất bài test năng lực.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        userType: 'TUTOR',
      },
    };
  },

  // ============================================
  // KIDS MODE: CHUYỂN ĐỔI SANG PHIÊN HỌC SINH (Profile Switcher)
  // ============================================
  async createStudentSession({ parentUserId, studentId, pin }) {
    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        parent: { userId: parentUserId },
      },
      include: { gradeLevel: true },
    });

    if (!student || !student.active) {
      throw { status: 404, message: 'Không tìm thấy hồ sơ học sinh' };
    }

    if (student.pinHash) {
      if (!pin) {
        throw { status: 400, message: 'Vui lòng nhập mã PIN của bé' };
      }
      const match = await bcrypt.compare(String(pin), student.pinHash);
      if (!match) {
        throw { status: 401, message: 'Mã PIN của bé không chính xác' };
      }
    }

    const studentToken = jwt.sign(
      {
        id: parentUserId,
        studentId: student.id,
        actorType: 'STUDENT',
        roles: ['STUDENT'],
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    return {
      success: true,
      token: studentToken,
      student: {
        id: student.id,
        fullName: student.fullName,
        nickname: student.nickname,
        avatarKey: student.avatarKey,
        gradeName: student.gradeLevel.name,
        uiMode: student.uiMode,
      },
    };
  },

  // ============================================
  // KIDS MODE: ĐĂNG NHẬP BẰNG MÃ 6 SỐ (Thiết bị riêng của bé)
  // ============================================
  async loginWithStudentCode({ code }) {
    if (!code) {
      throw { status: 400, message: 'Vui lòng nhập mã đăng nhập' };
    }

    const now = new Date();
    const loginCodes = await prisma.studentLoginCode.findMany({
      where: {
        expiresAt: { gte: now },
        usedAt: null,
      },
      include: {
        student: {
          include: { parent: { include: { user: true } }, gradeLevel: true },
        },
      },
    });

    let matchedCodeRecord = null;
    for (const record of loginCodes) {
      const isMatch = await bcrypt.compare(String(code), record.codeHash);
      if (isMatch) {
        matchedCodeRecord = record;
        break;
      }
    }

    if (!matchedCodeRecord) {
      throw { status: 401, message: 'Mã đăng nhập không chính xác hoặc đã hết hạn' };
    }

    await prisma.studentLoginCode.update({
      where: { id: matchedCodeRecord.id },
      data: { usedAt: new Date() },
    });

    const student = matchedCodeRecord.student;
    const studentToken = jwt.sign(
      {
        id: student.parent.user.id,
        studentId: student.id,
        actorType: 'STUDENT',
        roles: ['STUDENT'],
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      success: true,
      token: studentToken,
      student: {
        id: student.id,
        fullName: student.fullName,
        nickname: student.nickname,
        avatarKey: student.avatarKey,
        gradeName: student.gradeLevel.name,
        uiMode: student.uiMode,
      },
    };
  },

  // ============================================
  // KIDS MODE: THOÁT KIDS MODE (Parental Gate)
  // ============================================
  async exitKidsMode({ parentUserId, pinOrPassword }) {
    if (!pinOrPassword) {
      throw { status: 400, message: 'Vui lòng nhập mã PIN phụ huynh hoặc mật khẩu để mở khóa' };
    }

    const parentUser = await prisma.user.findUnique({
      where: { id: parentUserId },
    });

    if (!parentUser) {
      throw { status: 404, message: 'Không tìm thấy tài khoản phụ huynh' };
    }

    let isAuthorized = false;
    if (parentUser.parentPinHash) {
      isAuthorized = await bcrypt.compare(String(pinOrPassword), parentUser.parentPinHash);
    }
    if (!isAuthorized) {
      isAuthorized = await bcrypt.compare(String(pinOrPassword), parentUser.passwordHash);
    }

    if (!isAuthorized) {
      throw { status: 401, message: 'Mã PIN hoặc mật khẩu phụ huynh không chính xác' };
    }

    return {
      success: true,
      message: 'Mở khóa thành công. Đã thoát chế độ Học sinh.',
    };
  },

  // ============================================
  // GET CURRENT USER — /api/auth/me
  // ============================================
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        department: {
          select: { id: true, code: true, name: true },
        },
        parentProfile: {
          include: {
            children: {
              where: { active: true },
              include: { gradeLevel: true },
            },
          },
        },
        tutorProfile: true,
      },
    });

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (!user.active || user.deletedAt) {
      throw { status: 403, message: 'Tài khoản đã bị khóa' };
    }

    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
      level: ur.role.level,
    }));

    const permissions = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    const { passwordHash, totpSecret, parentPinHash, userRoles, ...userSafe } = user;

    return {
      ...userSafe,
      roles,
      permissions: Array.from(permissions),
    };
  },

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw { status: 400, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' };
    }
    if (newPassword.length < 6) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      throw { status: 401, message: 'Mật khẩu hiện tại không chính xác' };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true, message: 'Đổi mật khẩu thành công' };
  },
};
