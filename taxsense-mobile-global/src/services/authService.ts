import { apiClient } from '@api/client';
import { User, AuthToken } from '@types/index';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  country: string;
  taxpayerId: string;
}

export interface OTPVerificationRequest {
  phone: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  resetToken: string;
}

export const AuthService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<{ user: User; token: AuthToken }>(
      '/auth/login',
      credentials
    );
    return response;
  },

  /**
   * Sign up new user
   */
  async signup(data: SignupRequest) {
    const response = await apiClient.post<{ user: User; token: AuthToken }>(
      '/auth/signup',
      data
    );
    return response;
  },

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/send-otp',
      { phone }
    );
    return response;
  },

  /**
   * Verify OTP
   */
  async verifyOTP(data: OTPVerificationRequest) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/verify-otp',
      data
    );
    return response;
  },

  /**
   * Refresh auth token
   */
  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<{ token: AuthToken }>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    );
    return response;
  },

  /**
   * Logout user
   */
  async logout() {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/logout'
    );
    return response;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await apiClient.get<User>('/auth/me');
    return response;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>) {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/forgot-password',
      { email },
      { skipAuth: true }
    );
    return response;
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      data,
      { skipAuth: true }
    );
    return response;
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/verify-email',
      { token },
      { skipAuth: true }
    );
    return response;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/change-password',
      { currentPassword, newPassword }
    );
    return response;
  },

  /**
   * Enable biometric login
   */
  async enableBiometric() {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/biometric/enable'
    );
    return response;
  },

  /**
   * Disable biometric login
   */
  async disableBiometric() {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/biometric/disable'
    );
    return response;
  },
};
