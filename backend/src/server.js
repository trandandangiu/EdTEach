// backend/src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

// Core routes kế thừa từ VKS-QLCV
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import departmentsRoutes from './routes/departments.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import permissionsRoutes from './routes/permissions.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import sseRoutes from './routes/sse.routes.js';
import pushRoutes from './routes/push.routes.js';
import attachmentsRoutes from './routes/attachments.routes.js';

// EdTech routes mới
import catalogRoutes from './routes/catalog.routes.js';
import familiesRoutes from './routes/families.routes.js';
import classesRoutes from './routes/classes.routes.js';
import lessonReportsRoutes from './routes/lessonReports.routes.js';
import careRoutes from './routes/care.routes.js';
import learningRoutes from './routes/learning.routes.js';
import tutorsRoutes from './routes/tutors.routes.js';
import classRequestsRoutes from './routes/classRequests.routes.js';
import forumRoutes from './routes/forum.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import { startCronJobs } from './cron/index.js';

import { errorHandler, notFound } from './middlewares/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình CORS linh hoạt từ .env và hỗ trợ mọi môi trường dev/local
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    // 1. Cho phép request không có origin (curl, Postman, server-to-server, mobile native)
    if (!origin) return callback(null, true);

    // 2. Trong môi trường Development hoặc khi có '*' trong .env: luôn cho phép
    if (isDev || envOrigins.includes('*')) {
      return callback(null, true);
    }

    // 3. Cho phép localhost, 127.0.0.1 và mọi dải IP mạng nội bộ (LAN / Wi-Fi) ở bất kỳ port nào
    const isLocalOrPrivate = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    if (isLocalOrPrivate) {
      return callback(null, true);
    }

    // 4. Kiểm tra danh sách whitelist cấu hình trong .env
    if (envOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('⚠️ CORS blocked origin:', origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json());

// Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const color = res.statusCode >= 500 ? '\x1b[31m'
      : res.statusCode >= 400 ? '\x1b[33m'
        : '\x1b[32m';
    console.log(`${color}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${Date.now() - start}ms`);
  });
  next();
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EdTech Platform API Docs',
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EdTech Backend đang hoạt động ổn định' });
});

// ============================================
// ĐĂNG KÝ CÁC PHÂN HỆ ROUTES
// ============================================

// Phân hệ Core & Quản trị
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/admin', adminRoutes);

// Phân hệ Realtime & Thông báo
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/push', pushRoutes);
app.use('/api', attachmentsRoutes);

// Phân hệ Giáo dục EdTech
app.use('/api/catalog', catalogRoutes);
app.use('/api/students', familiesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/lesson-reports', lessonReportsRoutes);
app.use('/api/care-cases', careRoutes);
app.use('/api/kids', learningRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/tutors', tutorsRoutes);
app.use('/api/class-requests', classRequestsRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/assessments', assessmentRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================');
  console.log('   NỀN TẢNG GIÁO DỤC & GIA SƯ EDTECH PLATFORM');
  console.log('======================================================');
  console.log(`🚀 Backend:  http://localhost:${PORT}`);
  console.log(`📚 Swagger:  http://localhost:${PORT}/api-docs`);
  console.log('======================================================');
  startCronJobs();
});