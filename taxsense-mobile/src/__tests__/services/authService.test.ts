import { authService } from '@/services/authService';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

jest.mock('expo-secure-store');
jest.mock('axios');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'authToken',
        'test-token'
      );
    });

    it('should throw error on login failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };

      (axios.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('SignUp', () => {
    it('should successfully sign up', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'newuser@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
          },
        },
      };

      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.signUp({
        email: 'newuser@example.com',
        phone: '1234567890',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('OTP Verification', () => {
    it('should verify OTP', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            phone: '1234567890',
          },
        },
      };

      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.verifyOTP({
        phone: '1234567890',
        otp: '123456',
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Logout', () => {
    it('should logout and clear auth state', async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });
});
