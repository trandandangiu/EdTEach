// backend/prisma/seed-demo-mvp.js
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('🌱 Bắt đầu tạo dữ liệu demo chuẩn MVP (Admin + Tutor + Parent)...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Demo@2026', salt);

  // 1. ROLES
  const allRoles = await prisma.role.findMany();
  const roles = {};
  allRoles.forEach((r) => {
    roles[r.code] = r;
  });

  // 2. KHỐI LỚP & MÔN HỌC (Grade 5, Math, Vietnamese, English)
  const grade5 = await prisma.gradeLevel.findFirst({
    where: { OR: [{ code: 'G5' }, { code: 'GRADE_5' }] },
  });
  const gradeLevelId = grade5 ? grade5.id : 5;

  let mathSubLevel = await prisma.subjectLevel.findFirst({
    where: { subject: { code: 'MATH' }, gradeLevelId },
  });
  let vietSubLevel = await prisma.subjectLevel.findFirst({
    where: { subject: { code: 'VIETNAMESE' }, gradeLevelId },
  });
  let engSubLevel = await prisma.subjectLevel.findFirst({
    where: { subject: { code: 'ENGLISH' }, gradeLevelId },
  });

  // Fallbacks if not found
  if (!mathSubLevel) mathSubLevel = await prisma.subjectLevel.findFirst();
  if (!engSubLevel) engSubLevel = mathSubLevel;

  // 3. TÀI KHOẢN ADMIN
  console.log('👤 [1/4] Khởi tạo tài khoản Quản Trị Viên (Admin)...');
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      userType: 'STAFF',
      active: true,
      email: 'admin@viettutor.edu.vn',
      fullName: 'Quản Trị Viên Hệ Thống',
    },
    create: {
      username: 'admin',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@viettutor.edu.vn',
      phone: '0988999999',
      passwordHash,
      userType: 'STAFF',
      active: true,
    },
  });

  if (roles.ADMIN) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: roles.ADMIN.id } },
      update: {},
      create: { userId: adminUser.id, roleId: roles.ADMIN.id },
    });
  }

  // 4. TÀI KHOẢN PHỤ HUYNH & HỌC SINH
  console.log('👪 [2/4] Khởi tạo tài khoản Phụ huynh & Học sinh Demo...');
  const parentUser = await prisma.user.upsert({
    where: { username: 'parent_demo' },
    update: {
      passwordHash,
      userType: 'PARENT',
      active: true,
      email: 'parent.demo@viettutor.edu.vn',
      fullName: 'Nguyễn Thị Hương (Phụ huynh Demo)',
      phone: '0988111222',
    },
    create: {
      username: 'parent_demo',
      fullName: 'Nguyễn Thị Hương (Phụ huynh Demo)',
      email: 'parent.demo@viettutor.edu.vn',
      phone: '0988111222',
      passwordHash,
      userType: 'PARENT',
      active: true,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
  });

  if (roles.PARENT) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: parentUser.id, roleId: roles.PARENT.id } },
      update: {},
      create: { userId: parentUser.id, roleId: roles.PARENT.id },
    });
  }

  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {
      address: 'Số 123 Đường Cầu Giấy, Phường Dịch Vọng',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
    },
    create: {
      userId: parentUser.id,
      address: 'Số 123 Đường Cầu Giấy, Phường Dịch Vọng',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
    },
  });

  let student = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: 'Nguyễn Minh An' },
  });
  if (!student) {
    student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: 'Nguyễn Minh An',
        nickname: 'Minh An',
        dob: new Date('2015-05-15'),
        gender: 'MALE',
        gradeLevelId,
        school: 'Tiểu học Dịch Vọng B',
        avatarKey: 'lion',
        streakDays: 5,
        tasksCompleted: 24,
        active: true,
      },
    });
  }

  // 5. TÀI KHOẢN GIA SƯ
  console.log('🎓 [3/4] Khởi tạo tài khoản Gia Sư Demo...');
  const tutorUser = await prisma.user.upsert({
    where: { username: 'tutor_demo' },
    update: {
      passwordHash,
      userType: 'TUTOR',
      active: true,
      email: 'tutor.demo@viettutor.edu.vn',
      fullName: 'Thầy Lê Hoàng Long (Gia sư Demo)',
      phone: '0912333444',
    },
    create: {
      username: 'tutor_demo',
      fullName: 'Thầy Lê Hoàng Long (Gia sư Demo)',
      email: 'tutor.demo@viettutor.edu.vn',
      phone: '0912333444',
      passwordHash,
      userType: 'TUTOR',
      active: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  if (roles.TUTOR) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: tutorUser.id, roleId: roles.TUTOR.id } },
      update: {},
      create: { userId: tutorUser.id, roleId: roles.TUTOR.id },
    });
  }

  const tutorProfile = await prisma.tutorProfile.upsert({
    where: { userId: tutorUser.id },
    update: {
      headline: 'Cử nhân Sư phạm Toán · 5 năm kinh nghiệm dạy Toán & Tiếng Việt Tiểu học',
      bio: 'Phương pháp trực quan sinh động, khơi gợi niềm yêu thích học tập tự nhiên cho học sinh.',
      hourlyRate: 250000,
      teachingMode: 'BOTH',
      canTeachGroup: true,
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      status: 'ACTIVE',
      verifiedAt: new Date(),
    },
    create: {
      userId: tutorUser.id,
      headline: 'Cử nhân Sư phạm Toán · 5 năm kinh nghiệm dạy Toán & Tiếng Việt Tiểu học',
      bio: 'Phương pháp trực quan sinh động, khơi gợi niềm yêu thích học tập tự nhiên cho học sinh.',
      hourlyRate: 250000,
      teachingMode: 'BOTH',
      canTeachGroup: true,
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      status: 'ACTIVE',
      verifiedAt: new Date(),
    },
  });

  // Gán môn dạy cho gia sư
  if (mathSubLevel) {
    await prisma.tutorSubject.upsert({
      where: { tutorId_subjectLevelId: { tutorId: tutorProfile.id, subjectLevelId: mathSubLevel.id } },
      update: {},
      create: { tutorId: tutorProfile.id, subjectLevelId: mathSubLevel.id },
    });
  }
  if (vietSubLevel) {
    await prisma.tutorSubject.upsert({
      where: { tutorId_subjectLevelId: { tutorId: tutorProfile.id, subjectLevelId: vietSubLevel.id } },
      update: {},
      create: { tutorId: tutorProfile.id, subjectLevelId: vietSubLevel.id },
    });
  }

  // Availability
  const existingAvail = await prisma.tutorAvailability.findFirst({
    where: { tutorId: tutorProfile.id },
  });
  if (!existingAvail) {
    await prisma.tutorAvailability.createMany({
      data: [
        { tutorId: tutorProfile.id, weekday: 2, startTime: '18:00', endTime: '20:00' },
        { tutorId: tutorProfile.id, weekday: 4, startTime: '18:00', endTime: '20:00' },
      ],
    });
  }

  // 6. LỚP HỌC MẪU (LH-DEMO-001)
  console.log('🏫 [4/4] Khởi tạo Lớp học mẫu & Yêu cầu tìm gia sư...');
  let sampleClass = await prisma.class.findUnique({
    where: { code: 'LH-DEMO-001' },
  });

  if (!sampleClass) {
    sampleClass = await prisma.class.create({
      data: {
        code: 'LH-DEMO-001',
        name: 'Toán Lớp 5 Cơ Bản & Nâng Cao - Bé Minh An',
        format: 'ONE_ON_ONE',
        capacity: 1,
        minStudents: 1,
        tutorId: tutorProfile.id,
        subjectLevelId: mathSubLevel.id,
        createdById: adminUser.id,
        creatorType: 'STAFF',
        teachingMode: 'OFFLINE',
        location: 'Số 123 Đường Cầu Giấy, Hà Nội',
        sessionDurationMin: 90,
        defaultFeePerSession: 250000,
        tutorPayPerSession: 200000,
        startDate: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedById: adminUser.id,
      },
    });

    // Thêm học sinh vào lớp
    await prisma.classStudent.create({
      data: {
        classId: sampleClass.id,
        studentId: student.id,
        status: 'ACTIVE',
        feePerSession: 250000,
      },
    });

    // Tạo lịch học thứ 3 và thứ 5
    const scheduleT3 = await prisma.classSchedule.create({
      data: {
        classId: sampleClass.id,
        weekday: 2,
        startTime: '18:30',
        endTime: '20:00',
        effectiveFrom: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      },
    });
    const scheduleT5 = await prisma.classSchedule.create({
      data: {
        classId: sampleClass.id,
        weekday: 4,
        startTime: '18:30',
        endTime: '20:00',
        effectiveFrom: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      },
    });

    // Buổi 1 trong quá khứ (5 ngày trước): Đã có sổ liên lạc CONFIRMED
    const lesson1 = await prisma.lesson.create({
      data: {
        classId: sampleClass.id,
        scheduleId: scheduleT3.id,
        startAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        endAt: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 90 * 60 * 1000),
        status: 'CONFIRMED',
      },
    });
    await prisma.lessonReport.create({
      data: {
        lessonId: lesson1.id,
        studentId: student.id,
        tutorId: tutorProfile.id,
        attendance: 'PRESENT',
        lessonContent: 'Ôn tập phân số và bài toán chuyển động đều.',
        tutorComment: 'Bé Minh An làm bài rất tốt, tiếp thu nhanh và chịu khó phát biểu.',
        homeworkNote: 'Làm bài tập 1, 2, 3 trang 25 SGK.',
        status: 'CONFIRMED',
        submittedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        confirmedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      },
    });

    // Buổi 2 trong quá khứ (2 ngày trước): Đã có sổ liên lạc SUBMITTED
    const lesson2 = await prisma.lesson.create({
      data: {
        classId: sampleClass.id,
        scheduleId: scheduleT5.id,
        startAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        endAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 90 * 60 * 1000),
        status: 'REPORTED',
      },
    });
    await prisma.lessonReport.create({
      data: {
        lessonId: lesson2.id,
        studentId: student.id,
        tutorId: tutorProfile.id,
        attendance: 'PRESENT',
        lessonContent: 'Luyện tập diện tích hình tam giác & hình thang.',
        tutorComment: 'Con nắm chắc công thức tính diện tích, cần rèn luyện thêm tính cẩn thận khi rút gọn phân số.',
        homeworkNote: 'Làm 4 bài hình học nâng cao trong vở bài tập.',
        status: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
    });

    // 2 buổi học sắp tới trong tuần này (SCHEDULED)
    await prisma.lesson.create({
      data: {
        classId: sampleClass.id,
        scheduleId: scheduleT3.id,
        startAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        endAt: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 90 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    await prisma.lesson.create({
      data: {
        classId: sampleClass.id,
        scheduleId: scheduleT5.id,
        startAt: new Date(Date.now() + 4 * 24 * 3600 * 1000),
        endAt: new Date(Date.now() + 4 * 24 * 3600 * 1000 + 90 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
  }

  // 7. YÊU CẦU TÌM GIA SƯ MẪU (CR-DEMO-001)
  let demoRequest = await prisma.classRequest.findUnique({
    where: { code: 'CR-DEMO-001' },
  });

  if (!demoRequest) {
    demoRequest = await prisma.classRequest.create({
      data: {
        code: 'CR-DEMO-001',
        parentId: parentProfile.id,
        studentId: student.id,
        subjectLevelId: engSubLevel.id,
        preferredFormat: 'ONE_ON_ONE',
        sessionsPerWeek: 2,
        sessionDurationMin: 90,
        preferredSlots: [
          { weekday: 3, time: '18:30' },
          { weekday: 6, time: '09:00' },
        ],
        teachingMode: 'OFFLINE',
        address: 'Số 123 Đường Cầu Giấy, Hà Nội',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        budgetPerSession: 300000,
        note: 'Cần tìm gia sư kèm Tiếng Anh giao tiếp và ngữ pháp lớp 5 cho bé Minh An.',
        status: 'OFFERING',
        onBoard: true,
      },
    });

    // Offer gửi cho tutor_demo
    await prisma.classOffer.upsert({
      where: {
        requestId_tutorId: {
          requestId: demoRequest.id,
          tutorId: tutorProfile.id,
        },
      },
      update: {},
      create: {
        requestId: demoRequest.id,
        tutorId: tutorProfile.id,
        offeredById: adminUser.id,
        source: 'STAFF_OFFER',
        proposedPay: 300000,
        status: 'PENDING',
        message: 'Phụ huynh rất thích hồ sơ của thầy Long, kính mời thầy xem xét nhận lớp cho bé.',
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      },
    });
  }

  console.log('\n=============================================================');
  console.log('🎉 SEED DỮ LIỆU DEMO MVP HOÀN TẤT!');
  console.log('=============================================================');
  console.log('📋 DANH SÁCH 3 TÀI KHOẢN DEMO SẴN SÀNG SỬ DỤNG:');
  console.log('-------------------------------------------------------------');
  console.log('1. QUẢN TRỊ VIÊN (ADMIN PORTAL):');
  console.log('   - URL Đăng nhập: /login');
  console.log('   - Tài khoản:     admin');
  console.log('   - Mật khẩu:      Demo@2026');
  console.log('   - Dashboard:     /admin');
  console.log('-------------------------------------------------------------');
  console.log('2. PHỤ HUYNH (PARENT PORTAL):');
  console.log('   - URL Đăng nhập: /login');
  console.log('   - Tài khoản:     parent_demo');
  console.log('   - Mật khẩu:      Demo@2026');
  console.log('   - Dashboard:     /parent/dashboard');
  console.log('   - Học sinh:      Nguyễn Minh An (Lớp 5)');
  console.log('-------------------------------------------------------------');
  console.log('3. GIA SƯ (TUTOR PORTAL):');
  console.log('   - URL Đăng nhập: /login');
  console.log('   - Tài khoản:     tutor_demo');
  console.log('   - Mật khẩu:      Demo@2026');
  console.log('   - Dashboard:     /tutor/dashboard');
  console.log('   - Lớp mẫu:       LH-DEMO-001 (Toán 5)');
  console.log('   - Offer nhận:    CR-DEMO-001 (Tiếng Anh 5)');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
