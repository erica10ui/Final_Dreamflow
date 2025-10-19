import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const SimpleNotificationContext = createContext();

export const useSimpleNotification = () => {
  const context = useContext(SimpleNotificationContext);
  if (!context) {
    throw new Error('useSimpleNotification must be used within a SimpleNotificationProvider');
  }
  return context;
};

export const SimpleNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  
  // Check if running in Expo Go (limited notification support)
  const isExpoGo = Constants.appOwnership === 'expo';

  // Load saved notifications on mount
  useEffect(() => {
    loadNotifications();
    checkPermissions();
  }, []);

  const loadNotifications = async () => {
    try {
      const saved = await AsyncStorage.getItem('simpleNotifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (newNotifications) => {
    try {
      await AsyncStorage.setItem('simpleNotifications', JSON.stringify(newNotifications));
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      if (isExpoGo) {
        // In Expo Go, notifications are limited - show as disabled
        setPermissionStatus('expo-go-limited');
        setIsEnabled(false);
        console.log('Running in Expo Go - notifications limited');
        return;
      }
      
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      setIsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus('error');
      setIsEnabled(false);
    }
  };

  const requestPermissions = async () => {
    try {
      if (isExpoGo) {
        Alert.alert(
          'Expo Go Limitation',
          'Push notifications are not available in Expo Go. To use full notification features, please build a development build or use a physical device with the standalone app.',
          [{ text: 'OK' }]
        );
        setPermissionStatus('expo-go-limited');
        setIsEnabled(false);
        return false;
      }
      
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      setIsEnabled(status === 'granted');
      
      if (status === 'granted') {
        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionStatus('error');
      setIsEnabled(false);
      return false;
    }
  };

  const scheduleNotification = async (title, body, triggerTime) => {
    try {
      if (isExpoGo) {
        // In Expo Go, just save to local storage as a reminder
        const newNotification = {
          id: Date.now().toString(),
          title,
          body,
          triggerTime,
          enabled: true,
          createdAt: new Date().toISOString(),
          isExpoGoReminder: true,
        };
        
        const updatedNotifications = [...notifications, newNotification];
        await saveNotifications(updatedNotifications);
        
        Alert.alert(
          'Reminder Saved',
          `"${title}" has been saved as a local reminder. Full notifications require a development build.`,
          [{ text: 'OK' }]
        );
        return 'expo-go-reminder';
      }
      
      // Request permissions if not already granted
      if (!isEnabled) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings to receive reminders.');
          return null;
        }
      }

      // Cancel existing notifications of the same type
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of existingNotifications) {
        if (notification.content.data?.type === title.toLowerCase().replace(/\s+/g, '_')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      // Schedule new notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { type: title.toLowerCase().replace(/\s+/g, '_') },
        },
        trigger: triggerTime,
      });

      // Save to local storage
      const newNotification = {
        id: notificationId,
        title,
        body,
        triggerTime,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const updatedNotifications = [...notifications.filter(n => n.title !== title), newNotification];
      await saveNotifications(updatedNotifications);

      console.log(`Notification scheduled: ${title}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
      return null;
    }
  };

  const scheduleBedtimeReminder = async (bedtime) => {
    const [hour, minute] = bedtime.split(':').map(Number);
    
    // Validate parsed values
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error('Invalid bedtime format for notification:', bedtime);
      Alert.alert('Invalid Time', 'Please enter a valid bedtime in HH:MM format (e.g., 22:00)');
      return null;
    }
    
    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    return await scheduleNotification(
      '🌙 Bedtime Reminder',
      'Time to wind down and prepare for sleep!',
      trigger
    );
  };

  const scheduleWakeUpAlarm = async (wakeTime) => {
    const [hour, minute] = wakeTime.split(':').map(Number);
    
    // Validate parsed values
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error('Invalid wake time format for notification:', wakeTime);
      Alert.alert('Invalid Time', 'Please enter a valid wake time in HH:MM format (e.g., 07:00)');
      return null;
    }
    
    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    return await scheduleNotification(
      '☀️ Wake Up Time',
      'Good morning! Time to start your day!',
      trigger
    );
  };

  const sendTestNotification = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Test Notification',
        'This is a test notification from Dreamflow! (Expo Go mode - saved locally)',
        [{ text: 'OK' }]
      );
      return 'expo-go-test';
    }
    
    return await scheduleNotification(
      '🔔 Test Notification',
      'This is a test notification from Dreamflow!',
      { seconds: 2 }
    );
  };

  const cancelAllNotifications = async () => {
    try {
      if (!isExpoGo) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      await saveNotifications([]);
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  const cancelNotification = async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      await saveNotifications(updatedNotifications);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const value = {
    notifications,
    isEnabled,
    permissionStatus,
    isExpoGo,
    requestPermissions,
    scheduleNotification,
    scheduleBedtimeReminder,
    scheduleWakeUpAlarm,
    sendTestNotification,
    cancelAllNotifications,
    cancelNotification,
    getScheduledNotifications,
  };

  return (
    <SimpleNotificationContext.Provider value={value}>
      {children}
    </SimpleNotificationContext.Provider>
  );
};

