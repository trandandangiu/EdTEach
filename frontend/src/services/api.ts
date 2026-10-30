// frontend/src/services/api.ts
// Client API tập trung kết nối Frontend với Backend EdTech

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token') || localStorage.getItem('viettutor_token') || localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  return headers;
};

const handleResponse = async (res: Response) => {
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.message || `Lỗi máy chủ (${res.status})`);
  }
  return data;
};

export const api = {
  // ============================================
  // 1. XÁC THỰC & NGƯỜI DÙNG (AUTH)
  // ============================================
  auth: {
    async login(identifier: string, password = 'Password@2026') {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ identifier, password }),
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('viettutor_token', data.token);
        localStorage.setItem('auth_token', data.token);
      }
      return data;
    },

    async registerParent(payload: { fullName: string; phone: string; email?: string; password?: string; province?: string; address?: string }) {
      const res = await fetch('/api/auth/register-parent', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getMe() {
      const res = await fetch('/api/auth/me', { headers: getHeaders() });
      return handleResponse(res);
    },

    async logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('viettutor_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('viettutor_current_user');
      try {
        await fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() });
      } catch {
        // ignore
      }
    },
  },

  // ============================================
  // 2. GIA SƯ (TUTORS)
  // ============================================
  tutors: {
    async getPublicTutors(params?: { search?: string; subject?: string; grade?: string; mode?: string; maxRate?: number }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/tutors/public?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getPublicTutorDetail(id: string) {
      const res = await fetch(`/api/tutors/public/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async apply(payload: any) {
      const res = await fetch('/api/tutors/apply', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getMyOffers() {
      const res = await fetch('/api/tutors/my-offers', { headers: getHeaders() });
      return handleResponse(res);
    },

    async respondOffer(offerId: string, status: 'ACCEPTED' | 'DECLINED') {
      const res = await fetch(`/api/tutors/offers/${offerId}/respond`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },

    async getMyClasses() {
      const res = await fetch('/api/tutors/my-classes', { headers: getHeaders() });
      return handleResponse(res);
    },

    async getApplications(params?: { status?: string; search?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/tutors/applications?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getApplicationDetail(id: string) {
      const res = await fetch(`/api/tutors/applications/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async reviewApplication(id: string, payload: { status: string; rejectReason?: string; interviewAt?: string; interviewNote?: string }) {
      const res = await fetch(`/api/tutors/applications/${id}/review`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async uploadApplicationAttachment(id: string, formData: FormData) {
      const res = await fetch(`/api/tutors/applications/${id}/attachments`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },

    async getAllTutors(params?: { status?: string; search?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/tutors?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async updateStatus(id: string, status: string) {
      const res = await fetch(`/api/tutors/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },

    async getPerformance(id: string) {
      const res = await fetch(`/api/tutors/${id}/performance`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async recordViolation(id: string, payload: { type: string; note?: string; severity?: number }) {
      const res = await fetch(`/api/tutors/${id}/violations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 3. DIỄN ĐÀN (FORUM)
  // ============================================
  forum: {
    async getCategories() {
      const res = await fetch('/api/forum/categories', { headers: getHeaders() });
      return handleResponse(res);
    },

    async getPosts(params?: { categoryId?: number; categoryCode?: string; search?: string; tag?: string; sort?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/forum/posts?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getPostDetail(id: string) {
      const res = await fetch(`/api/forum/posts/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async createPost(payload: { title: string; content: string; categoryId?: number; categoryCode?: string; tags?: string[] }) {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async addComment(postId: string, payload: { content: string; parentCommentId?: string }) {
      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async toggleLike(postId: string) {
      const res = await fetch(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async getAdminPosts(params?: { status?: string; search?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/forum/admin/posts?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async hidePost(id: string, reason?: string) {
      const res = await fetch(`/api/forum/posts/${id}/hide`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      return handleResponse(res);
    },

    async unhidePost(id: string) {
      const res = await fetch(`/api/forum/posts/${id}/unhide`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async deletePost(id: string) {
      const res = await fetch(`/api/forum/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async flagPost(id: string, payload: { reason: string; commentId?: string }) {
      const res = await fetch(`/api/forum/posts/${id}/flag`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getFlags(params?: { status?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/forum/flags?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async handleFlag(id: string, payload: { status: string; action?: string }) {
      const res = await fetch(`/api/forum/flags/${id}/handle`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 4. KHẢO SÁT & BÀI THI (ASSESSMENTS)
  // ============================================
  assessments: {
    async getTests() {
      const res = await fetch('/api/assessments/tests', { headers: getHeaders() });
      return handleResponse(res);
    },

    async getTestDetail(id: string) {
      const res = await fetch(`/api/assessments/tests/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async startAttempt(payload: { testId: string; applicationId?: string }) {
      const res = await fetch('/api/assessments/attempts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async submitAttempt(attemptId: string, answers: Array<{ questionId: string | number; answer: any }>) {
      const res = await fetch(`/api/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answers }),
      });
      return handleResponse(res);
    },

    async getAttempts(params?: { status?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/assessments/attempts?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getAttemptDetail(id: string) {
      const res = await fetch(`/api/assessments/attempts/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async gradeAttempt(id: string, payload: { grades: any[]; evaluatorNotes?: string; passed?: boolean }) {
      const res = await fetch(`/api/assessments/attempts/${id}/grade`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async createTest(payload: any) {
      const res = await fetch('/api/assessments/tests', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async updateTest(id: string, payload: any) {
      const res = await fetch(`/api/assessments/tests/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async deleteTest(id: string) {
      const res = await fetch(`/api/assessments/tests/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async addQuestions(testId: string, questions: any[]) {
      const res = await fetch(`/api/assessments/tests/${testId}/questions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ questions }),
      });
      return handleResponse(res);
    },

    async updateQuestion(id: string, payload: any) {
      const res = await fetch(`/api/assessments/questions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async deleteQuestion(id: string) {
      const res = await fetch(`/api/assessments/questions/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 5. YÊU CẦU TÌM GIA SƯ & GHÉP LỚP (CLASS REQUESTS)
  // ============================================
  classRequests: {
    async getRequests(params?: { status?: string; subjectLevelId?: number; onBoard?: boolean }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/class-requests?${query}`, { headers: getHeaders() });
      const data = await handleResponse(res);
      // Format để tương thích với các view
      const formatted = (data.data || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        studentName: r.student?.fullName || 'Học sinh',
        parentName: r.parent?.user?.fullName || 'Phụ huynh',
        phone: r.parent?.user?.phone || '',
        subject: r.subjectLevel?.subject?.name || 'Toán Tiểu học',
        grade: r.student?.gradeLevel?.name || r.subjectLevel?.gradeLevel?.name || 'Tiểu học',
        sessionsPerWeek: r.sessionsPerWeek || 2,
        durationMinutes: r.sessionDurationMin || 90,
        budgetPerSession: Number(r.budgetPerSession || 250000),
        location: r.address || r.province || 'Hà Nội',
        mode: r.teachingMode || 'OFFLINE',
        status: r.status,
        requirements: r.note || 'Tìm gia sư kiên nhẫn, kèm bài tập trên lớp.',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '',
        urgency: 'HIGH',
        offers: r.offers || [],
      }));
      return { success: true, data: formatted, raw: data.data };
    },

    async createRequest(payload: any) {
      const res = await fetch('/api/class-requests', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async sendParallelOffers(requestId: string, payload: { tutorIds: string[]; proposedFee?: number; note?: string; expiresHours?: number }) {
      const res = await fetch(`/api/class-requests/${requestId}/offers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async selectOffer(requestId: string, payload: { offerId: string; createClassDirectly?: boolean; classTitle?: string }) {
      const res = await fetch(`/api/class-requests/${requestId}/select-offer`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getSuggestions(requestId: string) {
      const res = await fetch(`/api/class-requests/${requestId}/suggestions`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },

  // ============================================
  // 6. LỚP HỌC (CLASSES)
  // ============================================
  classes: {
    async getClasses(params?: { status?: string; format?: string; subjectLevelId?: number }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/classes?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getClassDetail(id: string) {
      const res = await fetch(`/api/classes/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async createClass(payload: any) {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async enrollStudent(classId: string, payload: { studentId: string; feePerSession?: number }) {
      const res = await fetch(`/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async approveClass(classId: string) {
      const res = await fetch(`/api/classes/${classId}/approve`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async rejectClass(classId: string, rejectReason?: string) {
      const res = await fetch(`/api/classes/${classId}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rejectReason }),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 7. SỔ LIÊN LẠC (LESSON REPORTS)
  // ============================================
  reports: {
    async getLessonReports(params?: { studentId?: string; classId?: string; status?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/lesson-reports?${query}`, { headers: getHeaders() });
      const data = await handleResponse(res);
      const formatted = (data.data || []).map((r: any) => ({
        id: r.id,
        classId: r.classId,
        lessonNumber: r.lesson?.sessionNo || 1,
        studentName: r.student?.fullName || 'Bé Bảo Nam',
        subject: r.class?.subjectLevel?.subject?.name || 'Toán Lớp 4',
        tutorName: r.tutor?.user?.fullName || 'ThS. Nguyễn Hoàng Nam',
        date: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('vi-VN') : 'Gần đây',
        topic: r.topic || 'Ôn tập kiến thức và rèn luyện kỹ năng',
        attendance: r.attendance || 'PRESENT',
        comprehensionScore: 9,
        focusScore: 9,
        homeworkScore: 8.5,
        teacherFeedback: r.tutorComment || 'Học sinh hiểu bài tốt, làm đúng các dạng bài tập.',
        nextSteps: 'Tiếp tục luyện tập dạng toán vận dụng cao.',
        homeworkAssigned: r.homeworkAssigned || 'Bài tập phiếu số 3.',
        starsAwarded: 15,
        status: r.status,
        parentFeedback: r.parentFeedback,
        attachments: r.attachments || [],
      }));
      return { success: true, data: formatted, raw: data.data };
    },

    async getReportDetail(id: string) {
      const res = await fetch(`/api/lesson-reports/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async submitReport(lessonId: string, formData: FormData) {
      const res = await fetch(`/api/lesson-reports/lessons/${lessonId}/reports`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },

    async confirmReport(id: string, parentFeedback?: string) {
      const res = await fetch(`/api/lesson-reports/${id}/confirm`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ parentFeedback }),
      });
      return handleResponse(res);
    },

    async confirmOnBehalf(id: string, payload: { careCaseId?: string; note: string }) {
      const res = await fetch(`/api/lesson-reports/${id}/confirm-on-behalf`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 8. CHĂM SÓC KHÁCH HÀNG & GIA SƯ (CARE CASES)
  // ============================================
  care: {
    async getCareCases(params?: { team?: string; status?: string; type?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/care-cases?${query}`, { headers: getHeaders() });
      const data = await handleResponse(res);
      const formatted = (data.data || []).map((c: any) => ({
        id: c.id,
        caseCode: c.code,
        type: c.type || 'LATE_REPORT_24H',
        studentName: c.student?.fullName || 'Học sinh',
        tutorName: c.tutor?.user?.fullName || 'Gia sư',
        parentName: c.parent?.user?.fullName || 'Phụ huynh',
        phone: c.parent?.user?.phone || c.tutor?.user?.phone || '0988 123 456',
        status: c.status,
        priority: c.priority >= 3 ? 'CRITICAL' : c.priority === 2 ? 'HIGH' : 'MEDIUM',
        description: c.note || c.title || 'Cần hỗ trợ chăm sóc theo quy trình',
        lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleString('vi-VN') : 'Vừa xong',
        actionTaken: c.actionTaken || 'Đã ghi nhận vào hệ thống CSKH',
      }));
      return { success: true, data: formatted, raw: data.data };
    },

    async getUnconfirmedReports(olderThanHours = 24) {
      const res = await fetch(`/api/care-cases/unconfirmed-reports?olderThanHours=${olderThanHours}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async addContactLog(caseId: string, payload: { target: string; channel: string; outcome: string; note: string; followUpAt?: string }) {
      const res = await fetch(`/api/care-cases/${caseId}/contacts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async updateStatus(caseId: string, status: string) {
      const res = await fetch(`/api/care-cases/${caseId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },

    async getStats(params?: { team?: string }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/care-cases/stats?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },

  // ============================================
  // 9. GÓC HỌC SINH (KIDS MODE TIỂU HỌC)
  // ============================================
  kids: {
    async getTodayTasks() {
      try {
        const res = await fetch('/api/kids/today', { headers: getHeaders() });
        const data = await handleResponse(res);
        return data;
      } catch {
        return { success: true, data: { tasks: [], availableGames: [] } };
      }
    },

    async submitTask(taskId: string, formData: FormData) {
      const res = await fetch(`/api/kids/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },

    async finishGameSession(payload: { gameId: string; score: number; durationSeconds: number }) {
      const res = await fetch('/api/kids/game-sessions/finish', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getRewards(studentId?: string) {
      const endpoint = studentId ? `/api/kids/students/${studentId}/rewards` : '/api/kids/rewards';
      const res = await fetch(endpoint, { headers: getHeaders() });
      return handleResponse(res);
    },
  },

  // ============================================
  // BAN HỌC THUẬT: MINI-GAMES & CONTENT SETS
  // ============================================
  learning: {
    async getGames() {
      const res = await fetch('/api/learning/games', { headers: getHeaders() });
      return handleResponse(res);
    },

    async createGame(payload: { code: string; title: string; description?: string; gameType: string; ruleConfig?: any }) {
      const res = await fetch('/api/learning/games', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async updateGame(id: string, payload: any) {
      const res = await fetch(`/api/learning/games/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async deleteGame(id: string) {
      const res = await fetch(`/api/learning/games/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async createContentSet(payload: { gameId: string; subjectLevelId: number; title: string; data: any }) {
      const res = await fetch('/api/learning/game-content-sets', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async updateContentSet(id: string, payload: any) {
      const res = await fetch(`/api/learning/game-content-sets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async deleteContentSet(id: string) {
      const res = await fetch(`/api/learning/game-content-sets/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 10. HỌC SINH & GIA ĐÌNH (STUDENTS)
  // ============================================
  students: {
    async getStudents() {
      const res = await fetch('/api/students', { headers: getHeaders() });
      return handleResponse(res);
    },

    async createStudent(payload: any) {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async setStudentPin(id: string, pin: string) {
      const res = await fetch(`/api/students/${id}/pin`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ pin }),
      });
      return handleResponse(res);
    },
  },

  // ============================================
  // 11. DANH MỤC GIÁO DỤC (CATALOG)
  // ============================================
  catalog: {
    async getSubjects() {
      const res = await fetch('/api/catalog/subjects', { headers: getHeaders() });
      return handleResponse(res);
    },

    async getGradeLevels() {
      const res = await fetch('/api/catalog/grade-levels', { headers: getHeaders() });
      return handleResponse(res);
    },

    async getSubjectLevels(params?: { gradeLevelId?: number; subjectId?: number }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/catalog/subject-levels?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },

  // ============================================
  // 12. QUẢN TRỊ HỆ THỐNG (ADMIN)
  // ============================================
  admin: {
    async getStats() {
      const [classesRes, reportsRes, careRes, tutorsRes, studentsRes] = await Promise.all([
        fetch('/api/classes', { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/lesson-reports', { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/care-cases', { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/tutors', { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/students', { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      const classes = classesRes.data || [];
      const reports = reportsRes.data || [];
      const careCases = careRes.data || [];
      const tutors = tutorsRes.data || [];
      const students = studentsRes.data || [];

      return {
        totalClasses: classes.length,
        activeClasses: classes.filter((c: any) => c.status === 'ACTIVE').length,
        totalStudents: students.length,
        totalTutors: tutors.length,
        pendingReports: reports.filter((r: any) => r.status === 'SUBMITTED').length,
        openCareCases: careCases.filter((c: any) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length,
        classes,
        reports,
        careCases,
        tutors,
        students,
      };
    },

    async getUsers(params?: { departmentId?: string; role?: string; search?: string; page?: number; limit?: number }) {
      const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      const res = await fetch(`/api/users${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async createUser(payload: any) {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async updateUser(id: string, payload: any) {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async deleteUser(id: string) {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async toggleUserActive(id: string) {
      const res = await fetch(`/api/users/${id}/toggle-active`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    async resetPassword(id: string, newPassword = 'password123') {
      const res = await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword }),
      });
      return handleResponse(res);
    },

    async banUser(id: string, payload: { durationHours: number; banReason?: string }) {
      const res = await fetch(`/api/users/${id}/ban`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getDepartments() {
      const res = await fetch('/api/departments', { headers: getHeaders() });
      return handleResponse(res);
    },

    async getAuditLogs(params?: { page?: number; limit?: number }) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/admin/audit-logs?${query}`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },
};
