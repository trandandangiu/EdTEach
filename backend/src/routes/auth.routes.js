// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Public auth
router.post('/login', authController.login);
router.post('/register/parent', authController.registerParent);
router.post('/register/applicant', authController.registerApplicant);
router.post('/student-code', authController.loginWithStudentCode);
router.post('/send-email-otp', authController.sendEmailOtp);
router.post('/verify-email-otp', authController.verifyEmailOtp);

// Authenticated auth
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);

// Kids mode switcher & exit
router.post('/student-session', authenticate, authController.createStudentSession);
router.post('/exit-kids', authenticate, authController.exitKidsMode);

export default router;