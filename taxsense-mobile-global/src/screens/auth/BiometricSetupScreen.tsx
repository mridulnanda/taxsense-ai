import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricSetupScreen({ navigation }: any) {
  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <View className="items-center mb-8">
        <Ionicons name="finger-print" size={64} color="#2563EB" />
      </View>

      <Text className="text-3xl font-bold text-gray-900 text-center mb-4">Enable Biometric</Text>
      <Text className="text-gray-600 text-center mb-8">
        Use Face ID or Fingerprint for faster and more secure login
      </Text>

      <TouchableOpacity className="w-full bg-blue-600 py-3 rounded-lg mb-4">
        <Text className="text-white text-center font-semibold">Enable Biometric</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('ProfileCreation')}
        className="w-full border border-gray-300 py-3 rounded-lg"
      >
        <Text className="text-gray-900 text-center font-semibold">Skip</Text>
      </TouchableOpacity>
    </View>
  );
}
