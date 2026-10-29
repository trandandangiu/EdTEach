// frontend/src/data/mockData.ts
// Toàn bộ dữ liệu giả đã được gỡ bỏ và chuyển sang API thực tế kết nối với Backend.
// File này lưu giữ các kiểu dữ liệu và fallback an toàn để bảo toàn tương thích mã nguồn.

export * from '../types/edtech';
import {
  TutorProfile,
  ForumPost,
  ClassRequest,
  TutorOffer,
  TutorClass,
  LessonReport,
  KidTask,
  ExamAttempt,
  CareCase,
} from '../types/edtech';

export const mockTutors: TutorProfile[] = [];
export const mockForumPosts: ForumPost[] = [];
export const mockClassRequests: ClassRequest[] = [];
export const mockTutorOffers: TutorOffer[] = [];
export const mockTutorClasses: TutorClass[] = [];
export const mockLessonReports: LessonReport[] = [];
export const mockKidsTasks: KidTask[] = [];
export const mockExamAttempts: ExamAttempt[] = [];
export const mockCareCases: CareCase[] = [];
export const mockAuditLogs: any[] = [];
export const mockDepartments: any[] = [];
