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
      // Delay 300ms chống timing attack + brute force
      await new Promise(r => setTimeout(r, 300));
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    let roles = user.userRoles.map(ur => ur.role.code);
    if (roles.length === 0 && user.userType) {
      roles = [user.userType];
    }
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
      user: {
        ...userSafe,
        roles,
        permissions: Array.from(permissions),
      },
      roles,
      permissions: Array.from(permissions),
      token,
    };
  },

  // ============================================
  // CHECK KHẢ DỤNG USERNAME / EMAIL / PHONE (TRÁNH TRÙNG DB)
  // ============================================
  async checkAvailability({ username, email, phone }) {
    const checks = { username: true, email: true, phone: true };

    if (username && username.trim()) {
      const userWithUsername = await prisma.user.findFirst({
        where: {
          username: { equals: username.trim(), mode: 'insensitive' },
          deletedAt: null,
        },
      });
      checks.username = !userWithUsername;
    }

    if (email && email.trim()) {
      const userWithEmail = await prisma.user.findFirst({
        where: {
          email: { equals: email.trim(), mode: 'insensitive' },
          deletedAt: null,
        },
      });
      checks.email = !userWithEmail;
    }

    if (phone && phone.trim()) {
      const userWithPhone = await prisma.user.findFirst({
        where: {
          phone: phone.trim(),
          deletedAt: null,
        },
      });
      checks.phone = !userWithPhone;
    }

    const available = checks.username && checks.email && checks.phone;
    return {
      success: true,
      available,
      checks,
    };
  },

  // ============================================
  // ĐĂNG KÝ PHỤ HUYNH
  // ============================================
  async registerParent({
    username,
    password,
    fullName,
    phone,
    email,
    address,
    province,
    district,
    parentPin,
    children = [],
    childName,
    childGrade,
  }) {
    if (!username || !fullName || !phone) {
      throw { status: 400, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (họ tên, SĐT, tên đăng nhập)' };
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email ? email.trim().toLowerCase() : null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          { phone: trimmedPhone },
          ...(trimmedEmail ? [{ email: trimmedEmail }] : []),
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      let conflictField = 'Tên đăng nhập, số điện thoại hoặc email';
      if (existing.username.toLowerCase() === trimmedUsername) conflictField = 'Tên đăng nhập';
      else if (existing.phone === trimmedPhone) conflictField = 'Số điện thoại';
      else if (trimmedEmail && existing.email?.toLowerCase() === trimmedEmail) conflictField = 'Email';
      throw { status: 400, message: `${conflictField} đã tồn tại trong hệ thống. Vui lòng chọn giá trị khác.` };
    }

    const finalPassword = password && password.trim().length >= 6 ? password.trim() : 'password123';
    const passwordHash = await bcrypt.hash(finalPassword, 10);
    const parentPinHash = parentPin ? await bcrypt.hash(String(parentPin), 10) : null;

    const parentRole = await prisma.role.findUnique({ where: { code: 'PARENT' } });

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: trimmedUsername,
          passwordHash,
          parentPinHash,
          fullName: fullName.trim(),
          phone: trimmedPhone,
          email: trimmedEmail,
          userType: 'PARENT',
          active: true,
        },
      });

      if (parentRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: parentRole.id },
        });
      }

      const parentProfile = await tx.parentProfile.create({
        data: {
          userId: user.id,
          address,
          province,
          district,
        },
      });

      // Tạo các hồ sơ học sinh (con yêu) nếu có
      const childList = Array.isArray(children) && children.length > 0
        ? children
        : (childName && childName.trim() ? [{ fullName: childName.trim(), grade: childGrade }] : []);

      for (const child of childList) {
        if (child.fullName && child.fullName.trim()) {
          let gradeLevelId = 1;
          if (child.gradeLevelId) {
            gradeLevelId = Number(child.gradeLevelId);
          } else if (child.grade) {
            const num = parseInt(String(child.grade).replace(/\D/g, '')) || 1;
            const matchedGrade = await tx.gradeLevel.findFirst({
              where: { name: { contains: `${num}` } },
            });
            if (matchedGrade) gradeLevelId = matchedGrade.id;
          }

          await tx.studentProfile.create({
            data: {
              parentId: parentProfile.id,
              fullName: child.fullName.trim(),
              gradeLevelId,
              nickname: child.nickname || undefined,
            },
          });
        }
      }

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
      message: 'Đăng ký tài khoản phụ huynh thành công. Người quản trị sẽ liên lạc để xác thực và hỗ trợ.',
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

    let roleCodes = user.userRoles.map(ur => ur.role.code);
    if (roleCodes.length === 0 && user.userType) {
      roleCodes = [user.userType];
    }
    const roleDetails = user.userRoles.map(ur => ({
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
      roles: roleCodes,
      roleDetails,
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

  // ============================================
  // UPDATE PROFILE (Current User)
  // ============================================
  async updateProfile(userId, data) {
    const { fullName, email, phone, avatarUrl, location, address, bio } = data;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { parentProfile: true, tutorProfile: true },
    });
    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    if (email && email.toLowerCase() !== user.email?.toLowerCase()) {
      const emailExists = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), id: { not: userId }, deletedAt: null },
      });
      if (emailExists) {
        throw { status: 400, message: 'Email này đã được sử dụng bởi tài khoản khác' };
      }
    }
    if (phone && phone !== user.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: { phone, id: { not: userId }, deletedAt: null },
      });
      if (phoneExists) {
        throw { status: 400, message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(fullName !== undefined && { fullName: fullName.trim() }),
          ...(email !== undefined && { email: email.trim().toLowerCase() }),
          ...(phone !== undefined && { phone: phone.trim() }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
      });

      if (user.parentProfile) {
        await tx.parentProfile.update({
          where: { id: user.parentProfile.id },
          data: {
            ...(location !== undefined && { province: location }),
            ...(address !== undefined && { address }),
          },
        });
      }

      if (user.tutorProfile) {
        await tx.tutorProfile.update({
          where: { id: user.tutorProfile.id },
          data: {
            ...(location !== undefined && { province: location }),
            ...(bio !== undefined && { bio }),
          },
        });
      }
    });

    const fullUser = await this.getCurrentUser(userId);
    return { success: true, message: 'Cập nhật thông tin cá nhân thành công', user: fullUser };
  },
};

