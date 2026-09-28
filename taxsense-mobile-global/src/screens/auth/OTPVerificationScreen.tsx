import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function OTPVerificationScreen({ route, navigation }: any) {
  const [otp, setOtp] = useState('');

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</Text>
      <Text className="text-gray-600 mb-8">Enter the OTP sent to {route.params?.phone}</Text>

      <TextInput
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6"
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity className="w-full bg-blue-600 py-3 rounded-lg">
        <Text className="text-white text-center font-semibold">Verify</Text>
      </TouchableOpacity>
    </View>
  );
}
