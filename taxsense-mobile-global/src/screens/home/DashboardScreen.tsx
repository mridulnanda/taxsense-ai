import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@hooks/useAuth';
import { useTax } from '@hooks/useTax';
import { FormattingUtils } from '@utils/formatting';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { currentCalculation, loadingCalculations, fetchCalculations } = useTax();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    fetchCalculations(currentYear);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const currentYear = new Date().getFullYear();
    await fetchCalculations(currentYear);
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-blue-600 px-6 py-6">
        <Text className="text-white text-lg mb-1">Welcome back,</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.firstName} {user?.lastName}
        </Text>
      </View>

      {/* Main Content */}
      <View className="px-6 py-6">
        {/* Quick Summary Card */}
        {currentCalculation && (
          <View className="bg-white rounded-lg p-6 shadow mb-6">
            <Text className="text-gray-600 text-sm mb-4">TAX CALCULATION SUMMARY</Text>
            <View className="mb-4">
              <Text className="text-3xl font-bold text-gray-900">
                {FormattingUtils.formatCurrency(currentCalculation.taxableIncome, 'INR')}
              </Text>
              <Text className="text-gray-600 text-sm">Taxable Income</Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-blue-600">
                  {FormattingUtils.formatCurrency(currentCalculation.taxNewRegime, 'INR')}
                </Text>
                <Text className="text-gray-600 text-xs">New Regime</Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-2xl font-bold text-green-600">
                  {FormattingUtils.formatCurrency(currentCalculation.savings, 'INR')}
                </Text>
                <Text className="text-gray-600 text-xs">Savings</Text>
              </View>
            </View>
          </View>
        )}

        {/* Next Deadline */}
        <View className="bg-white rounded-lg p-6 shadow mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={24} color="#2563EB" />
            <Text className="text-gray-900 font-semibold text-lg ml-3">Next Deadline</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">July 31, 2024</Text>
          <Text className="text-gray-600">Annual Tax Filing</Text>
        </View>

        {/* Recent Activity */}
        <View className="bg-white rounded-lg p-6 shadow mb-6">
          <Text className="text-gray-900 font-semibold text-lg mb-4">Recent Activity</Text>
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
              <Ionicons name="checkmark" size={20} color="#10B981" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-medium">Tax Calculated</Text>
              <Text className="text-gray-600 text-sm">Today at 10:30 AM</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="document-outline" size={20} color="#2563EB" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-medium">Document Uploaded</Text>
              <Text className="text-gray-600 text-sm">Yesterday</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold text-lg mb-4">Quick Actions</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity className="flex-1 bg-blue-600 rounded-lg p-4 items-center">
              <Ionicons name="calculator" size={24} color="white" />
              <Text className="text-white text-xs font-semibold mt-2">Compute Tax</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-green-600 rounded-lg p-4 items-center">
              <Ionicons name="camera" size={24} color="white" />
              <Text className="text-white text-xs font-semibold mt-2">Scan Doc</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-purple-600 rounded-lg p-4 items-center">
              <Ionicons name="document-text" size={24} color="white" />
              <Text className="text-white text-xs font-semibold mt-2">File Tax</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View className="bg-blue-50 border-l-4 border-blue-600 rounded p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#2563EB" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-900 font-semibold">New Deduction Found</Text>
              <Text className="text-blue-800 text-sm">
                We found a potential deduction for your medical expenses
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
