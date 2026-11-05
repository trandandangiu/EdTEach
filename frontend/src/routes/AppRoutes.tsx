import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// LOADING SPINNER TỐI GIẢN
// ============================================================================
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
    <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs font-semibold tracking-wide text-emerald-950">Đang tải trang VietTutor...</span>
  </div>
);

// ============================================================================
// LAZY-LOAD CÁC MODULES & TRANG (Tối ưu bundle kích thước PWA)
// ============================================================================

// 1. Phân hệ Công khai (Public / Superprof-style)
const PublicHomePage = lazy(() => import('../features/public/PublicHomePage'));
const PublicTutorSearchPage = lazy(() => import('../features/public/PublicTutorSearchPage'));
const PublicTutorDetailPage = lazy(() => import('../features/public/PublicTutorDetailPage'));
// [FUTURE] const ForumPage = lazy(() => import('../features/forum/ForumPage'));
// [FUTURE] const ForumDetailPage = lazy(() => import('../features/forum/ForumDetailPage'));
const LoginPage = lazy(() => import('../pages/Login'));
// [FUTURE] const StaffLogin = lazy(() => import('../pages/StaffLogin'));
const ParentRegisterPage = lazy(() => import('../features/public/ParentRegisterPage'));
const UserProfilePage = lazy(() => import('../features/profile/UserProfilePage'));

// 2. Tuyển dụng & Gia sư (Tutor Portal)
const TutorLayout = lazy(() => import('../features/tutor/TutorLayout'));
const TutorApplyPage = lazy(() => import('../features/apply/TutorApplyPage'));
const TutorTestsPage = lazy(() => import('../features/apply/TutorTestsPage'));
const TutorExamRoomPage = lazy(() => import('../features/apply/TutorExamRoomPage'));
const TutorDashboard = lazy(() => import('../features/tutor/TutorDashboard'));
// [FUTURE] const TutorOpenBoardPage = lazy(() => import('../features/tutor/TutorOpenBoardPage'));
const TutorOffersInboxPage = lazy(() => import('../features/tutor/TutorOffersInboxPage'));
const TutorClassesPage = lazy(() => import('../features/tutor/TutorClassesPage'));
const TutorClassDetailPage = lazy(() => import('../features/tutor/TutorClassDetailPage'));
const LessonReportSubmitPage = lazy(() => import('../features/tutor/LessonReportSubmitPage'));
// [FUTURE] const TutorTasksManagerPage = lazy(() => import('../features/tutor/TutorTasksManagerPage'));

// 3. Phân hệ Phụ huynh (Parent Portal)
const ParentLayout = lazy(() => import('../features/parent/ParentLayout'));
const ParentDashboard = lazy(() => import('../features/parent/ParentDashboard'));
const ParentChildrenPage = lazy(() => import('../features/parent/ParentChildrenPage'));
const CreateClassRequestPage = lazy(() => import('../features/parent/CreateClassRequestPage'));
const ParentRequestsHistoryPage = lazy(() => import('../features/parent/ParentRequestsHistoryPage'));
const LessonReportsParentPage = lazy(() => import('../features/parent/LessonReportsParentPage'));
const LessonReportParentDetailPage = lazy(() => import('../features/parent/LessonReportParentDetailPage'));
const ParentSchedulePage = lazy(() => import('../features/parent/ParentSchedulePage'));

// 4. Góc học sinh (Kids Portal - Lớp 1-5)
// [FUTURE] const KidsTodayTasksPage = lazy(() => import('../features/kids/KidsTodayTasksPage'));
// [FUTURE] const KidsSubmitTaskPage = lazy(() => import('../features/kids/KidsSubmitTaskPage'));
// [FUTURE] const KidsGamesHubPage = lazy(() => import('../features/kids/KidsGamesHubPage'));
// [FUTURE] const KidsGamePlayPage = lazy(() => import('../features/kids/KidsGamePlayPage'));
// [FUTURE] const KidsTrophyPage = lazy(() => import('../features/kids/KidsTrophyPage'));

// 5. Trung tâm Điều hành & Quản trị (Admin Portal)
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminDashboardHome = lazy(() => import('../components/admin/AdminDashboardHome'));
const AdminRecruitKanban = lazy(() => import('../features/admin/recruit/AdminRecruitKanban'));
const AdminGradeAttemptPage = lazy(() => import('../features/admin/recruit/AdminGradeAttemptPage'));
const AdminMatchingQueue = lazy(() => import('../components/admin/edtech/AdminClassRequests'));
const AdminClassesManager = lazy(() => import('../features/admin/matching/AdminClassesManager'));
const AdminCareCases = lazy(() => import('../components/admin/edtech/AdminCareCases'));
// [FUTURE] const AdminAcademicManager = lazy(() => import('../features/admin/academic/AdminAcademicManager'));
// [FUTURE] const AdminForumMod = lazy(() => import('../features/admin/forum/AdminForumMod'));
const AdminUsers = lazy(() => import('../components/admin/AdminUsers'));
// [FUTURE] const AdminDepartments = lazy(() => import('../components/admin/AdminDepartments'));
// [FUTURE] const DatabaseBrowser = lazy(() => import('../components/admin/DatabaseBrowser'));
// [FUTURE] const AdminAuditLogs = lazy(() => import('../components/admin/AdminAuditLogs'));
// [FUTURE] const AdminSessions = lazy(() => import('../components/admin/AdminSessions'));

// ============================================================================
// HỢP PHẦN BẢO VỆ PHÂN QUYỀN (PROTECTED ROUTE HỖ TRỢ RBAC VÀ TOKEN HỌC SINH)
// ============================================================================
interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireKidsMode?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requiredPermissions,
  requireKidsMode = false,
}) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  // 1. Chưa đăng nhập
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kiểm tra chế độ Kids Mode
  const isStudentActor = currentUser.actorType === 'STUDENT';
  if (requireKidsMode && !isStudentActor) {
    // Nếu trang bắt buộc cho bé mà đang là phiên phụ huynh/nhân sự
    return <Navigate to="/parent/dashboard" replace />;
  }
  if (!requireKidsMode && isStudentActor) {
    // Nếu bé đang ở phiên Kids token mà bấm vào link của người lớn -> giữ an toàn, đẩy về /kids
    return <Navigate to="/kids" replace />;
  }

  // ADMIN bypass toàn bộ kiểm tra roles và permissions
  const userRoles: string[] = currentUser.roles?.map((r: any) => (typeof r === 'string' ? r : r.code)) || [];
  if (userRoles.includes('ADMIN')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    );
  }

  // 3. Kiểm tra vai trò (Roles check)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return <AccessDeniedView reason="Vai trò tài khoản không phù hợp với phân hệ này." />;
    }
  }

  // 4. Kiểm tra quyền hạn chi tiết (Permissions check - logic OR)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPerms: string[] = currentUser.permissions || [];
    const hasPermission = requiredPermissions.some((perm) => userPerms.includes(perm));
    if (!hasPermission) {
      return <AccessDeniedView reason="Bạn không có quyền thao tác trên tính năng này." />;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

// Màn hình từ chối truy cập
const AccessDeniedView: React.FC<{ reason: string }> = ({ reason }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    const roles: string[] = currentUser?.roles?.map((r: any) => (typeof r === 'string' ? r : r.code)) || [];
    if (roles.includes('ADMIN')) return '/admin';
    if (roles.includes('PARENT')) return '/parent/dashboard';
    if (roles.includes('TUTOR')) return '/tutor/dashboard';
    return '/';
  };

  const getDashboardLabel = () => {
    const roles: string[] = currentUser?.roles?.map((r: any) => (typeof r === 'string' ? r : r.code)) || [];
    if (roles.includes('ADMIN')) return 'Về trang Quản trị';
    if (roles.includes('PARENT')) return 'Về Bàn làm việc Phụ huynh';
    if (roles.includes('TUTOR')) return 'Về Bàn làm việc Gia sư';
    return 'Về trang chủ';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-sm border border-ink-200 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-danger-500 border border-rose-200 flex items-center justify-center mx-auto text-2xl font-bold">
          ✕
        </div>
        <h2 className="text-lg font-semibold text-ink-900 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-sm text-ink-500 leading-relaxed">{reason}</p>
        <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate(getDashboardPath())}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition cursor-pointer shadow-sm"
          >
            {getDashboardLabel()}
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2.5 text-xs font-semibold text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-xl transition cursor-pointer"
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// KHAI BÁO TOÀN BỘ CÂY ĐỊNH TUYẾN (APP ROUTES)
// ============================================================================
export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ===================================================================
            1. PHÂN HỆ KHÁM PHÁ CÔNG KHAI (Public / Sàn Superprof-style)
        =================================================================== */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* Tìm kiếm & Hồ sơ gia sư kiểu Superprof */}
        <Route path="/tutors" element={<PublicTutorSearchPage />} />
        <Route path="/tutors/:id" element={<PublicTutorDetailPage />} />

        {/* [FUTURE] Diễn đàn cộng đồng
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/:id" element={<ForumDetailPage />} />
        */}

        {/* Đăng ký & Đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        {/* [FUTURE] <Route path="/staff/login" element={<StaffLogin />} /> */}
        <Route path="/register/parent" element={<ParentRegisterPage />} />
        <Route path="/register/tutor" element={<Navigate to="/apply" replace />} />
        <Route path="/apply" element={<TutorApplyPage />} />

        {/* Thông tin cá nhân & Đổi mật khẩu cho người dùng đã đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>

        {/* ===================================================================
            2. PHÂN HỆ TUYỂN DỤNG & PHÒNG THI ONLINE CHO GIA SƯ
        =================================================================== */}
        <Route path="/apply/tests" element={<TutorTestsPage />} />
        <Route path="/apply/tests/:attemptId" element={<TutorExamRoomPage />} />

        {/* ===================================================================
            3. BÀN LÀM VIỆC DÀNH CHO GIA SƯ CHÍNH THỨC (TUTOR PORTAL)
        =================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={['TUTOR']} />}>
          <Route path="/tutor" element={<TutorLayout />}>
            <Route index element={<Navigate to="/tutor/dashboard" replace />} />
            <Route path="dashboard" element={<TutorDashboard />} />
            {/* [FUTURE] <Route path="board" element={<TutorOpenBoardPage />} /> */}
            <Route path="offers" element={<TutorOffersInboxPage />} />
            <Route path="classes" element={<TutorClassesPage />} />
            <Route path="classes/:id" element={<TutorClassDetailPage />} />
            <Route path="lessons/:lessonId/report" element={<LessonReportSubmitPage />} />
            {/* [FUTURE] <Route path="tasks" element={<TutorTasksManagerPage />} /> */}
          </Route>
        </Route>

        {/* ===================================================================
            4. PHÂN HỆ DÀNH CHO PHỤ HUYNH (PARENT PORTAL)
        =================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
          <Route path="/parent" element={<ParentLayout />}>
            <Route index element={<Navigate to="/parent/dashboard" replace />} />
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="children" element={<ParentChildrenPage />} />
            <Route path="requests" element={<ParentRequestsHistoryPage />} />
            <Route path="requests/new" element={<CreateClassRequestPage />} />
            <Route path="reports" element={<LessonReportsParentPage />} />
            <Route path="reports/:id" element={<LessonReportParentDetailPage />} />
            <Route path="schedule" element={<ParentSchedulePage />} />
          </Route>
        </Route>

        {/* [FUTURE] ===================================================================
            5. GÓC HỌC TẬP CỦA BÉ (KIDS PORTAL - PHIÊN BẢN HỌC SINH AN TOÀN)
        ===================================================================
        <Route element={<ProtectedRoute requireKidsMode={true} allowedRoles={['STUDENT']} />}>
          <Route path="/kids">
            <Route index element={<KidsTodayTasksPage />} />
            <Route path="tasks/:id" element={<KidsSubmitTaskPage />} />
            <Route path="games" element={<KidsGamesHubPage />} />
            <Route path="games/:code" element={<KidsGamePlayPage />} />
            <Route path="trophy" element={<KidsTrophyPage />} />
          </Route>
        </Route>
        */}

        {/* ===================================================================
            6. TRUNG TÂM ĐIỀU HÀNH & QUẢN TRỊ VIÊN (ADMIN / STAFF PORTAL)
        =================================================================== */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                'ADMIN',
                'STAFF_RECRUIT',
                'STAFF_MATCHING',
                'STAFF_CS',
                'STAFF_TUTOR_CARE',
                'STAFF_ACADEMIC',
                'DEPT_MANAGER',
              ]}
            />
          }
        >
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminDashboardHome />} />

            {/* Phân hệ Tuyển dụng & Thẩm định */}
            <Route path="recruit" element={<AdminRecruitKanban />} />
            <Route path="recruit/grade/:attemptId" element={<AdminGradeAttemptPage />} />

            {/* Phân hệ Điều phối, Offer song song & Lớp học */}
            <Route path="matching" element={<AdminMatchingQueue />} />
            <Route path="matching/classes" element={<AdminClassesManager />} />

            {/* Phân hệ CSKH (Xử lý trễ 24-48h, Gọi điện xác nhận thay) */}
            <Route path="care" element={<AdminCareCases />} />

            {/* [FUTURE] Phân hệ Học thuật & Ngân hàng đề thi
            <Route path="academic" element={<AdminAcademicManager />} />
            */}

            {/* [FUTURE] Kiểm duyệt diễn đàn
            <Route path="forum-mod" element={<AdminForumMod />} />
            */}

            {/* Quản trị hệ thống, RBAC & CSDL */}
            <Route path="system">
              <Route path="users" element={<AdminUsers />} />
              {/* [FUTURE] <Route path="departments" element={<AdminDepartments />} /> */}
              {/* [FUTURE] <Route path="database" element={<DatabaseBrowser />} /> */}
              {/* [FUTURE] <Route path="audit-logs" element={<AdminAuditLogs />} /> */}
              {/* [FUTURE] <Route path="sessions" element={<AdminSessions />} /> */}
            </Route>
          </Route>
        </Route>

        {/* [FUTURE] ===================================================================
            7. CÁC PHÂN HỆ CHUYÊN TRÁCH 6 BỘ PHẬN NHÂN SỰ (STAFF PORTALS)
        ===================================================================
        <Route path="/staff" element={<Navigate to="/staff/recruit" replace />} />

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF_RECRUIT']} />}>
          <Route path="/staff/recruit" element={<StaffLayout />}>
            <Route index element={<AdminRecruitKanban />} />
            <Route path="grade/:attemptId" element={<AdminGradeAttemptPage />} />
            <Route path="grades" element={<AdminGradeAttemptPage />} />
            <Route path="candidates" element={<AdminRecruitKanban />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF_MATCHING']} />}>
          <Route path="/staff/matching" element={<StaffLayout />}>
            <Route index element={<AdminMatchingQueue />} />
            <Route path="classes" element={<AdminClassesManager />} />
            <Route path="pending-classes" element={<AdminClassesManager />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF_CS']} />}>
          <Route path="/staff/care" element={<StaffLayout />}>
            <Route index element={<AdminCareCases />} />
            <Route path="unconfirmed" element={<AdminCareCases />} />
            <Route path="contacts" element={<AdminCareCases />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF_TUTOR_CARE']} />}>
          <Route path="/staff/tutor-care" element={<StaffLayout />}>
            <Route index element={<AdminCareCases />} />
            <Route path="overdue" element={<AdminCareCases />} />
            <Route path="violations" element={<AdminCareCases />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF_ACADEMIC']} />}>
          <Route path="/staff/academic" element={<StaffLayout />}>
            <Route index element={<AdminAcademicManager />} />
            <Route path="games" element={<AdminAcademicManager />} />
            <Route path="cases" element={<AdminCareCases />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF_FORUM']} />}>
          <Route path="/staff/forum" element={<StaffLayout />}>
            <Route index element={<AdminForumMod />} />
            <Route path="flags" element={<AdminForumMod />} />
            <Route path="banned" element={<AdminUsers />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
        */}

        {/* ===================================================================
            FALLBACK: BẤT KỲ ĐƯỜNG DẪN NÀO KHÔNG KHỚP → ĐẨY VỀ TRANG CHỦ
        =================================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
