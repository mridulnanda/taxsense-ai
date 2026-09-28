import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

const OTPVerificationScreen: React.FC<any> = ({ route, navigation }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOTP({ phone, otp });
      setAuthenticated(true);
    } catch (error) {
      Alert.alert(
        'Verification Error',
        error instanceof Error ? error.message : 'Failed to verify OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await authService.sendOTP(phone);
      setResendTimer(60);
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to resend OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {phone}
      </Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          placeholderTextColor="#999"
          value={otp}
          onChangeText={setOtp}
          editable={!loading}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={resendTimer > 0 || loading}
        >
          <Text style={styles.link}>
            {resendTimer > 0
              ? `Resend OTP in ${resendTimer}s`
              : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});

export default OTPVerificationScreen;
