// backend/src/middlewares/department.js
import prisma from '../config/prisma.js';

/**
 * Middleware chặn nhân sự (STAFF) thao tác trên người dùng ngoài bộ phận của mình.
 * - ADMIN: bypass toàn bộ kiểm tra.
 * - STAFF: 
 *   + Khi update/delete user theo req.params.id: target user phải cùng departmentId với req.user.
 *   + Không cho phép thao tác trên ADMIN hoặc tài khoản khác bộ phận.
 */
export async function requireDepartment(req, res, next) {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    const roles = currentUser.roles || [];

    // ADMIN bypass tất cả
    if (roles.includes('ADMIN')) {
      return next();
    }

    // Nếu không phải ADMIN, kiểm tra bộ phận của currentUser
    if (!currentUser.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản nhân sự chưa được phân bổ vào phòng ban',
      });
    }

    const targetUserId = req.params.id;

    // Nếu có targetUserId (update, delete, view detail)
    if (targetUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng mục tiêu',
        });
      }

      // Không cho phép staff can thiệp vào tài khoản ADMIN
      const targetRoles = targetUser.userRoles.map(ur => ur.role.code);
      if (targetRoles.includes('ADMIN')) {
        return res.status(403).json({
          success: false,
          message: 'Không được phép thao tác trên tài khoản Quản trị viên',
        });
      }

      // Kiểm tra cùng bộ phận
      if (targetUser.departmentId !== currentUser.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có quyền thao tác trên nhân sự thuộc bộ phận của mình',
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
