import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '@/stores/authStore';

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Feather name="user" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>PAN Number</Text>
          <Text style={styles.value}>{user?.panNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Occupation</Text>
          <Text style={styles.value}>{user?.occupationType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>
            {user?.residentialAddress?.city}, {user?.residentialAddress?.state}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingRow}>
          <Feather name="lock" size={20} color="#666" />
          <Text style={styles.settingText}>Change Password</Text>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Feather name="bell" size={20} color="#666" />
          <Text style={styles.settingText}>Notifications</Text>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Feather name="download" size={20} color="#666" />
          <Text style={styles.settingText}>Export Data</Text>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingRow}>
          <Feather name="help-circle" size={20} color="#666" />
          <Text style={styles.settingText}>Help Center</Text>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Feather name="mail" size={20} color="#666" />
          <Text style={styles.settingText}>Contact Support</Text>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  profileCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginVertical: 12,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default ProfileScreen;
