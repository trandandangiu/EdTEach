// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { loginLimiter, otpLimiter, registerLimiter } from '../middlewares/rateLimit.js';

const router = Router();

// Public auth
router.post('/login', loginLimiter, authController.login);
router.post('/check-availability', authController.checkAvailability);
router.post('/register/parent', registerLimiter, authController.registerParent);
router.post('/register-parent', registerLimiter, authController.registerParent);
router.post('/register/applicant', registerLimiter, authController.registerApplicant);
router.post('/register-applicant', registerLimiter, authController.registerApplicant);
router.post('/student-code', authController.loginWithStudentCode);
router.post('/send-email-otp', otpLimiter, authController.sendEmailOtp);
router.post('/verify-email-otp', authController.verifyEmailOtp);

// Authenticated auth
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);
router.put('/profile', authenticate, authController.updateProfile);

// Kids mode switcher & exit
router.post('/student-session', authenticate, authController.createStudentSession);
router.post('/exit-kids', authenticate, authController.exitKidsMode);

export default router;