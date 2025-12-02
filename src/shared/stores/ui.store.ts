/**
 * UI Store
 * Zustand store for UI state (modals, notifications, etc.)
 * Single Responsibility: Manages global UI state
 */

import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Modal state
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;

  // Notification state
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Modal state
  modals: {},
  openModal: (id: string) =>
    set((state) => ({
      modals: { ...state.modals, [id]: true },
    })),
  closeModal: (id: string) =>
    set((state) => {
      const { [id]: _, ...rest } = state.modals;
      return { modals: rest };
    }),
  isModalOpen: (id: string) => get().modals[id] ?? false,

  // Notification state
  notifications: [],
  addNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration
    if (newNotification.duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },
  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Sidebar state
  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

