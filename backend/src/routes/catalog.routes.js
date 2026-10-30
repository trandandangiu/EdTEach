// backend/src/routes/catalog.routes.js
import { Router } from 'express';
import {
  getEducationLevels,
  getGradeLevels,
  getSubjects,
  getSubjectLevels,
} from '../controllers/catalog.controller.js';

const router = Router();

router.get('/education-levels', getEducationLevels);
router.get('/grade-levels', getGradeLevels);
router.get('/subjects', getSubjects);
router.get('/subject-levels', getSubjectLevels);

export default router;
