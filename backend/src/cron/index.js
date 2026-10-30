// backend/src/cron/index.js
import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { createAndPushNotification } from '../services/notification.helper.js';

export function startCronJobs() {
  console.log('⏰ Khởi động hệ thống tác vụ định kỳ tự động (Cron Runner)...');

  // =========================================================================
  // 1. generateLessons: 01:00 hàng ngày
  // Sinh tự động các buổi học (Lesson) trong 14 ngày tới cho các lớp ACTIVE
  // =========================================================================
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Đang sinh các buổi học tự động cho 14 ngày tới...');
    try {
      const activeClasses = await prisma.class.findMany({
        where: { status: 'ACTIVE' },
        include: { schedules: true },
      });

      const today = new Date();
      let createdLessonsCount = 0;

      for (const cls of activeClasses) {
        if (!cls.schedules || cls.schedules.length === 0) continue;

        for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + dayOffset);
          const targetDayOfWeek = targetDate.getDay(); // 0: Chủ nhật, 1: T2, ..., 6: T7

          // Tìm schedule khớp với weekday
          const matchingSchedule = cls.schedules.find((s) => {
            // weekday trong schema có thể là 0-6 hoặc 2-8
            return s.weekday === targetDayOfWeek || (s.weekday === 8 && targetDayOfWeek === 0) || (s.weekday === targetDayOfWeek + 1);
          });

          if (!matchingSchedule) continue;

          // Tính startAt và endAt
          const [startHour, startMin] = matchingSchedule.startTime.split(':').map(Number);
          const [endHour, endMin] = matchingSchedule.endTime.split(':').map(Number);

          const startAt = new Date(targetDate);
          startAt.setHours(startHour, startMin, 0, 0);

          const endAt = new Date(targetDate);
          endAt.setHours(endHour, endMin, 0, 0);

          // Kiểm tra xem đã sinh buổi học này chưa
          const existingLesson = await prisma.lesson.findFirst({
            where: {
              classId: cls.id,
              startAt: {
                gte: new Date(startAt.getTime() - 60000),
                lte: new Date(startAt.getTime() + 60000),
              },
            },
          });

          if (!existingLesson) {
            await prisma.lesson.create({
              data: {
                classId: cls.id,
                scheduleId: matchingSchedule.id,
                startAt,
                endAt,
                status: 'SCHEDULED',
              },
            });
            createdLessonsCount++;
          }
        }
      }

      console.log(`[CRON] Hoàn tất sinh lịch học: ${createdLessonsCount} buổi học mới đã được tạo.`);
    } catch (err) {
      console.error('[CRON ERROR - generateLessons]:', err.message);
    }
  });

  // =========================================================================
  // 2. lessonReminders: Chạy 5 phút / lần
  // Nhắc nhở buổi học trước 60 phút tới gia sư, học sinh và phụ huynh
  // =========================================================================
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const in65Min = new Date(now.getTime() + 65 * 60 * 1000);
      const in55Min = new Date(now.getTime() + 55 * 60 * 1000);

      const upcomingLessons = await prisma.lesson.findMany({
        where: {
          status: 'SCHEDULED',
          startAt: {
            gte: in55Min,
            lte: in65Min,
          },
        },
        include: {
          class: {
            include: {
              tutor: { include: { user: true } },
              students: {
                include: {
                  student: {
                    include: {
                      user: true,
                      parent: { include: { user: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const lesson of upcomingLessons) {
        const classTitle = lesson.class?.name || 'Lớp học';

        // Nhắc gia sư
        if (lesson.class?.tutor?.user?.id) {
          await createAndPushNotification(null, {
            userId: lesson.class.tutor.user.id,
            type: 'LESSON_REMINDER',
            title: `Nhắc lịch: Buổi học "${classTitle}" sẽ diễn ra sau 60 phút nữa`,
            referenceType: 'LESSON',
            referenceId: lesson.id,
          });
        }

        // Nhắc phụ huynh & học sinh
        for (const cs of lesson.class?.students || []) {
          const parentUserId = cs.student?.parent?.user?.id;
          if (parentUserId) {
            await createAndPushNotification(null, {
              userId: parentUserId,
              type: 'LESSON_REMINDER',
              title: `Buổi học "${classTitle}" của bé ${cs.student?.fullName} sẽ bắt đầu sau 60 phút`,
              referenceType: 'LESSON',
              referenceId: lesson.id,
            });
          }

          const studentUserId = cs.student?.user?.id;
          if (studentUserId) {
            await createAndPushNotification(null, {
              userId: studentUserId,
              type: 'LESSON_REMINDER',
              title: `Chuẩn bị góc học tập: Lớp "${classTitle}" sắp bắt đầu sau 60 phút nhé!`,
              referenceType: 'LESSON',
              referenceId: lesson.id,
            });
          }
        }
      }
    } catch (err) {
      console.error('[CRON ERROR - lessonReminders]:', err.message);
    }
  });

  // =========================================================================
  // 3. reportOverdue: Chạy 1 giờ / lần
  // Nhắc gia sư nộp báo cáo sau 12h, tự động tạo CareCase & Violation sau 24h
  // =========================================================================
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const past12h = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Quét các buổi học đã kết thúc hơn 12h mà chưa có báo cáo nào
      const lessonsMissingReport = await prisma.lesson.findMany({
        where: {
          endAt: { lte: past12h },
          status: { in: ['SCHEDULED', 'COMPLETED'] },
          reports: { none: {} },
        },
        include: {
          class: {
            include: {
              tutor: { include: { user: true } },
            },
          },
        },
      });

      for (const lesson of lessonsMissingReport) {
        const tutor = lesson.class?.tutor;
        if (!tutor) continue;

        // Nếu quá 24h: Tự động tạo CareCase cho ban CSKH Gia Sư và ghi nhận Vi phạm
        if (lesson.endAt <= past24h) {
          const existingCase = await prisma.careCase.findFirst({
            where: {
              type: 'REPORT_OVERDUE',
              classId: lesson.classId,
              tutorId: tutor.id,
              status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
          });

          if (!existingCase) {
            const caseCode = `CS-TUTOR-${Date.now().toString().slice(-6)}`;
            await prisma.careCase.create({
              data: {
                code: caseCode,
                team: 'CS_TUTOR',
                type: 'REPORT_OVERDUE',
                priority: 3,
                title: `Gia sư ${tutor.user.fullName} trễ nộp báo cáo buổi học > 24h`,
                detail: `Buổi học lớp "${lesson.class.name}" kết thúc lúc ${lesson.endAt.toLocaleString('vi-VN')} nhưng chưa có báo cáo sổ liên lạc.`,
                classId: lesson.classId,
                tutorId: tutor.id,
                dueAt: new Date(now.getTime() + 12 * 3600 * 1000),
                status: 'OPEN',
              },
            });

            // Ghi nhận vi phạm
            await prisma.tutorViolation.create({
              data: {
                tutorId: tutor.id,
                type: 'LATE_REPORT',
                severity: 1,
                note: `Tự động ghi nhận: Trễ nộp báo cáo buổi học kết thúc lúc ${lesson.endAt.toLocaleString('vi-VN')} quá 24 giờ.`,
              },
            });

            // Báo notification cho gia sư
            if (tutor.user?.id) {
              await createAndPushNotification(null, {
                userId: tutor.user.id,
                type: 'REPORT_OVERDUE_ALERT',
                title: `Cảnh báo: Bạn đã trễ nộp báo cáo buổi học "${lesson.class.name}" quá 24h. Hệ thống đã ghi nhận 1 lần vi phạm.`,
                referenceType: 'LESSON',
                referenceId: lesson.id,
              });
            }
          }
        } else {
          // Chỉ mới quá 12h: Gửi notification nhắc nhở gia sư nộp báo cáo
          if (tutor.user?.id) {
            await createAndPushNotification(null, {
              userId: tutor.user.id,
              type: 'REPORT_REMINDER',
              title: `Nhắc nhở nộp báo cáo: Buổi học "${lesson.class.name}" đã kết thúc 12h trước. Vui lòng nộp báo cáo trước mốc 24h.`,
              referenceType: 'LESSON',
              referenceId: lesson.id,
            });
          }
        }
      }
    } catch (err) {
      console.error('[CRON ERROR - reportOverdue]:', err.message);
    }
  });

  // =========================================================================
  // 4. reportUnconfirmed: Chạy 1 giờ / lần
  // Quét báo cáo đã nộp > 24h mà phụ huynh chưa xác nhận -> Tạo CareCase CSKH
  // =========================================================================
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const unconfirmedReports = await prisma.lessonReport.findMany({
        where: {
          status: 'SUBMITTED',
          submittedAt: { lte: past24h },
        },
        include: {
          student: {
            include: {
              parent: { include: { user: true } },
            },
          },
          lesson: { include: { class: true } },
        },
      });

      for (const report of unconfirmedReports) {
        const existingCase = await prisma.careCase.findFirst({
          where: {
            lessonReportId: report.id,
          },
        });

        if (!existingCase) {
          const caseCode = `CS-UNCONF-${Date.now().toString().slice(-6)}`;
          await prisma.careCase.create({
            data: {
              code: caseCode,
              team: 'CS_PARENT',
              type: 'REPORT_UNCONFIRMED',
              priority: 2,
              title: `Báo cáo buổi học của bé ${report.student.fullName} chưa được phụ huynh xác nhận sau 24h`,
              detail: `Báo cáo nộp lúc ${report.submittedAt.toLocaleString('vi-VN')}. Nhân viên CSKH cần gọi điện thăm hỏi hoặc xác nhận thay.`,
              classId: report.lesson?.classId,
              lessonReportId: report.id,
              parentId: report.student?.parent?.id,
              tutorId: report.tutorId,
              dueAt: new Date(now.getTime() + 24 * 3600 * 1000),
              status: 'OPEN',
            },
          });
        }
      }
    } catch (err) {
      console.error('[CRON ERROR - reportUnconfirmed]:', err.message);
    }
  });

  // =========================================================================
  // 5. careFollowUps: Chạy 15 phút / lần
  // Nhắc nhân sự phiếu CSKH sắp hoặc đã quá hạn SLA
  // =========================================================================
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const overdueCases = await prisma.careCase.findMany({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueAt: { lte: now },
        },
        include: {
          assignee: true,
        },
      });

      for (const c of overdueCases) {
        if (c.assigneeId) {
          await createAndPushNotification(null, {
            userId: c.assigneeId,
            type: 'CARE_SLA_BREACH',
            title: `Cảnh báo SLA: Phiếu chăm sóc [${c.code}] đã quá hạn xử lý!`,
            referenceType: 'CARE_CASE',
            referenceId: c.id,
          });
        }
      }
    } catch (err) {
      console.error('[CRON ERROR - careFollowUps]:', err.message);
    }
  });

  // =========================================================================
  // 6. expireOffers: Chạy 15 phút / lần
  // Chuyển các offer gia sư hết hạn sang EXPIRED
  // =========================================================================
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const expiredCount = await prisma.classOffer.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lte: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      if (expiredCount.count > 0) {
        console.log(`[CRON] Đã chuyển ${expiredCount.count} offer lớp học hết hạn sang EXPIRED.`);
      }
    } catch (err) {
      console.error('[CRON ERROR - expireOffers]:', err.message);
    }
  });

  // =========================================================================
  // 7. expireAttempts: Chạy 1 phút / lần
  // Tự động kết thúc bài thi khảo sát ứng viên khi hết giờ làm bài
  // =========================================================================
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const overdueAttempts = await prisma.assessmentAttempt.findMany({
        where: {
          status: 'IN_PROGRESS',
          deadlineAt: { lte: now },
        },
      });

      for (const attempt of overdueAttempts) {
        await prisma.assessmentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'SUBMITTED',
            submittedAt: now,
          },
        });
      }
    } catch (err) {
      console.error('[CRON ERROR - expireAttempts]:', err.message);
    }
  });

  // =========================================================================
  // 8. streakReset: Chạy lúc 00:05 hàng ngày
  // Reset streak học tập của học sinh nếu ngày hôm qua không hoàn thành nhiệm vụ
  // =========================================================================
  cron.schedule('5 0 * * *', async () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Học sinh có streak > 0 nhưng lastActiveDate trước ngày hôm qua
      await prisma.studentProfile.updateMany({
        where: {
          streakDays: { gt: 0 },
          OR: [
            { lastActiveDate: null },
            { lastActiveDate: { lt: yesterday } },
          ],
        },
        data: {
          streakDays: 0,
        },
      });

      console.log('[CRON] Đã cập nhật chuỗi streak học tập hàng ngày của các học sinh.');
    } catch (err) {
      console.error('[CRON ERROR - streakReset]:', err.message);
    }
  });

  console.log('✅ Hệ thống Cron Runner đã sẵn sàng hoạt động với 8 lịch trình tự động.');
}
