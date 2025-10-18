import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSimpleNotification } from '../contexts/SimpleNotificationContext';

export default function NotificationTest() {
  const {
    isEnabled,
    permissionStatus,
    isExpoGo,
    requestPermissions,
    sendTestNotification,
    scheduleBedtimeReminder,
    scheduleWakeUpAlarm,
    cancelAllNotifications,
    getScheduledNotifications
  } = useSimpleNotification();

  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadScheduledCount();
  }, []);

  const loadScheduledCount = async () => {
    try {
      const scheduled = await getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Error loading scheduled count:', error);
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive reminders.');
    }
  };

  const handleTestNotification = async () => {
    const result = await sendTestNotification();
    if (result) {
      Alert.alert('Success', 'Test notification scheduled! You should receive it in 2 seconds.');
    }
  };

  const handleBedtimeReminder = async () => {
    const result = await scheduleBedtimeReminder('22:00');
    if (result) {
      Alert.alert('Success', 'Bedtime reminder scheduled for 10:00 PM daily!');
      loadScheduledCount();
    }
  };

  const handleWakeUpAlarm = async () => {
    const result = await scheduleWakeUpAlarm('07:00');
    if (result) {
      Alert.alert('Success', 'Wake up alarm scheduled for 7:00 AM daily!');
      loadScheduledCount();
    }
  };

  const handleCancelAll = async () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel All',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            setScheduledCount(0);
            Alert.alert('Success', 'All notifications cancelled!');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Simple Notification Test</Text>
      <Text style={styles.subtitle}>Android & Web Compatible</Text>
      
      {isExpoGo && (
        <View style={styles.expoGoWarning}>
          <MaterialCommunityIcons name="information" size={20} color="#F59E0B" />
          <Text style={styles.expoGoText}>
            Running in Expo Go - notifications limited to local reminders
          </Text>
        </View>
      )}
      
      <View style={styles.statusContainer}>
        <Text style={styles.status}>
          Status: {isEnabled ? '✅ Enabled' : '❌ Disabled'}
        </Text>
        <Text style={styles.status}>
          Permission: {permissionStatus}
        </Text>
        <Text style={styles.status}>
          Scheduled: {scheduledCount} notifications
        </Text>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handleRequestPermissions}>
        <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>Request Permissions</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, !isEnabled && styles.buttonDisabled]} 
        onPress={handleTestNotification}
        disabled={!isEnabled}
      >
        <MaterialCommunityIcons name="send" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>Send Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, !isEnabled && styles.buttonDisabled]} 
        onPress={handleBedtimeReminder}
        disabled={!isEnabled}
      >
        <MaterialCommunityIcons name="moon-waning-crescent" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>Schedule Bedtime (10 PM)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, !isEnabled && styles.buttonDisabled]} 
        onPress={handleWakeUpAlarm}
        disabled={!isEnabled}
      >
        <MaterialCommunityIcons name="weather-sunny" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>Schedule Wake Up (7 AM)</Text>
      </TouchableOpacity>

      {scheduledCount > 0 && (
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelAll}>
          <MaterialCommunityIcons name="cancel" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Cancel All Notifications</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.info}>
        {Platform.OS === 'android' 
          ? 'For full functionality on Android, use a development build instead of Expo Go.'
          : 'Notifications work best on physical devices.'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9B70D8',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#9B70D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  expoGoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  expoGoText: {
    color: '#92400E',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
