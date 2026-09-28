import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList, RootStackParamList } from './types';

// Screens
import HomeStack from './stacks/HomeStack';
import TaxStack from './stacks/TaxStack';
import DocumentsStack from './stacks/DocumentsStack';
import ComplianceStack from './stacks/ComplianceStack';
import ReportsStack from './stacks/ReportsStack';
import AdvisorStack from './stacks/AdvisorStack';
import SettingsStack from './stacks/SettingsStack';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tax':
              iconName = focused ? 'calculator' : 'calculator-outline';
              break;
            case 'Documents':
              iconName = focused ? 'document' : 'document-outline';
              break;
            case 'Compliance':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              break;
            case 'Reports':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Advisor':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabel: route.name,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Tax"
        component={TaxStack}
        options={{ tabBarLabel: 'Tax' }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsStack}
        options={{ tabBarLabel: 'Documents' }}
      />
      <Tab.Screen
        name="Compliance"
        component={ComplianceStack}
        options={{ tabBarLabel: 'Compliance' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="Advisor"
        component={AdvisorStack}
        options={{ tabBarLabel: 'Advisor' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Root" component={TabNavigator} />
    </RootStack.Navigator>
  );
};
