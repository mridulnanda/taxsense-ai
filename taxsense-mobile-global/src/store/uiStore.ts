import { create } from 'zustand';
import { Notification } from '@types/index';

interface UIState {
  notifications: Notification[];
  isLoading: boolean;
  isDarkMode: boolean;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  showBottomSheet: boolean;
  bottomSheetContent: string | null;
  activeTab: string;
  scrollPosition: Record<string, number>;
  sideMenuOpen: boolean;
}

interface UIActions {
  // Notifications
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;

  // Loading
  setLoading: (loading: boolean) => void;

  // Theme
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  // Language
  setLanguage: (lang: string) => void;

  // Font Size
  setFontSize: (size: 'small' | 'medium' | 'large') => void;

  // Bottom Sheet
  showBottomSheet: (content: string) => void;
  hideBottomSheet: () => void;

  // Navigation
  setActiveTab: (tab: string) => void;
  setScrollPosition: (key: string, position: number) => void;

  // Side Menu
  setSideMenuOpen: (open: boolean) => void;
  toggleSideMenu: () => void;

  // Reset
  reset: () => void;
}

const initialState: UIState = {
  notifications: [],
  isLoading: false,
  isDarkMode: false,
  language: 'en',
  fontSize: 'medium',
  showBottomSheet: false,
  bottomSheetContent: null,
  activeTab: 'home',
  scrollPosition: {},
  sideMenuOpen: false,
};

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  ...initialState,

  addNotification: (notification) => {
    const { notifications } = get();
    set({ notifications: [notification, ...notifications] });
  },

  removeNotification: (id) => {
    const { notifications } = get();
    set({ notifications: notifications.filter((n) => n.id !== id) });
  },

  clearNotifications: () => set({ notifications: [] }),

  markNotificationAsRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({ notifications: updated });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setDarkMode: (isDarkMode) => set({ isDarkMode }),

  toggleDarkMode: () => {
    const { isDarkMode } = get();
    set({ isDarkMode: !isDarkMode });
  },

  setLanguage: (language) => set({ language }),

  setFontSize: (fontSize) => set({ fontSize }),

  showBottomSheet: (content) =>
    set({ showBottomSheet: true, bottomSheetContent: content }),

  hideBottomSheet: () =>
    set({ showBottomSheet: false, bottomSheetContent: null }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setScrollPosition: (key, position) => {
    const { scrollPosition } = get();
    set({ scrollPosition: { ...scrollPosition, [key]: position } });
  },

  setSideMenuOpen: (sideMenuOpen) => set({ sideMenuOpen }),

  toggleSideMenu: () => {
    const { sideMenuOpen } = get();
    set({ sideMenuOpen: !sideMenuOpen });
  },

  reset: () => set(initialState),
}));
