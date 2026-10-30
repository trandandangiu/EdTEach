// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu EdTech Platform...');

  // ============================================
  // 1. TẠO 5 PHÒNG BAN CHUYÊN TRÁCH
  // ============================================
  console.log('🏢 Tạo các phòng ban...');
  const departments = [
    { code: 'DEPT_RECRUIT', name: 'Phòng Tuyển dụng & Thẩm định', order: 1, description: 'Quản lý tuyển sinh, thẩm định hồ sơ, bài test và phỏng vấn gia sư' },
    { code: 'DEPT_MATCHING', name: 'Phòng Điều phối & Ghép lớp', order: 2, description: 'Tiếp nhận yêu cầu tìm gia sư, gửi offer và điều phối lớp học' },
    { code: 'DEPT_CS', name: 'Phòng CSKH (Phụ huynh)', order: 3, description: 'Chăm sóc phụ huynh, theo dõi buổi học chưa xác nhận và giải quyết khiếu nại' },
    { code: 'DEPT_TUTOR_CARE', name: 'Phòng Chăm sóc Gia sư', order: 4, description: 'Đôn đốc gia sư nộp nhật ký buổi học, hỗ trợ giảng dạy và xử lý vi phạm' },
    { code: 'DEPT_ACADEMIC', name: 'Phòng Giám sát Học thuật', order: 5, description: 'Kiểm soát chất lượng sư phạm, ngân hàng đề thi, bài tập và diễn đàn' },
    { code: 'DEPT_FORUM', name: 'Ban Kiểm duyệt Diễn đàn', order: 6, description: 'Kiểm soát nội dung, kiểm duyệt bài viết và xử lý vi phạm diễn đàn' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${departments.length} phòng ban`);

  // ============================================
  // 2. TẠO DANH MỤC ROLES
  // ============================================
  console.log('👥 Tạo các roles...');
  const roles = [
    { id: 1, code: 'ADMIN', name: 'Tổng quản trị', level: 0, isSystem: true, description: 'Quản trị viên toàn hệ thống' },
    { id: 2, code: 'STAFF_RECRUIT', name: 'Chuyên viên Tuyển dụng', level: 1, isSystem: true, description: 'Thẩm định hồ sơ gia sư, phỏng vấn' },
    { id: 3, code: 'STAFF_MATCHING', name: 'Điều phối viên', level: 1, isSystem: true, description: 'Ghép lớp, gửi offer, điều phối học sinh' },
    { id: 4, code: 'STAFF_CS', name: 'Chuyên viên CSKH', level: 1, isSystem: true, description: 'Hỗ trợ phụ huynh, xác nhận buổi học' },
    { id: 5, code: 'STAFF_TUTOR_CARE', name: 'Chuyên viên CS Gia sư', level: 1, isSystem: true, description: 'Nhắc nhở, hỗ trợ gia sư' },
    { id: 6, code: 'STAFF_ACADEMIC', name: 'Chuyên viên Học thuật', level: 1, isSystem: true, description: 'Quản lý đề test, chất lượng học tập' },
    { id: 7, code: 'STAFF_FORUM', name: 'Kiểm duyệt diễn đàn', level: 1, isSystem: true, description: 'Kiểm duyệt bài viết, xử lý vi phạm diễn đàn' },
    { id: 8, code: 'DEPT_MANAGER', name: 'Trưởng bộ phận', level: 1, isSystem: true, description: 'Quản lý và thống kê cấp phòng' },
    { id: 10, code: 'APPLICANT', name: 'Ứng viên gia sư', level: 3, isSystem: true, description: 'Ứng viên đang nộp hồ sơ và làm bài test' },
    { id: 11, code: 'TUTOR', name: 'Gia sư chính thức', level: 2, isSystem: true, description: 'Gia sư đã được duyệt' },
    { id: 12, code: 'PARENT', name: 'Phụ huynh', level: 2, isSystem: true, description: 'Khách hàng phụ huynh học sinh' },
    { id: 13, code: 'STUDENT', name: 'Học sinh', level: 3, isSystem: true, description: 'Học sinh làm nhiệm vụ và ôn tập' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { code: role.code, name: role.name, description: role.description, level: role.level },
      create: role,
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${roles.length} roles`);

  // ============================================
  // 3. TẠO PERMISSIONS ĐẦY ĐỦ
  // ============================================
  console.log('🔑 Tạo permissions...');
  const permissions = [
    // user
    { code: 'user:view:all', name: 'Xem tất cả người dùng', module: 'user', action: 'view', scope: 'all' },
    { code: 'user:create', name: 'Tạo tài khoản người dùng', module: 'user', action: 'create' },
    { code: 'user:create:department', name: 'Tạo tài khoản trong bộ phận', module: 'user', action: 'create', scope: 'department' },
    { code: 'user:update:all', name: 'Cập nhật mọi người dùng', module: 'user', action: 'update', scope: 'all' },
    { code: 'user:update:own', name: 'Cập nhật tài khoản cá nhân', module: 'user', action: 'update', scope: 'own' },
    { code: 'user:update:department', name: 'Cập nhật tài khoản trong bộ phận', module: 'user', action: 'update', scope: 'department' },
    { code: 'user:delete', name: 'Xóa tài khoản', module: 'user', action: 'delete' },
    { code: 'user:delete:department', name: 'Xóa tài khoản trong bộ phận', module: 'user', action: 'delete', scope: 'department' },
    { code: 'user:reset-password', name: 'Khôi phục mật khẩu', module: 'user', action: 'reset-password' },
    { code: 'user:assign-role', name: 'Gán vai trò tài khoản', module: 'user', action: 'assign-role' },

    // catalog
    { code: 'catalog:manage', name: 'Quản lý danh mục giáo dục', module: 'catalog', action: 'manage' },

    // tutor_app
    { code: 'tutor_app:submit', name: 'Nộp hồ sơ gia sư', module: 'tutor_app', action: 'submit' },
    { code: 'tutor_app:view:own', name: 'Xem hồ sơ của mình', module: 'tutor_app', action: 'view', scope: 'own' },
    { code: 'tutor_app:view:all', name: 'Xem tất cả hồ sơ gia sư', module: 'tutor_app', action: 'view', scope: 'all' },
    { code: 'tutor_app:review', name: 'Thẩm định hồ sơ & xếp phỏng vấn', module: 'tutor_app', action: 'review' },
    { code: 'tutor_app:decide', name: 'Phê duyệt / Từ chối gia sư', module: 'tutor_app', action: 'decide' },

    // assessment
    { code: 'assessment:take', name: 'Làm bài kiểm tra năng lực', module: 'assessment', action: 'take' },
    { code: 'assessment:manage', name: 'Quản lý ngân hàng đề test', module: 'assessment', action: 'manage' },
    { code: 'assessment:grade', name: 'Chấm bài tự luận ứng viên', module: 'assessment', action: 'grade' },

    // tutor
    { code: 'tutor:view:all', name: 'Xem danh sách gia sư', module: 'tutor', action: 'view', scope: 'all' },
    { code: 'tutor:update:own', name: 'Cập nhật thông tin gia sư của mình', module: 'tutor', action: 'update', scope: 'own' },
    { code: 'tutor:suspend', name: 'Đình chỉ / Kích hoạt gia sư', module: 'tutor', action: 'suspend' },

    // student & family
    { code: 'student:manage:own', name: 'Quản lý hồ sơ con', module: 'student', action: 'manage', scope: 'own' },
    { code: 'student:view:all', name: 'Xem tất cả học sinh', module: 'student', action: 'view', scope: 'all' },

    // class_request
    { code: 'class_request:create', name: 'Tạo yêu cầu tìm gia sư', module: 'class_request', action: 'create' },
    { code: 'class_request:view:own', name: 'Xem yêu cầu của mình', module: 'class_request', action: 'view', scope: 'own' },
    { code: 'class_request:view:all', name: 'Xem tất cả yêu cầu', module: 'class_request', action: 'view', scope: 'all' },
    { code: 'class_request:handle', name: 'Xử lý yêu cầu ghép lớp', module: 'class_request', action: 'handle' },
    { code: 'class_request:cancel:own', name: 'Hủy yêu cầu tìm gia sư', module: 'class_request', action: 'cancel', scope: 'own' },

    // offer & board
    { code: 'offer:create', name: 'Gửi offer lớp học', module: 'offer', action: 'create' },
    { code: 'offer:respond', name: 'Phản hồi offer (Đồng ý/Từ chối)', module: 'offer', action: 'respond' },
    { code: 'offer:select', name: 'Lựa chọn gia sư nhận lớp', module: 'offer', action: 'select' },
    { code: 'offer:view:own', name: 'Xem offer của mình', module: 'offer', action: 'view', scope: 'own' },
    { code: 'board:view', name: 'Xem Bảng lớp mở', module: 'board', action: 'view' },
    { code: 'board:apply', name: 'Ứng tuyển lớp trên bảng mở', module: 'board', action: 'apply' },

    // class
    { code: 'class:view:all', name: 'Xem mọi lớp học', module: 'class', action: 'view', scope: 'all' },
    { code: 'class:view:assigned', name: 'Xem lớp được phân công dạy', module: 'class', action: 'view', scope: 'assigned' },
    { code: 'class:view:own', name: 'Xem lớp của con mình', module: 'class', action: 'view', scope: 'own' },
    { code: 'class:create', name: 'Tạo lớp học', module: 'class', action: 'create' },
    { code: 'class:create:own', name: 'Gia sư tạo lớp nhóm đề xuất', module: 'class', action: 'create', scope: 'own' },
    { code: 'class:approve', name: 'Phê duyệt lớp nhóm', module: 'class', action: 'approve' },
    { code: 'class:update', name: 'Cập nhật thông tin lớp', module: 'class', action: 'update' },
    { code: 'class:enroll', name: 'Thêm / Bớt học sinh vào lớp', module: 'class', action: 'enroll' },
    { code: 'class:close', name: 'Đóng / Hoàn thành lớp học', module: 'class', action: 'close' },

    // lesson & report
    { code: 'lesson:reschedule', name: 'Đổi lịch buổi học', module: 'lesson', action: 'reschedule' },
    { code: 'lesson:cancel', name: 'Hủy buổi học', module: 'lesson', action: 'cancel' },
    { code: 'lesson_report:create', name: 'Nộp nhận xét sổ liên lạc', module: 'lesson_report', action: 'create' },
    { code: 'lesson_report:view:assigned', name: 'Xem nhật ký lớp mình dạy', module: 'lesson_report', action: 'view', scope: 'assigned' },
    { code: 'lesson_report:view:own', name: 'Xem nhật ký buổi học của con', module: 'lesson_report', action: 'view', scope: 'own' },
    { code: 'lesson_report:view:all', name: 'Xem tất cả sổ liên lạc', module: 'lesson_report', action: 'view', scope: 'all' },
    { code: 'lesson_report:confirm', name: 'Xác nhận buổi học', module: 'lesson_report', action: 'confirm' },
    { code: 'lesson_report:confirm:on-behalf', name: 'CSKH xác nhận thay phụ huynh', module: 'lesson_report', action: 'confirm:on-behalf' },

    // care
    { code: 'care:view:team', name: 'Xem phiếu chăm sóc của đội', module: 'care', action: 'view', scope: 'team' },
    { code: 'care:view:all', name: 'Xem mọi phiếu chăm sóc', module: 'care', action: 'view', scope: 'all' },
    { code: 'care:handle', name: 'Xử lý phiếu chăm sóc', module: 'care', action: 'handle' },
    { code: 'care:contact-log', name: 'Ghi nhật ký liên hệ (gọi điện/Zalo)', module: 'care', action: 'contact-log' },

    // task & game
    { code: 'task:create', name: 'Giao bài tập về nhà', module: 'task', action: 'create' },
    { code: 'task:review', name: 'Nhận xét bài nộp của học sinh', module: 'task', action: 'review' },
    { code: 'task:submit', name: 'Học sinh nộp bài tập', module: 'task', action: 'submit' },
    { code: 'task:view:own', name: 'Xem bài tập của mình', module: 'task', action: 'view', scope: 'own' },
    { code: 'game:play', name: 'Chơi mini-game ôn tập', module: 'game', action: 'play' },
    { code: 'game:manage', name: 'Quản lý game và nội dung câu hỏi', module: 'game', action: 'manage' },

    // forum
    { code: 'forum:post', name: 'Đăng bài trên diễn đàn', module: 'forum', action: 'post' },
    { code: 'forum:comment', name: 'Bình luận bài viết', module: 'forum', action: 'comment' },
    { code: 'forum:moderate', name: 'Kiểm duyệt bài viết, bình luận', module: 'forum', action: 'moderate' },

    // stats & admin
    { code: 'stats:view:all', name: 'Xem báo cáo thống kê toàn viện', module: 'stats', action: 'view', scope: 'all' },
    { code: 'stats:view:department', name: 'Xem thống kê bộ phận', module: 'stats', action: 'view', scope: 'department' },
    { code: 'admin:database:view', name: 'Xem trình duyệt CSDL', module: 'admin', action: 'database:view' },
    { code: 'admin:audit-logs:view', name: 'Xem nhật ký hệ thống', module: 'admin', action: 'audit-logs:view' },
    { code: 'admin:settings:manage', name: 'Quản lý cấu hình hệ thống', module: 'admin', action: 'settings:manage' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, action: perm.action, scope: perm.scope },
      create: { ...perm, isSystem: true },
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${permissions.length} permissions`);

  // ============================================
  // 4. GÁN PERMISSIONS CHO CÁC ROLES
  // ============================================
  console.log('🔗 Gán permissions cho roles...');
  const rolePermMap = {
    STAFF_RECRUIT: [
      'tutor_app:view:all', 'tutor_app:review', 'tutor_app:decide',
      'assessment:grade', 'tutor:view:all', 'stats:view:department',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    STAFF_MATCHING: [
      'class_request:view:all', 'class_request:handle', 'offer:create', 'offer:select',
      'class:view:all', 'class:create', 'class:approve', 'class:update', 'class:enroll', 'class:close',
      'tutor:view:all', 'student:view:all', 'stats:view:department',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    STAFF_CS: [
      'class_request:create', 'class_request:view:all', 'class:view:all',
      'lesson_report:view:all', 'lesson_report:confirm:on-behalf',
      'care:view:team', 'care:handle', 'care:contact-log',
      'stats:view:department', 'forum:moderate',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    STAFF_TUTOR_CARE: [
      'tutor:view:all', 'class:view:all', 'lesson_report:view:all',
      'care:view:team', 'care:handle', 'care:contact-log',
      'stats:view:department',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    STAFF_ACADEMIC: [
      'assessment:manage', 'assessment:grade', 'game:manage',
      'class:view:all', 'lesson_report:view:all',
      'care:view:team', 'care:handle', 'care:contact-log',
      'forum:moderate', 'stats:view:department',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    STAFF_FORUM: [
      'forum:post', 'forum:comment', 'forum:moderate', 'stats:view:department',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    DEPT_MANAGER: [
      'stats:view:department', 'care:view:all',
      'user:create:department', 'user:update:department', 'user:delete:department',
    ],
    APPLICANT: [
      'tutor_app:submit', 'tutor_app:view:own', 'assessment:take',
    ],
    TUTOR: [
      'user:update:own', 'tutor:update:own', 'offer:view:own', 'offer:respond',
      'board:view', 'board:apply',
      'class:view:assigned', 'class:create:own',
      'lesson_report:create', 'lesson_report:view:assigned',
      'task:create', 'task:review',
      'forum:post', 'forum:comment',
    ],
    PARENT: [
      'user:update:own', 'student:manage:own',
      'class_request:create', 'class_request:view:own', 'class_request:cancel:own',
      'class:view:own', 'lesson_report:view:own', 'lesson_report:confirm',
      'forum:post', 'forum:comment',
    ],
    STUDENT: [
      'game:play', 'task:submit', 'task:view:own',
    ],
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermMap)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    for (const code of permCodes) {
      const perm = await prisma.permission.findUnique({ where: { code } });
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log('✅ Đã gán permissions cho roles');

  // ============================================
  // 5. TẠO DANH MỤC CẤP 1 (LỚP 1 - 5, TOÁN, TV, TA)
  // ============================================
  console.log('📚 Tạo danh mục giáo dục Cấp 1...');
  const eduPrimary = await prisma.educationLevel.upsert({
    where: { code: 'PRIMARY' },
    update: { name: 'Tiểu học (Cấp 1)', order: 1 },
    create: { code: 'PRIMARY', name: 'Tiểu học (Cấp 1)', order: 1 },
  });

  const gradeList = [
    { code: 'G1', name: 'Lớp 1', order: 1 },
    { code: 'G2', name: 'Lớp 2', order: 2 },
    { code: 'G3', name: 'Lớp 3', order: 3 },
    { code: 'G4', name: 'Lớp 4', order: 4 },
    { code: 'G5', name: 'Lớp 5', order: 5 },
  ];

  const grades = {};
  for (const g of gradeList) {
    grades[g.code] = await prisma.gradeLevel.upsert({
      where: { code: g.code },
      update: { name: g.name, order: g.order, educationLevelId: eduPrimary.id },
      create: { code: g.code, name: g.name, order: g.order, educationLevelId: eduPrimary.id },
    });
  }

  const catStem = await prisma.subjectCategory.upsert({
    where: { code: 'STEM' },
    update: { name: 'Khoa học & Tự nhiên', order: 1 },
    create: { code: 'STEM', name: 'Khoa học & Tự nhiên', order: 1 },
  });

  const catLang = await prisma.subjectCategory.upsert({
    where: { code: 'LANGUAGE' },
    update: { name: 'Ngôn ngữ & Xã hội', order: 2 },
    create: { code: 'LANGUAGE', name: 'Ngôn ngữ & Xã hội', order: 2 },
  });

  const subjMath = await prisma.subject.upsert({
    where: { code: 'MATH' },
    update: { name: 'Toán học', categoryId: catStem.id, color: '#3B82F6', icon: 'Calculator' },
    create: { code: 'MATH', name: 'Toán học', categoryId: catStem.id, color: '#3B82F6', icon: 'Calculator' },
  });

  const subjViet = await prisma.subject.upsert({
    where: { code: 'VIETNAMESE' },
    update: { name: 'Tiếng Việt', categoryId: catLang.id, color: '#EF4444', icon: 'BookOpen' },
    create: { code: 'VIETNAMESE', name: 'Tiếng Việt', categoryId: catLang.id, color: '#EF4444', icon: 'BookOpen' },
  });

  const subjEng = await prisma.subject.upsert({
    where: { code: 'ENGLISH' },
    update: { name: 'Tiếng Anh Phonics', categoryId: catLang.id, color: '#10B981', icon: 'Languages' },
    create: { code: 'ENGLISH', name: 'Tiếng Anh Phonics', categoryId: catLang.id, color: '#10B981', icon: 'Languages' },
  });

  // Tạo SubjectLevel cho Lớp 1 -> 5
  for (const g of gradeList) {
    const grade = grades[g.code];
    await prisma.subjectLevel.upsert({
      where: { subjectId_gradeLevelId: { subjectId: subjMath.id, gradeLevelId: grade.id } },
      update: { displayName: `Toán học vui ${g.name}` },
      create: { subjectId: subjMath.id, gradeLevelId: grade.id, displayName: `Toán học vui ${g.name}` },
    });
    await prisma.subjectLevel.upsert({
      where: { subjectId_gradeLevelId: { subjectId: subjViet.id, gradeLevelId: grade.id } },
      update: { displayName: `Tiếng Việt luyện chữ ${g.name}` },
      create: { subjectId: subjViet.id, gradeLevelId: grade.id, displayName: `Tiếng Việt luyện chữ ${g.name}` },
    });
    await prisma.subjectLevel.upsert({
      where: { subjectId_gradeLevelId: { subjectId: subjEng.id, gradeLevelId: grade.id } },
      update: { displayName: `Tiếng Anh thiếu nhi ${g.name}` },
      create: { subjectId: subjEng.id, gradeLevelId: grade.id, displayName: `Tiếng Anh thiếu nhi ${g.name}` },
    });
  }
  console.log('✅ Đã tạo danh mục Lớp 1 - 5 cho Toán, Tiếng Việt, Tiếng Anh');

  // ============================================
  // 6. TẠO ĐỀ TEST ĐÁNH GIÁ GIA SƯ MẪU
  // ============================================
  console.log('📝 Tạo bài test đánh giá gia sư mẫu...');
  const pedTest = await prisma.assessmentTest.upsert({
    where: { code: 'PEDAGOGY_GEN' },
    update: {},
    create: {
      code: 'PEDAGOGY_GEN',
      title: 'Kiểm tra Nghiệp vụ Sư phạm & Tâm lý Lứa tuổi Tiểu học',
      kind: 'PEDAGOGY',
      durationMin: 20,
      questionCount: 3,
      passPercent: 70,
    },
  });

  const pedQuestions = [
    {
      content: 'Khi học sinh lớp 2 mất tập trung và nghịch đồ chơi trong giờ học, gia sư nên làm gì trước tiên?',
      type: 'SINGLE_CHOICE',
      options: [
        { key: 'A', text: 'Quát mắng và tịch thu đồ chơi' },
        { key: 'B', text: 'Nhẹ nhàng tạm dừng, lồng ghép trò chơi ngắn liên quan bài học để kéo sự chú ý' },
        { key: 'C', text: 'Bỏ qua và tiếp tục giảng bài một mình' },
        { key: 'D', text: 'Gọi điện báo phụ huynh ngay lập tức trong giờ' },
      ],
      answerKey: ['B'],
      points: 1,
      explanation: 'Học sinh tiểu học có thời gian tập trung ngắn (15-20 phút), cần đổi phương pháp nhẹ nhàng.',
    },
    {
      content: 'Phương pháp nào sau đây giúp học sinh lớp 1 ghi nhớ mặt chữ và số hiệu quả nhất?',
      type: 'SINGLE_CHOICE',
      options: [
        { key: 'A', text: 'Chép phạt 100 lần' },
        { key: 'B', text: 'Học vẹt thuộc lòng' },
        { key: 'C', text: 'Sử dụng hình ảnh trực quan, đồ vật thực tế và bài vè vần điệu' },
        { key: 'D', text: 'Chỉ đọc sách giáo khoa' },
      ],
      answerKey: ['C'],
      points: 1,
    },
    {
      content: 'Hãy mô tả ngắn gọn (3-5 câu) kế hoạch của bạn trong 5 phút đầu buổi học đầu tiên để tạo thiện cảm với học sinh tiểu học.',
      type: 'ESSAY',
      points: 2,
    },
  ];

  for (const q of pedQuestions) {
    const existing = await prisma.assessmentQuestion.findFirst({
      where: { testId: pedTest.id, content: q.content },
    });
    if (!existing) {
      await prisma.assessmentQuestion.create({
        data: { testId: pedTest.id, ...q },
      });
    }
  }

  // ============================================
  // 7. TẠO MINIGAME & STICKERS MẪU
  // ============================================
  console.log('🎮 Tạo MiniGame & Huy hiệu...');
  await prisma.miniGame.upsert({
    where: { code: 'MATH_BALLOON' },
    update: {},
    create: {
      code: 'MATH_BALLOON',
      name: 'Bong bóng Toán nhẩm',
      description: 'Bấm nổ quả bóng mang phép tính có kết quả chính xác để ghi điểm',
      subjectId: subjMath.id,
      minGradeOrder: 1,
      maxGradeOrder: 5,
    },
  });

  await prisma.miniGame.upsert({
    where: { code: 'FLASHCARD_MATCH' },
    update: {},
    create: {
      code: 'FLASHCARD_MATCH',
      name: 'Lật thẻ Từ vựng',
      description: 'Lật và ghép cặp từ tiếng Anh tương ứng với hình ảnh minh họa',
      subjectId: subjEng.id,
      minGradeOrder: 1,
      maxGradeOrder: 5,
    },
  });

  const rewards = [
    { code: 'BEE_HARDWORKING', name: 'Ong Vàng Chăm Chỉ', type: 'STICKER', imageUrl: '/stickers/bee.png', unlockRule: { type: 'TASKS_COMPLETED', value: 5 } },
    { code: 'MATH_KNIGHT', name: 'Hiệp Sĩ Toán Học', type: 'BADGE', imageUrl: '/stickers/knight.png', unlockRule: { type: 'TASKS_COMPLETED', value: 15 } },
    { code: 'STREAK_7_DAYS', name: 'Chiến Binh 7 Ngày', type: 'TROPHY', imageUrl: '/stickers/trophy_streak.png', unlockRule: { type: 'STREAK', value: 7 } },
  ];

  for (const r of rewards) {
    await prisma.reward.upsert({
      where: { code: r.code },
      update: r,
      create: r,
    });
  }

  // ============================================
  // 8. TẠO CHUYÊN MỤC DIỄN ĐÀN
  // ============================================
  console.log('💬 Tạo chuyên mục diễn đàn...');
  const forumCats = [
    { code: 'PARENT_CORNER', name: 'Góc Cha Mẹ', description: 'Kinh nghiệm nuôi dạy, tâm lý học đường và phương pháp đồng hành cùng con', order: 1, allowedRoles: ['PARENT', 'ADMIN', 'STAFF_CS'] },
    { code: 'TUTOR_CORNER', name: 'Góc Gia Sư', description: 'Giáo án mẫu, mẹo sư phạm thực chiến và xử lý tình huống lớp học', order: 2, allowedRoles: ['TUTOR', 'ADMIN', 'STAFF_ACADEMIC'] },
    { code: 'QA', name: 'Hỏi Đáp Bài Tập Khó', description: 'Nơi phụ huynh và học sinh nhờ giải đáp các dạng bài tập', order: 3, allowedRoles: [] },
  ];

  for (const fc of forumCats) {
    await prisma.forumCategory.upsert({
      where: { code: fc.code },
      update: fc,
      create: fc,
    });
  }

  // ============================================
  // 9. TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
  // ============================================
  console.log('👤 Tạo tài khoản Admin mặc định...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@2026', salt);

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash, userType: 'STAFF', active: true },
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'Tổng Quản Trị Hệ Thống',
      email: 'admin@edtech.vn',
      userType: 'STAFF',
      active: true,
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  // ============================================
  // 10. TẠO TÀI KHOẢN NHÂN SỰ CHO 6 BỘ PHẬN
  // ============================================
  console.log('👥 Tạo tài khoản chuyên viên 6 bộ phận...');
  const staffAccounts = [
    { username: 'staff_recruit', fullName: 'Chuyên viên Tuyển dụng', roleCode: 'STAFF_RECRUIT', deptCode: 'DEPT_RECRUIT', email: 'recruit@edtech.vn' },
    { username: 'staff_matching', fullName: 'Điều phối viên Lớp học', roleCode: 'STAFF_MATCHING', deptCode: 'DEPT_MATCHING', email: 'matching@edtech.vn' },
    { username: 'staff_care', fullName: 'Chuyên viên CSKH Phụ huynh', roleCode: 'STAFF_CS', deptCode: 'DEPT_CS', email: 'care@edtech.vn' },
    { username: 'staff_tutor_care', fullName: 'Chuyên viên Chăm sóc Gia sư', roleCode: 'STAFF_TUTOR_CARE', deptCode: 'DEPT_TUTOR_CARE', email: 'tutorcare@edtech.vn' },
    { username: 'staff_academic', fullName: 'Chuyên viên Học thuật', roleCode: 'STAFF_ACADEMIC', deptCode: 'DEPT_ACADEMIC', email: 'academic@edtech.vn' },
    { username: 'staff_forum', fullName: 'Kiểm duyệt viên Diễn đàn', roleCode: 'STAFF_FORUM', deptCode: 'DEPT_FORUM', email: 'forum@edtech.vn' },
  ];

  for (const st of staffAccounts) {
    const dept = await prisma.department.findUnique({ where: { code: st.deptCode } });
    const role = await prisma.role.findUnique({ where: { code: st.roleCode } });
    const user = await prisma.user.upsert({
      where: { username: st.username },
      update: {
        passwordHash,
        fullName: st.fullName,
        email: st.email,
        departmentId: dept?.id,
        userType: 'STAFF',
        active: true,
      },
      create: {
        username: st.username,
        passwordHash,
        fullName: st.fullName,
        email: st.email,
        departmentId: dept?.id,
        userType: 'STAFF',
        active: true,
      },
    });

    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
  }

  console.log('🎉 Seed dữ liệu EdTech hoàn tất thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });