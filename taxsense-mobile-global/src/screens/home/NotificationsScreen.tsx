import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const notifications = [
  { id: 1, type: 'deadline', title: 'Tax Filing Deadline', message: 'Annual tax filing deadline is on July 31', time: '2 hours ago' },
  { id: 2, type: 'deduction', title: 'New Deduction Found', message: 'Medical expense deduction available', time: 'Yesterday' },
  { id: 3, type: 'alert', title: 'Audit Risk Alert', message: 'Your profile shows medium audit risk', time: '3 days ago' },
];

export default function NotificationsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white mx-4 my-2 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="bell" size={24} color="#2563EB" />
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">{item.title}</Text>
                <Text className="text-gray-600 text-sm">{item.message}</Text>
                <Text className="text-gray-500 text-xs mt-2">{item.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
