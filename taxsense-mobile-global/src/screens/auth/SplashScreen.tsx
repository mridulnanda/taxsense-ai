import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@store/authStore';

export default function SplashScreen() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Auto-navigate after splash
    const timer = setTimeout(() => {
      // Navigation happens in App.tsx
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-b from-blue-50 to-blue-100">
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-white mb-6 shadow-lg flex items-center justify-center">
          <Text className="text-3xl font-bold text-blue-600">TS</Text>
        </View>
        <Text className="text-3xl font-bold text-blue-600 mb-2">TaxSense</Text>
        <Text className="text-lg text-gray-600 mb-8">Global</Text>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-500 mt-6">Loading...</Text>
      </View>
    </View>
  );
}
