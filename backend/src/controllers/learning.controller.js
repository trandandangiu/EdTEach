// backend/src/controllers/learning.controller.js
import prisma from '../config/prisma.js';

// Nhiệm vụ hôm nay của học sinh (Kids Mode)
export async function getKidsTodayTasks(req, res, next) {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Yêu cầu phiên học sinh hợp lệ' });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { gradeLevel: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    // Danh sách bài tập được giao
    const tasks = await prisma.assignmentTask.findMany({
      where: {
        studentId,
        status: { in: ['ASSIGNED', 'SUBMITTED', 'REVIEWED'] },
      },
      include: {
        game: true,
        attachments: true,
        class: {
          include: { subjectLevel: { include: { subject: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Danh sách mini-game phù hợp khối lớp của bé
    const games = await prisma.miniGame.findMany({
      where: {
        active: true,
        minGradeOrder: { lte: student.gradeLevel.order },
        maxGradeOrder: { gte: student.gradeLevel.order },
      },
      include: { subject: true },
    });

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          nickname: student.nickname,
          avatarKey: student.avatarKey,
          streakDays: student.streakDays,
          tasksCompleted: student.tasksCompleted,
        },
        tasks,
        availableGames: games,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Học sinh nộp bài tập (kèm ảnh chụp bài giải)
export async function submitTask(req, res, next) {
  try {
    const { id } = req.params;
    const { submissionNote } = req.body;
    const studentId = req.user.studentId;

    const task = await prisma.assignmentTask.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
    }

    if (studentId && task.studentId !== studentId) {
      return res.status(403).json({ success: false, message: 'Bạn không phải người được giao bài tập này' });
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const resTask = await tx.assignmentTask.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          submissionNote,
          submittedAt: new Date(),
        },
      });

      // Lưu file ảnh đính kèm nếu có
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await tx.attachment.create({
            data: {
              uploaderId: req.user.id,
              assignmentTaskId: id,
              category: 'SUBMISSION',
              fileName: file.originalname,
              filePath: file.path.replace(/\\/g, '/'),
              fileSize: file.size,
              mimeType: file.mimetype,
            },
          });
        }
      }

      // Tăng bộ đếm tasksCompleted và chuỗi streak của học sinh
      const student = await tx.studentProfile.update({
        where: { id: task.studentId },
        data: {
          tasksCompleted: { increment: 1 },
          lastActiveDate: new Date(),
        },
      });

      // Kiểm tra mở khóa Sticker/Huy hiệu
      const rewards = await tx.reward.findMany({ where: { active: true } });
      for (const r of rewards) {
        const rule = r.unlockRule;
        if (rule?.type === 'TASKS_COMPLETED' && student.tasksCompleted >= rule.value) {
          await tx.studentReward.upsert({
            where: { studentId_rewardId: { studentId: student.id, rewardId: r.id } },
            update: {},
            create: { studentId: student.id, rewardId: r.id },
          });
        }
      }

      return resTask;
    });

    res.json({ success: true, data: updatedTask, message: 'Nộp bài tập thành công! Bé làm tốt lắm!' });
  } catch (err) {
    next(err);
  }
}

// Ghi nhận hoàn thành lượt chơi mini-game
export async function finishGameSession(req, res, next) {
  try {
    const studentId = req.user.studentId;
    const { gameId, taskId, durationSec } = req.body;

    if (!studentId || !gameId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin lượt chơi' });
    }

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.gameSession.create({
        data: {
          studentId,
          gameId,
          taskId,
          completed: true,
          durationSec: durationSec ? parseInt(durationSec, 10) : 60,
          finishedAt: new Date(),
        },
      });

      // Nếu chơi từ 1 bài tập cụ thể -> đánh dấu bài tập hoàn thành
      if (taskId) {
        await tx.assignmentTask.update({
          where: { id: taskId },
          data: { status: 'SUBMITTED', submittedAt: new Date() },
        });
      }

      // Tăng số lượng hoàn thành
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          tasksCompleted: { increment: 1 },
          lastActiveDate: new Date(),
        },
      });

      return created;
    });

    res.json({ success: true, data: session, message: 'Chúc mừng bé đã hoàn thành trò chơi!' });
  } catch (err) {
    next(err);
  }
}

// Tủ cúp huy hiệu / sticker của bé
export async function getStudentRewards(req, res, next) {
  try {
    const studentId = req.user.studentId || req.params.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã học sinh' });
    }

    const studentRewards = await prisma.studentReward.findMany({
      where: { studentId },
      include: { reward: true },
      orderBy: { unlockedAt: 'desc' },
    });

    res.json({ success: true, data: studentRewards });
  } catch (err) {
    next(err);
  }
}

// ============================================
// QUẢN TRỊ MINI-GAME & CONTENT SETS (HỌC THUẬT)
// ============================================

// Lấy danh sách toàn bộ Mini-Game
export async function getAllMiniGames(req, res, next) {
  try {
    const games = await prisma.miniGame.findMany({
      include: {
        subject: true,
        contentSets: {
          include: {
            subjectLevel: { include: { subject: true, gradeLevel: true } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: games });
  } catch (err) {
    next(err);
  }
}

// Tạo mini-game mới
export async function createMiniGame(req, res, next) {
  try {
    const { code, name, description, subjectId, minGradeOrder = 1, maxGradeOrder = 5, thumbnailUrl, engineConfig } = req.body;
    const game = await prisma.miniGame.create({
      data: {
        code,
        name,
        description,
        subjectId: subjectId ? Number(subjectId) : null,
        minGradeOrder: Number(minGradeOrder),
        maxGradeOrder: Number(maxGradeOrder),
        thumbnailUrl,
        engineConfig: engineConfig || null,
        active: true,
      },
    });
    res.status(201).json({ success: true, data: game, message: 'Tạo Mini-Game mới thành công' });
  } catch (err) {
    next(err);
  }
}

// Cập nhật mini-game
export async function updateMiniGame(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, subjectId, minGradeOrder, maxGradeOrder, thumbnailUrl, engineConfig, active } = req.body;
    const updated = await prisma.miniGame.update({
      where: { id },
      data: {
        name,
        description,
        subjectId: subjectId !== undefined ? (subjectId ? Number(subjectId) : null) : undefined,
        minGradeOrder: minGradeOrder !== undefined ? Number(minGradeOrder) : undefined,
        maxGradeOrder: maxGradeOrder !== undefined ? Number(maxGradeOrder) : undefined,
        thumbnailUrl,
        engineConfig,
        active,
      },
    });
    res.json({ success: true, data: updated, message: 'Cập nhật Mini-Game thành công' });
  } catch (err) {
    next(err);
  }
}

// Xóa mini-game
export async function deleteMiniGame(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.miniGame.delete({ where: { id } });
    res.json({ success: true, message: 'Đã xóa Mini-Game thành công' });
  } catch (err) {
    next(err);
  }
}

// Tạo content set cho game
export async function createGameContentSet(req, res, next) {
  try {
    const { gameId, subjectLevelId, title, data } = req.body;
    const contentSet = await prisma.gameContentSet.create({
      data: {
        gameId,
        subjectLevelId: Number(subjectLevelId),
        title,
        data: typeof data === 'string' ? JSON.parse(data) : data,
        createdById: req.user.id,
        active: true,
      },
    });
    res.status(201).json({ success: true, data: contentSet, message: 'Tạo gói nội dung câu hỏi thành công' });
  } catch (err) {
    next(err);
  }
}

// Cập nhật content set
export async function updateGameContentSet(req, res, next) {
  try {
    const { id } = req.params;
    const { title, data, active } = req.body;
    const updated = await prisma.gameContentSet.update({
      where: { id },
      data: {
        title,
        data: data ? (typeof data === 'string' ? JSON.parse(data) : data) : undefined,
        active,
      },
    });
    res.json({ success: true, data: updated, message: 'Cập nhật gói nội dung thành công' });
  } catch (err) {
    next(err);
  }
}

// Xóa content set
export async function deleteGameContentSet(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.gameContentSet.delete({ where: { id } });
    res.json({ success: true, message: 'Đã xóa gói nội dung game' });
  } catch (err) {
    next(err);
  }
}
