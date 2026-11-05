// backend/src/controllers/classes.controller.js
import prisma from '../config/prisma.js';

// Danh sách lớp theo quyền & vai trò
export async function getClasses(req, res, next) {
  try {
    const { status, format, subjectLevelId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (format) where.format = format;
    if (subjectLevelId) where.subjectLevelId = parseInt(subjectLevelId, 10);

    const isStaff = req.user.roles.some(r => ['ADMIN', 'STAFF_MATCHING', 'STAFF_CS', 'STAFF_TUTOR_CARE', 'STAFF_ACADEMIC'].includes(r));

    if (!isStaff) {
      if (req.user.roles.includes('TUTOR')) {
        const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
        if (!tutor) return res.json({ success: true, data: [] });
        where.tutorId = tutor.id;
      } else if (req.user.roles.includes('PARENT')) {
        where.students = {
          some: { student: { parent: { userId: req.user.id } }, status: 'ACTIVE' },
        };
      } else if (req.user.actorType === 'STUDENT') {
        where.students = {
          some: { studentId: req.user.studentId, status: 'ACTIVE' },
        };
      }
    }

    const list = await prisma.class.findMany({
      where,
      include: {
        tutor: { include: { user: { select: { fullName: true, phone: true, avatarUrl: true } } } },
        subjectLevel: { include: { subject: true, gradeLevel: true } },
        students: {
          where: { status: 'ACTIVE' },
          include: { student: { select: { id: true, fullName: true, nickname: true, avatarKey: true } } },
        },
        schedules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

// Chi tiết 1 lớp học
export async function getClassDetail(req, res, next) {
  try {
    const { id } = req.params;
    const classItem = await prisma.class.findUnique({
      where: { id },
      include: {
        tutor: { include: { user: { select: { fullName: true, phone: true, email: true, avatarUrl: true } } } },
        subjectLevel: { include: { subject: true, gradeLevel: true } },
        students: {
          include: {
            student: {
              include: {
                parent: { include: { user: { select: { fullName: true, phone: true } } } },
                gradeLevel: true,
              },
            },
          },
        },
        schedules: true,
        lessons: {
          take: 10,
          orderBy: { startAt: 'desc' },
          include: { reports: true },
        },
      },
    });

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    res.json({ success: true, data: classItem });
  } catch (err) {
    next(err);
  }
}

// Tạo lớp học mới (Admin/Điều phối viên hoặc Gia sư tạo lớp nhóm)
export async function createClass(req, res, next) {
  try {
    const {
      name,
      format,
      capacity,
      minStudents,
      tutorId,
      subjectLevelId,
      teachingMode,
      location,
      meetingUrl,
      sessionDurationMin,
      defaultFeePerSession,
      tutorPayPerSession,
      startDate,
      schedules,
    } = req.body;

    const isStaff = req.user.roles.some(r => ['ADMIN', 'STAFF_MATCHING'].includes(r));
    let finalTutorId = tutorId;

    if (!isStaff) {
      // Gia sư tự tạo lớp nhóm đề xuất
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
      if (!tutor) {
        return res.status(403).json({ success: false, message: 'Bạn chưa có hồ sơ gia sư hợp lệ' });
      }
      finalTutorId = tutor.id;
    }

    if (!finalTutorId || !subjectLevelId || !name) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin lớp bắt buộc' });
    }

    const code = `LH-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;
    const initialStatus = isStaff ? (format === 'GROUP' ? 'OPEN' : 'ACTIVE') : 'PENDING_APPROVAL';

    const newClass = await prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: {
          code,
          name,
          format: format || 'ONE_ON_ONE',
          capacity: capacity ? parseInt(capacity, 10) : (format === 'GROUP' ? 6 : 1),
          minStudents: minStudents ? parseInt(minStudents, 10) : 1,
          tutorId: finalTutorId,
          subjectLevelId: parseInt(subjectLevelId, 10),
          createdById: req.user.id,
          creatorType: isStaff ? 'STAFF' : 'TUTOR',
          teachingMode: teachingMode || 'OFFLINE',
          location,
          meetingUrl,
          sessionDurationMin: sessionDurationMin ? parseInt(sessionDurationMin, 10) : 90,
          defaultFeePerSession: defaultFeePerSession || 150000,
          tutorPayPerSession: tutorPayPerSession || 120000,
          startDate: startDate ? new Date(startDate) : new Date(),
          status: initialStatus,
          approvedAt: isStaff ? new Date() : null,
          approvedById: isStaff ? req.user.id : null,
        },
      });

      // Tạo lịch lặp tuần nếu có
      if (Array.isArray(schedules) && schedules.length > 0) {
        for (const s of schedules) {
          await tx.classSchedule.create({
            data: {
              classId: created.id,
              weekday: parseInt(s.weekday, 10),
              startTime: s.startTime,
              endTime: s.endTime,
              effectiveFrom: startDate ? new Date(startDate) : new Date(),
            },
          });
        }
      }

      return created;
    });

    res.status(201).json({
      success: true,
      data: newClass,
      message: isStaff
        ? 'Tạo lớp học thành công'
        : 'Đã gửi đề xuất lớp nhóm. Vui lòng chờ Phòng Điều phối phê duyệt.',
    });
  } catch (err) {
    next(err);
  }
}

// Ghi danh học sinh vào lớp (Admin hoặc Điều phối viên)
export async function enrollStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { studentId, feePerSession } = req.body;

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: { students: { where: { status: 'ACTIVE' } } },
    });

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    if (classItem.students.length >= classItem.capacity) {
      return res.status(400).json({ success: false, message: 'Lớp học đã đủ sĩ số tối đa' });
    }

    const enrollment = await prisma.classStudent.upsert({
      where: { classId_studentId: { classId: id, studentId } },
      update: {
        status: 'ACTIVE',
        feePerSession: feePerSession || classItem.defaultFeePerSession,
        leftAt: null,
      },
      create: {
        classId: id,
        studentId,
        feePerSession: feePerSession || classItem.defaultFeePerSession,
        status: 'ACTIVE',
      },
    });

    // Nếu lớp đang OPEN và đạt minStudents thì chuyển sang ACTIVE
    const newCount = classItem.students.length + 1;
    if (classItem.status === 'OPEN' && newCount >= classItem.minStudents) {
      await prisma.class.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
    }

    res.json({ success: true, data: enrollment, message: 'Ghi danh học sinh thành công' });
  } catch (err) {
    next(err);
  }
}

// Buổi học tiếp theo gần nhất (cho Countdown trên /home)
export async function getNextLesson(req, res, next) {
  try {
    const now = new Date();
    const where = {
      startAt: { gte: now },
      status: 'SCHEDULED',
    };

    if (req.user.roles.includes('TUTOR')) {
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
      if (!tutor) return res.json({ success: true, data: null });
      where.class = { tutorId: tutor.id };
    } else if (req.user.roles.includes('PARENT')) {
      where.class = {
        students: { some: { student: { parent: { userId: req.user.id } }, status: 'ACTIVE' } },
      };
    } else if (req.user.actorType === 'STUDENT') {
      where.class = {
        students: { some: { studentId: req.user.studentId, status: 'ACTIVE' } },
      };
    }

    const nextLesson = await prisma.lesson.findFirst({
      where,
      include: {
        class: {
          include: {
            tutor: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
            subjectLevel: { include: { subject: true, gradeLevel: true } },
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    res.json({ success: true, data: nextLesson });
  } catch (err) {
    next(err);
  }
}

// Duyệt lớp nhóm do gia sư đề xuất
export async function approveClass(req, res, next) {
  try {
    const { id } = req.params;
    const approvedById = req.user.id;

    const classItem = await prisma.class.findUnique({ where: { id } });
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        status: classItem.format === 'GROUP' ? 'OPEN' : 'ACTIVE',
        approvedById,
        approvedAt: new Date(),
      },
    });

    res.json({ success: true, data: updated, message: 'Đã phê duyệt lớp học thành công' });
  } catch (err) {
    next(err);
  }
}

// Từ chối lớp nhóm do gia sư đề xuất
export async function rejectClass(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;

    const classItem = await prisma.class.findUnique({ where: { id } });
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rejectReason: rejectReason || 'Không phù hợp tiêu chí học thuật',
      },
    });

    res.json({ success: true, data: updated, message: 'Đã từ chối lớp học' });
  } catch (err) {
    next(err);
  }
}

// Cập nhật lịch học / thời khóa biểu cho lớp học của học sinh
export async function updateClassSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const { schedules, location, meetingUrl } = req.body;

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: { tutor: true },
    });

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    const isOwnerTutor = classItem.tutor?.userId === req.user.id;
    const isAdmin = req.user.roles?.includes('ADMIN');

    if (!isOwnerTutor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa lớp học này' });
    }

    // Cập nhật thông tin lớp
    await prisma.class.update({
      where: { id },
      data: {
        location: location !== undefined ? location : undefined,
        meetingUrl: meetingUrl !== undefined ? meetingUrl : undefined,
      },
    });

    // Nếu có mảng schedules truyền lên
    if (Array.isArray(schedules)) {
      // Xóa schedules cũ
      await prisma.classSchedule.deleteMany({ where: { classId: id } });

      // Tạo schedules mới
      if (schedules.length > 0) {
        await prisma.classSchedule.createMany({
          data: schedules.map((s) => ({
            classId: id,
            weekday: Number(s.weekday),
            startTime: s.startTime || '18:30',
            endTime: s.endTime || '20:00',
            effectiveFrom: new Date(),
          })),
        });
      }
    }

    const updated = await prisma.class.findUnique({
      where: { id },
      include: { schedules: true, students: { include: { student: true } } },
    });

    res.json({ success: true, data: updated, message: 'Cập nhật thời khóa biểu thành công!' });
  } catch (err) {
    next(err);
  }
}

// Gia sư giao bài tập về nhà cho học sinh trong lớp
export async function assignHomework(req, res, next) {
  try {
    const { id } = req.params;
    const { studentId, title, description, dueDate, type } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Tiêu đề bài tập không được để trống' });
    }

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: { tutor: true, students: true },
    });

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    const targetStudentId = studentId || classItem.students[0]?.studentId;
    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Lớp học chưa có học sinh để giao bài' });
    }

    const task = await prisma.assignmentTask.create({
      data: {
        classId: id,
        studentId: targetStudentId,
        createdById: req.user.id,
        title,
        description: description || null,
        type: type || 'HOMEWORK_PHOTO',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'ASSIGNED',
      },
    });

    res.status(201).json({ success: true, data: task, message: 'Đã giao bài tập về nhà cho bé thành công!' });
  } catch (err) {
    next(err);
  }
}

// Xóa lớp học (Admin / Ban điều phối)
export async function deleteClass(req, res, next) {
  try {
    const { id } = req.params;
    const isStaffOrAdmin = req.user.roles.some((r) =>
      ['ADMIN', 'STAFF_MATCHING', 'STAFF_CS'].includes(r)
    );
    if (!isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Chỉ Quản trị viên hoặc Ban điều phối mới có quyền xóa lớp học' });
    }

    const classItem = await prisma.class.findUnique({ where: { id } });
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assignmentTask.deleteMany({ where: { classId: id } });
      await tx.lessonReport.deleteMany({ where: { classId: id } });
      await tx.lesson.deleteMany({ where: { classId: id } });
      await tx.classSchedule.deleteMany({ where: { classId: id } });
      await tx.classStudent.deleteMany({ where: { classId: id } });
      await tx.class.delete({ where: { id } });
    });

    res.json({ success: true, message: `Đã xóa lớp học ${classItem.code || id} thành công` });
  } catch (err) {
    next(err);
  }
}

