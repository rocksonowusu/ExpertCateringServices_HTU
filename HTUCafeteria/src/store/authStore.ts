import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  studentId?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, markOnboarded?: boolean) => Promise<{ success: boolean }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setHasSeenOnboarding: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const mockUsers = [
  {
    id: '1',
    name: 'Kwesi Mensah',
    email: 'student@htu.edu.gh',
    password: 'password123',
    phone: '0241234567',
    isAdmin: false,
    studentId: 'HTU/CS/2021/001',
    department: 'Computer Science',
  },
  {
    id: '2',
    name: 'Ama Boateng',
    email: 'ama@htu.edu.gh',
    password: 'password123',
    phone: '0551234567',
    isAdmin: false,
    studentId: 'HTU/BUS/2022/045',
    department: 'Business Administration',
  },
  {
    id: '3',
    name: 'Cafeteria Admin',
    email: 'admin@htu.edu.gh',
    password: 'admin123',
    phone: '0209876543',
    isAdmin: true,
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hasSeenOnboarding: false,
  isLoading: false,

  loginWithEmail: async (email, markOnboarded) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.isAdmin);
    const userData = found
      ? (({ password: _pw, ...rest }) => rest)(found)
      : (() => {
          const namePart = email.split('@')[0];
          const name = namePart.split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return { id: `u_${Date.now()}`, name, email, phone: '', isAdmin: false };
        })();
    set({ user: userData, isLoading: false, ...(markOnboarded ? { hasSeenOnboarding: true } : {}) });
    return { success: true };
  },

  adminLogin: async (email, password) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1000));
    const found = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.isAdmin
    );
    if (found) {
      const { password: _pw, ...userData } = found;
      set({ user: userData, isLoading: false });
      return { success: true };
    }
    set({ isLoading: false });
    return { success: false, error: 'Invalid admin credentials.' };
  },

  logout: () => set({ user: null }),

  setHasSeenOnboarding: () => set({ hasSeenOnboarding: true }),

  updateProfile: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
}));
