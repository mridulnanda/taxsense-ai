import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, OccupationType } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    set({ token });
    if (token) {
      SecureStore.setItemAsync('authToken', token).catch(console.error);
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  logout: async () => {
    await SecureStore.deleteItemAsync('authToken').catch(console.error);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreToken: async () => {
    try {
      set({ isLoading: true });
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        set({ token, isAuthenticated: true });
      }
    } catch (error) {
      set({ error: 'Failed to restore token' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
}));
