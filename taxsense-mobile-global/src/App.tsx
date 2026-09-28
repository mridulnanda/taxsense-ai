import React, { useEffect, useState } from 'react';
import { View, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { RootNavigator } from '@navigation/index';
import { AuthNavigator } from '@navigation/AuthNavigator';
import SplashScreen from '@screens/auth/SplashScreen';

export default function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isDarkMode } = useUIStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      // Simulate splash screen delay
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    };

    checkAuthStatus();
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#1F2937' : '#FFFFFF'}
      />
      <NavigationContainer theme={{ dark: isDarkMode, colors: {} as any }}>
        {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
