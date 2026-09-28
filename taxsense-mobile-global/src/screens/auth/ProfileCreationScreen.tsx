import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export default function ProfileCreationScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    taxpayerId: '',
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-8">Complete Your Profile</Text>

        <TextInput
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />

        <TextInput
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        />

        <TextInput
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6"
          placeholder="Taxpayer ID"
          value={formData.taxpayerId}
          onChangeText={(text) => setFormData({ ...formData, taxpayerId: text })}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('CountrySelection')}
          className="w-full bg-blue-600 py-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
