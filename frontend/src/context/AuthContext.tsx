// frontend/src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  api,
  setUnauthorizedHandler,
  hasToken,
  clearToken,
  ApiError,
} from '../services/api';

// ============================================================
// TYPES
// ============================================================
export interface UserRole {
  code: string;
  name: string;
}

export interface KidProfile {
  id: string;
  name: string;
  grade: string;
  stars: number;
  gems: number;
  level: number;
  streakDays: number;
  avatar: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  roles: string[];
  permissions: string[];
  actorType: 'USER' | 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN' | 'STAFF';
  departmentId?: string;
  departmentCode?: string;
  kidProfile?: KidProfile;
}

export type RoleKey =
  | 'PUBLIC'
  | 'PARENT'
  | 'TUTOR'
  | 'STUDENT'
  | 'ADMIN'
  | 'APPLICANT'
  | 'STAFF';

export interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  /** true khi bootstrap auth (kiểm tra token + getMe) đã xong */
  isBootstrapped: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
  /** Demo dev toolbar — trả về true nếu đăng nhập thành công */
  switchUserRole: (roleKey: RoleKey) => Promise<boolean>;
  addKidStars: (count: number) => void;
}

// ============================================================
// HELPERS
// ============================================================
const STAFF_DEPT_KEY = 'viettutor_staff_dept';
const CURRENT_USER_KEY = 'viettutor_current_user';

const DEFAULT_AVATARS: Record<string, string> = {
  ADMIN:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  STAFF:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  TUTOR:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  PARENT:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  STUDENT:
    'https://images.unsplash.com/photo-1595454223600-91fb57999718?auto=format&fit=crop&w=150&q=80',
  USER:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
};

const extractRoleCodes = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((r: any) => {
        if (typeof r === 'string') return r;
        if (r && typeof r === 'object') return r.code || r.name || '';
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string') return [raw];
  if (typeof raw === 'object' && (raw.code || raw.name)) return [raw.code || raw.name];
  return [];
};

/** Chỉ map API user → AuthUser, trích xuất chính xác roles từ mọi cấu trúc API */
const mapApiUserToAuthUser = (u: any, topLevelRoles?: any, topLevelPerms?: any): AuthUser => {
  let roles = extractRoleCodes(topLevelRoles);
  if (roles.length === 0) roles = extractRoleCodes(u.roles);
  if (roles.length === 0 && Array.isArray(u.userRoles)) {
    roles = extractRoleCodes(u.userRoles.map((ur: any) => ur.role));
  }
  if (roles.length === 0 && u.role) {
    roles = extractRoleCodes(u.role);
  }
  if (roles.length === 0 && u.userType) {
    roles = [u.userType];
  }

  let actorType: AuthUser['actorType'] = 'USER';
  if (roles.includes('ADMIN')) actorType = 'ADMIN';
  else if (roles.some((r) => r.startsWith('STAFF_'))) actorType = 'STAFF';
  else if (roles.includes('TUTOR')) actorType = 'TUTOR';
  else if (roles.includes('STUDENT')) actorType = 'STUDENT';
  else if (roles.includes('PARENT')) actorType = 'PARENT';
  else if (u.userType === 'STAFF') actorType = 'STAFF';
  else if (u.userType === 'PARENT') actorType = 'PARENT';
  else if (u.userType === 'TUTOR') actorType = 'TUTOR';
  else if (u.userType === 'STUDENT') actorType = 'STUDENT';

  const permissions = Array.isArray(topLevelPerms)
    ? topLevelPerms
    : (Array.isArray(u.permissions) ? u.permissions : []);

  const fallbackAvatar = DEFAULT_AVATARS[actorType] || DEFAULT_AVATARS.USER;

  return {
    id: String(u.id),
    name: u.fullName || u.username || 'Người dùng',
    email: u.email || '',
    phone: u.phone || '',
    avatar: u.avatarUrl || u.avatar || fallbackAvatar,
    roles,
    permissions,
    actorType,
    departmentId: u.departmentId,
    departmentCode: u.department?.code,
    kidProfile: u.studentProfile || undefined,
  };
};

// Credentials cho dev toolbar — map theo seed data backend
const ROLE_CREDENTIALS: Record<
  Exclude<RoleKey, 'PUBLIC'>,
  { u: string; p: string }
> = {
  PARENT: { u: 'parent_maianh', p: 'password123' },
  TUTOR: { u: 'tutor_hoangnam', p: 'password123' },
  ADMIN: { u: 'admin', p: 'Password@2026' },
  STAFF: { u: 'staff_recruit', p: 'Password@2026' },
  STUDENT: { u: 'student_baonam', p: 'password123' },
  APPLICANT: { u: 'thutrang', p: 'password123' },
};

// ============================================================
// CONTEXT
// ============================================================
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  isBootstrapped: false,
  login: async () => null,
  logout: () => {},
  switchUserRole: async () => false,
  addKidStars: () => {},
});

// ============================================================
// PROVIDER
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const bootstrapRan = useRef(false);

  // ------------------------------------------------------------
  // 1. Đăng ký 401 handler — chạy 1 lần khi mount
  // ------------------------------------------------------------
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // api.ts đã clearToken() trước khi gọi handler này rồi
      setCurrentUser(null);
      // Không redirect thủ công — ProtectedRoute sẽ tự đá về /login
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // ------------------------------------------------------------
  // 2. Bootstrap — verify token với backend TRƯỚC khi tin user
  // ------------------------------------------------------------
  useEffect(() => {
    if (bootstrapRan.current) return;
    bootstrapRan.current = true;

    let cancelled = false;

    async function bootstrap() {
      // Không có token → khách vãng lai
      if (!hasToken()) {
        if (!cancelled) {
          setCurrentUser(null);
          setIsLoading(false);
          setIsBootstrapped(true);
        }
        return;
      }

      try {
        const res: any = await api.auth.getMe();
        if (cancelled) return;

        if (res?.user) {
          const authUser = mapApiUserToAuthUser(res.user, res.roles, res.permissions);
          if (authUser.departmentCode) {
            localStorage.setItem(STAFF_DEPT_KEY, authUser.departmentCode);
          } else {
            localStorage.removeItem(STAFF_DEPT_KEY);
          }
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
          setCurrentUser(authUser);
        } else {
          // Token hợp lệ nhưng backend không trả user → coi như khách
          clearToken();
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }
      } catch (err) {
        if (!cancelled) {
          // Token hết hạn / invalid → api.ts đã clearToken rồi (nếu 401)
          // Nếu network error → cũng clear để an toàn
          if (err instanceof ApiError && err.status !== 401) {
            console.warn('[AuthContext] Bootstrap network error:', err.message);
          }
          clearToken();
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsBootstrapped(true);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------------------
  // 3. login() — chỉ set currentUser khi có token thật
  // ------------------------------------------------------------
  const login = useCallback(
    async (identifier: string, password: string): Promise<AuthUser | null> => {
      setIsLoading(true);
      try {
        const res: any = await api.auth.login(identifier, password);

        if (res?.user && res?.token) {
          const authUser = mapApiUserToAuthUser(res.user, res.roles, res.permissions);
          if (authUser.departmentCode) {
            localStorage.setItem(STAFF_DEPT_KEY, authUser.departmentCode);
          } else {
            localStorage.removeItem(STAFF_DEPT_KEY);
          }
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
          setCurrentUser(authUser);
          return authUser;
        }

        return null;
      } catch (err) {
        console.warn('[AuthContext] Login failed:', err);
        clearToken();
        localStorage.removeItem(CURRENT_USER_KEY);
        setCurrentUser(null);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ------------------------------------------------------------
  // 4. logout()
  // ------------------------------------------------------------
  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(STAFF_DEPT_KEY);
    api.auth.logout().catch(() => {});
    setCurrentUser(null);
  }, []);

  // ------------------------------------------------------------
  // 5. switchUserRole — dev toolbar, KHÔNG fallback preset
  // ------------------------------------------------------------
  const switchUserRole = useCallback(
    async (roleKey: RoleKey): Promise<boolean> => {
      if (roleKey === 'PUBLIC') {
        api.auth.logout().catch(() => {});
        clearToken();
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(STAFF_DEPT_KEY);
        setCurrentUser(null);
        return true;
      }

      const cred = ROLE_CREDENTIALS[roleKey];
      if (!cred) return false;

      setIsLoading(true);
      try {
        let res: any;
        try {
          res = await api.auth.login(cred.u, cred.p);
        } catch {
          // Thử mật khẩu phụ
          res = await api.auth.login(cred.u, 'password123');
        }

        if (res?.user && res?.token) {
          const authUser = mapApiUserToAuthUser(res.user, res.roles, res.permissions);
          if (authUser.departmentCode) {
            localStorage.setItem(STAFF_DEPT_KEY, authUser.departmentCode);
          } else {
            localStorage.removeItem(STAFF_DEPT_KEY);
          }
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
          setCurrentUser(authUser);
          return true;
        }
        return false;
      } catch (err) {
        console.warn(`[AuthContext] switchUserRole(${roleKey}) failed:`, err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ------------------------------------------------------------
  // 6. addKidStars
  // ------------------------------------------------------------
  const addKidStars = useCallback((count: number) => {
    setCurrentUser((prev) => {
      if (!prev?.kidProfile) return prev;
      return {
        ...prev,
        kidProfile: {
          ...prev.kidProfile,
          stars: prev.kidProfile.stars + count,
        },
      };
    });
  }, []);

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isBootstrapped,
        login,
        logout,
        switchUserRole,
        addKidStars,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);