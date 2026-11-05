// backend/src/routes/care.routes.js
import { Router } from 'express';
import {
  getCareCases,
  getCareCaseDetail,
  addContactLog,
  updateCareCaseStatus,
  getUnconfirmedLessonReports,
  getCareStats,
  deleteCareCase,
} from '../controllers/care.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = Router();

router.use(authenticate);

// Danh sách & chi tiết phiếu chăm sóc
router.get('/stats', requirePermission('care:view:team', 'care:view:all'), getCareStats);
router.get('/unconfirmed-reports', requirePermission('care:view:team', 'care:view:all'), getUnconfirmedLessonReports);
router.get('/', requirePermission('care:view:team', 'care:view:all'), getCareCases);
router.get('/:id', requirePermission('care:view:team', 'care:view:all'), getCareCaseDetail);

// Ghi nhật ký liên hệ (gọi điện, Zalo)
router.post('/:id/contacts', requirePermission('care:contact-log'), addContactLog);

// Cập nhật trạng thái phiếu
router.patch('/:id/status', requirePermission('care:handle'), updateCareCaseStatus);

// Xóa phiếu chăm sóc
router.delete('/:id', requirePermission('care:handle', 'care:manage'), deleteCareCase);

export default router;
