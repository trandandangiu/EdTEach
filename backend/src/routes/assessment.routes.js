// backend/src/routes/assessment.routes.js
import express from 'express';
import { assessmentController } from '../controllers/assessment.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Ứng viên gia sư làm bài khảo sát
router.get('/tests', assessmentController.getTests);
router.get('/tests/:id', assessmentController.getTestDetail);
router.post('/attempts', assessmentController.startAttempt);
router.post('/attempts/:id/submit', assessmentController.submitAttempt);

// Quản trị viên / Chuyên viên tuyển dụng chấm bài
router.get('/attempts', assessmentController.getAttempts);
router.get('/attempts/:id', assessmentController.getAttemptDetail);
router.patch('/attempts/:id/grade', assessmentController.gradeAttempt);

// Quản trị ngân hàng đề thi & câu hỏi (CRUD)
router.post('/tests', assessmentController.createTest);
router.put('/tests/:id', assessmentController.updateTest);
router.delete('/tests/:id', assessmentController.deleteTest);
router.post('/tests/:id/questions', assessmentController.addQuestions);
router.put('/questions/:id', assessmentController.updateQuestion);
router.delete('/questions/:id', assessmentController.deleteQuestion);

export default router;
