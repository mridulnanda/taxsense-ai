import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-gray-900 mb-8">Create New Password</Text>

      <TextInput
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity className="w-full bg-blue-600 py-3 rounded-lg">
        <Text className="text-white text-center font-semibold">Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}
