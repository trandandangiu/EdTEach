// backend/src/controllers/tutors.controller.js
import prisma from '../config/prisma.js';

export const tutorsController = {
  // Ứng viên gửi đơn đăng ký gia sư (TutorApplyPage)
  async apply(req, res, next) {
    try {
      const {
        username,
        password,
        fullName,
        email,
        phone,
        avatarUrl,
        dob,
        gender,
        province,
        district,
        school,
        major,
        degree,
        experienceYears = 0,
        bio,
        customSubjects,
        expectedRate = 200000,
        teachingMode = 'BOTH',
        canTeachGroup = false,
        subjectLevelIds = [],
      } = req.body;

      const finalUsername = (username || (email ? email.split('@')[0] : `tutor_${Date.now().toString().slice(-6)}`)).trim().toLowerCase();
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password || 'password123', 10);

      let userId = req.user?.id;
      // Nếu chưa có tài khoản, tạo hoặc tìm user theo username/email/phone
      if (!userId) {
        let user = await prisma.user.findFirst({
          where: { OR: [{ username: finalUsername }, { email }, { phone }] },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              username: finalUsername,
              email: email || `tutor_${Date.now()}@edtech.local`,
              phone: phone || '',
              fullName,
              avatarUrl: avatarUrl || null,
              passwordHash,
              userType: 'TUTOR',
            },
          });

          // Gán role APPLICANT
          const applicantRole = await prisma.role.findUnique({ where: { code: 'APPLICANT' } });
          if (applicantRole) {
            await prisma.userRole.create({
              data: { userId: user.id, roleId: applicantRole.id },
            });
          }
        } else {
          // Cập nhật thông tin avatar hoặc password nếu có
          await prisma.user.update({
            where: { id: user.id },
            data: {
              fullName: fullName || user.fullName,
              avatarUrl: avatarUrl || user.avatarUrl,
              passwordHash: password ? passwordHash : user.passwordHash,
            },
          });
        }
        userId = user.id;
      }

      const code = `TAP${Date.now().toString().slice(-6)}`;

      const fullBio = [
        req.body.subjects ? `Môn đăng ký: ${Array.isArray(req.body.subjects) ? req.body.subjects.join(', ') : req.body.subjects}` : '',
        customSubjects ? `Môn tự nhập: ${customSubjects}` : '',
        bio
      ].filter(Boolean).join('\n');

      const application = await prisma.$transaction(async (tx) => {
        // Tạo đơn ứng tuyển
        const app = await tx.tutorApplication.create({
          data: {
            code,
            userId,
            fullName,
            phone,
            email,
            dob: dob ? new Date(dob) : null,
            gender,
            province,
            district,
            school,
            major,
            degree,
            experienceYears: Number(experienceYears),
            bio: fullBio,
            expectedRate,
            teachingMode,
            canTeachGroup: Boolean(canTeachGroup),
            status: 'PENDING',
            submittedAt: new Date(),
          },
        });

        // Gán môn đăng ký dạy
        if (Array.isArray(subjectLevelIds) && subjectLevelIds.length > 0) {
          await tx.tutorApplicationSubject.createMany({
            data: subjectLevelIds.map((slId) => ({
              applicationId: app.id,
              subjectLevelId: Number(slId),
            })),
            skipDuplicates: true,
          });
        }

        return app;
      });

      res.status(201).json({
        success: true,
        data: application,
        message: 'Hồ sơ ứng tuyển gia sư đã được gửi thành công! Ban Tuyển Dụng sẽ liên hệ thẩm định.',
      });
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách gia sư công khai (PublicTutorSearchPage & PublicHomePage)
  async getPublicTutors(req, res, next) {
    try {
      const { search, subject, grade, mode, maxRate } = req.query;
      const where = { status: 'ACTIVE' };

      if (mode && mode !== 'ALL') {
        where.teachingMode = mode;
      }

      if (maxRate) {
        where.hourlyRate = { lte: Number(maxRate) };
      }

      const tutors = await prisma.tutorProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true, phone: true, email: true },
          },
          subjects: {
            include: {
              subjectLevel: {
                include: { subject: true, gradeLevel: true },
              },
            },
          },
          classes: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter client-side cho subject / grade nếu có
      let filtered = tutors;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.user?.fullName?.toLowerCase().includes(q) ||
            t.headline?.toLowerCase().includes(q) ||
            t.bio?.toLowerCase().includes(q) ||
            t.subjects.some(
              (s) =>
                s.subjectLevel?.subject?.name?.toLowerCase().includes(q) ||
                s.subjectLevel?.gradeLevel?.name?.toLowerCase().includes(q)
            )
        );
      }

      if (subject) {
        filtered = filtered.filter((t) =>
          t.subjects.some((s) => s.subjectLevel?.subject?.name?.toLowerCase().includes(subject.toLowerCase()))
        );
      }

      if (grade) {
        filtered = filtered.filter((t) =>
          t.subjects.some((s) => s.subjectLevel?.gradeLevel?.name?.toLowerCase().includes(grade.toLowerCase()))
        );
      }

      const formatted = filtered.map((t) => {
        const subList = Array.from(new Set(t.subjects.map((s) => s.subjectLevel?.subject?.name).filter(Boolean)));
        const gradeList = Array.from(new Set(t.subjects.map((s) => s.subjectLevel?.gradeLevel?.name).filter(Boolean)));

        return {
          id: t.id,
          name: t.user?.fullName || 'Thầy/Cô Gia Sư',
          avatar: t.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          title: t.headline || 'Gia sư Tiểu học Sư phạm',
          badge: t.canTeachGroup ? 'Gia sư Tinh Hoa' : 'Gia sư Tận Tâm',
          verified: Boolean(t.verifiedAt),
          subjects: subList.length > 0 ? subList : ['Toán Tiểu học', 'Tiếng Việt'],
          grades: gradeList.length > 0 ? gradeList : ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'],
          hourlyRate: Number(t.hourlyRate || 300000),
          rating: 5.0,
          reviewCount: 30 + (t.classes?.length || 0) * 3,
          studentsTaught: (t.classes?.length || 0) * 4 + 12,
          location: t.province ? `${t.district || ''}, ${t.province}` : 'Hà Nội & TP.HCM',
          teachingMode: t.teachingMode || 'BOTH',
          bio: t.bio || 'Tận tâm hướng dẫn học sinh tiểu học, phương pháp sư phạm dễ hiểu, khơi gợi niềm vui học tập.',
          education: 'Tốt nghiệp Đại học Sư Phạm / Ngoại Ngữ',
          achievements: ['Chứng chỉ Nghiệp vụ Sư phạm Tiểu học', '100% Học sinh tiến bộ'],
          freeTrial: true,
          responseRate: '< 15 phút',
        };
      });

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Chi tiết gia sư công khai (PublicTutorDetailPage)
  async getPublicTutorDetail(req, res, next) {
    try {
      const { id } = req.params;
      const tutor = await prisma.tutorProfile.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true } },
          subjects: {
            include: {
              subjectLevel: { include: { subject: true, gradeLevel: true } },
            },
          },
          classes: true,
        },
      });

      if (!tutor) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin gia sư' });
      }

      const subList = Array.from(new Set(tutor.subjects.map((s) => s.subjectLevel?.subject?.name).filter(Boolean)));
      const gradeList = Array.from(new Set(tutor.subjects.map((s) => s.subjectLevel?.gradeLevel?.name).filter(Boolean)));

      const formatted = {
        id: tutor.id,
        name: tutor.user?.fullName,
        avatar: tutor.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        title: tutor.headline || 'Gia sư Tiểu học Sư phạm',
        badge: tutor.canTeachGroup ? 'Gia sư Tinh Hoa' : 'Gia sư Tận Tâm',
        verified: Boolean(tutor.verifiedAt),
        subjects: subList.length > 0 ? subList : ['Toán Tiểu học', 'Tiếng Việt'],
        grades: gradeList.length > 0 ? gradeList : ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'],
        hourlyRate: Number(tutor.hourlyRate || 300000),
        rating: 5.0,
        reviewCount: 45,
        studentsTaught: 50,
        location: tutor.province ? `${tutor.district || ''}, ${tutor.province}` : 'Hà Nội & TP.HCM',
        teachingMode: tutor.teachingMode || 'BOTH',
        bio: tutor.bio || 'Phương pháp học tư duy hình ảnh giúp bé say mê, nắm chắc kiến thức và tự tin làm bài tập.',
        education: 'Cử nhân Sư phạm Tiểu học',
        achievements: ['Giáo viên dạy giỏi cấp Thành phố', 'Top 1% Gia sư được phụ huynh đánh giá cao'],
        freeTrial: true,
        responseRate: '< 15 phút',
      };

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Gia sư lấy danh sách Offers nhận lớp gửi cho mình (TutorOffersInboxPage)
  async getMyOffers(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!profile) {
        return res.json({ success: true, data: [] });
      }

      const offers = await prisma.classOffer.findMany({
        where: { tutorId: profile.id },
        include: {
          request: {
            include: {
              student: { include: { gradeLevel: true } },
              parent: { include: { user: { select: { fullName: true, phone: true } } } },
              subjectLevel: { include: { subject: true, gradeLevel: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = offers.map((off) => ({
        id: off.id,
        requestId: off.requestId,
        requestTitle: `Lớp ${off.request?.subjectLevel?.subject?.name} ${off.request?.subjectLevel?.gradeLevel?.name}`,
        studentName: off.request?.student?.fullName || 'Học sinh',
        subject: off.request?.subjectLevel?.subject?.name,
        grade: off.request?.subjectLevel?.gradeLevel?.name,
        ratePerSession: Number(off.proposedFee || off.request?.budgetPerSession || 250000),
        sessionsPerWeek: off.request?.sessionsPerWeek || 2,
        mode: off.request?.teachingMode === 'ONLINE' ? 'Trực tuyến Zoom' : 'Dạy tại nhà',
        location: off.request?.address || off.request?.province || 'Theo thỏa thuận',
        status: off.status,
        createdAt: off.createdAt ? new Date(off.createdAt).toLocaleString('vi-VN') : '',
        deadlineHours: 24,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Gia sư phản hồi Offer (ACCEPTED hoặc DECLINED)
  async respondOffer(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACCEPTED' | 'DECLINED'
      const userId = req.user.id;

      const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!profile) {
        return res.status(403).json({ success: false, message: 'Bạn chưa có hồ sơ gia sư' });
      }

      const offer = await prisma.classOffer.findUnique({ where: { id } });
      if (!offer || offer.tutorId !== profile.id) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời' });
      }

      const updated = await prisma.classOffer.update({
        where: { id },
        data: { status, respondedAt: new Date() },
      });

      res.json({
        success: true,
        data: updated,
        message: status === 'ACCEPTED' ? 'Bạn đã nhận lời dạy lớp học này!' : 'Đã từ chối lời mời nhận lớp',
      });
    } catch (err) {
      next(err);
    }
  },

  // Gia sư lấy danh sách lớp học của mình (TutorClassesPage & TutorDashboard)
  async getMyClasses(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!profile) {
        return res.json({ success: true, data: [] });
      }

      const classes = await prisma.class.findMany({
        where: { tutorId: profile.id },
        include: {
          subjectLevel: { include: { subject: true, gradeLevel: true } },
          students: {
            include: {
              student: {
                include: {
                  parent: { include: { user: { select: { fullName: true, phone: true } } } },
                },
              },
            },
          },
          lessons: {
            orderBy: { startAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = classes.map((c) => {
        const firstStudent = c.students[0]?.student;
        const totalLessons = c.sessionsPerWeek ? c.sessionsPerWeek * 12 : 24;
        const completedLessons = c.lessons.filter((l) => l.status === 'CONFIRMED' || l.status === 'REPORTED').length;

        return {
          id: c.id,
          code: c.code,
          studentName: firstStudent?.fullName || 'Học sinh',
          parentName: firstStudent?.parent?.user?.fullName || 'Phụ huynh',
          parentPhone: firstStudent?.parent?.user?.phone || '',
          subject: c.subjectLevel?.subject?.name || 'Môn học',
          grade: c.subjectLevel?.gradeLevel?.name || 'Tiểu học',
          schedule: `${c.sessionsPerWeek || 2} buổi/tuần`,
          totalLessons,
          completedLessons,
          currentProgress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          status: c.status,
          nextLessonTime: 'Theo lịch xếp',
          tutorNotes: c.notes || 'Học sinh chăm chỉ, nắm bài tốt.',
        };
      });

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // -------------------------------------------------------------
  // Quản lý ứng viên & gia sư cho Admin (giữ nguyên & tối ưu)
  // -------------------------------------------------------------
  async getApplications(req, res, next) {
    try {
      const { status, search } = req.query;
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          { school: { contains: search, mode: 'insensitive' } },
        ];
      }

      const applications = await prisma.tutorApplication.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, fullName: true, avatarUrl: true, email: true, phone: true } },
          subjects: {
            include: {
              subjectLevel: { include: { subject: true, gradeLevel: true } },
            },
          },
          attempts: {
            select: { id: true, testId: true, percent: true, passed: true, status: true },
          },
          attachments: { where: { isDeleted: false } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  },

  async getApplicationDetail(req, res, next) {
    try {
      const { id } = req.params;
      const application = await prisma.tutorApplication.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true, fullName: true, avatarUrl: true, email: true, phone: true } },
          subjects: {
            include: {
              subjectLevel: { include: { subject: true, gradeLevel: true } },
            },
          },
          attempts: { include: { test: true } },
          attachments: { where: { isDeleted: false } },
          reviewer: { select: { id: true, fullName: true } },
        },
      });

      if (!application) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
      }

      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  },

  async reviewApplication(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rejectReason, interviewAt, interviewNote } = req.body;
      const reviewerId = req.user.id;

      const app = await prisma.tutorApplication.findUnique({
        where: { id },
        include: { subjects: true },
      });

      if (!app) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resApp = await tx.tutorApplication.update({
          where: { id },
          data: {
            status,
            reviewerId,
            rejectReason: status === 'REJECTED' ? rejectReason : null,
            interviewAt: interviewAt ? new Date(interviewAt) : undefined,
            interviewNote,
            decidedAt: ['APPROVED', 'REJECTED'].includes(status) ? new Date() : undefined,
          },
        });

        if (status === 'APPROVED') {
          let profile = await tx.tutorProfile.findUnique({ where: { userId: app.userId } });
          if (!profile) {
            profile = await tx.tutorProfile.create({
              data: {
                userId: app.userId,
                applicationId: app.id,
                headline: `Gia sư ${app.fullName} - ${app.school || 'Đại học Sư phạm'}`,
                bio: app.bio,
                hourlyRate: app.expectedRate,
                teachingMode: app.teachingMode,
                canTeachGroup: app.canTeachGroup,
                province: app.province,
                district: app.district,
                status: 'ACTIVE',
                verifiedAt: new Date(),
              },
            });

            if (app.subjects && app.subjects.length > 0) {
              await tx.tutorSubject.createMany({
                data: app.subjects.map((s) => ({
                  tutorId: profile.id,
                  subjectLevelId: s.subjectLevelId,
                })),
                skipDuplicates: true,
              });
            }
          }
        }

        if (status === 'TESTING') {
          try {
            const { emailService } = await import('../services/email.service.js');
            await emailService.sendExamInvitation(app.email, app.fullName, req.body.examInfo || {});
          } catch (mailErr) {
            console.warn('Gửi email mời thi thất bại:', mailErr.message);
          }
        }

        return resApp;
      });

      // Gửi thông báo SSE & Push cho ứng viên
      if (app.userId) {
        try {
          const { createAndPushNotification } = await import('../services/notification.helper.js');
          let notifTitle = 'Hồ sơ ứng tuyển gia sư đã được cập nhật';
          if (interviewAt) {
            notifTitle = `Lịch phỏng vấn gia sư: ${new Date(interviewAt).toLocaleString('vi-VN')}`;
          } else if (status === 'TESTING') {
            notifTitle = 'Hồ sơ đạt sơ tuyển: Mời bạn làm bài khảo sát chuyên môn (đã gửi email)';
          } else if (status === 'APPROVED') {
            notifTitle = 'Chúc mừng! Hồ sơ gia sư của bạn đã được phê duyệt';
          } else if (status === 'REJECTED') {
            notifTitle = 'Thông báo kết quả thẩm định hồ sơ gia sư';
          }

          await createAndPushNotification(prisma, {
            userId: app.userId,
            type: 'APPLICATION_STATUS_UPDATE',
            title: notifTitle,
            referenceType: 'TUTOR_APPLICATION',
            referenceId: app.id,
          });
        } catch (notifErr) {
          console.warn('Gửi thông báo ứng tuyển thất bại:', notifErr.message);
        }
      }

      res.json({ success: true, data: updated, message: `Hồ sơ đã được cập nhật trạng thái: ${status}` });
    } catch (err) {
      next(err);
    }
  },

  async getTutors(req, res, next) {
    try {
      const { status, search } = req.query;
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { user: { fullName: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search } } },
          { headline: { contains: search, mode: 'insensitive' } },
        ];
      }

      const tutors = await prisma.tutorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true } },
          subjects: {
            include: {
              subjectLevel: { include: { subject: true, gradeLevel: true } },
            },
          },
          classes: {
            where: { status: 'ACTIVE' },
            select: { id: true, title: true, format: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: tutors });
    } catch (err) {
      next(err);
    }
  },

  async updateTutorStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const tutor = await prisma.tutorProfile.update({
        where: { id },
        data: { status },
      });

      res.json({ success: true, data: tutor, message: 'Cập nhật trạng thái gia sư thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Admin ẩn hoặc hiển thị gia sư trên sàn công khai
  async toggleTutorVisibility(req, res, next) {
    try {
      const { id } = req.params;
      const tutor = await prisma.tutorProfile.findUnique({ where: { id } });
      if (!tutor) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ gia sư' });
      }

      const newStatus = tutor.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const updated = await prisma.tutorProfile.update({
        where: { id },
        data: { status: newStatus },
      });

      res.json({
        success: true,
        data: updated,
        message: newStatus === 'ACTIVE'
          ? 'Đã bật hiển thị gia sư trên sàn công khai'
          : 'Đã tạm ẩn hồ sơ gia sư khỏi sàn công khai',
      });
    } catch (err) {
      next(err);
    }
  },

  // Admin xóa gia sư đã được duyệt
  async deleteTutor(req, res, next) {
    try {
      const { id } = req.params;
      const tutor = await prisma.tutorProfile.findUnique({
        where: { id },
        include: {
          classes: true,
          reports: true,
          offers: true,
        },
      });

      if (!tutor) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ gia sư' });
      }

      const hasHistory = (tutor.classes?.length > 0) || (tutor.reports?.length > 0);

      if (hasHistory) {
        // Có dữ liệu ràng buộc lịch sử lớp/báo cáo -> Soft-delete & vô hiệu hóa
        await prisma.$transaction(async (tx) => {
          await tx.tutorProfile.update({
            where: { id },
            data: { status: 'SUSPENDED' },
          });

          await tx.user.update({
            where: { id: tutor.userId },
            data: { active: false, deletedAt: new Date() },
          });
        });

        return res.json({
          success: true,
          message: 'Gia sư đã có lịch sử lớp học. Hệ thống đã đình chỉ và vô hiệu hóa tài khoản an toàn.',
        });
      } else {
        // Chưa có lịch sử lớp học -> Xóa triệt để
        await prisma.$transaction(async (tx) => {
          await tx.tutorSubject.deleteMany({ where: { tutorId: id } });
          await tx.tutorAvailability.deleteMany({ where: { tutorId: id } });
          await tx.classOffer.deleteMany({ where: { tutorId: id } });
          await tx.tutorProfile.delete({ where: { id } });

          // Gỡ role TUTOR khỏi user
          const tutorRole = await tx.role.findUnique({ where: { code: 'TUTOR' } });
          if (tutorRole) {
            await tx.userRole.deleteMany({
              where: { userId: tutor.userId, roleId: tutorRole.id },
            });
          }
        });

        return res.json({
          success: true,
          message: 'Đã xóa hoàn toàn hồ sơ gia sư thành công.',
        });
      }
    } catch (err) {
      next(err);
    }
  },

  // Upload CV, bằng cấp, chứng chỉ cho hồ sơ ứng viên
  async uploadAttachment(req, res, next) {
    try {
      const { id } = req.params;
      const file = req.file;
      const { category = 'DEGREE_CERTIFICATE' } = req.body;
      const uploaderId = req.user.id;

      if (!file) {
        return res.status(400).json({ success: false, message: 'Chưa chọn file đính kèm' });
      }

      const application = await prisma.tutorApplication.findUnique({ where: { id } });
      if (!application) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
      }

      const attachment = await prisma.attachment.create({
        data: {
          uploaderId,
          tutorApplicationId: id,
          category,
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      });

      // Nếu nộp file bài thi Word/Excel -> tự động chuyển trạng thái hồ sơ sang TEST_SUBMITTED
      if (category === 'EXAM_SUBMISSION' || category === 'TEST_PAPER') {
        await prisma.tutorApplication.update({
          where: { id },
          data: { status: 'TEST_SUBMITTED' },
        });
      }

      res.status(201).json({
        success: true,
        data: attachment,
        message: category === 'EXAM_SUBMISSION' || category === 'TEST_PAPER'
          ? 'Đã tải lên bài làm khảo sát chuyên môn (Word/Excel) thành công!'
          : 'Tải lên tài liệu minh chứng thành công',
      });
    } catch (err) {
      next(err);
    }
  },

  // Hiệu suất giảng dạy & nhật ký vi phạm của gia sư
  async getTutorPerformance(req, res, next) {
    try {
      const { id } = req.params;
      const tutor = await prisma.tutorProfile.findUnique({
        where: { id },
        include: {
          user: { select: { fullName: true, phone: true, email: true, avatarUrl: true } },
          classes: { where: { status: 'ACTIVE' } },
          reports: true,
          violations: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!tutor) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy gia sư' });
      }

      const totalReports = tutor.reports.length;
      const onTimeReports = tutor.reports.filter((r) => r.status === 'CONFIRMED' || r.status === 'SUBMITTED').length;
      const onTimeRate = totalReports > 0 ? Math.round((onTimeReports / totalReports) * 100) : 100;

      res.json({
        success: true,
        data: {
          tutorId: tutor.id,
          name: tutor.user?.fullName,
          phone: tutor.user?.phone,
          status: tutor.status,
          activeClassesCount: tutor.classes.length,
          totalReports,
          onTimeRate,
          violations: tutor.violations,
          violationCount: tutor.violations.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // Ghi nhận vi phạm của gia sư
  async recordViolation(req, res, next) {
    try {
      const { id } = req.params;
      const { type = 'LATE_REPORT', note, severity = 1 } = req.body;

      const violation = await prisma.tutorViolation.create({
        data: {
          tutorId: id,
          type,
          note,
          severity: Number(severity),
        },
      });

      // Kiểm tra nếu gia sư vi phạm ≥ 3 lần thì tự động tạm đình chỉ (PAUSED / SUSPENDED)
      const count = await prisma.tutorViolation.count({ where: { tutorId: id } });
      let statusUpdated = false;
      if (count >= 3) {
        await prisma.tutorProfile.update({
          where: { id },
          data: { status: 'PAUSED' },
        });
        statusUpdated = true;
      }

      res.status(201).json({
        success: true,
        data: violation,
        statusUpdated,
        message: statusUpdated
          ? 'Đã ghi nhận vi phạm lần thứ 3+. Gia sư đã tự động chuyển sang trạng thái Tạm dừng!'
          : 'Đã ghi nhận vi phạm thành công',
      });
    } catch (err) {
      next(err);
    }
  },
};
