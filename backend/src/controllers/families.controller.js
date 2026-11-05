// backend/src/controllers/families.controller.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Danh sách con của phụ huynh
export async function getMyStudents(req, res, next) {
  try {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        children: {
          where: { active: true },
          include: { gradeLevel: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!parentProfile) {
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: parentProfile.children });
  } catch (err) {
    next(err);
  }
}

// Thêm con mới
export async function createStudent(req, res, next) {
  try {
    const { fullName, nickname, dob, age, gender, gradeLevelId, school, avatarKey, pin } = req.body;

    if (!fullName || !gradeLevelId) {
      return res.status(400).json({ success: false, message: 'Họ tên và khối lớp là bắt buộc' });
    }

    let parent = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
    if (!parent) {
      parent = await prisma.parentProfile.create({ data: { userId: req.user.id } });
    }

    let pinHash = null;
    if (pin) {
      pinHash = await bcrypt.hash(String(pin), 10);
    }

    // Tính ngày sinh nếu người dùng chỉ nhập tuổi
    let calculatedDob = dob ? new Date(dob) : null;
    if (!calculatedDob && age) {
      const currentYear = new Date().getFullYear();
      calculatedDob = new Date(currentYear - parseInt(age, 10), 0, 1);
    }

    const student = await prisma.studentProfile.create({
      data: {
        parentId: parent.id,
        fullName,
        nickname: nickname || null,
        dob: calculatedDob,
        gender: gender || null,
        gradeLevelId: parseInt(gradeLevelId, 10),
        school: school || null,
        avatarKey: avatarKey || 'kid_default',
        pinHash,
      },
      include: { gradeLevel: true },
    });

    res.status(201).json({ success: true, data: student, message: 'Thêm hồ sơ con thành công' });
  } catch (err) {
    next(err);
  }
}

// Cập nhật thông tin con
export async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, nickname, dob, age, gender, gradeLevelId, school, avatarKey } = req.body;

    const student = await prisma.studentProfile.findFirst({
      where: { id, parent: { userId: req.user.id } },
    });

    if (!student && !req.user.roles.includes('ADMIN')) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học sinh' });
    }

    let calculatedDob = dob !== undefined ? (dob ? new Date(dob) : null) : undefined;
    if (calculatedDob === undefined && age) {
      const currentYear = new Date().getFullYear();
      calculatedDob = new Date(currentYear - parseInt(age, 10), 0, 1);
    }

    const updated = await prisma.studentProfile.update({
      where: { id },
      data: {
        fullName,
        nickname,
        dob: calculatedDob,
        gender,
        gradeLevelId: gradeLevelId ? parseInt(gradeLevelId, 10) : undefined,
        school,
        avatarKey,
      },
      include: { gradeLevel: true },
    });

    res.json({ success: true, data: updated, message: 'Cập nhật thành công' });
  } catch (err) {
    next(err);
  }
}

// Xóa hồ sơ con (soft delete)
export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const student = await prisma.studentProfile.findFirst({
      where: { id, parent: { userId: req.user.id } },
    });

    if (!student && !req.user.roles.includes('ADMIN')) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học sinh' });
    }

    await prisma.studentProfile.update({
      where: { id },
      data: { active: false },
    });

    res.json({ success: true, message: 'Đã xóa hồ sơ con thành công' });
  } catch (err) {
    next(err);
  }
}

// Lấy danh sách bài tập về nhà của bé (do gia sư giao)
export async function getStudentTasks(req, res, next) {
  try {
    const { id } = req.params;
    const student = await prisma.studentProfile.findFirst({
      where: { id, parent: { userId: req.user.id } },
    });

    if (!student && !req.user.roles.includes('ADMIN')) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học sinh' });
    }

    // Lấy bài tập từ AssignmentTask
    const tasks = await prisma.assignmentTask.findMany({
      where: { studentId: id },
      include: {
        class: {
          include: {
            tutor: { include: { user: true } },
            subjectLevel: { include: { subject: true } },
          },
        },
        lesson: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Lấy bài tập từ các LessonReport gần nhất
    const reportsWithHomework = await prisma.lessonReport.findMany({
      where: {
        studentId: id,
        homeworkNote: { not: null },
      },
      include: {
        lesson: {
          include: {
            class: {
              include: {
                tutor: { include: { user: true } },
                subjectLevel: { include: { subject: true } },
              },
            },
          },
        },
        tutor: { include: { user: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        tasks,
        reportsWithHomework: reportsWithHomework.map((r) => ({
          id: r.id,
          lessonId: r.lessonId,
          lessonContent: r.lessonContent,
          homeworkNote: r.homeworkNote,
          tutorName: r.tutor?.user?.fullName || 'Gia sư',
          subjectName: r.lesson?.class?.subjectLevel?.subject?.name || 'Môn học',
          submittedAt: r.submittedAt,
          tutorComment: r.tutorComment,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// Cập nhật mã PIN của bé
export async function setStudentPin(req, res, next) {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin || String(pin).length < 4) {
      return res.status(400).json({ success: false, message: 'Mã PIN phải từ 4 chữ số' });
    }

    const student = await prisma.studentProfile.findFirst({
      where: { id, parent: { userId: req.user.id } },
    });

    if (!student && !req.user.roles.includes('ADMIN')) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    const pinHash = await bcrypt.hash(String(pin), 10);
    await prisma.studentProfile.update({
      where: { id },
      data: { pinHash },
    });

    res.json({ success: true, message: 'Cập nhật mã PIN thành công' });
  } catch (err) {
    next(err);
  }
}

// Tạo mã đăng nhập 6 số dùng 1 lần (dành cho thiết bị riêng của bé)
export async function createStudentLoginCode(req, res, next) {
  try {
    const { id } = req.params;
    const student = await prisma.studentProfile.findFirst({
      where: { id, parent: { userId: req.user.id } },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    // Sinh mã ngẫu nhiên 6 chữ số
    const rawCode = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(rawCode, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // hết hạn sau 5 phút

    await prisma.studentLoginCode.create({
      data: {
        studentId: student.id,
        codeHash,
        expiresAt,
      },
    });

    res.json({
      success: true,
      data: {
        code: rawCode,
        expiresAt,
        studentName: student.fullName,
      },
      message: 'Mã đăng nhập có hiệu lực trong 5 phút',
    });
  } catch (err) {
    next(err);
  }
}

// Tổng quan Dashboard Bento cho học sinh
export async function getStudentOverview(req, res, next) {
  try {
    const { id } = req.params;
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        gradeLevel: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: {
              include: {
                tutor: { include: { user: true } },
                subjectLevel: { include: { subject: true } },
                schedules: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    // Buổi học tiếp theo gần nhất
    const now = new Date();
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        class: {
          students: { some: { studentId: student.id, status: 'ACTIVE' } },
        },
        startAt: { gte: now },
        status: 'SCHEDULED',
      },
      include: {
        class: {
          include: {
            tutor: { include: { user: true } },
            subjectLevel: { include: { subject: true } },
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    // Thống kê nhiệm vụ trong tuần
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

    const totalTasksThisWeek = await prisma.assignmentTask.count({
      where: {
        studentId: student.id,
        createdAt: { gte: startOfWeek },
      },
    });

    const completedTasksThisWeek = await prisma.assignmentTask.count({
      where: {
        studentId: student.id,
        status: { in: ['SUBMITTED', 'REVIEWED'] },
        createdAt: { gte: startOfWeek },
      },
    });

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          nickname: student.nickname,
          avatarKey: student.avatarKey,
          gradeName: student.gradeLevel.name,
          streakDays: student.streakDays,
          tasksCompleted: student.tasksCompleted,
        },
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              subjectName: nextLesson.class.subjectLevel.displayName || nextLesson.class.subjectLevel.subject.name,
              tutorName: nextLesson.class.tutor.user.fullName,
              startAt: nextLesson.startAt,
              endAt: nextLesson.endAt,
              meetingUrl: nextLesson.class.meetingUrl,
              teachingMode: nextLesson.class.teachingMode,
            }
          : null,
        weeklyTasks: {
          total: totalTasksThisWeek,
          completed: completedTasksThisWeek,
          percent: totalTasksThisWeek > 0 ? Math.round((completedTasksThisWeek / totalTasksThisWeek) * 100) : 100,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
