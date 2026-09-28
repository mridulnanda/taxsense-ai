import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

import SplashScreen from '@/screens/SplashScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import OTPVerificationScreen from '@/screens/auth/OTPVerificationScreen';

import HomeScreen from '@/screens/main/HomeScreen';
import ScenariosScreen from '@/screens/main/ScenariosScreen';
import ComputeScreen from '@/screens/main/ComputeScreen';
import AnalyticsScreen from '@/screens/main/AnalyticsScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

import { RootStackParamList, AuthStackParamList, MainStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTabs = createBottomTabNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </AuthStack.Navigator>
  );
};

const MainTabsNavigator = () => {
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Scenarios') {
            iconName = 'layers';
          } else if (route.name === 'Compute') {
            iconName = 'calculator';
          } else if (route.name === 'Analytics') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
        headerTintColor: '#000',
      })}
    >
      <MainTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <MainTabs.Screen
        name="Scenarios"
        component={ScenariosScreen}
        options={{ title: 'Scenarios' }}
      />
      <MainTabs.Screen
        name="Compute"
        component={ComputeScreen}
        options={{ title: 'Compute Tax' }}
      />
      <MainTabs.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <MainTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </MainTabs.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabsNavigator}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

export const Navigation: React.FC = () => {
  const { isAuthenticated, isLoading, restoreToken } = useAuthStore();
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        await restoreToken();
      } catch (error) {
        console.error('Failed to restore token:', error);
      } finally {
        setSplashVisible(false);
      }
    };

    bootstrapAsync();
  }, [restoreToken]);

  if (splashVisible || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
