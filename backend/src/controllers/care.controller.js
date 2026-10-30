// backend/src/controllers/care.controller.js
import prisma from '../config/prisma.js';

// Danh sách phiếu chăm sóc
export async function getCareCases(req, res, next) {
  try {
    const { team, status, type, priority, assignee } = req.query;
    const where = {};

    if (team) where.team = team;
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = parseInt(priority, 10);
    if (assignee === 'me') where.assigneeId = req.user.id;

    // Giới hạn theo đội nếu không phải Admin
    if (!req.user.roles.includes('ADMIN')) {
      if (req.user.roles.includes('STAFF_CS')) where.team = 'CS_PARENT';
      else if (req.user.roles.includes('STAFF_TUTOR_CARE')) where.team = 'CS_TUTOR';
      else if (req.user.roles.includes('STAFF_ACADEMIC')) where.team = 'ACADEMIC';
    }

    const list = await prisma.careCase.findMany({
      where,
      include: {
        parent: { include: { user: { select: { fullName: true, phone: true } } } },
        tutor: { include: { user: { select: { fullName: true, phone: true } } } },
        assignee: { select: { id: true, fullName: true } },
        contactLogs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

// Chi tiết 1 phiếu chăm sóc
export async function getCareCaseDetail(req, res, next) {
  try {
    const { id } = req.params;
    const careCase = await prisma.careCase.findUnique({
      where: { id },
      include: {
        parent: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
        tutor: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
        assignee: { select: { id: true, fullName: true } },
        class: {
          include: {
            subjectLevel: { include: { subject: true, gradeLevel: true } },
          },
        },
        lessonReport: {
          include: { attachments: true, student: true },
        },
        contactLogs: {
          include: { staff: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!careCase) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu chăm sóc' });
    }

    res.json({ success: true, data: careCase });
  } catch (err) {
    next(err);
  }
}

// Ghi nhật ký liên hệ (gọi điện, Zalo, SMS)
export async function addContactLog(req, res, next) {
  try {
    const { id } = req.params;
    const { target, channel, outcome, note, followUpAt } = req.body;

    if (!target || !channel || !outcome || !note) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin cuộc gọi' });
    }

    const careCase = await prisma.careCase.findUnique({ where: { id } });
    if (!careCase) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu chăm sóc' });
    }

    const log = await prisma.$transaction(async (tx) => {
      const createdLog = await tx.careContactLog.create({
        data: {
          caseId: id,
          staffId: req.user.id,
          target,
          channel,
          outcome,
          note,
          followUpAt: followUpAt ? new Date(followUpAt) : null,
        },
      });

      // Tự động chuyển status phiếu sang IN_PROGRESS nếu đang OPEN
      if (careCase.status === 'OPEN') {
        await tx.careCase.update({
          where: { id },
          data: { status: 'IN_PROGRESS', assigneeId: req.user.id },
        });
      }

      return createdLog;
    });

    res.status(201).json({ success: true, data: log, message: 'Ghi nhật ký liên hệ thành công' });
  } catch (err) {
    next(err);
  }
}

// Cập nhật trạng thái phiếu
export async function updateCareCaseStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, assigneeId, resolution, priority } = req.body;

    const data = {};
    if (status) data.status = status;
    if (assigneeId) data.assigneeId = assigneeId;
    if (priority) data.priority = parseInt(priority, 10);
    if (resolution) {
      data.resolution = resolution;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        data.resolvedAt = new Date();
      }
    }

    const updated = await prisma.careCase.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: updated, message: 'Cập nhật phiếu thành công' });
  } catch (err) {
    next(err);
  }
}

// Báo cáo các buổi học quá hạn xác nhận (dành cho đội CSKH chủ động theo dõi)
export async function getUnconfirmedLessonReports(req, res, next) {
  try {
    const { olderThanHours } = req.query;
    const hours = olderThanHours ? parseInt(olderThanHours, 10) : 24;
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const list = await prisma.lessonReport.findMany({
      where: {
        status: 'SUBMITTED',
        submittedAt: { lte: threshold },
      },
      include: {
        student: {
          include: {
            parent: { include: { user: { select: { fullName: true, phone: true } } } },
          },
        },
        tutor: { include: { user: { select: { fullName: true, phone: true } } } },
        lesson: {
          include: { class: { include: { subjectLevel: { include: { subject: true } } } } },
        },
        careCases: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    next(err);
  }
}

// Thống kê KPI phiếu chăm sóc (Dashboard CSKH / CS Gia Sư / Học Thuật)
export async function getCareStats(req, res, next) {
  try {
    const { team } = req.query;
    const where = {};
    if (team) where.team = team;

    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.careCase.count({ where }),
      prisma.careCase.count({ where: { ...where, status: 'OPEN' } }),
      prisma.careCase.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.careCase.count({ where: { ...where, status: 'RESOLVED' } }),
    ]);

    const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const overdue = await prisma.careCase.count({
      where: {
        ...where,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        createdAt: { lte: overdueThreshold },
      },
    });

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        overdue,
      },
    });
  } catch (err) {
    next(err);
  }
}
