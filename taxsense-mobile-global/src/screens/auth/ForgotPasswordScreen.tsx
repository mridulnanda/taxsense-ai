import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Reset Password</Text>
      <Text className="text-gray-600 mb-8">Enter your email to reset your password</Text>

      <TextInput
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity className="w-full bg-blue-600 py-3 rounded-lg">
        <Text className="text-white text-center font-semibold">Send Reset Link</Text>
      </TouchableOpacity>
    </View>
  );
}
