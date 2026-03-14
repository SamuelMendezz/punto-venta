import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export type StaffRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  photoUrl?: string;
  active: boolean;
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  staffUser: StaffUser | null;
  isAuthReady: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setStaffUser: (user: StaffUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  logoutStaff: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  staffUser: null,
  isAuthReady: false,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setStaffUser: (user) => set({ staffUser: user }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  logoutStaff: () => set({ staffUser: null }),
}));
