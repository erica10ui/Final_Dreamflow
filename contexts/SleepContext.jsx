import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createDatabaseManager } from '../lib/database.js';

const SleepContext = createContext();

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (!context) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};

// Notification setup
const setupNotifications = async () => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sleep-reminders', {
        name: 'Sleep Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9B70D8',
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Error setting up notifications:', error.message);
    return false;
  }
};

export const SleepProvider = ({ children, user }) => {
  const [sleepSessions, setSleepSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepGoal, setSleepGoal] = useState(8); // hours
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Database manager instance
  const [dbManager, setDbManager] = useState(null);

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('SleepContext: Loading timeout reached, setting loading to false');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Initialize database manager when user changes
  useEffect(() => {
    console.log('SleepContext: User changed:', user?.uid || 'No user');
    if (user && user.uid) {
      const manager = createDatabaseManager(user.uid);
      setDbManager(manager);
      console.log('SleepContext: Loading sleep data for user:', user.uid);
      loadSleepDataFromFirebase(manager);
    } else {
      setDbManager(null);
      console.log('SleepContext: No user, setting loading to false');
      setIsLoading(false);
    }
  }, [user]);

  // Load sleep data from organized Firebase structure
  const loadSleepDataFromFirebase = async (manager) => {
    if (!manager) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Load sleep sessions from dedicated collection
      const sessions = await manager.getSleepSessions(30);
      setSleepSessions(sessions);
      
      // Load user preferences from user document
      const userStats = await manager.getUserStatistics();
      if (userStats.sleepGoal) setSleepGoal(userStats.sleepGoal);
      if (userStats.bedtime) setBedtime(userStats.bedtime);
      if (userStats.wakeTime) setWakeTime(userStats.wakeTime);
      
      // Also load from AsyncStorage as fallback
      await loadSleepData();
    } catch (error) {
      console.error('Error loading sleep data from Firebase:', error);
      await loadSleepData();
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from AsyncStorage (fallback)
  const loadSleepData = async () => {
    try {
      const [sessionsData, currentSessionData, goalData, bedtimeData, wakeTimeData] = await Promise.all([
        AsyncStorage.getItem('sleepSessions'),
        AsyncStorage.getItem('currentSession'),
        AsyncStorage.getItem('sleepGoal'),
        AsyncStorage.getItem('bedtime'),
        AsyncStorage.getItem('wakeTime')
      ]);

      if (sessionsData) setSleepSessions(JSON.parse(sessionsData));
      if (currentSessionData) setCurrentSession(JSON.parse(currentSessionData));
      if (goalData) setSleepGoal(parseInt(goalData));
      if (bedtimeData) setBedtime(bedtimeData);
      if (wakeTimeData) setWakeTime(wakeTimeData);
    } catch (error) {
      console.error('Error loading sleep data from storage:', error);
    }
  };

  // Save sleep session to organized database
  const saveSleepSession = async (sessionData) => {
    if (!dbManager) {
      // Fallback to AsyncStorage
      await saveSleepData();
      return;
    }

    try {
      const session = await dbManager.addSleepSession(sessionData);
      
      // Update local state
      setSleepSessions(prev => [session, ...prev]);
      
      // Also save to AsyncStorage as backup
      await saveSleepData();
      
      console.log('Sleep session saved to organized database:', session);
      return session;
    } catch (error) {
      console.error('Error saving sleep session:', error);
      // Fallback to AsyncStorage
      await saveSleepData();
    }
  };

  // Save data to AsyncStorage (fallback)
  const saveSleepData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('sleepSessions', JSON.stringify(sleepSessions)),
        AsyncStorage.setItem('currentSession', JSON.stringify(currentSession)),
        AsyncStorage.setItem('sleepGoal', sleepGoal.toString()),
        AsyncStorage.setItem('bedtime', bedtime),
        AsyncStorage.setItem('wakeTime', wakeTime)
      ]);
    } catch (error) {
      console.error('Error saving sleep data to storage:', error);
    }
  };

  // Update user preferences in organized database
  const updateUserPreferences = async (preferences) => {
    if (!dbManager) {
      await saveSleepData();
      return;
    }

    try {
      await dbManager.updateUserStatistics(preferences);
      await saveSleepData();
      console.log('User preferences updated in organized database');
    } catch (error) {
      console.error('Error updating user preferences:', error);
      await saveSleepData();
    }
  };

  // Start sleep session
  const startSleep = async () => {
    const sessionData = {
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      quality: null,
      notes: '',
      bedtime: bedtime,
      wakeTime: wakeTime,
      sleepGoal: sleepGoal
    };

    const session = await saveSleepSession(sessionData);
    setCurrentSession(session);
    setIsSleeping(true);
    
    console.log('Sleep session started:', session);
  };

  // End sleep session
  const endSleep = async (quality = 'Good') => {
    if (!currentSession) return;

    const endTime = new Date();
    const startTime = new Date(currentSession.startTime);
    const duration = (endTime - startTime) / (1000 * 60 * 60); // hours

    const updatedSession = {
      ...currentSession,
      endTime: endTime.toISOString(),
      duration: Math.round(duration * 10) / 10,
      quality: quality
    };

    try {
      if (dbManager) {
        await dbManager.updateSleepSession(currentSession.id, updatedSession);
      }
      
      // Update local state
      setSleepSessions(prev => 
        prev.map(session => 
          session.id === currentSession.id ? updatedSession : session
        )
      );
      
      setCurrentSession(null);
      setIsSleeping(false);
      
      await saveSleepData();
      console.log('Sleep session ended:', updatedSession);
    } catch (error) {
      console.error('Error ending sleep session:', error);
    }
  };

  // Update sleep goal
  const updateSleepGoal = async (goal) => {
    setSleepGoal(goal);
    await updateUserPreferences({ sleepGoal: goal });
  };

  // Update bedtime
  const updateBedtime = async (time) => {
    setBedtime(time);
    await updateUserPreferences({ bedtime: time });
  };

  // Update wake time
  const updateWakeTime = async (time) => {
    setWakeTime(time);
    await updateUserPreferences({ wakeTime: time });
  };

  // Get current sleep duration
  const getCurrentSleepDuration = () => {
    if (!currentSession || !isSleeping) return 0;
    
    const startTime = new Date(currentSession.startTime);
    const now = new Date();
    const duration = (now - startTime) / (1000 * 60 * 60); // hours
    
    return Math.round(duration * 10) / 10;
  };

  // Get sleep statistics
  const getSleepStats = () => {
    if (sleepSessions.length === 0) {
      return {
        totalSessions: 0,
        averageSleep: 0,
        sleepStreak: 0,
        goalAchievement: 0,
        last7Days: 0,
        totalSleep: 0
      };
    }

    const last7Days = sleepSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    });

    const totalSleep = sleepSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSleep = totalSleep / sleepSessions.length;
    
    // Calculate sleep streak
    let sleepStreak = 0;
    const sortedSessions = [...sleepSessions].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].startTime).toDateString();
      const previousDate = i > 0 ? new Date(sortedSessions[i - 1].startTime).toDateString() : null;
      
      if (i === 0 || sessionDate === previousDate) {
        sleepStreak++;
      } else {
        break;
      }
    }

    // Calculate goal achievement
    const goalAchievement = last7Days.filter(session => (session.duration || 0) >= sleepGoal).length;

    return {
      totalSessions: sleepSessions.length,
      averageSleep: Math.round(averageSleep * 10) / 10,
      sleepStreak,
      goalAchievement,
      last7Days: last7Days.length,
      totalSleep: Math.round(totalSleep * 10) / 10
    };
  };

  // Schedule sleep reminder
  const scheduleSleepReminder = async () => {
    try {
      const hasPermission = await setupNotifications();
      if (!hasPermission) return false;

      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule bedtime reminder
      const bedtimeHour = parseInt(bedtime.split(':')[0]);
      const bedtimeMinute = parseInt(bedtime.split(':')[1]);
      
      const bedtimeDate = new Date();
      bedtimeDate.setHours(bedtimeHour, bedtimeMinute, 0, 0);
      
      // If bedtime has passed today, schedule for tomorrow
      if (bedtimeDate <= new Date()) {
        bedtimeDate.setDate(bedtimeDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Bedtime Reminder',
          body: `It's time to wind down and prepare for sleep. Your bedtime is ${bedtime}.`,
          sound: 'default',
        },
        trigger: bedtimeDate,
      });

      console.log('Sleep reminder scheduled for:', bedtimeDate);
      return true;
    } catch (error) {
      console.error('Error scheduling sleep reminder:', error);
      return false;
    }
  };

  // Schedule wake up alarm
  const scheduleWakeUpAlarm = async () => {
    try {
      const hasPermission = await setupNotifications();
      if (!hasPermission) return false;

      const wakeHour = parseInt(wakeTime.split(':')[0]);
      const wakeMinute = parseInt(wakeTime.split(':')[1]);
      
      const wakeDate = new Date();
      wakeDate.setHours(wakeHour, wakeMinute, 0, 0);
      
      // If wake time has passed today, schedule for tomorrow
      if (wakeDate <= new Date()) {
        wakeDate.setDate(wakeDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Good Morning!',
          body: `Time to wake up! Have a great day ahead.`,
          sound: 'default',
        },
        trigger: wakeDate,
      });

      console.log('Wake up alarm scheduled for:', wakeDate);
      return true;
    } catch (error) {
      console.error('Error scheduling wake up alarm:', error);
      return false;
    }
  };

  // Clear all sleep data
  const clearAllSleepData = async () => {
    if (!dbManager) {
      // Clear AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('sleepSessions'),
        AsyncStorage.removeItem('currentSession'),
        AsyncStorage.removeItem('sleepGoal'),
        AsyncStorage.removeItem('bedtime'),
        AsyncStorage.removeItem('wakeTime')
      ]);
      
      setSleepSessions([]);
      setCurrentSession(null);
      setIsSleeping(false);
      return;
    }

    try {
      await dbManager.clearAllUserData();
      
      // Reset local state
      setSleepSessions([]);
      setCurrentSession(null);
      setIsSleeping(false);
      
      // Clear AsyncStorage as well
      await Promise.all([
        AsyncStorage.removeItem('sleepSessions'),
        AsyncStorage.removeItem('currentSession'),
        AsyncStorage.removeItem('sleepGoal'),
        AsyncStorage.removeItem('bedtime'),
        AsyncStorage.removeItem('wakeTime')
      ]);
      
      console.log('All sleep data cleared for user');
    } catch (error) {
      console.error('Error clearing sleep data:', error);
    }
  };

  const value = {
    // State
    sleepSessions,
    currentSession,
    isSleeping,
    sleepGoal,
    bedtime,
    wakeUpTime: wakeTime,
    notifications,
    isLoading,
    
    // Actions
    startSleep,
    endSleep,
    updateSleepGoal,
    updateBedtime,
    updateWakeTime,
    getCurrentSleepDuration,
    getSleepStats,
    scheduleSleepReminder,
    scheduleWakeUpAlarm,
    clearAllSleepData,
    loadSleepDataFromFirebase: () => loadSleepDataFromFirebase(dbManager),
    saveSleepSession
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
};