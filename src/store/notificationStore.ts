import { create } from 'zustand';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserRole } from '@/types';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  roles: UserRole[];
}

interface NotificationState {
  notifications: Notification[];
  unsubscribe: (() => void) | null;
  listenForRole: (role: UserRole) => () => void;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: (role: UserRole) => void;
  removeNotification: (id: string) => void;
  clearAll: (role: UserRole) => void;
  getForRole: (role: UserRole) => Notification[];
  unreadCountForRole: (role: UserRole) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unsubscribe: null,

  listenForRole: (role: UserRole) => {
    // Unsubscribe previous listener
    const prev = get().unsubscribe;
    if (prev) prev();

    const q = query(
      collection(db, 'notifications'),
      where('roles', 'array-contains', role),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
          read: data.read ?? false,
          roles: data.roles ?? [],
        };
      });
      set({ notifications: notifs });
    }, (error) => {
      console.error('Notification listener error:', error);
    });

    set({ unsubscribe: unsub });
    return unsub;
  },

  addNotification: async (n) => {
    await addDoc(collection(db, 'notifications'), {
      ...n,
      timestamp: Timestamp.now(),
      read: false,
    });
  },

  markAsRead: async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  },

  markAllAsRead: async (role) => {
    const notifs = get().notifications.filter((n) => n.roles.includes(role) && !n.read);
    const batch = writeBatch(db);
    notifs.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }));
    try {
      await batch.commit();
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  },

  removeNotification: async (id) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error('Failed to remove notification:', e);
    }
  },

  clearAll: async (role) => {
    const notifs = get().notifications.filter((n) => n.roles.includes(role));
    const batch = writeBatch(db);
    notifs.forEach((n) => batch.delete(doc(db, 'notifications', n.id)));
    try {
      await batch.commit();
    } catch (e) {
      console.error('Failed to clear all:', e);
    }
  },

  getForRole: (role) => get().notifications.filter((n) => n.roles.includes(role)),

  unreadCountForRole: (role) =>
    get().notifications.filter((n) => n.roles.includes(role) && !n.read).length,
}));
