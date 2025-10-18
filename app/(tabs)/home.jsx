import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
// import * as Notifications from 'expo-notifications'; // Disabled for web compatibility
import { useSleep } from '../../contexts/SleepContext';
import { useSound } from '../../contexts/SoundContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleNotification } from '../../contexts/SimpleNotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Home() {
  const { user } = useAuth();
  const { 
    isSleeping, 
    currentSession, 
    sleepGoal, 
    bedtime, 
    wakeUpTime: defaultWakeTime, 
    startSleep, 
    endSleep, 
    sleepSessions,
    getSleepStats, 
    getCurrentSleepDuration,
    updateSleepGoal,
    updateBedtime,
    updateWakeTime,
    scheduleSleepReminder,
    scheduleWakeUpAlarm
  } = useSleep();
  
  const { requestPermissions, scheduleBedtimeReminder: scheduleReminder, scheduleWakeUpAlarm: scheduleAlarm } = useSimpleNotification();
  const { colors, isDarkMode } = useTheme();
  
  const { playSound } = useSound();
  const [showSettings, setShowSettings] = useState(false);
  const [tempSleepGoal, setTempSleepGoal] = useState(sleepGoal);
  const [tempBedtime, setTempBedtime] = useState(bedtime);
  const [tempWakeTime, setTempWakeTime] = useState(defaultWakeTime);
  
  // New sleep management states
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
  const [bedtimeTime, setBedtimeTime] = useState(new Date());
  const [wakeUpTime, setWakeUpTime] = useState(new Date());
  const [wakeUpSound, setWakeUpSound] = useState('birds');
  const [alarmSounds] = useState([
    {
      id: 'birds',
      name: 'Birds Chirping',
      icon: '🐦',
      description: 'Gentle bird sounds for peaceful wake-up',
      audioFile: require('../../assets/sounds/birds39-forest-20772.mp3')
    },
    {
      id: 'chimes',
      name: 'Soft Chimes',
      icon: '🔔',
      description: 'Delicate chime sounds for gentle awakening',
      audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3')
    },
    {
      id: 'classic',
      name: 'Classic Alarm',
      icon: '⏰',
      description: 'Traditional alarm clock sound',
      audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3')
    },
    {
      id: 'sleepy-rain',
      name: 'Sleepy Rain',
      icon: '🌧️',
      description: 'Gentle rain sounds for calm wake-up',
      audioFile: require('../../assets/sounds/sleepy-rain-116521.mp3')
    },
    {
      id: 'soft-piano',
      name: 'Soft Piano',
      icon: '🎹',
      description: 'Inspirational piano melodies',
      audioFile: require('../../assets/sounds/soft-piano-inspiration-405221.mp3')
    },
    {
      id: 'silent-waves',
      name: 'Silent Waves',
      icon: '🌊',
      description: 'Calming ocean waves for peaceful awakening',
      audioFile: require('../../assets/sounds/silent-waves-instrumental-333295.mp3')
    },
    {
      id: 'peaceful-sleep',
      name: 'Peaceful Sleep',
      icon: '😴',
      description: 'Gentle ambient sounds for soft wake-up',
      audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3')
    },
    {
      id: 'calm-ocean',
      name: 'Calm Ocean Breeze',
      icon: '🌊',
      description: 'Ocean breeze sounds for refreshing wake-up',
      audioFile: require('../../assets/sounds/calm-ocean-breeze-325556.mp3')
    }
  ]);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sleepDuration, setSleepDuration] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmTime, setAlarmTime] = useState(null);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMusicSelector, setShowMusicSelector] = useState(false);

  const stats = getSleepStats();
  const currentDuration = getCurrentSleepDuration();

  // Wake-up music options with real audio files
  const wakeUpSounds = [
    { 
      id: 'birds', 
      name: 'Birds Chirping', 
      icon: '🐦',
      audioFile: require('../../assets/sounds/birds39-forest-20772.mp3'),
      description: 'Gentle bird songs to wake you naturally'
    },
    { 
      id: 'chimes', 
      name: 'Soft Chimes', 
      icon: '🔔',
      audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3'),
      description: 'Peaceful chimes for a gentle awakening'
    },
    {
      id: 'alarm',
      name: 'Classic Alarm',
      icon: '⏰',      
      audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3'),
      description: 'Traditional alarm sound to wake you up'
    },
    { 
      id: 'nature', 
      name: 'Sleepy Rain', 
      icon: '🌧️',
      audioFile: require('../../assets/sounds/sleepy-rain-116521.mp3'),
      description: 'Gentle rain sounds for a refreshing start'
    },
    {
      id: 'piano',
      name: 'Soft Piano',
      icon: '🎹',
      audioFile: require('../../assets/sounds/soft-piano-inspiration-405221.mp3'),
      description: 'Inspirational piano melodies for a gentle wake-up'
    },
    {
      id: 'waves',
      name: 'Silent Waves',
      icon: '🌊',
      audioFile: require('../../assets/sounds/silent-waves-instrumental-333295.mp3'),
      description: 'Calming instrumental waves for a serene wake-up'
    },
    {
      id: 'calm-ocean-breeze',
      name: 'Calm Ocean Breeze',
      icon: '🌊',
      audioFile: require('../../assets/sounds/calm-ocean-breeze-325556.mp3'),
      description: 'Peaceful ocean breeze for gentle awakening'
    },
    {
      id: 'relaxing-sleep-music',
      name: 'Relaxing Sleep Music',
      icon: '🌧️',
      audioFile: require('../../assets/sounds/relaxing-sleep-music-with-soft-ambient-rain-369762.mp3'),
      description: 'Soft ambient rain for peaceful wake-up'
    },
    {
      id: 'peaceful-sleep',
      name: 'Peaceful Sleep',
      icon: '😴',
      audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3'),
      description: 'Gentle ambient sounds for soft wake-up'
    }
  ];

  useEffect(() => {
    setTempSleepGoal(sleepGoal);
    setTempBedtime(bedtime);
    setTempWakeTime(defaultWakeTime);
  }, [sleepGoal, bedtime, defaultWakeTime]);

  // Load user preferences from Firestore
  useEffect(() => {
    loadUserPreferences();
    setupNotifications();
  }, [user]);

  // Alarm functions
  const triggerAlarm = useCallback(async () => {
    setAlarmActive(true);

    // Find the selected wake-up sound
    const selectedSound = wakeUpSounds.find(s => s.id === wakeUpSound);
    if (selectedSound) {
      await playWakeUpSound(selectedSound);
    }

    // Show alarm notification
    Alert.alert(
      '🌅 Wake Up!',
      'It\'s time to wake up! Your alarm is ringing.',
      [
        {
          text: 'Snooze (5 min)',
          onPress: () => snoozeAlarm(5)
        },
        {
          text: 'Stop Alarm',
          onPress: stopAlarm,
          style: 'destructive'
        }
      ],
      { cancelable: false }
    );
  }, [wakeUpSound, wakeUpSounds, playWakeUpSound]);

  const snoozeAlarm = useCallback((minutes) => {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    setAlarmTime(snoozeTime);
    setAlarmActive(false);
    stopWakeUpSound();

    Alert.alert('Snooze', `Alarm snoozed for ${minutes} minutes`);
  }, [stopWakeUpSound]);

  const stopAlarm = useCallback(() => {
    setAlarmActive(false);
    setAlarmTime(null);
    stopWakeUpSound();
  }, [stopWakeUpSound]);

  const setAlarm = () => {
    setAlarmTime(wakeUpTime);
    Alert.alert('Alarm Set', `Alarm set for ${wakeUpTime.toLocaleTimeString()}`);
  };

  // Real-time clock and alarm system
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if it's time for the alarm
      if (alarmTime && !alarmActive) {
        const alarmDate = new Date(alarmTime);
        const timeDiff = alarmDate.getTime() - now.getTime();
        
        // If alarm time is within 1 minute, trigger alarm
        if (timeDiff <= 60000 && timeDiff >= 0) {
          triggerAlarm();
        }
      }

      // Check if sleep goal hours have been reached
      if (isSleeping && currentDuration >= sleepGoal) {
        // Trigger alarm when sleep goal is reached
        if (!alarmActive) {
          triggerAlarm();
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [alarmTime, alarmActive, triggerAlarm, isSleeping, currentDuration, sleepGoal]);

  // Audio functions for wake-up sounds
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playWakeUpSound = useCallback(async (soundOption) => {
    try {
      console.log('Attempting to play wake-up sound:', soundOption.name);
      
      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Load and play new sound with better error handling
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundOption.audioFile,
        { 
          shouldPlay: true, 
          isLooping: false
        }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      console.log('Wake-up sound loaded and playing successfully');

    } catch (error) {
      console.error('Error playing wake-up sound:', error);
      Alert.alert(
        'Audio Error', 
        `Could not play "${soundOption.name}". The audio file may be corrupted or in an unsupported format.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  }, [sound]);

  const testAlarmSound = async (soundId) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const selectedSound = alarmSounds.find(s => s.id === soundId);
      if (selectedSound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          selectedSound.audioFile,
          { shouldPlay: true, isLooping: false }
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        // Stop after 3 seconds for testing
        setTimeout(async () => {
          if (newSound) {
            await newSound.stopAsync();
            await newSound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error testing alarm sound:', error);
    }
  };

  const stopWakeUpSound = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  }, [sound]);


  // Calculate sleep duration in real-time
  useEffect(() => {
    calculateSleepDuration();
  }, [bedtimeTime, wakeUpTime]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Sync with SleepContext values
  useEffect(() => {
    if (bedtime) {
      const [hours, minutes] = bedtime.split(':');
      const bedtimeDate = new Date();
      bedtimeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setBedtimeTime(bedtimeDate);
    }
    
    if (defaultWakeTime) {
      const [hours, minutes] = defaultWakeTime.split(':');
      const wakeTimeDate = new Date();
      wakeTimeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setWakeUpTime(wakeTimeDate);
    }
  }, [bedtime, defaultWakeTime]);

  // Load user preferences from Firestore
  const loadUserPreferences = async () => {
    if (!user || !user.id) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.bedtimeTime) setBedtimeTime(new Date(data.bedtimeTime));
        if (data.wakeUpTime) setWakeUpTime(new Date(data.wakeUpTime));
        if (data.wakeUpSound) setWakeUpSound(data.wakeUpSound);
        if (data.notificationsEnabled) setNotificationsEnabled(data.notificationsEnabled);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Save user preferences to Firestore
  const saveUserPreferences = async () => {
    if (!user || !user.id) return;
    
    try {
      await setDoc(doc(db, 'users', user.id), {
        bedtimeTime: bedtimeTime.toISOString(),
        wakeUpTime: wakeUpTime.toISOString(),
        wakeUpSound,
        notificationsEnabled,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      Alert.alert('Success', 'Sleep preferences saved successfully!');
    } catch (error) {
      console.error('Error saving user preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  // Calculate sleep duration
  const calculateSleepDuration = () => {
    const bedtime = new Date(bedtimeTime);
    const wake = new Date(wakeUpTime);
    
    // Handle overnight sleep (bedtime to next day wake time)
    if (wake <= bedtime) {
      wake.setDate(wake.getDate() + 1);
    }
    
    const diffMs = wake - bedtime;
    const diffHours = diffMs / (1000 * 60 * 60);
    setSleepDuration(Math.round(diffHours * 10) / 10);
  };

  // Setup notifications using the new notification system
  const setupNotifications = async () => {
    try {
      const granted = await requestPermissions();
      
      if (granted) {
        setNotificationsEnabled(true);
        console.log('Notifications enabled successfully!');
      } else {
        console.log('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Schedule bedtime reminder using the new notification system
  const scheduleBedtimeReminder = async () => {
    if (!notificationsEnabled) return;
    
    try {
      const bedtime = bedtimeTime.toTimeString().slice(0, 5); // Convert to HH:MM format
      const wakeTime = wakeUpTime.toTimeString().slice(0, 5); // Convert to HH:MM format
      
      // Update the SleepContext with the new times
      updateBedtime(bedtime);
      updateWakeTime(wakeTime);
      
      const bedtimeResult = await scheduleReminder(bedtime);
      const wakeResult = await scheduleAlarm(wakeTime);
      
      if (bedtimeResult && wakeResult) {
        Alert.alert('Success', 'Sleep reminders scheduled successfully!');
        console.log('Bedtime reminder scheduled for:', bedtime);
        console.log('Wake up alarm scheduled for:', wakeTime);
      } else {
        Alert.alert('Info', 'Notification preferences saved locally. Full notifications require proper permissions.');
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications. Please try again.');
    }
  };


  // Handle bedtime time change
  const onBedtimeChange = (event, selectedDate) => {
    setShowBedtimePicker(false);
    if (selectedDate) {
      setBedtimeTime(selectedDate);
    }
  };

  // Handle wake time change
  const onWakeTimeChange = (event, selectedDate) => {
    setShowWakeTimePicker(false);
    if (selectedDate) {
      setWakeUpTime(selectedDate);
    }
  };

  // Save and schedule
  const handleSaveAndSchedule = async () => {
    await saveUserPreferences();
    await scheduleBedtimeReminder();
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get recent sleep sessions (last 5 sessions)
  const getRecentSleepSessions = () => {
    if (!sleepSessions || sleepSessions.length === 0) return [];
    
    return sleepSessions
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 5);
  };

  const formatSleepSessionDate = (startTime) => {
    const date = new Date(startTime);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatSleepDuration = (duration) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const handleStartSleep = () => {
    playSound('button');
    startSleep();
    Alert.alert('Sleep Started', 'Sleep tracking has begun. Sweet dreams! 🌙');
  };

  const handleEndSleep = () => {
    playSound('button');
    Alert.alert(
      'End Sleep Session',
      'How was your sleep quality?',
      [
        { text: 'Poor', onPress: () => endSleep('Poor') },
        { text: 'Fair', onPress: () => endSleep('Fair') },
        { text: 'Good', onPress: () => endSleep('Good') },
        { text: 'Great', onPress: () => endSleep('Great') },
        { text: 'Excellent', onPress: () => endSleep('Excellent') }
      ]
    );
  };

  const handleSaveSettings = () => {
    playSound('success');
    updateSleepGoal(tempSleepGoal);
    updateBedtime(tempBedtime);
    updateWakeTime(tempWakeTime);
    
    // Save alarm settings
    if (alarmEnabled && alarmTime) {
      // Parse alarm time and set it
      const [hours, minutes] = alarmTime.split(':');
      const alarmDate = new Date();
      alarmDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setAlarmTime(alarmDate.toISOString());
      scheduleWakeUpAlarm();
    } else {
      setAlarmTime(null);
    }
    
    scheduleSleepReminder();
    setShowSettings(false);
    Alert.alert('Settings Saved', 'Your sleep preferences have been updated!');
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Stars Background Component (shinning stars with crescent emoji)
  const renderStars = () => {
    if (!isDarkMode) return null;
    
    return (
      <View style={styles.nightSkyContainer}>
        {/* Crescent Emoji */}
        <View style={styles.crescentContainer}>
          <Text style={styles.crescentEmoji}>🌙</Text>
        </View>
        
        {/* Shinning Stars */}
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: Math.random() * 0.8 + 0.2,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {renderStars()}
      {/* Greeting and Settings Header */}
      <View style={[styles.greetingHeader, { marginTop: 80 }]}>
        {/* Left Side - Greetings */}
        <View style={styles.greetingLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}, {user?.firstName || 'Dream Explorer'}!
          </Text>
          <Text style={[styles.currentTime, { color: colors.textSecondary }]}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
            Ready to track your sleep journey?
          </Text>
        </View>
        
        {/* Right Side - Settings Button */}
        <TouchableOpacity 
          style={[styles.headerSettingsButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            playSound('button');
            setShowSettings(true);
          }}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Sleep Tracking Card */}
      <View style={[styles.sleepTrackingCard, { backgroundColor: colors.card, shadowColor: colors.shadow, marginTop: 20 }]}>
        <View style={styles.sleepHeader}>
          <View style={styles.sleepTitleContainer}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={colors.primary} />
            <Text style={[styles.sleepTitle, { color: colors.text }]}>Sleep Tracking</Text>
          </View>
          <View style={styles.sleepStatus}>
            <View style={[styles.statusDot, { backgroundColor: isSleeping ? colors.success : colors.textMuted }]} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {isSleeping ? 'Sleeping' : 'Awake'}
            </Text>
          </View>
        </View>

        {isSleeping ? (
          <View style={styles.sleepingContent}>
            <View style={styles.sleepDurationContainer}>
              <Text style={styles.sleepDuration}>
                {Math.floor(currentDuration)}h {Math.round((currentDuration % 1) * 60)}m
              </Text>
              <Text style={styles.sleepDurationLabel}>Sleep Duration</Text>
              {currentDuration >= sleepGoal && (
                <View style={styles.goalReachedContainer}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                  <Text style={styles.goalReachedText}>Goal Reached! Alarm will trigger soon.</Text>
                </View>
              )}
              {alarmTime && alarmEnabled && (
                <View style={styles.alarmIndicatorContainer}>
                  <MaterialCommunityIcons name="alarm" size={16} color={colors.primary} />
                  <Text style={styles.alarmIndicatorText}>
                    Alarm set for {new Date(alarmTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.endSleepButton} onPress={handleEndSleep}>
              <MaterialCommunityIcons name="stop" size={24} color="#FFFFFF" />
              <Text style={styles.endSleepText}>End Sleep</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.awakeContent}>
            <View style={styles.sleepGoalDisplay}>
              <Text style={styles.goalNumber}>{sleepGoal}h</Text>
              <Text style={styles.goalLabel}>Sleep Goal</Text>
            </View>
            <TouchableOpacity style={styles.startSleepButton} onPress={handleStartSleep}>
              <MaterialCommunityIcons name="sleep" size={32} color="#FFFFFF" />
              <Text style={styles.startSleepText}>Start Sleep</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>


      {/* Sleep Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sleep Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.averageSleep}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average Sleep</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.sleepStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.goalAchievement}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goal Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalSessions}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Sessions</Text>
          </View>
        </View>
      </View>

      {/* Recent Sleep Sessions */}
      {stats.last7Days > 0 && (
        <View style={[styles.recentSessionsContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Sleep Sessions</Text>
          <View style={styles.sessionsList}>
            <Text style={[styles.sessionsText, { color: colors.textSecondary }]}>
              You've tracked {stats.last7Days} sleep sessions in the last 7 days.
              Keep up the great work! 🌙
            </Text>
          </View>
        </View>
      )}

      {/* Sleep Tips */}
      <View style={[styles.tipsContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sleep Tips</Text>
        <View style={styles.tipsList}>
          <View style={[styles.tipItem, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Go to bed at the same time every night
            </Text>
          </View>
          <View style={[styles.tipItem, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="phone-off" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Avoid screens 1 hour before bedtime
            </Text>
          </View>
          <View style={[styles.tipItem, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="thermometer" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Keep your bedroom cool and dark
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacing} />

      {/* DateTimePicker Modals */}
      {showBedtimePicker && (
        <DateTimePicker
          value={bedtimeTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onBedtimeChange}
        />
      )}

      {showWakeTimePicker && (
        <DateTimePicker
          value={wakeUpTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onWakeTimeChange}
        />
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sleep Settings</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  playSound('button');
                  setShowSettings(false);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsContent}>
              {/* Sleep Goal */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Sleep Goal (hours)</Text>
                <View style={styles.goalSelector}>
                  {[6, 7, 8, 9, 10].map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      style={[
                        styles.goalOption,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        tempSleepGoal === goal && [styles.goalOptionActive, { backgroundColor: colors.primary }]
                      ]}
                      onPress={() => {
                        playSound('button');
                        setTempSleepGoal(goal);
                      }}
                    >
                      <Text style={[
                        styles.goalOptionText,
                        { color: colors.text },
                        tempSleepGoal === goal && [styles.goalOptionTextActive, { color: '#FFFFFF' }]
                      ]}>
                        {goal}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bedtime */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Bedtime</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={tempBedtime}
                  onChangeText={setTempBedtime}
                  placeholder="22:00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Wake Time */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Wake Up Time</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={tempWakeTime}
                  onChangeText={setTempWakeTime}
                  placeholder="06:00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Alarm Wake Up */}
              <View style={styles.settingItem}>
                <View style={styles.alarmSettingHeader}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Alarm Wake Up</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Set alarm if you don't wake up naturally</Text>
                </View>
                
                <View style={styles.alarmToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.alarmToggle,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      alarmEnabled && [styles.alarmToggleActive, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => {
                      playSound('button');
                      setAlarmEnabled(!alarmEnabled);
                    }}
                  >
                    <View style={[
                      styles.alarmToggleButton,
                      { backgroundColor: colors.surface },
                      alarmEnabled && [styles.alarmToggleButtonActive, { backgroundColor: '#FFFFFF' }]
                    ]} />
                  </TouchableOpacity>
                  <Text style={[styles.alarmToggleLabel, { color: colors.text }]}>
                    {alarmEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>

                {alarmEnabled && (
                  <View style={styles.alarmTimeContainer}>
                    <Text style={[styles.alarmTimeLabel, { color: colors.text }]}>Alarm Time</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                      value={alarmTime}
                      onChangeText={setAlarmTime}
                      placeholder="07:00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  playSound('button');
                  setShowSettings(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveSettings}
              >
                <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inlineHeader: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTextContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickStatText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  quickStatValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 4,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greetingLeft: {
    flex: 1,
  },
  headerSettingsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 16,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0E6FA',
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  sleepTrackingCard: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  sleepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sleepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A3E9E',
  },
  sleepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sleepDurationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alarmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sleepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sleepingContent: {
    alignItems: 'center',
  },
  sleepDuration: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#9B70D8',
    marginBottom: 8,
  },
  sleepDurationLabel: {
    fontSize: 16,
    color: '#9B70D8',
    marginBottom: 24,
  },
  goalReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
  },
  goalReachedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  alarmIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
  },
  alarmIndicatorText: {
    fontSize: 14,
    color: '#9B70D8',
    fontWeight: '600',
    marginLeft: 6,
  },
  endSleepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  endSleepText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  awakeContent: {
    alignItems: 'center',
  },
  sleepGoalDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  goalNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9B70D8',
  },
  goalLabel: {
    fontSize: 16,
    color: '#9B70D8',
  },
  startSleepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B70D8',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startSleepText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  scheduleCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6A3E9E',
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleInfo: {
    marginLeft: 12,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9B70D8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9B70D8',
    textAlign: 'center',
  },
  recentSessionsContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  sessionsList: {
    alignItems: 'center',
  },
  sessionsText: {
    fontSize: 16,
    color: '#9B70D8',
    textAlign: 'center',
    lineHeight: 24,
  },
  tipsContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal Styles
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A3E9E',
  },
  closeButton: {
    padding: 4,
  },
  settingsContent: {
    padding: 20,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  alarmSettingHeader: {
    marginBottom: 12,
  },
  alarmToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alarmToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    padding: 2,
    marginRight: 12,
  },
  alarmToggleActive: {
    backgroundColor: '#9B70D8',
  },
  alarmToggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  alarmToggleButtonActive: {
    transform: [{ translateX: 20 }],
  },
  alarmToggleLabel: {
    fontSize: 14,
    color: '#6A3E9E',
    fontWeight: '500',
  },
  alarmTimeContainer: {
    marginTop: 8,
  },
  alarmTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  goalSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  goalOptionActive: {
    backgroundColor: '#9B70D8',
    borderColor: '#9B70D8',
  },
  goalOptionText: {
    fontSize: 14,
    color: '#9B70D8',
    fontWeight: '500',
  },
  goalOptionTextActive: {
    color: '#FFFFFF',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#6A3E9E',
    backgroundColor: '#F0E6FA',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9B70D8',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#9B70D8',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alarmSoundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  alarmSoundCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alarmSoundCardSelected: {
    borderColor: '#9B70D8',
    backgroundColor: '#F3E8FF',
    shadowColor: '#9B70D8',
    shadowOpacity: 0.2,
  },
  alarmSoundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alarmSoundInfo: {
    flex: 1,
  },
  alarmSoundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alarmSoundDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  testAlarmButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B70D8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  selectedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Stars and Crescent Styles
  nightSkyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  crescentContainer: {
    position: 'absolute',
    top: 80,
    right: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crescentEmoji: {
    fontSize: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
});
    alignItems: 'center',
  },
  crescentEmoji: {
    fontSize: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
});