import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const SleepContext = createContext();

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (!context) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};

// Configure notifications
const setupNotifications = async () => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    console.log('Notifications setup successfully');
    return true;
  } catch (error) {
    console.warn('Error setting up notifications:', error.message);
    return false;
  }
};

export const SleepProvider = ({ children }) => {
  const [sleepSessions, setSleepSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepGoal, setSleepGoal] = useState(8); // hours
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [notifications, setNotifications] = useState([]);

  // Load data from storage
  useEffect(() => {
    loadSleepData();
  }, []);

  const loadSleepData = async () => {
    try {
      const [sessions, goal, bedTime, wakeTimeData, notifs] = await Promise.all([
        AsyncStorage.getItem('sleepSessions'),
        AsyncStorage.getItem('sleepGoal'),
        AsyncStorage.getItem('bedtime'),
        AsyncStorage.getItem('wakeTime'),
        AsyncStorage.getItem('sleepNotifications')
      ]);

      if (sessions) setSleepSessions(JSON.parse(sessions));
      if (goal) setSleepGoal(parseInt(goal));
      if (bedTime) setBedtime(bedTime);
      if (wakeTimeData) setWakeTime(wakeTimeData);
      if (notifs) setNotifications(JSON.parse(notifs));
    } catch (error) {
      console.error('Error loading sleep data:', error);
    }
  };

  const saveSleepData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving sleep data:', error);
    }
  };

  const startSleep = () => {
    const session = {
      id: Date.now(),
      startTime: new Date(),
      endTime: null,
      duration: 0,
      quality: null,
      notes: ''
    };
    
    setCurrentSession(session);
    setIsSleeping(true);
    saveSleepData('currentSession', session);
  };

  const endSleep = (quality = 'Good', notes = '') => {
    if (!currentSession) return;

    const endTime = new Date();
    const duration = Math.round((endTime - currentSession.startTime) / (1000 * 60 * 60)); // hours

    const completedSession = {
      ...currentSession,
      endTime,
      duration,
      quality,
      notes
    };

    const updatedSessions = [...sleepSessions, completedSession];
    setSleepSessions(updatedSessions);
    setCurrentSession(null);
    setIsSleeping(false);
    
    saveSleepData('sleepSessions', updatedSessions);
    saveSleepData('currentSession', null);
  };

  const updateSleepGoal = (goal) => {
    setSleepGoal(goal);
    saveSleepData('sleepGoal', goal);
  };

  const updateBedtime = (time) => {
    // Validate time format (HH:MM)
    if (typeof time === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setBedtime(time);
      saveSleepData('bedtime', time);
    } else {
      console.warn('Invalid bedtime format:', time);
    }
  };

  const updateWakeTime = (time) => {
    // Validate time format (HH:MM)
    if (typeof time === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setWakeTime(time);
      saveSleepData('wakeTime', time);
    } else {
      console.warn('Invalid wake time format:', time);
    }
  };

  const scheduleSleepReminder = async () => {
    try {
      // Setup notifications if not already done
      const setupSuccess = await setupNotifications();
      
      if (!setupSuccess) {
        console.warn('Notification setup failed, saving preference locally');
        const newNotification = {
          id: `bedtime_${Date.now()}`,
          type: 'bedtime',
          time: bedtime,
          enabled: true
        };
        const updatedNotifications = [...notifications.filter(n => n.type !== 'bedtime'), newNotification];
        setNotifications(updatedNotifications);
        saveSleepData('sleepNotifications', updatedNotifications);
        return newNotification.id;
      }

      // Cancel existing bedtime notifications
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const bedtimeNotifications = existingNotifications.filter(n => 
        n.content.data?.type === 'bedtime'
      );
      
      for (const notification of bedtimeNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      const [hour, minute] = bedtime.split(':').map(Number);
      
      // Validate parsed values
      if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.error('Invalid bedtime format for notification:', bedtime);
        return null;
      }
      
      const trigger = {
        hour,
        minute,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Bedtime Reminder',
          body: 'Time to wind down and prepare for sleep!',
          sound: 'default',
          data: { type: 'bedtime' },
        },
        trigger,
      });

      const newNotification = {
        id: notificationId,
        type: 'bedtime',
        time: bedtime,
        enabled: true
      };

      const updatedNotifications = [...notifications.filter(n => n.type !== 'bedtime'), newNotification];
      setNotifications(updatedNotifications);
      saveSleepData('sleepNotifications', updatedNotifications);

      console.log('Bedtime reminder scheduled successfully');
      return notificationId;
    } catch (error) {
      console.error('Error scheduling bedtime reminder:', error);
      return null;
    }
  };

  const scheduleWakeUpAlarm = async () => {
    try {
      // Setup notifications if not already done
      const setupSuccess = await setupNotifications();
      
      if (!setupSuccess) {
        console.warn('Notification setup failed, saving preference locally');
        const newNotification = {
          id: `wakeup_${Date.now()}`,
          type: 'wakeup',
          time: wakeTime,
          enabled: true
        };
        const updatedNotifications = [...notifications.filter(n => n.type !== 'wakeup'), newNotification];
        setNotifications(updatedNotifications);
        saveSleepData('sleepNotifications', updatedNotifications);
        return newNotification.id;
      }

      // Cancel existing wakeup notifications
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const wakeupNotifications = existingNotifications.filter(n => 
        n.content.data?.type === 'wakeup'
      );
      
      for (const notification of wakeupNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      const [hour, minute] = wakeTime.split(':').map(Number);
      
      // Validate parsed values
      if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.error('Invalid wake time format for notification:', wakeTime);
        return null;
      }
      
      const trigger = {
        hour,
        minute,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Wake Up Time',
          body: 'Good morning! Time to start your day!',
          sound: 'default',
          data: { type: 'wakeup' },
        },
        trigger,
      });

      const newNotification = {
        id: notificationId,
        type: 'wakeup',
        time: wakeTime,
        enabled: true
      };

      const updatedNotifications = [...notifications.filter(n => n.type !== 'wakeup'), newNotification];
      setNotifications(updatedNotifications);
      saveSleepData('sleepNotifications', updatedNotifications);

      console.log('Wake up alarm scheduled successfully');
      return notificationId;
    } catch (error) {
      console.error('Error scheduling wake up alarm:', error);
      return null;
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifications([]);
      saveSleepData('sleepNotifications', []);
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  const getSleepStats = () => {
    const last7Days = sleepSessions.slice(-7);
    const totalSleep = last7Days.reduce((sum, session) => sum + session.duration, 0);
    const averageSleep = last7Days.length > 0 ? totalSleep / last7Days.length : 0;
    const sleepStreak = calculateSleepStreak();
    const goalAchievement = last7Days.filter(session => session.duration >= sleepGoal).length;

    return {
      totalSessions: sleepSessions.length,
      averageSleep: Math.round(averageSleep * 10) / 10,
      sleepStreak,
      goalAchievement,
      last7Days: last7Days.length,
      totalSleep: Math.round(totalSleep * 10) / 10
    };
  };

  const calculateSleepStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasSleep = sleepSessions.some(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime() && session.duration >= sleepGoal;
      });

      if (hasSleep) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getCurrentSleepDuration = () => {
    if (!currentSession) return 0;
    const now = new Date();
    const duration = (now - currentSession.startTime) / (1000 * 60 * 60); // hours
    return Math.round(duration * 10) / 10;
  };

  const value = {
    sleepSessions,
    currentSession,
    isSleeping,
    sleepGoal,
    bedtime,
    wakeTime,
    notifications,
    startSleep,
    endSleep,
    updateSleepGoal,
    updateBedtime,
    updateWakeTime,
    scheduleSleepReminder,
    scheduleWakeUpAlarm,
    cancelAllNotifications,
    getSleepStats,
    getCurrentSleepDuration
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
};





