// backend/src/routes/tutors.routes.js
import express from 'express';
import { tutorsController } from '../controllers/tutors.controller.js';
import { authenticate } from '../middlewares/auth.js';

import { upload } from '../config/multer.js';

const router = express.Router();

// Public routes (tìm kiếm gia sư, chi tiết gia sư công khai, nộp hồ sơ ứng tuyển)
router.get('/public', tutorsController.getPublicTutors);
router.get('/public/:id', tutorsController.getPublicTutorDetail);
router.post('/apply', tutorsController.apply);

// Protected routes (Gia sư & Quản trị)
router.use(authenticate);

// Dành cho gia sư đang đăng nhập
router.get('/my-offers', tutorsController.getMyOffers);
router.post('/offers/:id/respond', tutorsController.respondOffer);
router.get('/my-classes', tutorsController.getMyClasses);

// Quản lý ứng viên gia sư (Admin/Staff)
router.get('/applications', tutorsController.getApplications);
router.get('/applications/:id', tutorsController.getApplicationDetail);
router.patch('/applications/:id/review', tutorsController.reviewApplication);
router.post('/applications/:id/attachments', upload.single('file'), tutorsController.uploadAttachment);

// Quản lý gia sư chính thức (Admin/Staff)
router.get('/', tutorsController.getTutors);
router.get('/:id/performance', tutorsController.getTutorPerformance);
router.post('/:id/violations', tutorsController.recordViolation);
router.patch('/:id/status', tutorsController.updateTutorStatus);

export default router;
