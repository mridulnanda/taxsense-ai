import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.taxsense.ai';

const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  timeout: 10000,
});

// Add token to requests
authApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignUpData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  panNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OTPVerificationData {
  phone: string;
  otp: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    try {
      const response = await authApi.post('/signup', data);
      const { token, user } = response.data;

      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);

      return { token, user };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async login(data: LoginData) {
    try {
      const response = await authApi.post('/login', data);
      const { token, user } = response.data;

      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setAuthenticated(true);

      return { token, user };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async sendOTP(phone: string) {
    try {
      const response = await authApi.post('/send-otp', { phone });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async verifyOTP(data: OTPVerificationData) {
    try {
      const response = await authApi.post('/verify-otp', data);
      const { token, user } = response.data;

      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setAuthenticated(true);

      return { token, user };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async refreshToken() {
    try {
      const response = await authApi.post('/refresh-token');
      const { token } = response.data;

      useAuthStore.getState().setToken(token);

      return token;
    } catch (error) {
      // If refresh fails, logout user
      await this.logout();
      throw this.handleError(error);
    }
  },

  async logout() {
    try {
      await authApi.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await useAuthStore.getState().logout();
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await authApi.get('/me');
      const user = response.data;

      useAuthStore.getState().setUser(user);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateProfile(updates: Partial<User>) {
    try {
      const response = await authApi.put('/profile', updates);
      const user = response.data;

      useAuthStore.getState().updateUser(user);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async enableBiometric() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        throw new Error('Device does not support biometric authentication');
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        throw new Error('No biometric data enrolled on device');
      }

      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async authenticateWithBiometric() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Authenticate to access TaxSense',
      });

      return result.success;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async resetPassword(email: string) {
    try {
      const response = await authApi.post('/reset-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    try {
      const response = await authApi.post('/confirm-reset-password', {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An authentication error occurred';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  },
};
