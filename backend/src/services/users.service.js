// backend/src/services/users.service.js
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

const DEFAULT_PASSWORD = 'password123';

const DEPT_ROLE_MAP = {
  DEPT_RECRUIT: ['STAFF_RECRUIT'],
  DEPT_MATCHING: ['STAFF_MATCHING'],
  DEPT_CS: ['STAFF_CS'],
  DEPT_TUTOR_CARE: ['STAFF_TUTOR_CARE'],
  DEPT_ACADEMIC: ['STAFF_ACADEMIC'],
  DEPT_FORUM: ['STAFF_FORUM'],
};

export const usersService = {
  // ============================================
  // 1. LẤY DANH SÁCH USERS
  // ============================================
  async getUsers(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const isGuest = !currentUser || !currentUser.id;
    const where = { deletedAt: null };

    if (!isGuest) {
      const perms = currentUser.permissions || [];
      const roles = currentUser.roles || [];
      const isPrivileged = roles.includes('ADMIN') || perms.includes('user:view:all');

      if (!isPrivileged) {
        if (perms.includes('user:view:department') && currentUser.departmentId) {
          where.OR = [
            { departmentId: currentUser.departmentId },
            { id: currentUser.id },
          ];
        } else {
          where.id = currentUser.id;
        }
      }
    }

    if (filters.search) {
      const search = filters.search;
      const searchOR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    if (filters.role) {
      where.userRoles = {
        some: { role: { code: filters.role } },
      };
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.active !== undefined) {
      where.active = filters.active === 'true' || filters.active === true;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          position: true,
          userType: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          departmentId: true,
          department: {
            select: { id: true, code: true, name: true },
          },
          parentProfile: {
            select: { province: true, district: true, address: true },
          },
          tutorProfile: {
            select: { province: true, district: true },
          },
          userRoles: {
            include: {
              role: {
                select: { id: true, code: true, name: true, level: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => {
      const roles = u.userRoles.map((ur) => ur.role);
      const primaryRole = roles[0]?.code || 'USER';

      const rawLocation = u.parentProfile?.address
        ? [u.parentProfile.address, u.parentProfile.district, u.parentProfile.province].filter(Boolean).join(', ')
        : [u.parentProfile?.district || u.tutorProfile?.district, u.parentProfile?.province || u.tutorProfile?.province].filter(Boolean).join(', ');
      const location = rawLocation || '—';

      return {
        ...u,
        roles,
        role: primaryRole,
        location,
        userRoles: undefined,
        ...(isGuest ? { email: undefined, phone: undefined } : {}),
      };
    });

    return {
      users: formatted,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT USER
  // ============================================
  async getUserById(userId, currentUser) {
    const isGuest = !currentUser || !currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
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

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    if (isGuest) {
      const roles = user.userRoles.map((ur) => ur.role.code);
      const { passwordHash, totpSecret, userRoles, ...userSafe } = user;
      return {
        ...userSafe,
        roles,
        permissions: [],
      };
    }

    const perms = currentUser.permissions || [];
    const userRoleCodes = currentUser.roles || [];
    const isPrivileged = userRoleCodes.includes('ADMIN') || perms.includes('user:view:all');

    if (!isPrivileged && user.id !== currentUser.id) {
      throw { status: 403, message: 'Không có quyền xem người dùng này' };
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = new Set();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.code);
      });
    });

    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      ...userSafe,
      roles,
      permissions: Array.from(permissions),
    };
  },

  // ============================================
  // 3. TẠO USER MỚI
  // ============================================
  async createUser(data, currentUser) {
    const {
      username,
      password,
      fullName,
      email,
      phone,
      position,
      departmentId,
      roleIds,
      role: roleCode,
      roleCodes,
    } = data;

    // Check username
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    if (existing) {
      throw { status: 400, message: 'Tên đăng nhập (username) đã tồn tại' };
    }

    // Check email
    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        throw { status: 400, message: 'Email đã được sử dụng' };
      }
    }

    // Check phone
    if (phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone },
      });
      if (phoneExists) {
        throw { status: 400, message: 'Số điện thoại đã được sử dụng' };
      }
    }

    // Resolve roles
    let finalRoleIds = roleIds;
    if (!finalRoleIds || finalRoleIds.length === 0) {
      const codes = roleCodes || (roleCode ? [roleCode] : ['PARENT']);
      const foundRoles = await prisma.role.findMany({
        where: { code: { in: codes } },
      });
      finalRoleIds = foundRoles.map((r) => r.id);
    }

    if (!finalRoleIds || finalRoleIds.length === 0) {
      const defaultRole = await prisma.role.findFirst({ where: { code: 'PARENT' } });
      if (defaultRole) finalRoleIds = [defaultRole.id];
    }

    const roles = await prisma.role.findMany({
      where: { id: { in: finalRoleIds } },
    });

    // Ràng buộc phòng ban & vai trò đối với nhân sự (không phải ADMIN)
    const isCurrentUserAdmin = currentUser?.roles?.includes('ADMIN');
    let effectiveDeptId = departmentId || null;

    if (!isCurrentUserAdmin && currentUser?.id) {
      if (!currentUser.departmentId) {
        throw { status: 403, message: 'Tài khoản nhân sự chưa được phân vào phòng ban' };
      }
      effectiveDeptId = currentUser.departmentId;

      const userDept = await prisma.department.findUnique({
        where: { id: currentUser.departmentId },
      });
      const allowedRoles = DEPT_ROLE_MAP[userDept?.code] || [];
      const hasDisallowedRole = roles.some((r) => !allowedRoles.includes(r.code));
      if (hasDisallowedRole) {
        throw {
          status: 403,
          message: `Nhân sự chỉ có quyền tạo tài khoản với vai trò thuộc bộ phận của mình (${allowedRoles.join(', ')})`,
        };
      }
    }

    // Xác định userType
    let userType = 'STAFF';
    if (roles.some((r) => r.code === 'PARENT')) userType = 'PARENT';
    else if (roles.some((r) => r.code === 'TUTOR' || r.code === 'APPLICANT')) userType = 'TUTOR';
    else if (roles.some((r) => r.code === 'STUDENT')) userType = 'STUDENT';

    // Hash password
    const finalPassword = password || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: username.trim(),
          passwordHash,
          fullName: fullName.trim(),
          email: email || null,
          phone: phone || null,
          position: position || null,
          departmentId: effectiveDeptId,
          userType,
          active: true,
        },
      });

      if (finalRoleIds.length > 0) {
        await tx.userRole.createMany({
          data: finalRoleIds.map((roleId) => ({
            userId: user.id,
            roleId,
            assignedBy: currentUser?.id || user.id,
          })),
        });
      }

      // Tạo hồ sơ tương ứng nếu là PARENT hoặc TUTOR kèm địa chỉ/khu vực
      const provinceVal = data.province || data.location || null;
      const districtVal = data.district || null;
      const addressVal = data.address || null;

      if (userType === 'PARENT') {
        await tx.parentProfile.create({
          data: {
            userId: user.id,
            province: provinceVal,
            district: districtVal,
            address: addressVal,
          },
        });
      } else if (userType === 'TUTOR' || roles.some((r) => r.code === 'TUTOR' || r.code === 'APPLICANT')) {
        await tx.tutorProfile.create({
          data: {
            userId: user.id,
            province: provinceVal,
            district: districtVal,
          },
        });
      }

      if (currentUser?.id) {
        await tx.auditLog.create({
          data: {
            userId: currentUser.id,
            userName: currentUser.fullName || currentUser.username || 'Admin',
            action: 'CREATE_USER',
            entityType: 'user',
            entityId: user.id,
            newValue: { username, fullName, userType, roleIds: finalRoleIds },
          },
        });
      }

      return user;
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return userSafe;
  },

  // ============================================
  // 4. CẬP NHẬT USER
  // ============================================
  async updateUser(userId, data, currentUser) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing || existing.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    const perms = currentUser.permissions || [];
    const userRoleCodes = currentUser.roles || [];
    const isPrivileged = userRoleCodes.includes('ADMIN');

    if (!isPrivileged && userId !== currentUser.id) {
      if (!currentUser.departmentId || existing.departmentId !== currentUser.departmentId) {
        throw { status: 403, message: 'Bạn chỉ có quyền sửa người dùng thuộc bộ phận của mình' };
      }
    }

    const updateData = {};
    const allowedFields = ['fullName', 'email', 'phone', 'avatarUrl', 'position', 'active'];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    if (isPrivileged && data.departmentId !== undefined) {
      updateData.departmentId = data.departmentId;
    } else if (!isPrivileged && currentUser.departmentId) {
      updateData.departmentId = currentUser.departmentId;
    }

    // Xử lý đổi password nếu có
    const rawPassword = data.password || data.newPassword;
    if (rawPassword && String(rawPassword).trim().length > 0) {
      const pwd = String(rawPassword).trim();
      if (pwd.length < 6) {
        throw { status: 400, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
      }
      updateData.passwordHash = await bcrypt.hash(pwd, 10);
      updateData.totpSecret = null;
      updateData.totpEnabled = false;
    }

    // Cập nhật roles nếu có
    if (data.roleCodes || data.roleCode) {
      const codes = data.roleCodes || [data.roleCode];
      if (!isPrivileged) {
        const userDept = await prisma.department.findUnique({
          where: { id: currentUser.departmentId },
        });
        const allowedRoles = DEPT_ROLE_MAP[userDept?.code] || [];
        const hasDisallowed = codes.some((c) => !allowedRoles.includes(c));
        if (hasDisallowed) {
          throw {
            status: 403,
            message: `Nhân sự chỉ được gán vai trò thuộc bộ phận của mình (${allowedRoles.join(', ')})`,
          };
        }
      }

      const targetRoles = await prisma.role.findMany({ where: { code: { in: codes } } });
      if (targetRoles.length > 0) {
        await prisma.userRole.deleteMany({ where: { userId } });
        await prisma.userRole.createMany({
          data: targetRoles.map((r) => ({
            userId,
            roleId: r.id,
            assignedBy: currentUser.id,
          })),
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (data.location !== undefined || data.province !== undefined || data.district !== undefined || data.address !== undefined) {
        const provinceVal = data.province !== undefined ? data.province : data.location;
        const districtVal = data.district;
        const addressVal = data.address;

        if (existing.userType === 'PARENT') {
          await tx.parentProfile.upsert({
            where: { userId },
            create: {
              userId,
              province: provinceVal || null,
              district: districtVal || null,
              address: addressVal || null,
            },
            update: {
              ...(provinceVal !== undefined && { province: provinceVal }),
              ...(districtVal !== undefined && { district: districtVal }),
              ...(addressVal !== undefined && { address: addressVal }),
            },
          });
        } else if (existing.userType === 'TUTOR') {
          await tx.tutorProfile.upsert({
            where: { userId },
            create: {
              userId,
              province: provinceVal || null,
              district: districtVal || null,
            },
            update: {
              ...(provinceVal !== undefined && { province: provinceVal }),
              ...(districtVal !== undefined && { district: districtVal }),
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: updateData.passwordHash ? 'UPDATE_USER_PASSWORD' : 'UPDATE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: { fullName: existing.fullName, phone: existing.phone },
          newValue: { ...updateData, passwordHash: updateData.passwordHash ? '***' : undefined },
        },
      });

      return user;
    });

    const { passwordHash, totpSecret, ...userSafe } = updated;
    return userSafe;
  },

  // ============================================
  // 5. XÓA USER (SOFT DELETE)
  // ============================================
  async deleteUser(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể xóa chính tài khoản đang đăng nhập' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể xóa tài khoản Quản trị viên tối cao' };
    }

    const isCurrentUserAdmin = currentUser.roles?.includes('ADMIN');
    if (!isCurrentUserAdmin) {
      if (!currentUser.departmentId || user.departmentId !== currentUser.departmentId) {
        throw { status: 403, message: 'Bạn chỉ có quyền xóa người dùng thuộc bộ phận của mình' };
      }
      if (user.userRoles.some((ur) => ur.role.code === 'ADMIN')) {
        throw { status: 403, message: 'Không thể xóa tài khoản Quản trị viên' };
      }
    }

    const stamp = Date.now();
    const finalUsername = `${user.username}__deleted_${stamp}`.slice(0, 100);
    const finalEmail = user.email ? `${user.email}__deleted_${stamp}`.slice(0, 200) : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          active: false,
          deletedAt: new Date(),
          username: finalUsername,
          email: finalEmail,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'DELETE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: { username: user.username, fullName: user.fullName },
          newValue: { deletedAt: new Date().toISOString() },
        },
      });
    });

    return {
      success: true,
      message: `Đã xóa tài khoản "${user.fullName}".`,
    };
  },

  // ============================================
  // 6. GÁN ROLES CHO USER
  // ============================================
  async assignRoles(userId, roleIds, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    if (!roleIds || roleIds.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 vai trò' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          assignedBy: currentUser.id,
        })),
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_ROLES',
          entityType: 'user',
          entityId: userId,
          newValue: { roleIds },
        },
      });
    });

    return { success: true, message: 'Đã cập nhật vai trò người dùng' };
  },

  // ============================================
  // 7. RESET PASSWORD
  // ============================================
  async resetPassword(userId, newPassword, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    const finalPassword = newPassword || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          totpSecret: null,
          totpEnabled: false,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'RESET_PASSWORD',
          entityType: 'user',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: `Đã reset mật khẩu cho "${user.fullName}". Mật khẩu mới: ${finalPassword}`,
      newPassword: finalPassword,
    };
  },

  // ============================================
  // 8. KHÓA / MỞ KHÓA USER
  // ============================================
  async toggleActive(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể khóa chính mình' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể khóa tài khoản Quản trị viên tối cao' };
    }

    const newActive = !user.active;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { active: newActive },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: newActive ? 'UNLOCK_USER' : 'LOCK_USER',
          entityType: 'user',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: newActive ? `Đã mở khóa tài khoản "${user.fullName}"` : `Đã khóa tài khoản "${user.fullName}"`,
      active: newActive,
    };
  },

  // ============================================
  // 9. BAN / KHÓA TẠM THỜI HOẶC VĨNH VIỄN
  // ============================================
  async banUser(userId, { durationHours, banReason }, currentUser) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể khóa tài khoản của chính mình' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể khóa tài khoản Quản trị viên tối cao' };
    }

    let bannedUntil = null;
    let message = '';

    if (durationHours === 0) {
      // Unban
      bannedUntil = null;
      message = `Đã gỡ lệnh cấm cho người dùng "${user.fullName}"`;
    } else if (durationHours === -1 || !durationHours) {
      // Vĩnh viễn (100 năm)
      bannedUntil = new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000);
      message = `Đã cấm vĩnh viễn người dùng "${user.fullName}". Lý do: ${banReason || 'Vi phạm nghiêm trọng'}`;
    } else {
      bannedUntil = new Date(Date.now() + Number(durationHours) * 3600 * 1000);
      message = `Đã khóa tạm thời người dùng "${user.fullName}" trong ${durationHours} giờ. Lý do: ${banReason || 'Vi phạm quy định'}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bannedUntil,
        banReason: durationHours === 0 ? null : (banReason || 'Vi phạm tiêu chuẩn cộng đồng'),
        active: durationHours === -1 ? false : user.active,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: durationHours === 0 ? 'UNBAN_USER' : 'BAN_USER',
        entityType: 'user',
        entityId: userId,
      },
    });

    return {
      success: true,
      message,
      user: {
        id: updatedUser.id,
        bannedUntil: updatedUser.bannedUntil,
        banReason: updatedUser.banReason,
      },
    };
  },
};
