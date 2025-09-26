import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { useJournal } from '../contexts/JournalContext';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { playSound } = useSound();
  const { dreamEntries, getStats } = useJournal();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || ''
  });
  
  // App settings state
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    soundEnabled: true,
    hapticFeedback: true,
    autoBackup: true,
    analyticsEnabled: true
  });

  const stats = getStats ? getStats() : { totalDreams: 0, sleepStreak: 0, avgSleepQuality: 0 };

  const handleEditProfile = () => {
    playSound('button');
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || ''
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editData);
      if (result.success) {
        playSound('success');
        setShowEditProfile(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        playSound('error');
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      playSound('error');
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    playSound('button');
  };

  const handleLogout = async () => {
    playSound('button');
    
    Alert.alert(
      'Sign Out', 
      'Are you sure you want to sign out?', 
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => playSound('button')
        },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await logout();
              if (result.success) {
                playSound('success');
                router.replace('/');
              } else {
                playSound('error');
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            } catch (error) {
              playSound('error');
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your dream entries. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: () => {
            // This would need to be implemented in the JournalContext
            Alert.alert('Feature Coming Soon', 'Data clearing will be available in a future update.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profile</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="account-edit" size={24} color="#8B5CF6" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>
                {user?.firstName} {user?.lastName} • @{user?.username}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalDreams}</Text>
              <Text style={styles.statLabel}>Dreams</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.sleepStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.recallRate}%</Text>
              <Text style={styles.statLabel}>Recall</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.avgSleepQuality.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Quality</Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ App Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="bell" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Notifications</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => handleSettingChange('notifications', value)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor={settings.notifications ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Dark Mode</Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => handleSettingChange('darkMode', value)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor={settings.darkMode ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="volume-high" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Sound Effects</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(value) => handleSettingChange('soundEnabled', value)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor={settings.soundEnabled ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="vibrate" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Haptic Feedback</Text>
          </View>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={(value) => handleSettingChange('hapticFeedback', value)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor={settings.hapticFeedback ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="backup-restore" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Auto Backup</Text>
          </View>
          <Switch
            value={settings.autoBackup}
            onValueChange={(value) => handleSettingChange('autoBackup', value)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor={settings.autoBackup ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Analytics</Text>
          </View>
          <Switch
            value={settings.analyticsEnabled}
            onValueChange={(value) => handleSettingChange('analyticsEnabled', value)}
            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
            thumbColor={settings.analyticsEnabled ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Data Management</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Export', 'Export feature coming soon!')}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="download" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Export Data</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Import', 'Import feature coming soon!')}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="upload" size={24} color="#8B5CF6" />
            <Text style={styles.settingTitle}>Import Data</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleClearData}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
            <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Clear All Data</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Account</Text>
        
        <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Sign Out</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                value={editData.firstName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                value={editData.lastName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                value={editData.username}
                onChangeText={(text) => setEditData(prev => ({ ...prev, username: text }))}
                placeholder="Enter username"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4C1D95',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dangerItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4C1D95',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
});
