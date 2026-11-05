// frontend/src/services/api.ts
// Client API tập trung kết nối Frontend với Backend EdTech

// ============================================================
// 1. TOKEN MANAGEMENT — 1 nguồn duy nhất
// ============================================================
const TOKEN_KEY = 'viettutor_token';
const LEGACY_TOKEN_KEYS = ['token', 'auth_token'] as const;
const CACHE_KEYS = ['viettutor_current_user', 'viettutor_staff_dept'] as const;

export const getToken = (): string | null => {
  const primary = localStorage.getItem(TOKEN_KEY);
  if (primary) return primary;
  // Tương thích ngược: đọc token cũ nếu key chính chưa có
  for (const key of LEGACY_TOKEN_KEYS) {
    const t = localStorage.getItem(key);
    if (t) return t;
  }
  return null;
};

export const hasToken = (): boolean => !!getToken();

const setToken = (token: string) => {
  // TODO: Khi toàn bộ app đã refactor, chỉ giữ TOKEN_KEY.
  // Ghi cả 3 keys để code cũ vẫn hoạt động trong giai đoạn chuyển đổi.
  localStorage.setItem(TOKEN_KEY, token);
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.setItem(key, token);
  }
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
  for (const key of CACHE_KEYS) {
    localStorage.removeItem(key);
  }
};

// ============================================================
// 2. UNAUTHORIZED HANDLER — xử lý 401 tập trung
// AuthContext đăng ký handler để logout + redirect
// ============================================================
type UnauthorizedHandler = (() => void) | null;
let onUnauthorized: UnauthorizedHandler = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

// ============================================================
// 3. ERROR CLASS
// ============================================================
export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ============================================================
// 4. HEADERS + RESPONSE HANDLER
// ============================================================
const getHeaders = (isMultipart = false): Record<string, string> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  return headers;
};

interface HandleOptions {
  /** Bỏ qua handler 401 — dùng cho endpoint login/register/otp */
  skipAuthHandler?: boolean;
}

const handleResponse = async (res: Response, options: HandleOptions = {}) => {
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  // Xử lý 401 tập trung — trừ khi caller yêu cầu bỏ qua
  if (res.status === 401 && !options.skipAuthHandler) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError(
      data.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      401,
      data
    );
  }

  if (!res.ok) {
    throw new ApiError(
      data.message || `Lỗi máy chủ (${res.status})`,
      res.status,
      data
    );
  }

  return data;
};

// ============================================================
// 5. REQUEST HELPER
// ============================================================
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  multipart?: FormData;
  query?: Record<string, any>;
  signal?: AbortSignal;
  skipAuthHandler?: boolean;
};

async function request<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    multipart,
    query,
    signal,
    skipAuthHandler,
  } = options;

  let url = path;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: getHeaders(!!multipart),
    signal,
  };

  // Chặn cứng: GET không được có body
  if (method !== 'GET' && method !== 'HEAD') {
    if (multipart) {
      fetchOptions.body = multipart;
    } else if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  let res: Response;
  try {
    res = await fetch(url, fetchOptions);
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(
      err?.message || 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.',
      0
    );
  }

  return handleResponse(res, { skipAuthHandler });
}

// ============================================================
// 6. API CLIENT
// ============================================================
export const api = {
  // ============================================
  // 1. XÁC THỰC & NGƯỜI DÙNG (AUTH)
  // ============================================
  auth: {
    async login(identifier: string, password: string) {
      // skipAuthHandler: sai password KHÔNG phải mất phiên
      const data = await request<{ token?: string; user?: any }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: { identifier, password },
          skipAuthHandler: true,
        }
      );
      if (data.token) setToken(data.token);
      return data;
    },

    async checkAvailability(payload: { username?: string; email?: string; phone?: string }) {
      return request<{
        success: boolean;
        available: boolean;
        checks: { username: boolean; email: boolean; phone: boolean };
      }>('/api/auth/check-availability', {
        method: 'POST',
        body: payload,
        skipAuthHandler: true,
      });
    },

    async registerParent(payload: {
      username?: string;
      fullName: string;
      phone: string;
      email?: string;
      password?: string;
      province?: string;
      address?: string;
      children?: Array<{ fullName: string; grade?: string; gradeLevelId?: number }>;
      childName?: string;
      childGrade?: string;
    }) {
      return request('/api/auth/register-parent', {
        method: 'POST',
        body: payload,
        skipAuthHandler: true,
      });
    },

    async getMe() {
      return request('/api/auth/me');
    },

    async logout() {
      // Clear local trước — logout phải luôn thành công ở client
      clearToken();
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getHeaders(),
        });
      } catch {
        // ignore
      }
    },

    async sendEmailOtp(email: string, type = 'PARENT_REGISTER') {
      return request('/api/auth/send-email-otp', {
        method: 'POST',
        body: { email, type },
        skipAuthHandler: true,
      });
    },

    async verifyEmailOtp(email: string, code: string) {
      return request('/api/auth/verify-email-otp', {
        method: 'POST',
        body: { email, code },
        skipAuthHandler: true,
      });
    },

    async changePassword(payload: { oldPassword?: string; newPassword?: string }) {
      return request('/api/auth/change-password', {
        method: 'POST',
        body: payload,
      });
    },

    async updateProfile(payload: {
      fullName?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string;
      location?: string;
      address?: string;
      bio?: string;
    }) {
      return request('/api/auth/profile', {
        method: 'PUT',
        body: payload,
      });
    },
  },

  // ============================================
  // 2. GIA SƯ (TUTORS)
  // ============================================
  tutors: {
    async getPublicTutors(params?: {
      search?: string;
      subject?: string;
      grade?: string;
      mode?: string;
      maxRate?: number;
    }) {
      return request('/api/tutors/public', { query: params });
    },

    async getPublicTutorDetail(id: string) {
      return request(`/api/tutors/public/${id}`);
    },

    async apply(payload: any) {
      return request('/api/tutors/apply', { method: 'POST', body: payload });
    },

    async getMyOffers() {
      return request('/api/tutors/my-offers');
    },

    async respondOffer(offerId: string, status: 'ACCEPTED' | 'DECLINED') {
      return request(`/api/tutors/offers/${offerId}/respond`, {
        method: 'POST',
        body: { status },
      });
    },

    async getMyClasses() {
      return request('/api/tutors/my-classes');
    },

    async getApplications(params?: { status?: string; search?: string }) {
      return request('/api/tutors/applications', { query: params });
    },

    async getApplicationDetail(id: string) {
      return request(`/api/tutors/applications/${id}`);
    },

    async reviewApplication(
      id: string,
      payload: {
        status: string;
        rejectReason?: string;
        interviewAt?: string;
        interviewNote?: string;
        examInfo?: {
          testTitle?: string;
          examFileType?: string;
          examFileUrl?: string;
          deadlineHours?: number;
          notes?: string;
        };
      }
    ) {
      return request(`/api/tutors/applications/${id}/review`, {
        method: 'PATCH',
        body: payload,
      });
    },

    async uploadApplicationAttachment(id: string, formData: FormData) {
      return request(`/api/tutors/applications/${id}/attachments`, {
        method: 'POST',
        multipart: formData,
      });
    },

    async getAllTutors(params?: { status?: string; search?: string }) {
      return request('/api/tutors', { query: params });
    },

    async updateStatus(id: string, status: string) {
      return request(`/api/tutors/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
    },

    async getPerformance(id: string) {
      return request(`/api/tutors/${id}/performance`);
    },

    async recordViolation(
      id: string,
      payload: { type: string; note?: string; severity?: number }
    ) {
      return request(`/api/tutors/${id}/violations`, {
        method: 'POST',
        body: payload,
      });
    },

    async toggleVisibility(id: string) {
      return request(`/api/tutors/${id}/toggle-visibility`, { method: 'PATCH' });
    },

    async deleteTutor(id: string) {
      return request(`/api/tutors/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================
  // 3. DIỄN ĐÀN (FORUM)
  // ============================================
  forum: {
    async getCategories() {
      return request('/api/forum/categories');
    },

    async getPosts(params?: {
      categoryId?: number;
      categoryCode?: string;
      search?: string;
      tag?: string;
      sort?: string;
    }) {
      return request('/api/forum/posts', { query: params });
    },

    async getPostDetail(id: string) {
      return request(`/api/forum/posts/${id}`);
    },

    async createPost(payload: {
      title: string;
      content: string;
      categoryId?: number;
      categoryCode?: string;
      tags?: string[];
    }) {
      return request('/api/forum/posts', { method: 'POST', body: payload });
    },

    async addComment(
      postId: string,
      payload: { content: string; parentCommentId?: string }
    ) {
      return request(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        body: payload,
      });
    },

    async toggleLike(postId: string) {
      return request(`/api/forum/posts/${postId}/like`, { method: 'POST' });
    },

    async getAdminPosts(params?: { status?: string; search?: string }) {
      return request('/api/forum/admin/posts', { query: params });
    },

    async hidePost(id: string, reason?: string) {
      return request(`/api/forum/posts/${id}/hide`, {
        method: 'POST',
        body: { reason },
      });
    },

    async unhidePost(id: string) {
      return request(`/api/forum/posts/${id}/unhide`, { method: 'POST' });
    },

    async deletePost(id: string) {
      return request(`/api/forum/posts/${id}`, { method: 'DELETE' });
    },

    async flagPost(id: string, payload: { reason: string; commentId?: string }) {
      return request(`/api/forum/posts/${id}/flag`, {
        method: 'POST',
        body: payload,
      });
    },

    async getFlags(params?: { status?: string }) {
      return request('/api/forum/flags', { query: params });
    },

    async handleFlag(id: string, payload: { status: string; action?: string }) {
      return request(`/api/forum/flags/${id}/handle`, {
        method: 'PATCH',
        body: payload,
      });
    },
  },

  // ============================================
  // 4. KHẢO SÁT & BÀI THI (ASSESSMENTS)
  // ============================================
  assessments: {
    async getTests() {
      return request('/api/assessments/tests');
    },

    async getTestDetail(id: string) {
      return request(`/api/assessments/tests/${id}`);
    },

    async startAttempt(payload: { testId: string; applicationId?: string }) {
      return request('/api/assessments/attempts', {
        method: 'POST',
        body: payload,
      });
    },

    async submitAttempt(
      attemptId: string,
      answers: Array<{ questionId: string | number; answer: any }>
    ) {
      return request(`/api/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: { answers },
      });
    },

    async getAttempts(params?: { status?: string }) {
      return request('/api/assessments/attempts', { query: params });
    },

    async getAttemptDetail(id: string) {
      return request(`/api/assessments/attempts/${id}`);
    },

    async gradeAttempt(
      id: string,
      payload: { grades: any[]; evaluatorNotes?: string; passed?: boolean }
    ) {
      return request(`/api/assessments/attempts/${id}/grade`, {
        method: 'PATCH',
        body: payload,
      });
    },

    async createTest(payload: any) {
      return request('/api/assessments/tests', {
        method: 'POST',
        body: payload,
      });
    },

    async updateTest(id: string, payload: any) {
      return request(`/api/assessments/tests/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },

    async deleteTest(id: string) {
      return request(`/api/assessments/tests/${id}`, { method: 'DELETE' });
    },

    async addQuestions(testId: string, questions: any[]) {
      return request(`/api/assessments/tests/${testId}/questions`, {
        method: 'POST',
        body: { questions },
      });
    },

    async updateQuestion(id: string, payload: any) {
      return request(`/api/assessments/questions/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },

    async deleteQuestion(id: string) {
      return request(`/api/assessments/questions/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================
  // 5. YÊU CẦU TÌM GIA SƯ & GHÉP LỚP (CLASS REQUESTS)
  // ============================================
  classRequests: {
    async getRequests(params?: {
      status?: string;
      subjectLevelId?: number;
      onBoard?: boolean;
    }) {
      const data = await request('/api/class-requests', { query: params });
      const formatted = (data.data || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        studentName: r.student?.fullName ?? null,
        parentName: r.parent?.user?.fullName ?? null,
        phone: r.parent?.user?.phone ?? null,
        subject: r.subjectLevel?.subject?.name ?? null,
        grade:
          r.student?.gradeLevel?.name ??
          r.subjectLevel?.gradeLevel?.name ??
          null,
        sessionsPerWeek: r.sessionsPerWeek ?? null,
        durationMinutes: r.sessionDurationMin ?? null,
        budgetPerSession:
          r.budgetPerSession != null ? Number(r.budgetPerSession) : null,
        location: r.address ?? r.province ?? null,
        mode: r.teachingMode ?? null,
        status: r.status ?? null,
        requirements: r.note ?? null,
        createdAt: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('vi-VN')
          : null,
        urgency: r.status === 'NEW' ? 'HIGH' : 'NORMAL',
        offers: r.offers || [],
      }));
      return { success: true, data: formatted, raw: data.data };
    },

    async createRequest(payload: any) {
      return request('/api/class-requests', { method: 'POST', body: payload });
    },

    async sendParallelOffers(
      requestId: string,
      payload: {
        tutorIds: string[];
        proposedFee?: number;
        note?: string;
        expiresHours?: number;
      }
    ) {
      return request(`/api/class-requests/${requestId}/offers`, {
        method: 'POST',
        body: payload,
      });
    },

    async selectOffer(
      requestId: string,
      payload: {
        offerId: string;
        createClassDirectly?: boolean;
        classTitle?: string;
      }
    ) {
      return request(`/api/class-requests/${requestId}/select-offer`, {
        method: 'POST',
        body: payload,
      });
    },

    async getSuggestions(requestId: string) {
      return request(`/api/class-requests/${requestId}/suggestions`);
    },

    async directMatch(
      requestId: string,
      payload: { tutorId: string; feePerSession?: number; classTitle?: string }
    ) {
      return request(`/api/class-requests/${requestId}/direct-match`, {
        method: 'POST',
        body: payload,
      });
    },

    async deleteRequest(requestId: string) {
      return request(`/api/class-requests/${requestId}`, {
        method: 'DELETE',
      });
    },
  },

  // ============================================
  // 6. LỚP HỌC (CLASSES)
  // ============================================
  classes: {
    async getClasses(params?: {
      status?: string;
      format?: string;
      subjectLevelId?: number;
    }) {
      return request('/api/classes', { query: params });
    },

    async getClassDetail(id: string) {
      return request(`/api/classes/${id}`);
    },

    async createClass(payload: any) {
      return request('/api/classes', { method: 'POST', body: payload });
    },

    async enrollStudent(
      classId: string,
      payload: { studentId: string; feePerSession?: number }
    ) {
      return request(`/api/classes/${classId}/enroll`, {
        method: 'POST',
        body: payload,
      });
    },

    async approveClass(classId: string) {
      return request(`/api/classes/${classId}/approve`, { method: 'POST' });
    },

    async rejectClass(classId: string, rejectReason?: string) {
      return request(`/api/classes/${classId}/reject`, {
        method: 'POST',
        body: { rejectReason },
      });
    },

    async updateSchedule(classId: string, payload: any) {
      return request(`/api/classes/${classId}/schedules`, {
        method: 'PUT',
        body: payload,
      });
    },

    async assignHomework(classId: string, payload: any) {
      return request(`/api/classes/${classId}/tasks`, {
        method: 'POST',
        body: payload,
      });
    },

    async deleteClass(classId: string) {
      return request(`/api/classes/${classId}`, {
        method: 'DELETE',
      });
    },
  },

  // ============================================
  // 7. SỔ LIÊN LẠC (LESSON REPORTS)
  // ============================================
  reports: {
    async getLessonReports(params?: {
      studentId?: string;
      classId?: string;
      status?: string;
    }) {
      const data = await request('/api/lesson-reports', { query: params });
      const formatted = (data.data || []).map((r: any) => ({
        id: r.id,
        classId: r.lesson?.classId ?? null,
        lessonNumber: r.lesson?.sessionNo ?? null,
        studentName: r.student?.fullName ?? null,
        subject: r.lesson?.class?.subjectLevel?.subject?.name ?? null,
        tutorName: r.tutor?.user?.fullName ?? null,
        date: r.submittedAt
          ? new Date(r.submittedAt).toLocaleDateString('vi-VN')
          : null,
        topic: r.lessonContent ?? null,
        attendance: r.attendance ?? null,
        comprehensionScore: null,
        focusScore: null,
        homeworkScore: null,
        teacherFeedback: r.tutorComment ?? null,
        nextSteps: null,
        homeworkAssigned: r.homeworkNote ?? null,
        starsAwarded: null,
        status: r.status ?? null,
        parentFeedback: r.parentFeedback ?? null,
        attachments: r.attachments || [],
      }));
      return { success: true, data: formatted, raw: data.data };
    },

    async getReportDetail(id: string) {
      return request(`/api/lesson-reports/${id}`);
    },

    async submitReport(lessonId: string, formData: FormData) {
      return request(`/api/lesson-reports/lessons/${lessonId}/reports`, {
        method: 'POST',
        multipart: formData,
      });
    },

    async confirmReport(id: string, parentFeedback?: string) {
      return request(`/api/lesson-reports/${id}/confirm`, {
        method: 'POST',
        body: { parentFeedback },
      });
    },

    async confirmOnBehalf(
      id: string,
      payload: { careCaseId?: string; note: string }
    ) {
      return request(`/api/lesson-reports/${id}/confirm-on-behalf`, {
        method: 'POST',
        body: payload,
      });
    },
  },

  // ============================================
  // 8. CHĂM SÓC KHÁCH HÀNG & GIA SƯ (CARE CASES)
  // ============================================
  care: {
    async getCareCases(params?: {
      team?: string;
      status?: string;
      type?: string;
    }) {
      const data = await request('/api/care-cases', { query: params });
      const formatted = (data.data || []).map((c: any) => ({
        id: c.id,
        caseCode: c.code ?? null,
        type: c.type ?? null,
        studentName: c.class?.students?.[0]?.student?.fullName ?? null,
        tutorName: c.tutor?.user?.fullName ?? null,
        parentName: c.parent?.user?.fullName ?? null,
        phone: c.parent?.user?.phone ?? c.tutor?.user?.phone ?? null,
        status: c.status ?? null,
        priority:
          c.priority >= 3 ? 'CRITICAL' : c.priority === 2 ? 'HIGH' : 'MEDIUM',
        description: c.title || c.detail || null,
        lastUpdated: c.updatedAt
          ? new Date(c.updatedAt).toLocaleString('vi-VN')
          : null,
        actionTaken: c.resolution ?? null,
      }));
      return { success: true, data: formatted, raw: data.data };
    },

    async getUnconfirmedReports(olderThanHours = 24) {
      return request('/api/care-cases/unconfirmed-reports', {
        query: { olderThanHours },
      });
    },

    async addContactLog(
      caseId: string,
      payload: {
        target: string;
        channel: string;
        outcome: string;
        note: string;
        followUpAt?: string;
      }
    ) {
      return request(`/api/care-cases/${caseId}/contacts`, {
        method: 'POST',
        body: payload,
      });
    },

    async updateStatus(caseId: string, status: string) {
      return request(`/api/care-cases/${caseId}/status`, {
        method: 'PATCH',
        body: { status },
      });
    },

    async getStats(params?: { team?: string }) {
      return request('/api/care-cases/stats', { query: params });
    },

    async deleteCareCase(caseId: string) {
      return request(`/api/care-cases/${caseId}`, { method: 'DELETE' });
    },
  },

  // ============================================
  // 9. GÓC HỌC SINH (KIDS MODE TIỂU HỌC)
  // ============================================
  kids: {
    async getTodayTasks() {
      return request('/api/kids/today');
    },

    async submitTask(taskId: string, formData: FormData) {
      return request(`/api/kids/tasks/${taskId}/submit`, {
        method: 'POST',
        multipart: formData,
      });
    },

    async finishGameSession(payload: {
      gameId: string;
      score: number;
      durationSeconds: number;
    }) {
      return request('/api/kids/game-sessions/finish', {
        method: 'POST',
        body: payload,
      });
    },

    async getRewards(studentId?: string) {
      const endpoint = studentId
        ? `/api/kids/students/${studentId}/rewards`
        : '/api/kids/rewards';
      return request(endpoint);
    },
  },

  // ============================================
  // BAN HỌC THUẬT: MINI-GAMES & CONTENT SETS
  // ============================================
  learning: {
    async getGames() {
      return request('/api/learning/games');
    },

    async createGame(payload: {
      code: string;
      name: string;
      description?: string;
      subjectId?: number;
      minGradeOrder?: number;
      maxGradeOrder?: number;
      thumbnailUrl?: string;
      engineConfig?: any;
    }) {
      return request('/api/learning/games', { method: 'POST', body: payload });
    },

    async updateGame(id: string, payload: any) {
      return request(`/api/learning/games/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },

    async deleteGame(id: string) {
      return request(`/api/learning/games/${id}`, { method: 'DELETE' });
    },

    async createContentSet(payload: {
      gameId: string;
      subjectLevelId: number;
      title: string;
      data: any;
    }) {
      return request('/api/learning/game-content-sets', {
        method: 'POST',
        body: payload,
      });
    },

    async updateContentSet(id: string, payload: any) {
      return request(`/api/learning/game-content-sets/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },

    async deleteContentSet(id: string) {
      return request(`/api/learning/game-content-sets/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ============================================
  // 10. HỌC SINH & GIA ĐÌNH (STUDENTS)
  // ============================================
  students: {
    async getStudents() {
      return request('/api/students');
    },

    async createStudent(payload: any) {
      return request('/api/students', { method: 'POST', body: payload });
    },

    async updateStudent(id: string, payload: any) {
      return request(`/api/students/${id}`, { method: 'PATCH', body: payload });
    },

    async deleteStudent(id: string) {
      return request(`/api/students/${id}`, { method: 'DELETE' });
    },

    async getStudentTasks(id: string) {
      return request(`/api/students/${id}/tasks`);
    },

    async getStudentOverview(id: string) {
      return request(`/api/students/${id}/overview`);
    },

    async setStudentPin(id: string, pin: string) {
      return request(`/api/students/${id}/pin`, {
        method: 'PUT',
        body: { pin },
      });
    },
  },

  // ============================================
  // 11. DANH MỤC GIÁO DỤC (CATALOG)
  // ============================================
  catalog: {
    async getSubjects() {
      return request('/api/catalog/subjects');
    },

    async getGradeLevels() {
      return request('/api/catalog/grade-levels');
    },

    async getSubjectLevels(params?: {
      gradeLevelId?: number;
      subjectId?: number;
    }) {
      return request('/api/catalog/subject-levels', { query: params });
    },
  },

  // ============================================
  // 12. QUẢN TRỊ HỆ THỐNG (ADMIN)
  // ============================================
  admin: {
    async getStats() {
      try {
        const res: any = await request('/api/admin/stats');
        const s = res?.stats || res;
        return {
          totalUsers: s.totalUsers ?? s.users ?? 0,
          totalTutors: s.totalTutors ?? 0,
          totalParents: s.totalParents ?? 0,
          pendingApplicants: s.pendingApplicants ?? 0,
          openRequests: s.openRequests ?? 0,
          criticalCare: s.criticalCare ?? 0,
          ...s,
        };
      } catch (err) {
        console.error('Failed to get admin stats:', err);
        return {
          totalUsers: 0,
          totalTutors: 0,
          totalParents: 0,
          pendingApplicants: 0,
          openRequests: 0,
          criticalCare: 0,
        };
      }
    },

    async getUsers(params?: {
      departmentId?: string;
      role?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) {
      return request('/api/users', { query: params });
    },

    async createUser(payload: any) {
      return request('/api/users', { method: 'POST', body: payload });
    },

    async updateUser(id: string, payload: any) {
      return request(`/api/users/${id}`, { method: 'PUT', body: payload });
    },

    async deleteUser(id: string) {
      return request(`/api/users/${id}`, { method: 'DELETE' });
    },

    async toggleUserActive(id: string) {
      return request(`/api/users/${id}/toggle-active`, { method: 'PATCH' });
    },

    async resetPassword(id: string, newPassword = 'password123') {
      return request(`/api/users/${id}/reset-password`, {
        method: 'POST',
        body: { newPassword },
      });
    },

    async banUser(
      id: string,
      payload: { durationHours: number; banReason?: string }
    ) {
      return request(`/api/users/${id}/ban`, {
        method: 'POST',
        body: payload,
      });
    },

    async getDepartments() {
      return request('/api/departments');
    },

    async getAuditLogs(params?: { page?: number; limit?: number }) {
      return request('/api/admin/audit-logs', { query: params });
    },
  },
};