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

      // Nếu user là Phụ Huynh (PARENT), chỉ trả về các yêu cầu tìm gia sư của chính phụ huynh đó
      const isParent = req.user && (req.user.roles?.includes('PARENT') || req.user.userType === 'PARENT');
      const isAdminOrStaff = req.user && (req.user.roles?.includes('ADMIN') || req.user.userType === 'STAFF');

      if (isParent && !isAdminOrStaff) {
        let parent = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
        if (!parent) {
          parent = await prisma.parentProfile.create({ data: { userId: req.user.id } });
        }
        where.parentId = parent.id;
      }

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
      let {
        parentId,
        studentId,
        studentName,
        gradeLevelId,
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

      // 1. Tự động xác định Parent
      if (!parentId && req.user) {
        let parent = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
        if (!parent) {
          parent = await prisma.parentProfile.create({ data: { userId: req.user.id } });
        }
        parentId = parent.id;
      }

      // 2. Tự động xác định Student nếu chưa chọn
      if (!studentId && parentId) {
        // Tìm bé theo studentName hoặc lấy bé đầu tiên của phụ huynh
        let student = null;
        if (studentName) {
          student = await prisma.studentProfile.findFirst({
            where: { parentId, fullName: studentName },
          });
        }
        if (!student) {
          student = await prisma.studentProfile.findFirst({
            where: { parentId },
            orderBy: { createdAt: 'desc' },
          });
        }
        if (!student) {
          // Tạo nhanh hồ sơ học sinh nếu phụ huynh chưa có
          const defaultGradeId = gradeLevelId ? Number(gradeLevelId) : 4;
          student = await prisma.studentProfile.create({
            data: {
              parentId,
              fullName: studentName || 'Học sinh',
              gradeLevelId: defaultGradeId,
            },
          });
        }
        studentId = student.id;
      }

      // 3. Tự động xác định SubjectLevel phù hợp nếu chưa có
      if (!subjectLevelId) {
        const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
        const gId = student?.gradeLevelId || 4;
        const subLevel = await prisma.subjectLevel.findFirst({
          where: { gradeLevelId: gId },
        });
        subjectLevelId = subLevel ? subLevel.id : 1;
      }

      const code = `CR${Date.now().toString().slice(-6)}`;
      const isStaffOrAdmin = req.user?.roles?.includes('ADMIN') || req.user?.userType === 'STAFF';

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
          handlerId: isStaffOrAdmin ? req.user.id : null,
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

  // Duyệt ghép lớp trực tiếp với 1 gia sư (Direct Match)
  async directMatch(req, res, next) {
    try {
      const { id } = req.params;
      const { tutorId, feePerSession, classTitle } = req.body;

      if (!tutorId) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn gia sư để ghép lớp' });
      }

      const request = await prisma.classRequest.findUnique({
        where: { id },
        include: {
          student: true,
          subjectLevel: { include: { subject: true, gradeLevel: true } },
        },
      });

      if (!request) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
      }

      if (request.status === 'MATCHED') {
        return res.status(400).json({ success: false, message: 'Yêu cầu này đã được ghép lớp trước đó' });
      }

      const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorId },
        include: { user: true },
      });
      if (!tutor) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin gia sư' });
      }

      const finalFee = feePerSession || request.budgetPerSession || tutor.hourlyRate || 200000;

      const result = await prisma.$transaction(async (tx) => {
        const offer = await tx.classOffer.upsert({
          where: { requestId_tutorId: { requestId: id, tutorId: tutor.id } },
          create: {
            requestId: id,
            tutorId: tutor.id,
            source: 'STAFF_OFFER',
            status: 'SELECTED',
            proposedPay: finalFee,
            expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          },
          update: {
            status: 'SELECTED',
            proposedPay: finalFee,
          },
        });

        await tx.classOffer.updateMany({
          where: { requestId: id, id: { not: offer.id } },
          data: { status: 'NOT_SELECTED' },
        });

        await tx.classRequest.update({
          where: { id },
          data: { status: 'MATCHED', matchedAt: new Date() },
        });

        const classCode = `CL${Date.now().toString().slice(-6)}`;
        const title = classTitle || `Lớp ${request.subjectLevel?.subject?.name || 'Môn học'} ${request.subjectLevel?.gradeLevel?.name || ''} - ${request.student?.fullName || 'Học sinh'}`;

        const newClass = await tx.class.create({
          data: {
            code: classCode,
            title,
            subjectLevelId: request.subjectLevelId,
            tutorId: tutor.id,
            format: request.preferredFormat || 'ONE_ON_ONE',
            capacity: request.preferredFormat === 'GROUP' ? 5 : 1,
            teachingMode: request.teachingMode,
            address: request.address,
            province: request.province,
            district: request.district,
            sessionsPerWeek: request.sessionsPerWeek,
            sessionDurationMin: request.sessionDurationMin,
            feePerSession: finalFee,
            status: 'ACTIVE',
            startDate: new Date(),
          },
        });

        await tx.classStudent.create({
          data: {
            classId: newClass.id,
            studentId: request.studentId,
            requestId: request.id,
            feePerSession: finalFee,
            status: 'ENROLLED',
          },
        });

        return { newClass };
      });

      res.json({
        success: true,
        data: result,
        message: `Đã duyệt ghép lớp thành công với gia sư ${tutor.user?.fullName || ''}!`,
      });
    } catch (err) {
      next(err);
    }
  },

  // Xóa / Hủy yêu cầu ghép lớp
  async deleteRequest(req, res, next) {
    try {
      const { id } = req.params;
      const request = await prisma.classRequest.findUnique({ where: { id } });
      if (!request) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu ghép lớp' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.classOffer.deleteMany({ where: { requestId: id } });
        await tx.classStudent.deleteMany({ where: { requestId: id } });
        await tx.classRequest.delete({ where: { id } });
      });

      res.json({ success: true, message: 'Đã xóa yêu cầu ghép lớp thành công' });
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
