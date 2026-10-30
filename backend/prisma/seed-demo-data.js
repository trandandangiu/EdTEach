// backend/prisma/seed-demo-data.js
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('🌱 Bắt đầu tạo dữ liệu demo hoàn chỉnh cho EdTech Platform...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. LẤY ROLES CÓ SẴN
  const allRoles = await prisma.role.findMany();
  const roles = {};
  allRoles.forEach(r => { roles[r.code] = r; });

  // 2. KHỐI LỚP & MÔN HỌC (GradeLevel & SubjectLevel)
  let grade4 = await prisma.gradeLevel.findFirst({ where: { code: 'GRADE_4' } });
  if (!grade4) {
    grade4 = await prisma.gradeLevel.findFirst();
  }

  let mathSubLevel = await prisma.subjectLevel.findFirst({
    where: { subject: { code: 'MATH' } },
    include: { subject: true, gradeLevel: true },
  });
  if (!mathSubLevel) {
    mathSubLevel = await prisma.subjectLevel.findFirst({
      include: { subject: true, gradeLevel: true },
    });
  }

  // 3. TẠO TÀI KHOẢN ADMIN
  console.log('👤 1. Tạo User Admin...');
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash, userType: 'STAFF', active: true, email: 'admin@viettutor.edu.vn' },
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

  // 4. TẠO TÀI KHOẢN PHỤ HUYNH & HỌC SINH
  console.log('👪 2. Tạo User Phụ huynh (Chị Mai Anh) & Học sinh (Bé Bảo Nam)...');
  const parentUser = await prisma.user.upsert({
    where: { username: 'parent_maianh' },
    update: { passwordHash, userType: 'PARENT', active: true, email: 'maianh.nguyen@gmail.com' },
    create: {
      username: 'parent_maianh',
      fullName: 'Chị Mai Anh',
      email: 'maianh.nguyen@gmail.com',
      phone: '0988123456',
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

  let parentProfile = await prisma.parentProfile.findUnique({ where: { userId: parentUser.id } });
  if (!parentProfile) {
    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: parentUser.id,
        address: 'P802 Tòa Landmark 1, Ba Đình, Hà Nội',
        province: 'Hà Nội',
        district: 'Ba Đình',
      },
    });
  }

  // Tạo Học sinh
  let student = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id },
  });
  if (!student) {
    student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: 'Bảo Nam',
        nickname: 'Bảo Nam',
        dob: new Date('2015-06-15'),
        gender: 'MALE',
        gradeLevelId: grade4 ? grade4.id : 4,
        school: 'Tiểu học Thăng Long',
        avatarKey: 'lion',
        streakDays: 7,
        tasksCompleted: 28,
        active: true,
      },
    });
  }

  // 5. TẠO TÀI KHOẢN GIA SƯ
  console.log('🎓 3. Tạo User Gia sư (ThS. Nguyễn Hoàng Nam)...');
  const tutorUser = await prisma.user.upsert({
    where: { username: 'tutor_hoangnam' },
    update: { passwordHash, userType: 'TUTOR', active: true, email: 'hoangnam.math@viettutor.edu.vn' },
    create: {
      username: 'tutor_hoangnam',
      fullName: 'ThS. Nguyễn Hoàng Nam',
      email: 'hoangnam.math@viettutor.edu.vn',
      phone: '0912888777',
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

  let tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: tutorUser.id } });
  if (!tutorProfile) {
    tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        headline: 'Thạc sĩ Toán Sư Phạm Hà Nội · 8 năm luyện thi & bồi dưỡng tư duy',
        bio: 'Phương pháp trực quan sinh động, khơi gợi niềm yêu thích Toán học tự nhiên cho học sinh tiểu học.',
        hourlyRate: 300000,
        teachingMode: 'BOTH',
        canTeachGroup: true,
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    });
  }

  // Gán môn dạy cho gia sư
  if (mathSubLevel) {
    await prisma.tutorSubject.upsert({
      where: { tutorId_subjectLevelId: { tutorId: tutorProfile.id, subjectLevelId: mathSubLevel.id } },
      update: {},
      create: { tutorId: tutorProfile.id, subjectLevelId: mathSubLevel.id },
    });
  }

  // 6. TẠO LỚP HỌC MẪU (CLASS)
  console.log('🏫 4. Tạo Lớp học mẫu đang chạy...');
  let sampleClass = await prisma.class.findFirst({
    where: { tutorId: tutorProfile.id },
  });

  if (!sampleClass && mathSubLevel) {
    sampleClass = await prisma.class.create({
      data: {
        code: 'LH-2026-TOAN4A',
        name: 'Toán Nâng Cao Lớp 4 - Bé Bảo Nam',
        format: 'ONE_ON_ONE',
        capacity: 1,
        minStudents: 1,
        tutorId: tutorProfile.id,
        subjectLevelId: mathSubLevel.id,
        createdById: adminUser.id,
        creatorType: 'STAFF',
        teachingMode: 'OFFLINE',
        location: 'P802 Tòa Landmark 1, Ba Đình, Hà Nội',
        sessionDurationMin: 90,
        defaultFeePerSession: 300000,
        tutorPayPerSession: 250000,
        startDate: new Date('2026-09-01'),
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
        feePerSession: 300000,
      },
    });

    // Tạo lịch học thứ 3 và thứ 5
    await prisma.classSchedule.createMany({
      data: [
        { classId: sampleClass.id, weekday: 2, startTime: '18:30', endTime: '20:00', effectiveFrom: new Date('2026-09-01') },
        { classId: sampleClass.id, weekday: 4, startTime: '18:30', endTime: '20:00', effectiveFrom: new Date('2026-09-01') },
      ],
    });
  }

  // 7. TẠO BUỔI HỌC & SỔ LIÊN LẠC (LESSON & LESSON REPORT)
  console.log('📝 5. Tạo Buổi học & Sổ liên lạc mẫu...');
  if (sampleClass) {
    const existingLessons = await prisma.lesson.findMany({
      where: { classId: sampleClass.id },
    });

    if (existingLessons.length === 0) {
      const lesson1 = await prisma.lesson.create({
        data: {
          classId: sampleClass.id,
          startAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
          status: 'CONFIRMED',
        },
      });

      await prisma.lessonReport.create({
        data: {
          lessonId: lesson1.id,
          studentId: student.id,
          tutorId: tutorProfile.id,
          attendance: 'PRESENT',
          lessonContent: 'Ôn tập phân số và phép cộng trừ phân số cùng mẫu số.',
          tutorComment: 'Bé Bảo Nam nắm chắc kiến thức cơ bản, tính nhẩm nhanh và chủ động hoàn thành các bài toán thực tế.',
          homeworkNote: 'Làm bài tập 1, 2, 3 trong phiếu luyện tập số 4.',
          status: 'CONFIRMED',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      });

      const lesson2 = await prisma.lesson.create({
        data: {
          classId: sampleClass.id,
          startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
          status: 'REPORTED',
        },
      });

      await prisma.lessonReport.create({
        data: {
          lessonId: lesson2.id,
          studentId: student.id,
          tutorId: tutorProfile.id,
          attendance: 'PRESENT',
          lessonContent: 'Hình học trực quan: Chu vi và diện tích hình bình hành.',
          tutorComment: 'Con tiếp thu tốt, vẽ hình cẩn thận bằng thước kẻ. Cần chú ý đơn vị đo cm² và m².',
          homeworkNote: 'Hoàn thành 4 bài hình học trong vở bài tập nâng cao.',
          status: 'SUBMITTED',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 8. TẠO YÊU CẦU TÌM GIA SƯ MẪU (CLASS REQUEST & OFFER)
  console.log('📌 6. Tạo Yêu cầu tìm gia sư & Lời mời nhận lớp...');
  if (mathSubLevel) {
    let req1 = await prisma.classRequest.findUnique({
      where: { code: 'CR-2026-9081' },
    });

    if (!req1) {
      req1 = await prisma.classRequest.create({
        data: {
          code: 'CR-2026-9081',
          parentId: parentProfile.id,
          studentId: student.id,
          subjectLevelId: mathSubLevel.id,
          preferredFormat: 'ONE_ON_ONE',
          sessionsPerWeek: 2,
          sessionDurationMin: 90,
          preferredSlots: [{ weekday: 2, time: '18:30' }, { weekday: 4, time: '18:30' }],
          teachingMode: 'OFFLINE',
          address: 'P802 Tòa Landmark 1, Ba Đình, Hà Nội',
          province: 'Hà Nội',
          district: 'Ba Đình',
          budgetPerSession: 300000,
          note: 'Bé cần gia sư tận tâm bồi dưỡng thi học sinh giỏi cấp trường.',
          status: 'OFFERING',
          onBoard: true,
        },
      });
    }

    const existingOffer = await prisma.classOffer.findUnique({
      where: { requestId_tutorId: { requestId: req1.id, tutorId: tutorProfile.id } },
    });

    if (!existingOffer) {
      await prisma.classOffer.create({
        data: {
          requestId: req1.id,
          tutorId: tutorProfile.id,
          offeredById: adminUser.id,
          source: 'STAFF_OFFER',
          proposedPay: 300000,
          status: 'PENDING',
          message: 'Phụ huynh đánh giá cao hồ sơ của thầy Hoàng Nam, kính mời thầy xem xét nhận lớp.',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 9. TẠO BÀI TẬP CHO BÉ (ASSIGNMENT TASK)
  console.log('🎯 7. Tạo Bài tập cho bé...');
  if (sampleClass) {
    const existingTask = await prisma.assignmentTask.findFirst({
      where: { classId: sampleClass.id, studentId: student.id },
    });

    if (!existingTask) {
      await prisma.assignmentTask.create({
        data: {
          classId: sampleClass.id,
          studentId: student.id,
          createdById: tutorUser.id,
          type: 'HOMEWORK_PHOTO',
          title: 'Thử thách 5 bài toán đố hình bình hành',
          description: 'Vẽ hình bình hành có đáy 12cm, chiều cao 7cm và tính diện tích.',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'ASSIGNED',
        },
      });
    }
  }

  // 10. TẠO BÀI VIẾT DIỄN ĐÀN (FORUM POSTS)
  console.log('💬 8. Tạo Bài viết diễn đàn...');
  const cat = await prisma.forumCategory.findFirst();
  if (cat) {
    const existingPost = await prisma.forumPost.findFirst({
      where: { authorId: tutorUser.id },
    });

    if (!existingPost) {
      const post = await prisma.forumPost.create({
        data: {
          categoryId: cat.id,
          authorId: tutorUser.id,
          title: 'Phương pháp giúp con tiểu học yêu thích môn Toán tự nhiên không áp lực',
          content: 'Nhiều phụ huynh lo lắng khi con sợ học Toán. Bí quyết là liên hệ Toán học với các trò chơi thực tế hàng ngày như đi siêu thị, chia bánh kẹo, tính tiền thối...',
          tags: ['Toán Tiểu Học', 'Nuôi Dạy Con', 'Kinh Nghiệm Sư Phạm'],
          status: 'PUBLISHED',
          viewCount: 154,
          likeCount: 28,
          commentCount: 2,
        },
      });

      await prisma.forumComment.create({
        data: {
          postId: post.id,
          authorId: parentUser.id,
          content: 'Cảm ơn chia sẻ rất tâm huyết của thầy Hoàng Nam! Em đã thử áp dụng và bé hào hứng hơn hẳn.',
          status: 'PUBLISHED',
          likeCount: 5,
        },
      });
    }
  }

  console.log('✅ SEED DỮ LIỆU DEMO HOÀN TẤT THÀNH CÔNG 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
