import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../types';

const Stack = createNativeStackNavigator<AdvisorStackParamList>();

const AdvisorHomeScreen = () => null;
const FindAdvisorScreen = () => null;
const AdvisorProfileScreen = () => null;
const BookConsultationScreen = () => null;
const ShareDataScreen = () => null;
const MessagesScreen = () => null;
const ConsultationsScreen = () => null;

export default function AdvisorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="AdvisorHome" component={AdvisorHomeScreen} options={{ title: 'Tax Advisor' }} />
      <Stack.Screen name="FindAdvisor" component={FindAdvisorScreen} options={{ title: 'Find Advisor' }} />
      <Stack.Screen name="AdvisorProfile" component={AdvisorProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="BookConsultation" component={BookConsultationScreen} options={{ title: 'Book Consultation' }} />
      <Stack.Screen name="ShareData" component={ShareDataScreen} options={{ title: 'Share Data' }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Consultations" component={ConsultationsScreen} options={{ title: 'Consultations' }} />
    </Stack.Navigator>
  );
}
