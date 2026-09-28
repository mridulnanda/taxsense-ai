import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { AuthService } from '@services/authService';
import { BiometricService } from '@utils/security';

export const useAuth = () => {
  const auth = useAuthStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    const available = await BiometricService.isBiometricAvailable();
    setBiometricAvailable(available);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        auth.setLoading(true);
        auth.setError(null);
        const response = await AuthService.login({ email, password });

        auth.setUser(response.user);
        auth.setToken(response.token);
        auth.setLoading(false);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        auth.setError(message);
        auth.setLoading(false);
        return false;
      }
    },
    [auth]
  );

  const loginWithBiometric = useCallback(async () => {
    try {
      auth.setLoading(true);
      auth.setError(null);

      const authenticated = await BiometricService.authenticate();
      if (!authenticated) {
        throw new Error('Biometric authentication failed');
      }

      // In a real app, you would retrieve stored credentials
      // and then call login, or have a separate endpoint

      auth.setLoading(false);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Biometric login failed';
      auth.setError(message);
      auth.setLoading(false);
      return false;
    }
  }, [auth]);

  const signup = useCallback(
    async (data: any) => {
      try {
        auth.setLoading(true);
        auth.setError(null);
        const response = await AuthService.signup(data);

        auth.setUser(response.user);
        auth.setToken(response.token);
        auth.setLoading(false);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Signup failed';
        auth.setError(message);
        auth.setLoading(false);
        return false;
      }
    },
    [auth]
  );

  const logout = useCallback(async () => {
    try {
      auth.setLoading(true);
      await AuthService.logout();
      await auth.logout();
      auth.setLoading(false);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      auth.setError(message);
      auth.setLoading(false);
      return false;
    }
  }, [auth]);

  const updateProfile = useCallback(
    async (data: any) => {
      try {
        auth.setLoading(true);
        auth.setError(null);
        const updatedUser = await AuthService.updateProfile(data);

        auth.setUser(updatedUser);
        auth.setLoading(false);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Update failed';
        auth.setError(message);
        auth.setLoading(false);
        return false;
      }
    },
    [auth]
  );

  const refreshToken = useCallback(async () => {
    try {
      if (!auth.token?.refreshToken) {
        throw new Error('No refresh token available');
      }
      await auth.refreshToken();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      auth.setError(message);
      return false;
    }
  }, [auth]);

  const enableBiometric = useCallback(async () => {
    try {
      auth.setLoading(true);
      auth.setError(null);
      await AuthService.enableBiometric();
      await BiometricService.enableBiometric();
      auth.setLoading(false);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable biometric';
      auth.setError(message);
      auth.setLoading(false);
      return false;
    }
  }, [auth]);

  return {
    ...auth,
    biometricAvailable,
    login,
    loginWithBiometric,
    signup,
    logout,
    updateProfile,
    refreshToken,
    enableBiometric,
  };
};
