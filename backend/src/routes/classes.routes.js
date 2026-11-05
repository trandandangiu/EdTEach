import { Router } from 'express';  
import {
  getClasses,
  getClassDetail,
  createClass,
  enrollStudent,
  getNextLesson,
  approveClass,
  rejectClass,
  updateClassSchedule,
  assignHomework,
  deleteClass,
} from '../controllers/classes.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = Router();

router.use(authenticate);

router.get('/next-lesson', getNextLesson);
router.get('/', requirePermission('class:view:all', 'class:view:assigned', 'class:view:own'), getClasses);
router.get('/:id', requirePermission('class:view:all', 'class:view:assigned', 'class:view:own'), getClassDetail);
router.post('/', requirePermission('class:create', 'class:create:own'), createClass);
router.post('/:id/enroll', requirePermission('class:enroll'), enrollStudent);
router.post('/:id/approve', requirePermission('class:approve', 'classes:edit', 'class_request:manage'), approveClass);
router.post('/:id/reject', requirePermission('class:reject', 'classes:edit', 'class_request:manage'), rejectClass);
router.put('/:id/schedules', updateClassSchedule);
router.post('/:id/tasks', assignHomework);
router.delete('/:id', deleteClass);

export default router;
