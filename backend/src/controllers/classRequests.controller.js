// backend/src/controllers/classRequests.controller.js
import prisma from '../config/prisma.js';

export const classRequestsController = {
  // Lấy danh sách yêu cầu tìm gia sư
  async getRequests(req, res, next) {
    try {
      const { status, subjectLevelId, onBoard } = req.query;
      const where = {};
      if (status) where.status = status;
      if (subjectLevelId) where.subjectLevelId = Number(subjectLevelId);
      if (onBoard !== undefined) where.onBoard = onBoard === 'true';

      const requests = await prisma.classRequest.findMany({
        where,
        include: {
          student: {
            include: { gradeLevel: true },
          },
          parent: {
            include: { user: { select: { fullName: true, phone: true } } },
          },
          subjectLevel: {
            include: { subject: true, gradeLevel: true },
          },
          offers: {
            include: {
              tutor: {
                include: { user: { select: { fullName: true, phone: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  },

  // Chi tiết yêu cầu
  async getRequestDetail(req, res, next) {
    try {
      const { id } = req.params;
      const request = await prisma.classRequest.findUnique({
        where: { id },
        include: {
          student: { include: { gradeLevel: true } },
          parent: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
          subjectLevel: { include: { subject: true, gradeLevel: true } },
          handler: { select: { id: true, fullName: true } },
          offers: {
            include: {
              tutor: {
                include: {
                  user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!request) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
      }

      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  },

  // Tạo yêu cầu tìm gia sư
  async createRequest(req, res, next) {
    try {
      const {
        parentId,
        studentId,
        subjectLevelId,
        preferredFormat,
        sessionsPerWeek,
        sessionDurationMin = 90,
        preferredSlots = [],
        teachingMode = 'OFFLINE',
        address,
        province,
        district,
        budgetPerSession,
        tutorGenderPref,
        note,
        offerMode = 'COORDINATOR_PICK',
        onBoard = false,
      } = req.body;

      const code = `CR${Date.now().toString().slice(-6)}`;

      const request = await prisma.classRequest.create({
        data: {
          code,
          parentId,
          studentId,
          subjectLevelId: Number(subjectLevelId),
          preferredFormat: preferredFormat || 'ONE_ON_ONE',
          sessionsPerWeek: Number(sessionsPerWeek) || 2,
          sessionDurationMin: Number(sessionDurationMin) || 90,
          preferredSlots,
          teachingMode,
          address,
          province,
          district,
          budgetPerSession,
          tutorGenderPref,
          note,
          offerMode,
          onBoard,
          handlerId: req.user.id,
          status: 'NEW',
        },
        include: {
          student: true,
          subjectLevel: { include: { subject: true, gradeLevel: true } },
        },
      });

      res.status(201).json({ success: true, data: request, message: 'Đã tạo yêu cầu tìm gia sư thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Gửi Offer song song cho nhiều gia sư cùng lúc
  async sendParallelOffers(req, res, next) {
    try {
      const { id } = req.params;
      const { tutorIds, proposedFee, note, expiresHours = 24 } = req.body;

      if (!Array.isArray(tutorIds) || tutorIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 gia sư' });
      }

      const request = await prisma.classRequest.findUnique({ where: { id } });
      if (!request) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
      }

      const expiresAt = new Date(Date.now() + expiresHours * 3600 * 1000);

      // Tạo offer cho từng gia sư
      const createdOffers = await prisma.$transaction(async (tx) => {
        const offers = [];
        for (const tutorId of tutorIds) {
          const offer = await tx.classOffer.upsert({
            where: {
              requestId_tutorId: {
                requestId: id,
                tutorId,
              },
            },
            create: {
              requestId: id,
              tutorId,
              source: 'STAFF_OFFER',
              status: 'PENDING',
              proposedPay: proposedFee ? proposedFee : undefined,
              message: note || undefined,
              expiresAt,
            },
            update: {
              expiresAt, // Gia hạn nếu đã có
              status: 'PENDING',
              proposedPay: proposedFee ? proposedFee : undefined,
              message: note || undefined,
            },
          });
          offers.push(offer);
        }

        // Cập nhật trạng thái yêu cầu sang OFFERING
        await tx.classRequest.update({
          where: { id },
          data: { status: 'OFFERING' },
        });

        return offers;
      });

      res.json({
        success: true,
        data: createdOffers,
        message: `Đã gửi offer song song thành công cho ${createdOffers.length} gia sư`,
      });
    } catch (err) {
      next(err);
    }
  },

  // Chọn gia sư và chốt ghép lớp (Matched)
  async selectOffer(req, res, next) {
    try {
      const { id } = req.params;
      const { offerId, createClassDirectly = true, classTitle } = req.body;

      const offer = await prisma.classOffer.findUnique({
        where: { id: offerId },
        include: { tutor: true },
      });

      if (!offer || offer.requestId !== id) {
        return res.status(400).json({ success: false, message: 'Offer không hợp lệ' });
      }

      const request = await prisma.classRequest.findUnique({
        where: { id },
        include: { student: true, subjectLevel: { include: { subject: true, gradeLevel: true } } },
      });

      const result = await prisma.$transaction(async (tx) => {
        // Thêm SELECT FOR UPDATE để lock row class_request
        await tx.$executeRawUnsafe(
          `SELECT id FROM class_requests WHERE id = $1 FOR UPDATE`,
          id
        );
        const currentRequest = await tx.classRequest.findUnique({
          where: { id },
          select: { status: true },
        });
        if (currentRequest?.status === 'MATCHED') {
          throw { status: 409, message: 'Yêu cầu này đã được ghép lớp thành công trước đó' };
        }

        // Cập nhật offer được chọn
        await tx.classOffer.update({
          where: { id: offerId },
          data: { status: 'SELECTED' },
        });

        // Đánh dấu các offer khác thành NOT_SELECTED
        await tx.classOffer.updateMany({
          where: { requestId: id, id: { not: offerId } },
          data: { status: 'NOT_SELECTED' },
        });

        // Chuyển trạng thái yêu cầu sang MATCHED
        await tx.classRequest.update({
          where: { id },
          data: { status: 'MATCHED', matchedAt: new Date() },
        });

        let newClass = null;
        if (createClassDirectly) {
          const classCode = `CL${Date.now().toString().slice(-6)}`;
          const title = classTitle || `Lớp ${request.subjectLevel.subject.name} ${request.subjectLevel.gradeLevel.name} - ${request.student.fullName}`;

          newClass = await tx.class.create({
            data: {
              code: classCode,
              title,
              subjectLevelId: request.subjectLevelId,
              tutorId: offer.tutorId,
              format: request.preferredFormat || 'ONE_ON_ONE',
              capacity: request.preferredFormat === 'GROUP' ? 5 : 1,
              teachingMode: request.teachingMode,
              address: request.address,
              province: request.province,
              district: request.district,
              sessionsPerWeek: request.sessionsPerWeek,
              sessionDurationMin: request.sessionDurationMin,
              feePerSession: offer.proposedFee || request.budgetPerSession,
              status: 'ACTIVE',
              startDate: new Date(),
            },
          });

          // Ghi danh học sinh vào lớp
          await tx.classStudent.create({
            data: {
              classId: newClass.id,
              studentId: request.studentId,
              requestId: request.id,
              feePerSession: offer.proposedFee || request.budgetPerSession,
              status: 'ENROLLED',
            },
          });
        }

        return { request, newClass };
      });

      res.json({
        success: true,
        data: result,
        message: 'Đã chốt gia sư và ghép lớp thành công!',
      });
    } catch (err) {
      next(err);
    }
  },

  // Gợi ý gia sư thật thông minh dựa trên matching score
  async getSuggestions(req, res, next) {
    try {
      const { id } = req.params;
      const { matchingService } = await import('../services/matching.service.js');
      const data = await matchingService.getSuggestionsForRequest(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
