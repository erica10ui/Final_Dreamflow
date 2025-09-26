import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';

const SleepContext = createContext();

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (!context) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};

// Configure notifications only if supported
const isNotificationSupported = Platform.OS !== 'android' || __DEV__ === false;

// Dynamic notification setup
let Notifications = null;
let notificationHandlerSet = false;

const setupNotifications = async () => {
  if (notificationHandlerSet || !isNotificationSupported) return;
  
  try {
    // Simplified for web compatibility
    console.log('Notifications setup (simplified for web)');
    notificationHandlerSet = true;
  } catch (error) {
    console.warn('Notifications not supported in this environment:', error.message);
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
  const [isSleepTime, setIsSleepTime] = useState(false);
  const [sleepReminderSound, setSleepReminderSound] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  // Load data from storage
  useEffect(() => {
    loadSleepData();
    setupSleepReminderSound();
  }, []);

  // Real-time sleep reminder check
  useEffect(() => {
    const checkSleepTime = () => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const today = now.toDateString();
      
      // Check if it's bedtime and notifications are enabled
      if (currentTime === bedtime && !isSleepTime && notificationsEnabled) {
        setIsSleepTime(true);
        // Only play sound if we haven't played today
        if (!hasPlayedToday) {
          playSleepReminderSound();
          setHasPlayedToday(true);
          AsyncStorage.setItem('hasPlayedToday', JSON.stringify(true));
          AsyncStorage.setItem('lastPlayedDate', today);
        }
        showSleepReminderAlert();
      } else if (currentTime !== bedtime && isSleepTime) {
        setIsSleepTime(false);
      }
      
      // Reset hasPlayedToday at midnight
      const lastPlayedDate = AsyncStorage.getItem('lastPlayedDate');
      if (lastPlayedDate && lastPlayedDate !== today) {
        setHasPlayedToday(false);
        AsyncStorage.setItem('hasPlayedToday', JSON.stringify(false));
      }
    };

    // Check every minute
    const interval = setInterval(checkSleepTime, 60000);
    
    // Initial check
    checkSleepTime();

    return () => clearInterval(interval);
  }, [bedtime, isSleepTime, notificationsEnabled, hasPlayedToday]);

  // Setup sleep reminder sound
  const setupSleepReminderSound = async () => {
    // Don't preload sound to prevent automatic playing
    console.log('Sleep reminder sound setup ready');
  };

  // Play sleep reminder sound
  const playSleepReminderSound = async () => {
    try {
      if (sleepReminderSound) {
        await sleepReminderSound.replayAsync();
      } else {
        // Fallback to system sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
          { shouldPlay: true, isLooping: false }
        );
        await sound.unloadAsync();
      }
    } catch (error) {
      console.log('Could not play sleep reminder sound:', error);
    }
  };

  // Show sleep reminder alert
  const showSleepReminderAlert = () => {
    Alert.alert(
      '🌙 Sleep Time!',
      'It\'s your bedtime. Time to wind down and prepare for sleep!',
      [
        {
          text: 'Start Sleep Session',
          onPress: () => {
            startSleep();
            setIsSleepTime(false);
          }
        },
        {
          text: 'Remind me in 15 min',
          onPress: () => {
            setTimeout(() => {
              setIsSleepTime(true);
              playSleepReminderSound();
              showSleepReminderAlert();
            }, 15 * 60 * 1000); // 15 minutes
          }
        },
        {
          text: 'Dismiss',
          onPress: () => setIsSleepTime(false),
          style: 'cancel'
        }
      ]
    );
  };

  const loadSleepData = async () => {
    try {
      const [sessions, goal, bedTime, wakeTimeData, notifs, notifEnabled, playedToday] = await Promise.all([
        AsyncStorage.getItem('sleepSessions'),
        AsyncStorage.getItem('sleepGoal'),
        AsyncStorage.getItem('bedtime'),
        AsyncStorage.getItem('wakeTime'),
        AsyncStorage.getItem('sleepNotifications'),
        AsyncStorage.getItem('notificationsEnabled'),
        AsyncStorage.getItem('hasPlayedToday')
      ]);

      if (sessions) setSleepSessions(JSON.parse(sessions));
      if (goal) setSleepGoal(parseInt(goal));
      if (bedTime) setBedtime(bedTime);
      if (wakeTimeData) setWakeTime(wakeTimeData);
      if (notifs) setNotifications(JSON.parse(notifs));
      if (notifEnabled !== null) setNotificationsEnabled(JSON.parse(notifEnabled));
      if (playedToday) setHasPlayedToday(JSON.parse(playedToday));
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
    setBedtime(time);
    saveSleepData('bedtime', time);
  };

  const updateWakeTime = (time) => {
    setWakeTime(time);
    saveSleepData('wakeTime', time);
  };

  const toggleNotifications = async (enabled) => {
    setNotificationsEnabled(enabled);
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
  };

  const scheduleSleepReminder = async () => {
    if (!isNotificationSupported) {
      console.warn('Push notifications not supported in Expo Go for Android. Use a development build for full functionality.');
      // Still save the notification preference for when using a development build
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

    try {
      // Setup notifications if not already done
      await setupNotifications();
      
      if (!Notifications) {
        throw new Error('Notifications not available');
      }

      const [hour, minute] = bedtime.split(':').map(Number);
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

      return notificationId;
    } catch (error) {
      console.error('Error scheduling bedtime reminder:', error);
      return null;
    }
  };

  const scheduleWakeUpAlarm = async () => {
    if (!isNotificationSupported) {
      console.warn('Push notifications not supported in Expo Go for Android. Use a development build for full functionality.');
      // Still save the notification preference for when using a development build
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

    try {
      // Setup notifications if not already done
      await setupNotifications();
      
      if (!Notifications) {
        throw new Error('Notifications not available');
      }

      const [hour, minute] = wakeTime.split(':').map(Number);
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

      return notificationId;
    } catch (error) {
      console.error('Error scheduling wake up alarm:', error);
      return null;
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
    isSleepTime,
    notificationsEnabled,
    startSleep,
    endSleep,
    updateSleepGoal,
    updateBedtime,
    updateWakeTime,
    toggleNotifications,
    scheduleSleepReminder,
    scheduleWakeUpAlarm,
    getSleepStats,
    getCurrentSleepDuration,
    playSleepReminderSound
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
};





