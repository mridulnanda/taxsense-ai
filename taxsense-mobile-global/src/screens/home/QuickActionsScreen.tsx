import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const actions = [
  { id: 1, icon: 'calculator', label: 'Compute Tax', description: 'Calculate your tax liability' },
  { id: 2, icon: 'camera', label: 'Scan Receipt', description: 'Capture and process receipts' },
  { id: 3, icon: 'document-text', label: 'File Tax', description: 'Submit tax return online' },
  { id: 4, icon: 'folder', label: 'Upload Document', description: 'Upload tax documents' },
  { id: 5, icon: 'person', label: 'Find Advisor', description: 'Connect with tax professionals' },
  { id: 6, icon: 'bar-chart', label: 'View Reports', description: 'Download tax reports' },
];

export default function QuickActionsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</Text>

        <View className="space-y-3">
          {actions.map((action) => (
            <TouchableOpacity key={action.id} className="bg-white rounded-lg p-4 flex-row items-center shadow">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name={action.icon as any} size={24} color="#2563EB" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-gray-900 font-semibold">{action.label}</Text>
                <Text className="text-gray-600 text-sm">{action.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
