// backend/src/cron/index.js
import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { createAndPushNotification } from '../services/notification.helper.js';

async function withCronLock(lockKey, ttlSeconds, taskFn) {
  const now = Date.now();
  const lockExpireKey = `CRON_LOCK_${lockKey}`;

  try {
    const existing = await prisma.systemSetting.findUnique({
      where: { key: lockExpireKey },
    });

    if (existing && Number(existing.value) > now) {
      // Lock vẫn còn hiệu lực, bỏ qua lần chạy này
      return;
    }

    // Giành lock
    await prisma.systemSetting.upsert({
      where: { key: lockExpireKey },
      update: { value: String(now + ttlSeconds * 1000) },
      create: {
        key: lockExpireKey,
        value: String(now + ttlSeconds * 1000),
        category: 'CRON_LOCK',
      },
    });

    // Thực thi task
    await taskFn();
  } catch (err) {
    console.error(`[CRON LOCK ERROR] ${lockKey}:`, err.message);
  }
}

export function startCronJobs() {
  console.log('⏰ Khởi động hệ thống tác vụ định kỳ tự động (Cron Runner)...');

  // =========================================================================
  // 1. generateLessons: 01:00 hàng ngày
  // Sinh tự động các buổi học (Lesson) trong 14 ngày tới cho các lớp ACTIVE
  // =========================================================================
  cron.schedule('0 1 * * *', async () => {
    await withCronLock('generateLessons', 3600, async () => {
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
  });

  // =========================================================================
  // 2. [FUTURE] lessonReminders: Chạy 5 phút / lần
  // Nhắc nhở buổi học trước 60 phút tới gia sư, học sinh và phụ huynh
  // =========================================================================
  // [FUTURE] cron.schedule('*/5 * * * *', async () => {
  // [FUTURE]   try {
  // [FUTURE]     const now = new Date();
  // [FUTURE]     const in65Min = new Date(now.getTime() + 65 * 60 * 1000);
  // [FUTURE]     const in55Min = new Date(now.getTime() + 55 * 60 * 1000);
  // [FUTURE]
  // [FUTURE]     const upcomingLessons = await prisma.lesson.findMany({
  // [FUTURE]       where: {
  // [FUTURE]         status: 'SCHEDULED',
  // [FUTURE]         startAt: {
  // [FUTURE]           gte: in55Min,
  // [FUTURE]           lte: in65Min,
  // [FUTURE]         },
  // [FUTURE]       },
  // [FUTURE]       include: {
  // [FUTURE]         class: {
  // [FUTURE]           include: {
  // [FUTURE]             tutor: { include: { user: true } },
  // [FUTURE]             students: {
  // [FUTURE]               include: {
  // [FUTURE]                 student: {
  // [FUTURE]                   include: {
  // [FUTURE]                     user: true,
  // [FUTURE]                     parent: { include: { user: true } },
  // [FUTURE]                   },
  // [FUTURE]                 },
  // [FUTURE]               },
  // [FUTURE]             },
  // [FUTURE]           },
  // [FUTURE]         },
  // [FUTURE]       });
  // [FUTURE]
  // [FUTURE]     for (const lesson of upcomingLessons) {
  // [FUTURE]       const classTitle = lesson.class?.name || 'Lớp học';
  // [FUTURE]
  // [FUTURE]       // Nhắc gia sư
  // [FUTURE]       if (lesson.class?.tutor?.user?.id) {
  // [FUTURE]         await createAndPushNotification(null, {
  // [FUTURE]           userId: lesson.class.tutor.user.id,
  // [FUTURE]           type: 'LESSON_REMINDER',
  // [FUTURE]           title: `Nhắc lịch: Buổi học "${classTitle}" sẽ diễn ra sau 60 phút nữa`,
  // [FUTURE]           referenceType: 'LESSON',
  // [FUTURE]           referenceId: lesson.id,
  // [FUTURE]         });
  // [FUTURE]       }
  // [FUTURE]
  // [FUTURE]       // Nhắc phụ huynh & học sinh
  // [FUTURE]       for (const cs of lesson.class?.students || []) {
  // [FUTURE]         const parentUserId = cs.student?.parent?.user?.id;
  // [FUTURE]         if (parentUserId) {
  // [FUTURE]           await createAndPushNotification(null, {
  // [FUTURE]             userId: parentUserId,
  // [FUTURE]             type: 'LESSON_REMINDER',
  // [FUTURE]             title: `Buổi học "${classTitle}" của bé ${cs.student?.fullName} sẽ bắt đầu sau 60 phút`,
  // [FUTURE]             referenceType: 'LESSON',
  // [FUTURE]             referenceId: lesson.id,
  // [FUTURE]           });
  // [FUTURE]         }
  // [FUTURE]
  // [FUTURE]         const studentUserId = cs.student?.user?.id;
  // [FUTURE]         if (studentUserId) {
  // [FUTURE]           await createAndPushNotification(null, {
  // [FUTURE]             userId: studentUserId,
  // [FUTURE]             type: 'LESSON_REMINDER',
  // [FUTURE]             title: `Chuẩn bị góc học tập: Lớp "${classTitle}" sắp bắt đầu sau 60 phút nhé!`,
  // [FUTURE]             referenceType: 'LESSON',
  // [FUTURE]             referenceId: lesson.id,
  // [FUTURE]           });
  // [FUTURE]         }
  // [FUTURE]       }
  // [FUTURE]     }
  // [FUTURE]   } catch (err) {
  // [FUTURE]     console.error('[CRON ERROR - lessonReminders]:', err.message);
  // [FUTURE]   }
  // [FUTURE] });

  // =========================================================================
  // 3. reportOverdue: Chạy 1 giờ / lần
  // Nhắc gia sư nộp báo cáo sau 12h, tự động tạo CareCase & Violation sau 24h
  // =========================================================================
  cron.schedule('0 * * * *', async () => {
    await withCronLock('reportOverdue', 3600, async () => {
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
  });

  // =========================================================================
  // 4. reportUnconfirmed: Chạy 1 giờ / lần
  // Quét báo cáo đã nộp > 24h mà phụ huynh chưa xác nhận -> Tạo CareCase CSKH
  // =========================================================================
  cron.schedule('0 * * * *', async () => {
    await withCronLock('reportUnconfirmed', 3600, async () => {
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
  });

  // =========================================================================
  // 5. [FUTURE] careFollowUps: Chạy 15 phút / lần
  // Nhắc nhân sự phiếu CSKH sắp hoặc đã quá hạn SLA
  // =========================================================================
  // [FUTURE] cron.schedule('*/15 * * * *', async () => {
  // [FUTURE]   try {
  // [FUTURE]     const now = new Date();
  // [FUTURE]     const overdueCases = await prisma.careCase.findMany({
  // [FUTURE]       where: {
  // [FUTURE]         status: { in: ['OPEN', 'IN_PROGRESS'] },
  // [FUTURE]         dueAt: { lte: now },
  // [FUTURE]       },
  // [FUTURE]       include: {
  // [FUTURE]         assignee: true,
  // [FUTURE]       },
  // [FUTURE]     });
  // [FUTURE]
  // [FUTURE]     for (const c of overdueCases) {
  // [FUTURE]       if (c.assigneeId) {
  // [FUTURE]         await createAndPushNotification(null, {
  // [FUTURE]           userId: c.assigneeId,
  // [FUTURE]           type: 'CARE_SLA_BREACH',
  // [FUTURE]           title: `Cảnh báo SLA: Phiếu chăm sóc [${c.code}] đã quá hạn xử lý!`,
  // [FUTURE]           referenceType: 'CARE_CASE',
  // [FUTURE]           referenceId: c.id,
  // [FUTURE]         });
  // [FUTURE]       }
  // [FUTURE]     }
  // [FUTURE]   } catch (err) {
  // [FUTURE]     console.error('[CRON ERROR - careFollowUps]:', err.message);
  // [FUTURE]   }
  // [FUTURE] });

  // =========================================================================
  // 6. [FUTURE] expireOffers: Chạy 15 phút / lần
  // Chuyển các offer gia sư hết hạn sang EXPIRED
  // =========================================================================
  // [FUTURE] cron.schedule('*/15 * * * *', async () => {
  // [FUTURE]   try {
  // [FUTURE]     const now = new Date();
  // [FUTURE]     const expiredCount = await prisma.classOffer.updateMany({
  // [FUTURE]       where: {
  // [FUTURE]         status: 'PENDING',
  // [FUTURE]         expiresAt: { lte: now },
  // [FUTURE]       },
  // [FUTURE]       data: {
  // [FUTURE]         status: 'EXPIRED',
  // [FUTURE]       },
  // [FUTURE]     });
  // [FUTURE]
  // [FUTURE]     if (expiredCount.count > 0) {
  // [FUTURE]       console.log(`[CRON] Đã chuyển ${expiredCount.count} offer lớp học hết hạn sang EXPIRED.`);
  // [FUTURE]     }
  // [FUTURE]   } catch (err) {
  // [FUTURE]     console.error('[CRON ERROR - expireOffers]:', err.message);
  // [FUTURE]   }
  // [FUTURE] });

  // =========================================================================
  // 7. [FUTURE] expireAttempts: Chạy 1 phút / lần
  // Tự động kết thúc bài thi khảo sát ứng viên khi hết giờ làm bài
  // =========================================================================
  // [FUTURE] cron.schedule('* * * * *', async () => {
  // [FUTURE]   try {
  // [FUTURE]     const now = new Date();
  // [FUTURE]     const overdueAttempts = await prisma.assessmentAttempt.findMany({
  // [FUTURE]       where: {
  // [FUTURE]         status: 'IN_PROGRESS',
  // [FUTURE]         deadlineAt: { lte: now },
  // [FUTURE]       },
  // [FUTURE]     });
  // [FUTURE]
  // [FUTURE]     for (const attempt of overdueAttempts) {
  // [FUTURE]       await prisma.assessmentAttempt.update({
  // [FUTURE]         where: { id: attempt.id },
  // [FUTURE]         data: {
  // [FUTURE]           status: 'SUBMITTED',
  // [FUTURE]           submittedAt: now,
  // [FUTURE]         },
  // [FUTURE]       });
  // [FUTURE]     }
  // [FUTURE]   } catch (err) {
  // [FUTURE]     console.error('[CRON ERROR - expireAttempts]:', err.message);
  // [FUTURE]   }
  // [FUTURE] });

  // =========================================================================
  // 8. [FUTURE] streakReset: Chạy lúc 00:05 hàng ngày
  // Reset streak học tập của học sinh nếu ngày hôm qua không hoàn thành nhiệm vụ
  // =========================================================================
  // [FUTURE] cron.schedule('5 0 * * *', async () => {
  // [FUTURE]   try {
  // [FUTURE]     const today = new Date();
  // [FUTURE]     const yesterday = new Date(today);
  // [FUTURE]     yesterday.setDate(today.getDate() - 1);
  // [FUTURE]     yesterday.setHours(0, 0, 0, 0);
  // [FUTURE]
  // [FUTURE]     // Học sinh có streak > 0 nhưng lastActiveDate trước ngày hôm qua
  // [FUTURE]     await prisma.studentProfile.updateMany({
  // [FUTURE]       where: {
  // [FUTURE]         streakDays: { gt: 0 },
  // [FUTURE]         OR: [
  // [FUTURE]           { lastActiveDate: null },
  // [FUTURE]           { lastActiveDate: { lt: yesterday } },
  // [FUTURE]         ],
  // [FUTURE]       },
  // [FUTURE]       data: {
  // [FUTURE]         streakDays: 0,
  // [FUTURE]       },
  // [FUTURE]     });
  // [FUTURE]
  // [FUTURE]     console.log('[CRON] Đã cập nhật chuỗi streak học tập hàng ngày của các học sinh.');
  // [FUTURE]   } catch (err) {
  // [FUTURE]     console.error('[CRON ERROR - streakReset]:', err.message);
  // [FUTURE]   }
  // [FUTURE] });

  console.log('✅ Hệ thống Cron Runner đã sẵn sàng hoạt động với 3 lịch trình tự động.');
}
