import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DocumentsStackParamList } from '../types';

const Stack = createNativeStackNavigator<DocumentsStackParamList>();

const DocumentsHomeScreen = () => null;
const CameraScannerScreen = () => null;
const DocumentUploadScreen = () => null;
const DocumentListScreen = () => null;
const DocumentDetailScreen = () => null;
const DocumentOCRScreen = () => null;
const DocumentOrganizationScreen = () => null;

export default function DocumentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="DocumentsHome" component={DocumentsHomeScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="CameraScanner" component={CameraScannerScreen} options={{ title: 'Scan Document' }} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Upload Document' }} />
      <Stack.Screen name="DocumentList" component={DocumentListScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Document Details' }} />
      <Stack.Screen name="DocumentOCR" component={DocumentOCRScreen} options={{ title: 'Extract Data' }} />
      <Stack.Screen name="DocumentOrganization" component={DocumentOrganizationScreen} options={{ title: 'Organize' }} />
    </Stack.Navigator>
  );
}
