// backend/src/routes/lessonReports.routes.js
import { Router } from 'express';
import {
  submitLessonReport,
  getLessonReports,
  getLessonReportDetail,
  confirmLessonReport,
  requestParentSupport,
  confirmOnBehalf,
} from '../controllers/lessonReports.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import { upload } from '../config/multer.js';

const router = Router();

router.use(authenticate);

// Danh sách & chi tiết
router.get('/', requirePermission('lesson_report:view:all', 'lesson_report:view:assigned', 'lesson_report:view:own'), getLessonReports);
router.get('/:id', requirePermission('lesson_report:view:all', 'lesson_report:view:assigned', 'lesson_report:view:own'), getLessonReportDetail);

// Gia sư nộp nhận xét buổi học (kèm ảnh sửa bài)
router.post('/lessons/:lessonId/reports', requirePermission('lesson_report:create'), upload.array('attachments', 5), submitLessonReport);

// Phụ huynh xác nhận hoặc yêu cầu hỗ trợ
router.post('/:id/confirm', requirePermission('lesson_report:confirm'), confirmLessonReport);
router.post('/:id/need-support', requirePermission('lesson_report:confirm'), requestParentSupport);

// CSKH xác nhận thay
router.post('/:id/confirm-on-behalf', requirePermission('lesson_report:confirm:on-behalf'), confirmOnBehalf);

export default router;
