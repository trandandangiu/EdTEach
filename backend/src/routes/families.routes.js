// backend/src/routes/families.routes.js
import { Router } from 'express';
import {
  getMyStudents,
  createStudent,
  updateStudent,
  setStudentPin,
  createStudentLoginCode,
  getStudentOverview,
} from '../controllers/families.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('student:manage:own', 'student:view:all'), getMyStudents);
router.get('/children', requirePermission('student:manage:own', 'student:view:all'), getMyStudents);
router.post('/', requirePermission('student:manage:own'), createStudent);
router.patch('/:id', requirePermission('student:manage:own'), updateStudent);
router.put('/:id/pin', requirePermission('student:manage:own'), setStudentPin);
router.post('/:id/login-codes', requirePermission('student:manage:own'), createStudentLoginCode);
router.get('/:id/overview', getStudentOverview);

export default router;
