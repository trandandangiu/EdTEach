import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

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

export interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  login: (email: string, role?: string) => Promise<boolean>;
  logout: () => void;
  switchUserRole: (roleKey: 'PUBLIC' | 'PARENT' | 'TUTOR' | 'STUDENT' | 'ADMIN' | 'APPLICANT' | 'STAFF') => void;
  addKidStars: (count: number) => void;
}

const PRESET_USERS: Record<string, AuthUser> = {
  ADMIN: {
    id: 'usr-admin-01',
    name: 'Quản Trị Viên Hệ Thống',
    email: 'admin@viettutor.edu.vn',
    phone: '0988 999 999',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    roles: ['ADMIN'],
    permissions: ['ALL_PERMISSIONS', 'MANAGE_USERS', 'MANAGE_RECRUIT', 'MANAGE_CLASSES', 'MANAGE_FINANCE'],
    actorType: 'ADMIN',
  },
  PARENT: {
    id: 'usr-parent-01',
    name: 'Chị Mai Anh',
    email: 'maianh.nguyen@gmail.com',
    phone: '0988 123 456',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    roles: ['PARENT'],
    permissions: ['VIEW_CHILDREN', 'CREATE_CLASS_REQUEST', 'VIEW_REPORTS', 'MAKE_PAYMENT'],
    actorType: 'PARENT',
  },
  STUDENT: {
    id: 'usr-student-01',
    name: 'Bé Bảo Nam (Lớp 4)',
    email: 'nam.baobao@student.viettutor.vn',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1595454223600-91fb57999718?auto=format&fit=crop&w=150&q=80',
    roles: ['STUDENT'],
    permissions: ['DO_HOMEWORK', 'PLAY_GAMES', 'VIEW_TROPHY'],
    actorType: 'STUDENT',
    kidProfile: {
      id: 'kid-01',
      name: 'Bảo Nam',
      grade: 'Lớp 4',
      stars: 185,
      gems: 42,
      level: 5,
      streakDays: 7,
      avatar: '🦁',
    },
  },
  TUTOR: {
    id: 'usr-tutor-01',
    name: 'ThS. Nguyễn Hoàng Nam',
    email: 'hoangnam.math@viettutor.edu.vn',
    phone: '0912 888 777',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    roles: ['TUTOR'],
    permissions: ['RECEIVE_OFFERS', 'SUBMIT_REPORT', 'VIEW_ASSIGNED_CLASSES', 'CREATE_TASKS'],
    actorType: 'TUTOR',
  },
  APPLICANT: {
    id: 'usr-applicant-01',
    name: 'Trần Thị Thu Trang',
    email: 'thutrang.pedagogy@gmail.com',
    phone: '0971 888 234',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    roles: ['APPLICANT'],
    permissions: ['TAKE_EXAM', 'SUBMIT_PROFILE'],
    actorType: 'USER',
  },
  STAFF: {
    id: 'usr-staff-01',
    name: 'Lê Thanh Bình (Điều Phối Viên)',
    email: 'binh.matching@viettutor.edu.vn',
    phone: '0903 444 333',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    roles: ['STAFF_MATCHING', 'STAFF_CARE', 'STAFF_RECRUIT'],
    permissions: ['DISPATCH_OFFERS', 'HANDLE_CARE_CASES', 'REVIEW_EXAMS'],
    actorType: 'ADMIN',
  },
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  switchUserRole: () => {},
  addKidStars: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to PARENT so user lands on a fully populated interactive state immediately
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('viettutor_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return PRESET_USERS.PARENT;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Restore session from API if token exists or auto-login default demo user
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('viettutor_token') || localStorage.getItem('auth_token');
    if (token) {
      api.auth.getMe().then((res: any) => {
        if (res?.user) {
          const u = res.user;
          const mappedRole = u.roles?.[0] || 'PARENT';
          const deptCode = u.department?.code || (u.roles?.includes('ADMIN') ? 'ALL' : '');
          if (deptCode) {
            localStorage.setItem('viettutor_staff_dept', deptCode);
          }

          const authUser: AuthUser = {
            id: u.id,
            name: u.fullName || u.username || 'Người dùng',
            email: u.email || '',
            phone: u.phone || '',
            avatar: u.avatar || PRESET_USERS[mappedRole]?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            roles: u.roles || [mappedRole],
            permissions: u.permissions || [],
            actorType: u.roles?.includes('ADMIN') ? 'ADMIN' : (u.roles?.some((r: string) => r.startsWith('STAFF_')) ? 'STAFF' : (u.roles?.includes('TUTOR') ? 'TUTOR' : u.roles?.includes('STUDENT') ? 'STUDENT' : 'PARENT')),
            departmentId: u.departmentId,
            departmentCode: u.department?.code,
            kidProfile: u.studentProfile || (mappedRole === 'STUDENT' ? PRESET_USERS.STUDENT.kidProfile : undefined),
          };
          setCurrentUser(authUser);
        }
      }).catch(() => {
        // Token invalid or offline, keep current state
      });
    } else {
      // Auto-login default parent account in the background for live API demo
      api.auth.login('parent_maianh', 'password123').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('viettutor_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('viettutor_current_user');
    }
  }, [currentUser]);

  const login = async (email: string, roleOrPassword?: string): Promise<boolean> => {
    setIsLoading(true);
    const targetKey = (roleOrPassword && PRESET_USERS[roleOrPassword.toUpperCase()]) 
      ? roleOrPassword.toUpperCase() 
      : 'PARENT';

    try {
      // Attempt backend login first
      const res: any = await api.auth.login(email, roleOrPassword || 'password123');
      if (res?.user && res?.token) {
        const u = res.user;
        const mappedRole = u.roles?.[0] || targetKey;
        const deptCode = u.department?.code || (u.roles?.includes('ADMIN') ? 'ALL' : '');
        if (deptCode) {
          localStorage.setItem('viettutor_staff_dept', deptCode);
        } else {
          localStorage.removeItem('viettutor_staff_dept');
        }

        const authUser: AuthUser = {
          id: u.id,
          name: u.fullName || u.username || email,
          email: u.email || email,
          phone: u.phone || '',
          avatar: u.avatar || PRESET_USERS[mappedRole]?.avatar || '',
          roles: u.roles || [mappedRole],
          permissions: u.permissions || [],
          actorType: u.roles?.includes('ADMIN') ? 'ADMIN' : (u.roles?.some((r: string) => r.startsWith('STAFF_')) ? 'STAFF' : (u.roles?.includes('TUTOR') ? 'TUTOR' : u.roles?.includes('STUDENT') ? 'STUDENT' : 'PARENT')),
          departmentId: u.departmentId,
          departmentCode: u.department?.code,
          kidProfile: u.studentProfile || (mappedRole === 'STUDENT' ? PRESET_USERS.STUDENT.kidProfile : undefined),
        };
        setCurrentUser(authUser);
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.warn('Backend login fallback to preset:', err);
    }

    // Fallback to preset
    const found = PRESET_USERS[targetKey] || PRESET_USERS.PARENT;
    setCurrentUser(found);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('viettutor_staff_dept');
    api.auth.logout();
    setCurrentUser(null);
  };

  const switchUserRole = async (roleKey: 'PUBLIC' | 'PARENT' | 'TUTOR' | 'STUDENT' | 'ADMIN' | 'APPLICANT' | 'STAFF') => {
    if (roleKey === 'PUBLIC') {
      api.auth.logout();
      setCurrentUser(null);
      return;
    }

    // Cập nhật UI ngay lập tức
    setCurrentUser(PRESET_USERS[roleKey] || PRESET_USERS.PARENT);

    // Đồng bộ JWT token thật từ backend cho role tương ứng
    const credentialsMap: Record<string, { u: string; p: string }> = {
      PARENT: { u: 'parent_maianh', p: 'password123' },
      TUTOR: { u: 'tutor_hoangnam', p: 'password123' },
      ADMIN: { u: 'admin', p: 'password123' },
      STAFF: { u: 'admin', p: 'password123' },
      STUDENT: { u: 'student_baonam', p: 'password123' },
    };

    const cred = credentialsMap[roleKey];
    if (cred) {
      try {
        await api.auth.login(cred.u, cred.p);
      } catch {
        // Dự phòng mật khẩu thứ 2
        try {
          await api.auth.login(cred.u, 'password123');
        } catch {
          // ignore
        }
      }
    }
  };

  const addKidStars = (count: number) => {
    if (currentUser?.kidProfile) {
      setCurrentUser({
        ...currentUser,
        kidProfile: {
          ...currentUser.kidProfile,
          stars: currentUser.kidProfile.stars + count,
        },
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
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
