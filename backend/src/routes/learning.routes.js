// backend/src/routes/learning.routes.js
import { Router } from 'express';
import {
  getKidsTodayTasks,
  submitTask,
  finishGameSession,
  getStudentRewards,
  getAllMiniGames,
  createMiniGame,
  updateMiniGame,
  deleteMiniGame,
  createGameContentSet,
  updateGameContentSet,
  deleteGameContentSet,
} from '../controllers/learning.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import { upload } from '../config/multer.js';

const router = Router();

router.use(authenticate);

// Kids Mode: Nhiệm vụ hôm nay
router.get('/today', getKidsTodayTasks);

// Nộp bài tập (chụp ảnh bài làm)
router.post('/tasks/:id/submit', upload.array('attachments', 5), submitTask);

// Ghi nhận hoàn thành lượt chơi game
router.post('/game-sessions/finish', finishGameSession);

// Tủ cúp huy hiệu của bé
router.get('/rewards', getStudentRewards);
router.get('/students/:studentId/rewards', getStudentRewards);

// Quản trị Mini-game & Content Sets (Ban Học Thuật)
router.get('/games', getAllMiniGames);
router.post('/games', createMiniGame);
router.put('/games/:id', updateMiniGame);
router.delete('/games/:id', deleteMiniGame);

router.post('/game-content-sets', createGameContentSet);
router.put('/game-content-sets/:id', updateGameContentSet);
router.delete('/game-content-sets/:id', deleteGameContentSet);

export default router;
