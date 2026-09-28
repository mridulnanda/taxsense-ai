import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsHomeScreen = () => null;
const AccountSettingsScreen = () => null;
const SecuritySettingsScreen = () => null;
const NotificationPreferencesScreen = () => null;
const PrivacySettingsScreen = () => null;
const LanguageSettingsScreen = () => null;
const AppUpdateScreen = () => null;
const HelpScreen = () => null;
const AboutScreen = () => null;

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: 'Account' }} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: 'Security' }} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} options={{ title: 'Language' }} />
      <Stack.Screen name="AppUpdate" component={AppUpdateScreen} options={{ title: 'Updates' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
    </Stack.Navigator>
  );
}
