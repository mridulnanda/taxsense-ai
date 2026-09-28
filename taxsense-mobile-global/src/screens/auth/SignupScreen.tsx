import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@hooks/useAuth';

export default function SignupScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    country: 'IN',
  });
  const { signup, isLoading, error } = useAuth();

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    await signup(formData);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
        <Text className="text-gray-600 mb-8">Sign up to get started with TaxSense</Text>

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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          placeholder="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
        />

        <TextInput
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />

        <TextInput
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
        />

        {error && <Text className="text-red-600 mb-4">{error}</Text>}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={isLoading}
          className="w-full bg-blue-600 py-3 rounded-lg mb-4"
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="text-center text-blue-600">
            Already have an account? <Text className="font-semibold">Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
