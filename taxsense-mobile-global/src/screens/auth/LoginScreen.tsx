import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@hooks/useAuth';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    await login(email, password);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 py-12">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
        <Text className="text-gray-600 mb-8">Login to your TaxSense account</Text>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error && <Text className="text-red-600 mb-4">{error}</Text>}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 py-3 rounded-lg mb-4"
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text className="text-center text-blue-600">
            Don't have an account? <Text className="font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} className="mt-4">
          <Text className="text-center text-blue-600">Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
