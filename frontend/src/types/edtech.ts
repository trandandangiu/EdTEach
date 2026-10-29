// frontend/src/types/edtech.ts
// Các định nghĩa TypeScript dùng chung cho toàn bộ giao diện EdTech

export interface TutorProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  badge: string;
  verified: boolean;
  subjects: string[];
  grades: string[];
  hourlyRate: number; // in VND
  rating: number;
  reviewCount: number;
  studentsTaught: number;
  location: string;
  teachingMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  bio: string;
  education: string;
  achievements: string[];
  freeTrial: boolean;
  responseRate: string;
}

export interface ForumPost {
  id: string;
  title: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  categoryCode?: string;
  createdAt: string;
  views: number;
  repliesCount: number;
  likes: number;
  content: string;
  tags: string[];
  replies?: {
    id: string;
    author: { name: string; avatar: string; role: string };
    content: string;
    createdAt: string;
    likes: number;
  }[];
}

export interface ClassRequest {
  id: string;
  code: string;
  studentName: string;
  parentName: string;
  phone: string;
  subject: string;
  grade: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  budgetPerSession: number;
  location: string;
  mode: 'ONLINE' | 'OFFLINE';
  status: 'OPEN' | 'MATCHING' | 'OFFERING' | 'ASSIGNED' | 'MATCHED' | 'CANCELLED';
  requirements?: string;
  createdAt: string;
  matchedTutorId?: string;
  urgency?: 'HIGH' | 'NORMAL';
  offers?: any[];
}

export interface TutorOffer {
  id: string;
  requestId: string;
  requestTitle: string;
  studentName: string;
  subject: string;
  grade: string;
  ratePerSession: number;
  sessionsPerWeek: number;
  mode: string;
  location: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'SELECTED';
  createdAt: string;
  deadlineHours: number;
}

export interface TutorClass {
  id: string;
  code: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  subject: string;
  grade: string;
  schedule: string;
  totalLessons: number;
  completedLessons: number;
  currentProgress: number; // percentage
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  nextLessonTime: string;
  tutorNotes: string;
}

export interface LessonReport {
  id: string;
  classId: string;
  lessonId?: string;
  lessonNumber?: number;
  studentName: string;
  subject: string;
  tutorName: string;
  date: string;
  topic?: string;
  attendance: 'PRESENT' | 'ABSENT' | 'LATE';
  comprehensionScore?: number; // 1-10
  focusScore?: number; // 1-10
  homeworkScore?: number; // 1-10
  teacherFeedback: string;
  nextSteps?: string;
  homeworkAssigned?: string;
  starsAwarded?: number;
  status?: string;
  parentFeedback?: string;
  attachments?: any[];
}

export interface KidTask {
  id: string;
  title: string;
  subject: string;
  icon: string;
  deadline: string;
  starsReward: number;
  completed: boolean;
  type: 'MATH_QUIZ' | 'ENGLISH_VOCAB' | 'READING_READ';
  description: string;
  questionCount: number;
  questions?: {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface ExamAttempt {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  subject: string;
  examTitle: string;
  score?: number;
  maxScore: number;
  status: 'PENDING_REVIEW' | 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  submittedAt: string;
  durationMinutes: number;
  evaluatorNotes?: string;
  answers: {
    questionId: number | string;
    questionText: string;
    applicantAnswer: string;
    expectedAnswer: string;
    pointsAwarded?: number;
    maxPoints: number;
  }[];
}

export interface CareCase {
  id: string;
  caseCode: string;
  type: 'LATE_REPORT_24H' | 'PARENT_FEEDBACK' | 'TUTOR_ABSENT' | 'URGENT_REPLACE';
  studentName: string;
  tutorName: string;
  parentName: string;
  phone: string;
  status: 'PENDING' | 'RESOLVING' | 'RESOLVED' | 'OPEN' | 'IN_PROGRESS';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  lastUpdated: string;
  actionTaken?: string;
}
