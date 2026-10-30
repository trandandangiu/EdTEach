// backend/src/controllers/assessment.controller.js
import prisma from '../config/prisma.js';

export const assessmentController = {
  // Lấy danh sách đề khảo sát
  async getTests(req, res, next) {
    try {
      const tests = await prisma.assessmentTest.findMany({
        where: { active: true },
        include: {
          subjectLevel: {
            include: { subject: true, gradeLevel: true },
          },
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: tests });
    } catch (err) {
      next(err);
    }
  },

  // Chi tiết đề thi và câu hỏi (dùng cho phòng thi của ứng viên)
  async getTestDetail(req, res, next) {
    try {
      const { id } = req.params;
      const test = await prisma.assessmentTest.findUnique({
        where: { id },
        include: {
          questions: {
            where: { active: true },
            select: {
              id: true,
              type: true,
              content: true,
              options: true,
              points: true,
            },
          },
        },
      });

      if (!test) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' });
      }

      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  },

  // Bắt đầu làm bài thi
  async startAttempt(req, res, next) {
    try {
      const { testId, applicationId } = req.body;
      const userId = req.user.id;

      // Tìm hồ sơ ứng viên nếu không truyền applicationId
      let appId = applicationId;
      if (!appId) {
        const app = await prisma.tutorApplication.findUnique({ where: { userId } });
        if (app) appId = app.id;
      }

      if (!appId) {
        return res.status(400).json({ success: false, message: 'Vui lòng hoàn thiện hồ sơ ứng tuyển trước khi thi' });
      }

      const test = await prisma.assessmentTest.findUnique({
        where: { id: testId },
        include: { questions: { where: { active: true } } },
      });

      if (!test) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
      }

      const deadlineAt = new Date(Date.now() + (test.durationMin || 30) * 60 * 1000);
      const questionIds = test.questions.map((q) => q.id);

      const attempt = await prisma.assessmentAttempt.create({
        data: {
          applicationId: appId,
          testId,
          questionIds,
          deadlineAt,
          status: 'IN_PROGRESS',
        },
        include: { test: true },
      });

      res.status(201).json({ success: true, data: attempt, message: 'Bắt đầu làm bài thi' });
    } catch (err) {
      next(err);
    }
  },

  // Nộp bài thi
  async submitAttempt(req, res, next) {
    try {
      const { id } = req.params;
      const { answers = [] } = req.body; // Array of { questionId, answer }

      const attempt = await prisma.assessmentAttempt.findUnique({
        where: { id },
        include: {
          test: {
            include: { questions: true },
          },
        },
      });

      if (!attempt) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lượt thi' });
      }

      // Chấm điểm trắc nghiệm tự động
      let autoScore = 0;
      let totalMaxScore = 0;
      const questionMap = new Map(attempt.test.questions.map((q) => [q.id, q]));

      const createdAnswers = [];
      for (const ans of answers) {
        const q = questionMap.get(ans.questionId);
        if (!q) continue;

        totalMaxScore += q.points || 1;
        let isCorrect = null;
        let pointsEarned = 0;

        if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') {
          const correctKey = Array.isArray(q.answerKey) ? q.answerKey : [q.answerKey];
          const userKey = Array.isArray(ans.answer) ? ans.answer : [ans.answer];
          isCorrect = JSON.stringify(correctKey.sort()) === JSON.stringify(userKey.sort());
          pointsEarned = isCorrect ? (q.points || 1) : 0;
          autoScore += pointsEarned;
        }

        createdAnswers.push({
          attemptId: id,
          questionId: q.id,
          answer: ans.answer,
          isCorrect,
          pointsEarned,
        });
      }

      // Kiểm tra có câu tự luận (ESSAY) cần chấm tay không
      const hasEssay = attempt.test.questions.some((q) => q.type === 'ESSAY');
      const finalStatus = hasEssay ? 'SUBMITTED' : autoScore / (totalMaxScore || 1) >= (attempt.test.passPercent / 100) ? 'GRADED' : 'GRADED';
      const passed = !hasEssay ? autoScore / (totalMaxScore || 1) >= (attempt.test.passPercent / 100) : null;

      await prisma.$transaction(async (tx) => {
        // Xóa câu trả lời cũ nếu có
        await tx.assessmentAnswer.deleteMany({ where: { attemptId: id } });
        // Tạo các câu trả lời
        for (const a of createdAnswers) {
          await tx.assessmentAnswer.create({ data: a });
        }

        await tx.assessmentAttempt.update({
          where: { id },
          data: {
            status: finalStatus,
            submittedAt: new Date(),
            autoScore,
            maxScore: totalMaxScore,
            percent: totalMaxScore > 0 ? Math.round((autoScore / totalMaxScore) * 100) : 0,
            passed,
          },
        });
      });

      res.json({
        success: true,
        message: 'Nộp bài thi thành công',
        data: { autoScore, totalMaxScore, hasEssay, status: finalStatus },
      });
    } catch (err) {
      next(err);
    }
  },

  // Admin: Lấy danh sách bài thi của ứng viên (Kanban / Grade Queue)
  async getAttempts(req, res, next) {
    try {
      const { status } = req.query;
      const where = {};
      if (status) where.status = status;

      const attempts = await prisma.assessmentAttempt.findMany({
        where,
        include: {
          test: true,
          application: {
            include: { user: { select: { fullName: true, email: true, phone: true } } },
          },
          answers: {
            include: { question: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      const formatted = attempts.map((att) => ({
        id: att.id,
        applicantName: att.application?.fullName || att.application?.user?.fullName || 'Ứng viên gia sư',
        email: att.application?.email || att.application?.user?.email,
        phone: att.application?.phone || att.application?.user?.phone,
        subject: att.test?.title || 'Khảo sát Năng lực Gia sư',
        examTitle: att.test?.title,
        score: att.percent,
        maxScore: 100,
        status: att.status === 'SUBMITTED' ? 'PENDING_REVIEW' : att.passed ? 'PASSED' : 'FAILED',
        submittedAt: att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : '',
        durationMinutes: att.test?.durationMin || 30,
        evaluatorNotes: att.answers?.find((a) => a.graderNote)?.graderNote || '',
        answers: att.answers.map((ans, idx) => ({
          questionId: ans.questionId,
          questionText: ans.question?.content || `Câu hỏi ${idx + 1}`,
          applicantAnswer: typeof ans.answer === 'string' ? ans.answer : JSON.stringify(ans.answer),
          expectedAnswer: ans.question?.explanation || 'Theo đáp án chuẩn sư phạm',
          pointsAwarded: ans.pointsEarned || 0,
          maxPoints: ans.question?.points || 1,
        })),
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  // Admin: Chi tiết một bài thi
  async getAttemptDetail(req, res, next) {
    try {
      const { id } = req.params;
      const att = await prisma.assessmentAttempt.findUnique({
        where: { id },
        include: {
          test: true,
          application: {
            include: { user: { select: { fullName: true, email: true, phone: true } } },
          },
          answers: {
            include: { question: true },
          },
        },
      });

      if (!att) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài thi' });
      }

      res.json({ success: true, data: att });
    } catch (err) {
      next(err);
    }
  },

  // Admin: Chấm điểm bài thi tự luận
  async gradeAttempt(req, res, next) {
    try {
      const { id } = req.params;
      const { grades = [], evaluatorNotes, passed } = req.body; // grades: [{ questionId, pointsEarned, graderNote }]
      const graderId = req.user.id;

      await prisma.$transaction(async (tx) => {
        let totalManualPoints = 0;
        for (const g of grades) {
          await tx.assessmentAnswer.updateMany({
            where: { attemptId: id, questionId: g.questionId },
            data: {
              pointsEarned: g.pointsEarned,
              graderNote: g.graderNote,
            },
          });
          totalManualPoints += g.pointsEarned || 0;
        }

        const att = await tx.assessmentAttempt.findUnique({
          where: { id },
          include: { answers: true, test: true },
        });

        const totalEarned = att.answers.reduce((acc, a) => acc + (a.pointsEarned || 0), 0);
        const percent = att.maxScore && att.maxScore > 0 ? Math.round((totalEarned / att.maxScore) * 100) : 0;
        const isPassed = passed !== undefined ? passed : percent >= (att.test?.passPercent || 70);

        await tx.assessmentAttempt.update({
          where: { id },
          data: {
            manualScore: totalManualPoints,
            percent,
            passed: isPassed,
            status: 'GRADED',
            gradedById: graderId,
            gradedAt: new Date(),
          },
        });
      });

      res.json({ success: true, message: 'Đã hoàn tất chấm điểm bài thi' });
    } catch (err) {
      next(err);
    }
  },

  // ==========================================
  // QUẢN TRỊ NGÂN HÀNG ĐỀ THI & CÂU HỎI (CRUD)
  // ==========================================
  // Tạo đề thi mới
  async createTest(req, res, next) {
    try {
      const {
        code,
        title,
        kind = 'PEDAGOGY', // PEDAGOGY | SUBJECT
        subjectLevelId,
        durationMin = 30,
        passPercent = 70,
        maxAttempts = 2,
        shuffle = true,
      } = req.body;

      const generatedCode = code || `TEST_${Date.now().toString().slice(-6)}`;

      const test = await prisma.assessmentTest.create({
        data: {
          code: generatedCode,
          title,
          kind,
          subjectLevelId: subjectLevelId ? Number(subjectLevelId) : null,
          durationMin: Number(durationMin),
          passPercent: Number(passPercent),
          maxAttempts: Number(maxAttempts),
          shuffle: Boolean(shuffle),
          active: true,
        },
      });

      res.status(201).json({ success: true, data: test, message: 'Tạo đề thi mới thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật đề thi
  async updateTest(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title,
        kind,
        subjectLevelId,
        durationMin,
        passPercent,
        maxAttempts,
        shuffle,
        active,
      } = req.body;

      const updated = await prisma.assessmentTest.update({
        where: { id },
        data: {
          title,
          kind,
          subjectLevelId: subjectLevelId !== undefined ? (subjectLevelId ? Number(subjectLevelId) : null) : undefined,
          durationMin: durationMin !== undefined ? Number(durationMin) : undefined,
          passPercent: passPercent !== undefined ? Number(passPercent) : undefined,
          maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : undefined,
          shuffle: shuffle !== undefined ? Boolean(shuffle) : undefined,
          active: active !== undefined ? Boolean(active) : undefined,
        },
      });

      res.json({ success: true, data: updated, message: 'Cập nhật đề thi thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Xóa đề thi (xóa mềm bằng active=false hoặc xóa hoàn toàn nếu chưa có attempt)
  async deleteTest(req, res, next) {
    try {
      const { id } = req.params;
      const attemptCount = await prisma.assessmentAttempt.count({ where: { testId: id } });

      if (attemptCount > 0) {
        await prisma.assessmentTest.update({
          where: { id },
          data: { active: false },
        });
        return res.json({ success: true, message: 'Đề thi đã có lượt thi nên đã được chuyển sang trạng thái Ngừng hoạt động' });
      }

      await prisma.assessmentQuestion.deleteMany({ where: { testId: id } });
      await prisma.assessmentTest.delete({ where: { id } });

      res.json({ success: true, message: 'Đã xóa đề thi thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Thêm câu hỏi vào đề (hỗ trợ thêm 1 hoặc nhiều câu hỏi từ Excel)
  async addQuestions(req, res, next) {
    try {
      const { id: testId } = req.params;
      const { questions = [] } = req.body;

      const test = await prisma.assessmentTest.findUnique({ where: { id: testId } });
      if (!test) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
      }

      const createdQuestions = [];
      for (const q of questions) {
        const item = await prisma.assessmentQuestion.create({
          data: {
            testId,
            type: q.type || 'SINGLE_CHOICE',
            content: q.content,
            options: q.options || null,
            answerKey: q.answerKey || null,
            points: Number(q.points || 1),
            explanation: q.explanation || null,
            active: true,
          },
        });
        createdQuestions.push(item);
      }

      // Cập nhật lại questionCount trong test
      const count = await prisma.assessmentQuestion.count({ where: { testId, active: true } });
      await prisma.assessmentTest.update({
        where: { id: testId },
        data: { questionCount: count },
      });

      res.status(201).json({
        success: true,
        data: createdQuestions,
        message: `Đã thêm ${createdQuestions.length} câu hỏi vào đề thi thành công`,
      });
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật câu hỏi
  async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const { type, content, options, answerKey, points, explanation, active } = req.body;

      const updated = await prisma.assessmentQuestion.update({
        where: { id },
        data: {
          type,
          content,
          options,
          answerKey,
          points: points !== undefined ? Number(points) : undefined,
          explanation,
          active,
        },
      });

      res.json({ success: true, data: updated, message: 'Cập nhật câu hỏi thành công' });
    } catch (err) {
      next(err);
    }
  },

  // Xóa câu hỏi
  async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const question = await prisma.assessmentQuestion.findUnique({ where: { id } });
      if (!question) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
      }

      await prisma.assessmentQuestion.delete({ where: { id } });

      // Cập nhật lại questionCount
      const count = await prisma.assessmentQuestion.count({ where: { testId: question.testId, active: true } });
      await prisma.assessmentTest.update({
        where: { id: question.testId },
        data: { questionCount: count },
      });

      res.json({ success: true, message: 'Đã xóa câu hỏi khỏi đề thi' });
    } catch (err) {
      next(err);
    }
  },
};
