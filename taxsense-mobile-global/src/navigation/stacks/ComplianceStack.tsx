import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ComplianceStackParamList } from '../types';

const Stack = createNativeStackNavigator<ComplianceStackParamList>();

const ComplianceHomeScreen = () => null;
const DeadlinesScreen = () => null;
const ChecklistScreen = () => null;
const AuditRiskScreen = () => null;
const RequiredDocumentsScreen = () => null;

export default function ComplianceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="ComplianceHome" component={ComplianceHomeScreen} options={{ title: 'Compliance' }} />
      <Stack.Screen name="Deadlines" component={DeadlinesScreen} options={{ title: 'Deadlines' }} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} options={{ title: 'Checklist' }} />
      <Stack.Screen name="AuditRisk" component={AuditRiskScreen} options={{ title: 'Audit Risk' }} />
      <Stack.Screen name="RequiredDocuments" component={RequiredDocumentsScreen} options={{ title: 'Required Documents' }} />
    </Stack.Navigator>
  );
}
