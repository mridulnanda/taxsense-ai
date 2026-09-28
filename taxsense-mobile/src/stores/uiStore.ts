import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  showOfflineIndicator: boolean;
  syncInProgress: boolean;
  selectedFinancialYear: string;
  notificationCount: number;

  // Actions
  setDarkMode: (isDark: boolean) => void;
  setOfflineIndicator: (show: boolean) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setSelectedFinancialYear: (year: string) => void;
  setNotificationCount: (count: number) => void;
  incrementNotificationCount: () => void;
  decrementNotificationCount: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  showOfflineIndicator: false,
  syncInProgress: false,
  selectedFinancialYear: new Date().getFullYear().toString(),
  notificationCount: 0,

  setDarkMode: (isDark) => set({ isDarkMode: isDark }),

  setOfflineIndicator: (show) => set({ showOfflineIndicator: show }),

  setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),

  setSelectedFinancialYear: (year) => set({ selectedFinancialYear: year }),

  setNotificationCount: (count) => set({ notificationCount: count }),

  incrementNotificationCount: () =>
    set((state) => ({ notificationCount: state.notificationCount + 1 })),

  decrementNotificationCount: () =>
    set((state) => ({
      notificationCount: Math.max(0, state.notificationCount - 1),
    })),
}));
