import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReportsStackParamList } from '../types';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

const ReportsHomeScreen = () => null;
const TaxSummaryScreen = () => null;
const YearOverYearScreen = () => null;
const ExportScreen = () => null;

export default function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="ReportsHome" component={ReportsHomeScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="TaxSummary" component={TaxSummaryScreen} options={{ title: 'Tax Summary' }} />
      <Stack.Screen name="YearOverYear" component={YearOverYearScreen} options={{ title: 'Year Over Year' }} />
      <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Export' }} />
    </Stack.Navigator>
  );
}
