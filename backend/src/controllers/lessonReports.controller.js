// backend/src/controllers/lessonReports.controller.js
import prisma from '../config/prisma.js';
import { sseService } from '../services/sse.service.js';
import { pushService } from '../services/push.service.js';

// Gia sư nộp nhận xét buổi học (Sổ liên lạc)
export async function submitLessonReport(req, res, next) {
  try {
    const { lessonId } = req.params;
    const {
      studentId,
      attendance,
      lateMinutes,
      lessonContent,
      tutorComment,
      homeworkNote,
      needsAttention,
    } = req.body;

    // Kiểm tra gia sư có dạy lớp này không
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
    if (!tutor && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ success: false, message: 'Chỉ gia sư của lớp mới được nộp sổ liên lạc' });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        class: {
          include: {
            students: { where: { studentId }, include: { student: { include: { parent: true } } } },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    if (tutor && lesson.class.tutorId !== tutor.id && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ success: false, message: 'Bạn không phải gia sư phụ trách buổi học này' });
    }

    const isStudentInClass = lesson.class.students.some(s => s.studentId === studentId);
    if (!isStudentInClass) {
      return res.status(400).json({
        success: false,
        error: 'Học sinh không thuộc lớp học này',
      });
    }

    // Tạo hoặc cập nhật LessonReport
    const report = await prisma.$transaction(async (tx) => {
      const savedReport = await tx.lessonReport.upsert({
        where: {
          lessonId_studentId: { lessonId, studentId },
        },
        update: {
          attendance: attendance || 'PRESENT',
          lateMinutes: lateMinutes ? parseInt(lateMinutes, 10) : 0,
          lessonContent: lessonContent || 'Ôn tập kiến thức',
          tutorComment: tutorComment || '',
          homeworkNote,
          needsAttention: needsAttention === true || needsAttention === 'true',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
        create: {
          lessonId,
          studentId,
          tutorId: tutor ? tutor.id : lesson.class.tutorId,
          attendance: attendance || 'PRESENT',
          lateMinutes: lateMinutes ? parseInt(lateMinutes, 10) : 0,
          lessonContent: lessonContent || 'Ôn tập kiến thức',
          tutorComment: tutorComment || '',
          homeworkNote,
          needsAttention: needsAttention === true || needsAttention === 'true',
          status: 'SUBMITTED',
        },
      });

      // Lưu file đính kèm nếu có upload
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await tx.attachment.create({
            data: {
              uploaderId: req.user.id,
              lessonReportId: savedReport.id,
              category: 'CORRECTED_WORK',
              fileName: file.originalname,
              filePath: file.path.replace(/\\/g, '/'),
              fileSize: file.size,
              mimeType: file.mimetype,
            },
          });
        }
      }

      // Cập nhật trạng thái buổi học sang REPORTED
      await tx.lesson.update({
        where: { id: lessonId },
        data: { status: 'REPORTED' },
      });

      // Nếu gia sư đánh dấu needsAttention -> tạo phiếu CSKH/Học thuật
      if (needsAttention === true || needsAttention === 'true') {
        const careCode = `CS-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;
        await tx.careCase.create({
          data: {
            code: careCode,
            team: 'ACADEMIC',
            type: 'TUTOR_FLAGGED',
            priority: 2,
            title: `Gia sư cần lưu ý về học sinh trong buổi học`,
            detail: `Nhận xét: ${tutorComment}`,
            classId: lesson.classId,
            lessonReportId: savedReport.id,
            tutorId: tutor ? tutor.id : lesson.class.tutorId,
            status: 'OPEN',
          },
        });
      }

      return savedReport;
    });

    // Gửi thông báo Realtime / Push cho Phụ huynh
    const parentUserId = lesson.class.students[0]?.student?.parent?.userId;
    if (parentUserId) {
      const notifData = {
        title: 'Sổ liên lạc buổi học mới',
        content: `Gia sư đã gửi nhận xét buổi học. Mời phụ huynh vào xem và xác nhận.`,
        referenceType: 'LESSON_REPORT',
        referenceId: report.id,
        link: `/parent/reports/${report.id}`,
      };

      await prisma.notification.create({
        data: {
          userId: parentUserId,
          type: 'LESSON_REPORT_SUBMITTED',
          ...notifData,
        },
      });

      sseService.sendToUser(parentUserId, 'LESSON_REPORT_SUBMITTED', notifData);
      pushService.sendToUser(parentUserId, notifData).catch(() => {});
    }

    res.status(201).json({
      success: true,
      data: report,
      message: 'Nộp nhận xét buổi học thành công. Đã gửi thông báo tới phụ huynh.',
    });
  } catch (err) {
    next(err);
  }
}

// Lấy danh sách sổ liên lạc
export async function getLessonReports(req, res, next) {
  try {
    const { studentId, classId, status } = req.query;
    const where = {};

    if (studentId) where.studentId = studentId;
    if (classId) where.lesson = { classId };
    if (status) where.status = status;

    if (req.user.roles.includes('PARENT')) {
      where.student = { parent: { userId: req.user.id } };
    } else if (req.user.roles.includes('TUTOR')) {
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
      if (tutor) where.tutorId = tutor.id;
    }

    const list = await prisma.lessonReport.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, nickname: true, avatarKey: true } },
        tutor: { include: { user: { select: { fullName: true } } } },
        lesson: {
          include: {
            class: { include: { subjectLevel: { include: { subject: true } } } },
          },
        },
        attachments: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

// Chi tiết 1 sổ liên lạc
export async function getLessonReportDetail(req, res, next) {
  try {
    const { id } = req.params;
    const report = await prisma.lessonReport.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            parent: { include: { user: { select: { fullName: true, phone: true } } } },
            gradeLevel: true,
          },
        },
        tutor: { include: { user: { select: { fullName: true, phone: true } } } },
        lesson: {
          include: {
            class: {
              include: { subjectLevel: { include: { subject: true, gradeLevel: true } } },
            },
          },
        },
        attachments: true,
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sổ liên lạc' });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

// Phụ huynh xác nhận buổi học
export async function confirmLessonReport(req, res, next) {
  try {
    const { id } = req.params;
    const { parentFeedback } = req.body;

    const report = await prisma.lessonReport.findUnique({
      where: { id },
      include: {
        student: { include: { parent: true } },
        lesson: true,
        tutor: true,
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sổ liên lạc' });
    }

    if (report.student.parent.userId !== req.user.id && !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xác nhận sổ liên lạc này' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resReport = await tx.lessonReport.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          parentFeedback,
          confirmedAt: new Date(),
          confirmedById: req.user.id,
        },
      });

      // Nếu tất cả các report trong lesson đã confirm -> cập nhật lesson sang CONFIRMED
      const pendingReports = await tx.lessonReport.count({
        where: {
          lessonId: report.lessonId,
          status: { notIn: ['CONFIRMED', 'CONFIRMED_BY_STAFF'] },
        },
      });

      if (pendingReports === 0) {
        await tx.lesson.update({
          where: { id: report.lessonId },
          data: { status: 'CONFIRMED' },
        });
      }

      return resReport;
    });

    // Thông báo cho Gia sư
    if (report.tutor.userId) {
      sseService.sendToUser(report.tutor.userId, 'LESSON_REPORT_CONFIRMED', {
        title: 'Phụ huynh đã xác nhận buổi học',
        content: parentFeedback ? `Phản hồi: "${parentFeedback}"` : 'Phụ huynh đã xác nhận hoàn thành buổi học.',
        reportId: report.id,
      });
    }

    res.json({ success: true, data: updated, message: 'Xác nhận buổi học thành công. Cảm ơn phụ huynh!' });
  } catch (err) {
    next(err);
  }
}

// Phụ huynh bấm "Cần hỗ trợ"
export async function requestParentSupport(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const report = await prisma.lessonReport.findUnique({
      where: { id },
      include: {
        student: { include: { parent: true } },
        lesson: { include: { class: true } },
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sổ liên lạc' });
    }

    const careCode = `CS-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    await prisma.$transaction(async (tx) => {
      await tx.lessonReport.update({
        where: { id },
        data: { parentNeedsSupport: true, parentFeedback: message },
      });

      await tx.careCase.create({
        data: {
          code: careCode,
          team: 'CS_PARENT',
          type: 'PARENT_NEEDS_SUPPORT',
          priority: 3, // Ưu tiên cao
          title: `Phụ huynh yêu cầu CSKH hỗ trợ về buổi học`,
          detail: message || 'Phụ huynh bấm yêu cầu hỗ trợ từ sổ liên lạc',
          classId: report.lesson.classId,
          lessonReportId: report.id,
          parentId: report.student.parentId,
          tutorId: report.tutorId,
          status: 'OPEN',
        },
      });
    });

    res.json({
      success: true,
      message: 'Đã gửi yêu cầu hỗ trợ. Đội ngũ CSKH sẽ liên hệ với phụ huynh trong thời gian sớm nhất!',
    });
  } catch (err) {
    next(err);
  }
}

// CSKH xác nhận thay sau khi gọi điện thoại xác minh
export async function confirmOnBehalf(req, res, next) {
  try {
    const { id } = req.params;
    const { careCaseId, note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do và ghi chú xác nhận thay' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resReport = await tx.lessonReport.update({
        where: { id },
        data: {
          status: 'CONFIRMED_BY_STAFF',
          confirmedAt: new Date(),
          confirmedById: req.user.id,
          confirmNote: note,
        },
      });

      if (careCaseId) {
        await tx.careCase.update({
          where: { id: careCaseId },
          data: {
            status: 'RESOLVED',
            resolution: `Nhân viên ${req.user.fullName} xác nhận thay phụ huynh: ${note}`,
            resolvedAt: new Date(),
          },
        });
      }

      return resReport;
    });

    res.json({ success: true, data: updated, message: 'Đã xác nhận buổi học thay phụ huynh' });
  } catch (err) {
    next(err);
  }
}
