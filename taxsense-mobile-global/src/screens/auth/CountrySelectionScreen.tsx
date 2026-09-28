import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COUNTRIES } from '@constants/index';

export default function CountrySelectionScreen({ navigation }: any) {
  const [selectedCountry, setSelectedCountry] = useState('IN');

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Select Country</Text>
        <Text className="text-gray-600 mb-6">Choose your tax jurisdiction</Text>

        <View className="space-y-2 mb-8">
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              onPress={() => setSelectedCountry(country.code)}
              className={`p-4 rounded-lg border-2 ${
                selectedCountry === country.code
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              <Text className="font-semibold text-gray-900">{country.name}</Text>
              <Text className="text-sm text-gray-600">{country.currency}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="w-full bg-blue-600 py-3 rounded-lg">
          <Text className="text-white text-center font-semibold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
