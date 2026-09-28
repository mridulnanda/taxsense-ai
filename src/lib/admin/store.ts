/**
 * Admin Dashboard Zustand Store
 * Global state management for admin dashboard
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  AdminUser,
  DashboardMetrics,
  Alert,
  AlertRule,
  NotificationPreference,
} from "./types";

interface AdminStore {
  // ========================================
  // User & Auth State
  // ========================================
  currentUser: AdminUser | null;
  setCurrentUser: (user: AdminUser | null) => void;

  // ========================================
  // Dashboard State
  // ========================================
  metrics: DashboardMetrics | null;
  setMetrics: (metrics: DashboardMetrics) => void;
  isLoadingMetrics: boolean;
  setLoadingMetrics: (loading: boolean) => void;

  // ========================================
  // Real-time State
  // ========================================
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;

  // ========================================
  // Alerts & Notifications
  // ========================================
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;

  alertRules: AlertRule[];
  setAlertRules: (rules: AlertRule[]) => void;

  notificationPreferences: NotificationPreference | null;
  setNotificationPreferences: (prefs: NotificationPreference) => void;

  // ========================================
  // UI State
  // ========================================
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  selectedFilters: Record<string, any>;
  setSelectedFilters: (filters: Record<string, any>) => void;

  dateRange: {
    start: Date;
    end: Date;
  };
  setDateRange: (start: Date, end: Date) => void;

  // ========================================
  // Data Cache
  // ========================================
  cachedData: Record<string, any>;
  setCachedData: (key: string, data: any) => void;
  clearCache: () => void;

  // ========================================
  // Reset
  // ========================================
  reset: () => void;
}

const initialDateRange = {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  end: new Date(),
};

export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set) => ({
        // User & Auth
        currentUser: null,
        setCurrentUser: (user) => set({ currentUser: user }),

        // Dashboard
        metrics: null,
        setMetrics: (metrics) => set({ metrics }),
        isLoadingMetrics: false,
        setLoadingMetrics: (loading) => set({ isLoadingMetrics: loading }),

        // Real-time
        isConnected: false,
        setConnected: (connected) => set({ isConnected: connected }),
        connectionError: null,
        setConnectionError: (error) => set({ connectionError: error }),

        // Alerts
        alerts: [],
        addAlert: (alert) =>
          set((state) => ({
            alerts: [alert, ...state.alerts].slice(0, 50), // Keep only last 50
          })),
        removeAlert: (alertId) =>
          set((state) => ({
            alerts: state.alerts.filter((a) => a.id !== alertId),
          })),
        acknowledgeAlert: (alertId) =>
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.id === alertId
                ? { ...a, status: "acknowledged" as const }
                : a
            ),
          })),
        clearAlerts: () => set({ alerts: [] }),

        alertRules: [],
        setAlertRules: (rules) => set({ alertRules: rules }),

        notificationPreferences: null,
        setNotificationPreferences: (prefs) =>
          set({ notificationPreferences: prefs }),

        // UI
        sidebarOpen: true,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        activeTab: "overview",
        setActiveTab: (tab) => set({ activeTab: tab }),

        selectedFilters: {},
        setSelectedFilters: (filters) => set({ selectedFilters: filters }),

        dateRange: initialDateRange,
        setDateRange: (start, end) => set({ dateRange: { start, end } }),

        // Cache
        cachedData: {},
        setCachedData: (key, data) =>
          set((state) => ({
            cachedData: { ...state.cachedData, [key]: data },
          })),
        clearCache: () => set({ cachedData: {} }),

        // Reset
        reset: () =>
          set({
            currentUser: null,
            metrics: null,
            isLoadingMetrics: false,
            isConnected: false,
            connectionError: null,
            alerts: [],
            alertRules: [],
            notificationPreferences: null,
            sidebarOpen: true,
            activeTab: "overview",
            selectedFilters: {},
            dateRange: initialDateRange,
            cachedData: {},
          }),
      }),
      {
        name: "admin-store",
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
          selectedFilters: state.selectedFilters,
          dateRange: state.dateRange,
          notificationPreferences: state.notificationPreferences,
        }),
      }
    )
  )
);
