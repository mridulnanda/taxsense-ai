import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'react-native-encrypted-storage';
import { STORAGE_KEYS, SECURITY_CONFIG } from '@constants/index';

export const BiometricService = {
  /**
   * Check if device supports biometric authentication
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  },

  /**
   * Get available biometric types
   */
  async getAvailableBiometrics(): Promise<string[]> {
    try {
      const biometrics = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return biometrics.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biometric';
        }
      });
    } catch (error) {
      console.error('Failed to get biometrics:', error);
      return [];
    }
  },

  /**
   * Authenticate using biometric
   */
  async authenticate(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'TaxSense requires authentication to access your data',
        fallbackLabel: 'Use PIN',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  },

  /**
   * Check if biometric is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  },

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<boolean> {
    try {
      const success = await this.authenticate();
      if (success) {
        await SecureStore.setItem('biometric_enabled', 'true');
      }
      return success;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  },

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.removeItem('biometric_enabled');
    } catch (error) {
      console.error('Failed to disable biometric:', error);
    }
  },
};

export const SecureStorageService = {
  /**
   * Store token securely
   */
  async storeToken(token: string): Promise<void> {
    try {
      await SecureStore.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Failed to store token:', error);
      throw error;
    }
  },

  /**
   * Retrieve stored token
   */
  async retrieveToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return token || null;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  /**
   * Remove stored token
   */
  async removeToken(): Promise<void> {
    try {
      await SecureStore.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to remove token:', error);
      throw error;
    }
  },

  /**
   * Store sensitive data securely
   */
  async storeSecureData(key: string, data: string): Promise<void> {
    try {
      await SecureStore.setItem(key, data);
    } catch (error) {
      console.error(`Failed to store secure data for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve sensitive data
   */
  async retrieveSecureData(key: string): Promise<string | null> {
    try {
      const data = await SecureStore.getItem(key);
      return data || null;
    } catch (error) {
      console.error(`Failed to retrieve secure data for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove sensitive data
   */
  async removeSecureData(key: string): Promise<void> {
    try {
      await SecureStore.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove secure data for key ${key}:`, error);
      throw error;
    }
  },
};

export const PINService = {
  /**
   * Set PIN for the app
   */
  async setPIN(pin: string): Promise<void> {
    try {
      if (pin.length !== SECURITY_CONFIG.PIN_LENGTH) {
        throw new Error(`PIN must be ${SECURITY_CONFIG.PIN_LENGTH} digits`);
      }
      await SecureStore.setItem('pin', pin);
    } catch (error) {
      console.error('Failed to set PIN:', error);
      throw error;
    }
  },

  /**
   * Verify PIN
   */
  async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedPIN = await SecureStore.getItem('pin');
      return storedPIN === pin;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
  },

  /**
   * Check if PIN is set
   */
  async isPINSet(): Promise<boolean> {
    try {
      const pin = await SecureStore.getItem('pin');
      return !!pin;
    } catch (error) {
      return false;
    }
  },

  /**
   * Remove PIN
   */
  async removePIN(): Promise<void> {
    try {
      await SecureStore.removeItem('pin');
    } catch (error) {
      console.error('Failed to remove PIN:', error);
      throw error;
    }
  },
};

export const SecurityUtils = {
  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  },

  /**
   * Hash password (note: use bcrypt on backend)
   */
  hashPassword(password: string): string {
    // This is a placeholder - actual hashing should be done on backend
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  },

  /**
   * Encrypt data (simple implementation - use proper encryption library in production)
   */
  encryptData(data: string, key: string): string {
    // This is a placeholder - use proper encryption in production
    return btoa(data); // Base64 encode
  },

  /**
   * Decrypt data
   */
  decryptData(encryptedData: string, key: string): string {
    // This is a placeholder - use proper decryption in production
    return atob(encryptedData); // Base64 decode
  },

  /**
   * Check if session is expired
   */
  isSessionExpired(lastActivityTime: number): boolean {
    const now = Date.now();
    return now - lastActivityTime > SECURITY_CONFIG.SESSION_TIMEOUT;
  },

  /**
   * Check if device is rooted/jailbroken
   */
  async isDeviceCompromised(): Promise<boolean> {
    // This would require a native module for complete implementation
    // Placeholder for security check
    return false;
  },
};
