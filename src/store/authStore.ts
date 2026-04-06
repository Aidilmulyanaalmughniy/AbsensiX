import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, updateDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, MaintenanceConfig, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializing: boolean;
  maintenance: MaintenanceConfig;
  allUsers: User[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setMaintenance: (config: MaintenanceConfig) => void;
  getAllUsers: () => User[];
  updateUser: (uid: string, data: Partial<User>) => void;
  resetPassword: (uid: string, newPassword: string) => void;
  addUser: (user: User & { password: string }) => void;
  deleteUser: (uid: string) => void;
  initAuth: () => () => void;
  fetchAllUsers: () => Promise<void>;
  listenMaintenance: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initializing: true,
  maintenance: { enabled: false, message: 'Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.' },
  allUsers: [],

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      // Find user doc by username
      const usersSnap = await getDocs(collection(db, 'users'));
      let userDoc: User | null = null;
      let userEmail = '';
      
      usersSnap.forEach(d => {
        const data = d.data();
        if (data.username === username) {
          userDoc = { uid: d.id, ...data } as User;
          userEmail = data.email || `${data.username}@absensix.local`;
        }
      });

      if (!userDoc) {
        set({ isLoading: false });
        return { success: false, error: 'Username tidak ditemukan' };
      }

      if (!(userDoc as User).enabled) {
        set({ isLoading: false });
        return { success: false, error: 'Akun dinonaktifkan. Hubungi administrator.' };
      }

      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, userEmail, password);
      set({ user: userDoc, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const msg = error?.code === 'auth/invalid-credential' 
        ? 'Username atau password salah'
        : error?.code === 'auth/too-many-requests'
        ? 'Terlalu banyak percobaan. Coba lagi nanti.'
        : 'Login gagal. Periksa koneksi internet.';
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, isAuthenticated: false });
  },

  initAuth: () => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userSnap.exists()) {
          const userData = { uid: userSnap.id, ...userSnap.data() } as User;
          set({ user: userData, isAuthenticated: true, initializing: false });
        } else {
          set({ user: null, isAuthenticated: false, initializing: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, initializing: false });
      }
    });
    return unsub;
  },

  setMaintenance: async (config) => {
    set({ maintenance: config });
    try {
      await setDoc(doc(db, 'config', 'maintenance'), config);
    } catch (e) {
      console.error('Failed to update maintenance config:', e);
    }
  },

  listenMaintenance: () => {
    const unsub = onSnapshot(doc(db, 'config', 'maintenance'), (snap) => {
      if (snap.exists()) {
        set({ maintenance: snap.data() as MaintenanceConfig });
      }
    });
    return unsub;
  },

  fetchAllUsers: async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users: User[] = [];
      snap.forEach(d => users.push({ uid: d.id, ...d.data() } as User));
      set({ allUsers: users });
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  },

  getAllUsers: () => get().allUsers,

  updateUser: async (uid, data) => {
    try {
      await updateDoc(doc(db, 'users', uid), data);
      set(state => ({
        allUsers: state.allUsers.map(u => u.uid === uid ? { ...u, ...data } : u)
      }));
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  },

  resetPassword: async (uid, newPassword) => {
    // Note: In Firebase, password reset requires Admin SDK or user re-auth
    // For now we store it as a field (not recommended for production)
    try {
      await updateDoc(doc(db, 'users', uid), { password_hint: newPassword });
    } catch (e) {
      console.error('Failed to reset password:', e);
    }
  },

  addUser: async (userData) => {
    try {
      const email = `${userData.username}@absensix.local`;
      const cred = await createUserWithEmailAndPassword(auth, email, userData.password);
      const { password: _, ...userWithoutPassword } = userData;
      const userToSave = {
        ...userWithoutPassword,
        uid: cred.user.uid,
        email,
      };
      await setDoc(doc(db, 'users', cred.user.uid), userToSave);
      set(state => ({
        allUsers: [...state.allUsers, { ...userToSave } as User]
      }));
    } catch (e: any) {
      console.error('Failed to add user:', e);
      throw e;
    }
  },

  deleteUser: async (uid) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      set(state => ({
        allUsers: state.allUsers.filter(u => u.uid !== uid)
      }));
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  },
}));
