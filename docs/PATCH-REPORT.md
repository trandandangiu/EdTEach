# BÁO CÁO CẮT GIẢM SCOPE & PATCH BẢO MẬT MVP (DEMO-READY)

**Dự án:** EdTeach Platform  
**Ngày thực hiện:** 04/11/2026  
**Phạm vi mục tiêu:** Tối ưu & ổn định 3 portal nòng cốt (**Admin + Tutor + Parent**) để demo người dùng thử nghiệm.

---

## 1. Danh Sách File Đã Thay Đổi & Tạo Mới

| STT | File | Loại thay đổi | Mô tả chi tiết |
|:---:|:---|:---:|:---|
| 1 | `backend/src/server.js` | Sửa đổi | Thêm comment `// [FUTURE]` vô hiệu hoá các route chưa dùng trong MVP (`departments`, `roles`, `permissions`, `push`, `forum`, `kids`, `learning`). |
| 2 | `backend/src/cron/index.js` | Sửa đổi | Comment `// [FUTURE]` 5 cron jobs tương lai (`lessonReminders`, `careFollowUps`, `expireOffers`, `expireAttempts`, `streakReset`). Thêm cơ chế `withCronLock` dùng bảng `SystemSetting` chống chạy trùng cho 3 cron job hoạt động (`generateLessons`, `reportOverdue`, `reportUnconfirmed`). |
| 3 | `frontend/src/routes/AppRoutes.tsx` | Sửa đổi | Bọc JSX comment `{/* [FUTURE] */}` và comment lazy import cho các trang Forum, Kids, Staff portal, và các trang quản trị nâng cao (Academic, Audit, Sessions...). |
| 4 | `frontend/src/pages/AdminDashboard.tsx` | Sửa đổi | Comment `// [FUTURE]` các menu quản trị chưa dùng trong MVP; lọc bỏ các group rỗng để sidebar gọn gàng. |
| 5 | `frontend/src/pages/Login.tsx` | Sửa đổi | Comment `// [FUTURE]` các redirect nhánh Staff và Kids trong hàm `getRedirectPath`. |
| 6 | `backend/src/services/auth.service.js` | Sửa đổi | Gỡ bỏ hoàn toàn dev backdoor cho password cố định; thêm 300ms timing defense chống timing & brute-force attack. |
| 7 | `backend/src/middlewares/rateLimit.js` | Tạo mới | Triển khai in-memory rate limiter gồm `loginLimiter` (10 lần/15m), `otpLimiter` (5 lần/1h), `registerLimiter` (3 lần/1h) kèm header chuẩn RFC (`Retry-After`, `X-RateLimit-*`). |
| 8 | `backend/src/routes/auth.routes.js` | Sửa đổi | Gắn `loginLimiter`, `otpLimiter`, `registerLimiter` vào các endpoint `/login`, `/register/*`, `/send-email-otp`. |
| 9 | `backend/src/services/email.service.js` | Sửa đổi | Chỉ đính kèm `debugOtp` trong response khi `process.env.NODE_ENV === 'development'`, bảo vệ mã OTP trên production. |
| 10 | `backend/src/config/multer.js` | Sửa đổi | Giới hạn `fileSize: 10MB`, `files: 5`; thêm regex kiểm tra đuôi kép nguy hiểm (` dangerousDoubleExt `) chống tấn công upload mã độc. |
| 11 | `backend/src/controllers/classRequests.controller.js` | Sửa đổi | 1. Bổ sung `SELECT FOR UPDATE` và kiểm tra `status === 'MATCHED'` (trả về 409) chống race condition ghép lớp đôi.<br>2. Dùng `tx.classOffer.upsert` thay thế `create` trong `sendParallelOffers` chống duplicate offer khi gửi nhiều lần. |
| 12 | `backend/src/controllers/lessonReports.controller.js` | Sửa đổi | Thêm kiểm tra `isStudentInClass` chống việc nộp báo cáo sai học sinh vào lớp học. |
| 13 | `backend/src/services/matching.service.js` | Sửa đổi | Chuyển đổi an toàn kiểu dữ liệu `Number(request.subjectLevelId)` và `Number(subjectId)` tránh mismatch kiểu chuỗi/số khi tính matching score. |
| 14 | `backend/prisma/seed-demo-mvp.js` | Tạo mới | Script seed dữ liệu độc lập, idempotent, chuẩn hoá 3 tài khoản demo và đầy đủ dữ liệu quan hệ (lớp học, buổi học, sổ liên lạc, yêu cầu gia sư). |
| 15 | `backend/package.json` | Sửa đổi | Bổ sung script lệnh `"seed:demo": "node prisma/seed-demo-mvp.js"`. |

---

## 2. Danh Sách Tính Năng Tạm Thời Vô Hiệu Hoá (`[FUTURE]`)

Tất cả các file mã nguồn gốc vẫn được giữ nguyên vẹn 100%, chỉ đánh dấu tag `[FUTURE]` tại các điểm tích hợp để phục hồi dễ dàng:

### Backend Routes:
- `/api/departments` (`departmentsRoutes`)
- `/api/roles` (`rolesRoutes`)
- `/api/permissions` (`permissionsRoutes`)
- `/api/push` (`pushRoutes`)
- `/api/forum` (`forumRoutes`)
- `/api/kids` & `/api/learning` (`learningRoutes`)

### Backend Cron Jobs:
- `lessonReminders` (nhắc lịch trước 60 phút)
- `careFollowUps` (quét phiếu CSKH quá hạn SLA)
- `expireOffers` (quét hết hạn offer lớp)
- `expireAttempts` (quét bài test ứng viên hết giờ)
- `streakReset` (reset streak học sinh)

### Frontend Routes & Pages:
- Cổng nhân sự chuyên trách `/staff/*` & `/staff/login`
- Cổng học sinh `/kids/*` (bàn học nhiệm vụ, mini-game, đổi quà)
- Diễn đàn cộng đồng `/forum/*`
- Module ngân hàng đề thi học thuật `/admin/academic` & thi online gia sư `/tutor/tests/*`
- Module giám sát hệ thống nâng cao (Audit Logs, Session Manager, DB Browser)

---

## 3. Danh Sách 3 Tài Khoản Demo

| Portal | Tài khoản (Username) | Mật khẩu | Vai trò (Role) | URL Truy cập | Dữ liệu mẫu liên kết |
|:---|:---|:---|:---|:---|:---|
| **Admin** | `admin` | `Demo@2026` | `ADMIN` | `/admin` | Toàn quyền quản trị lớp, duyệt gia sư, điều phối yêu cầu |
| **Phụ huynh** | `parent_demo` | `Demo@2026` | `PARENT` | `/parent/dashboard` | Bé Nguyễn Minh An (Lớp 5), lớp học `LH-DEMO-001`, yêu cầu tìm gia sư `CR-DEMO-001` |
| **Gia sư** | `tutor_demo` | `Demo@2026` | `TUTOR` | `/tutor/dashboard` | Lớp phụ trách `LH-DEMO-001` (Toán 5), nhận offer `CR-DEMO-001` (Tiếng Anh 5) |

---

## 4. Hướng Dẫn Chạy & Thử Nghiệm

### Bước 1: Khởi tạo dữ liệu demo
```bash
cd backend
npm run seed:demo
```

### Bước 2: Khởi động Backend
```bash
cd backend
npm run dev
# Backend chạy tại: http://localhost:3000
# API Docs Swagger: http://localhost:3000/api-docs
```

### Bước 3: Khởi động Frontend
```bash
cd frontend
npm run dev
# Frontend chạy tại: http://localhost:5173
```

### Bước 4: Kiểm tra các luồng chính
1. **Đăng nhập Admin (`admin` / `Demo@2026`):**
   - Vào `/admin` $\rightarrow$ kiểm tra quản lý yêu cầu lớp, điều phối gia sư.
2. **Đăng nhập Gia sư (`tutor_demo` / `Demo@2026`):**
   - Vào `/tutor/dashboard` $\rightarrow$ xem lịch dạy lớp `LH-DEMO-001`, nộp sổ liên lạc buổi học.
   - Kiểm tra hộp thư lời mời nhận lớp `CR-DEMO-001`.
3. **Đăng nhập Phụ huynh (`parent_demo` / `Demo@2026`):**
   - Vào `/parent/dashboard` $\rightarrow$ xem tiến độ học tập bé Minh An, xem và xác nhận nhận xét sổ liên lạc của thầy Long.

---

## 5. Checklist Kích Hoạt Lại Các Tính Năng Tương Lai (Post-Demo)

Khi mở rộng lại toàn bộ các portal trong giai đoạn tiếp theo:
- [ ] **Mở lại Kids Portal:** Bỏ comment route `/kids/*` trong `AppRoutes.tsx` và `/api/kids`, `/api/learning` trong `server.js`. Kích hoạt lại cron job `streakReset`.
- [ ] **Mở lại Staff Portal:** Bỏ comment `/staff/*` trong `AppRoutes.tsx`, route phân quyền trong `server.js`.
- [ ] **Mở lại Diễn đàn (Forum):** Bỏ comment `/forum/*` trong `AppRoutes.tsx` và `/api/forum` trong `server.js`.
- [ ] **Kích hoạt WebPush & Cron nhắc nhở:** Mở lại `pushRoutes`, `lessonReminders`, `careFollowUps` trong `backend/src/cron/index.js`.
- [ ] **Chuyển In-Memory Rate Limiter sang Redis:** Khi triển khai môi trường multi-instance / cluster production.
