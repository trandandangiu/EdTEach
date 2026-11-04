// backend/src/config/multer.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục uploads cấu hình qua .env hoặc mặc định D:/EdTeach/uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '../../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage linh hoạt theo category / ownerType / yyyy / mm
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const category = (req.body?.category || req.params?.category || 'general').toLowerCase();

    const dir = path.join(UPLOAD_DIR, category, yyyy, mm);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${fileId}_${baseName}${ext}`);
  },
});

// Allowed file types (thêm webp, heic, heif)
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/zip',
  'application/x-rar-compressed',
];

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10 MB, max 5 files
  fileFilter: (req, file, cb) => {
    // Chống double extension attack: file.php.jpg, shell.exe.pdf, etc.
    const dangerousDoubleExt = /\.(php|exe|sh|bat|cmd|js|jsp|asp|aspx|py|pl|rb|com)\./i;
    if (dangerousDoubleExt.test(file.originalname)) {
      return cb(new Error('Tên file không hợp lệ (phát hiện phần mở rộng kép)'), false);
    }

    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Loại file không được phép: ${file.mimetype}`));
    }
  },
});

export { UPLOAD_DIR };