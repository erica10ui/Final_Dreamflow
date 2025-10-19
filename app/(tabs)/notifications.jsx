import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSound } from '../../contexts/SoundContext';
import { useJournal } from '../../contexts/JournalContext';
import { useSimpleNotification } from '../../contexts/SimpleNotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSleep } from '../../contexts/SleepContext';
import NotificationTest from '../../components/NotificationTest';

const { width } = Dimensions.get('window');

export default function NotificationScreen() {
  const { user } = useAuth();
  const { playSound } = useSound();
  const { getStats, dreamEntries } = useJournal();
  const { isSleeping } = useSleep();
  const { scheduleBedtimeReminder, scheduleWakeUpAlarm } = useSimpleNotification();
  const { isDarkMode, toggleTheme, colors } = useTheme();

  // Stars Background Component (shining stars with crescent emoji)
  const renderStars = () => {
    if (!isDarkMode) return null;
    
    return (
      <View style={styles.nightSkyContainer}>
        {/* Crescent Emoji */}
        <View style={styles.crescentContainer}>
          <Text style={styles.crescentEmoji}>🌙</Text>
        </View>
        
        {/* Animated Stars */}
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
              },
            ]}
          />
        ))}
      </View>
    );
  };
  const { sleepSessions, sleepGoal, bedtime, wakeUpTime, getSleepStats } = useSleep();
  
  // State for notifications and sleep tracking
  const [notifications, setNotifications] = useState([]);
  const [sleepReminders, setSleepReminders] = useState([]);
  
  // Get real sleep statistics from SleepContext
  const sleepStats = getSleepStats();
  
  // Calculate sleep quality from recent sessions (if quality data is available)
  const calculateSleepQuality = () => {
    if (sleepSessions.length === 0) return 4.2; // Default value
    
    // Get last 7 sessions for quality calculation
    const recentSessions = sleepSessions.slice(-7);
    const qualitySum = recentSessions.reduce((sum, session) => {
      // If session has quality data, use it; otherwise estimate based on duration vs goal
      if (session.quality) {
        return sum + session.quality;
      } else {
        // Estimate quality based on how close duration is to goal
        const durationRatio = session.duration / sleepGoal;
        return sum + Math.min(5, Math.max(1, durationRatio * 5));
      }
    }, 0);
    
    return Math.round((qualitySum / recentSessions.length) * 10) / 10;
  };
  
  // Calculate improvement rate by comparing recent vs older sessions
  const calculateImprovementRate = () => {
    if (sleepSessions.length < 14) return 12; // Default value if not enough data
    
    const recentSessions = sleepSessions.slice(-7);
    const olderSessions = sleepSessions.slice(-14, -7);
    
    const recentAvg = recentSessions.reduce((sum, session) => sum + session.duration, 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, session) => sum + session.duration, 0) / olderSessions.length;
    
    const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
    return Math.round(Math.max(0, improvement));
  };
  
  const realSleepStats = {
    bedtime: bedtime || '22:00',
    wakeTime: wakeUpTime || '07:00',
    sleepDuration: sleepStats.averageSleep || 0,
    sleepQuality: calculateSleepQuality(),
    sleepStreak: sleepStats.sleepStreak || 0,
    totalSleepHours: sleepStats.totalSleep || 0,
    avgSleepScore: Math.round((sleepStats.goalAchievement / Math.max(sleepStats.totalSessions, 1)) * 100) || 0,
    improvementRate: calculateImprovementRate()
  };

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSleepTime, setIsSleepTime] = useState(false);
  const [timeToSleep, setTimeToSleep] = useState(0);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get real-time stats from journal context
  const stats = getStats ? getStats() : { totalDreams: 0, sleepStreak: 0, avgSleepQuality: 0 };

  // Real-time clock update - simplified to prevent infinite loops
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if it's sleep time - with proper validation
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Validate bedtime format and provide fallback
      const bedtimeString = realSleepStats.bedtime || '22:00';
      const bedtimeParts = bedtimeString.split(':');
      
      if (bedtimeParts.length === 2) {
        const bedHour = parseInt(bedtimeParts[0], 10);
        const bedMinute = parseInt(bedtimeParts[1], 10);
        
        // Validate parsed values
        if (!isNaN(bedHour) && !isNaN(bedMinute) && bedHour >= 0 && bedHour <= 23 && bedMinute >= 0 && bedMinute <= 59) {
          const bedTimeMinutes = bedHour * 60 + bedMinute;
          
          // Handle overnight sleep (bedtime is next day)
          let timeDiff = bedTimeMinutes - currentTimeMinutes;
          if (timeDiff < 0) {
            timeDiff += 24 * 60; // Add 24 hours in minutes
          }
          
          const newIsSleepTime = timeDiff <= 30 && timeDiff >= 0;
          const newTimeToSleep = Math.max(0, timeDiff);
          
          // Only update state if values have changed
          setIsSleepTime(prev => prev !== newIsSleepTime ? newIsSleepTime : prev);
          setTimeToSleep(prev => prev !== newTimeToSleep ? newTimeToSleep : prev);
        } else {
          console.warn('Invalid bedtime format:', bedtimeString);
          // Set default values if bedtime is invalid
          setIsSleepTime(false);
          setTimeToSleep(0);
        }
      } else {
        console.warn('Invalid bedtime format:', bedtimeString);
        // Set default values if bedtime is invalid
        setIsSleepTime(false);
        setTimeToSleep(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [realSleepStats.bedtime]); // Include realSleepStats.bedtime in dependencies

  // Pulse animation for sleep time
  useEffect(() => {
    if (isSleepTime) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => {
        pulse.stop();
      };
    }
  }, [isSleepTime, pulseAnim]);

  // Generate sleep reminders - memoized to prevent re-runs
  const sleepRemindersData = useMemo(() => [
    {
      id: 1,
      type: 'bedtime',
      title: '🌙 Time for Bed!',
      message: `It's ${realSleepStats.bedtime} - your optimal bedtime`,
      time: realSleepStats.bedtime,
      priority: 'high',
      active: true
    },
    {
      id: 2,
      type: 'wind_down',
      title: '🧘 Wind Down Time',
      message: 'Start your bedtime routine in 30 minutes',
      time: '21:30',
      priority: 'medium',
      active: true
    },
    {
      id: 3,
      type: 'morning',
      title: '☀️ Good Morning!',
      message: `Time to wake up at ${realSleepStats.wakeTime}`,
      time: realSleepStats.wakeTime,
      priority: 'high',
      active: true
    },
    {
      id: 4,
      type: 'hydration',
      title: '💧 Hydration Reminder',
      message: 'Drink water but avoid too much before bed',
      time: '21:00',
      priority: 'low',
      active: true
    },
    {
      id: 5,
      type: 'journal',
      title: '📝 Dream Journal',
      message: 'Record your dreams before they fade away',
      time: '07:30',
      priority: 'medium',
      active: true
    }
  ], [realSleepStats.bedtime, realSleepStats.wakeTime]);

  // Set sleep reminders once
  useEffect(() => {
    setSleepReminders(sleepRemindersData);
  }, [sleepRemindersData]);

  // Generate improvement notifications - memoized to prevent re-runs
  const improvementNotifications = useMemo(() => [
    {
      id: 1,
      type: 'achievement',
      title: '🎉 Sleep Streak!',
      message: `You've maintained your sleep schedule for ${realSleepStats.sleepStreak} days!`,
      time: '2 hours ago',
      read: false,
      icon: 'trophy',
      color: '#F59E0B'
    },
    {
      id: 2,
      type: 'improvement',
      title: '📈 Sleep Quality Up!',
      message: `Your sleep quality improved by ${realSleepStats.improvementRate}% this week`,
      time: '1 day ago',
      read: false,
      icon: 'trending-up',
      color: '#10B981'
    },
    {
      id: 3,
      type: 'milestone',
      title: '🌟 Dream Master!',
      message: `You've recorded ${stats.totalDreams || 0} dreams! Keep it up!`,
      time: '2 days ago',
      read: false,
      icon: 'star',
      color: '#9B70D8'
    },
    {
      id: 4,
      type: 'tip',
      title: '💡 Sleep Tip',
      message: 'Try reading for 15 minutes before bed to improve sleep quality',
      time: '3 days ago',
      read: true,
      icon: 'lightbulb',
      color: '#3B82F6'
    },
    {
      id: 5,
      type: 'reminder',
      title: '⏰ Bedtime Soon',
      message: 'Your bedtime is in 30 minutes. Start winding down!',
      time: 'Just now',
      read: false,
      icon: 'clock',
      color: '#EF4444'
    }
  ], [realSleepStats.sleepStreak, realSleepStats.improvementRate, stats.totalDreams]);

  // Set notifications once
  useEffect(() => {
    setNotifications(improvementNotifications);
  }, [improvementNotifications]);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Toggle reminder
  const toggleReminder = (id) => {
    setSleepReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, active: !reminder.active } : reminder
      )
    );
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get time until sleep
  const getTimeUntilSleep = () => {
    // Handle invalid or NaN values
    if (isNaN(timeToSleep) || timeToSleep < 0) {
      return '--';
    }
    
    if (timeToSleep <= 0) return 'Now!';
    
    const hours = Math.floor(timeToSleep / 60);
    const minutes = Math.floor(timeToSleep % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Settings functions
  const { logout } = useAuth();
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await logout();
              if (result.success) {
                console.log('Profile: Logout successful');
                // AuthRouter will handle the redirect to welcome screen
              } else {
                Alert.alert('Error', 'Logout failed. Please try again.');
              }
            } catch (error) {
              console.error('Profile: Logout error:', error);
              Alert.alert('Error', 'An unexpected error occurred during logout.');
            }
          }
        }
      ]
    );
  };

  const handleEditName = () => {
    Alert.alert(
      'Edit Name',
      'Name editing functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  const toggleDarkMode = () => {
    toggleTheme();
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Add notification toggle logic here
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    // Add sound toggle logic here
  };

  const toggleAutoSave = () => {
    setAutoSave(!autoSave);
    // Add auto-save toggle logic here
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode);
    // Add privacy mode toggle logic here
  };

  // Schedule sleep notifications using the new notification system
  const scheduleSleepNotifications = async () => {
    try {
      const bedtime = realSleepStats.bedtime || '22:00';
      const wakeTime = realSleepStats.wakeTime || '07:00';
      
      const bedtimeResult = await scheduleBedtimeReminder(bedtime);
      const wakeResult = await scheduleWakeUpAlarm(wakeTime);
      
      if (bedtimeResult && wakeResult) {
        Alert.alert('Success', 'Sleep notifications scheduled successfully!');
        console.log('Sleep notifications scheduled for:', bedtime, 'and', wakeTime);
      } else {
        Alert.alert('Info', 'Notification preferences saved locally. Full notifications require proper permissions.');
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderStars()}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.headerCardContent}>
          <View style={[styles.headerCardIcon, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="bell" size={32} color={colors.primary} />
          </View>
          <View style={styles.headerCardText}>
            <Text style={[styles.headerCardTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.headerCardSubtitle, { color: colors.textSecondary }]}>Stay updated with your sleep schedule and wellness reminders</Text>
          </View>
          <View style={styles.headerButtons}>
          <TouchableOpacity 
              style={[styles.settingsButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
              onPress={() => setShowSettings(true)}
          >
              <MaterialCommunityIcons name="cog" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sleep Time Alert */}
      {isSleepTime && !isSleeping && (
        <Animated.View style={[styles.sleepAlert, { transform: [{ scale: pulseAnim }], marginTop: 20 }]}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={32} color="#FFFFFF" />
          <View style={styles.sleepAlertContent}>
            <Text style={styles.sleepAlertTitle}>Time to Sleep!</Text>
            <Text style={styles.sleepAlertMessage}>
              Your bedtime is now. Start your sleep routine!
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Sleep Status Card */}
      <View style={[styles.sleepStatusCard, { backgroundColor: colors.surface, shadowColor: colors.shadow, marginTop: 20 }]}>
        <View style={styles.sleepStatusHeader}>
          <Text style={[styles.sleepStatusTitle, { color: colors.text }]}>🌙 Sleep Status</Text>
          <Text style={[styles.currentTime, { color: colors.textSecondary }]}>{formatTime(currentTime)}</Text>
        </View>
        
        <View style={styles.sleepStatusContent}>
          <View style={styles.sleepTimeInfo}>
            <View style={styles.sleepTimeItem}>
              <Text style={[styles.sleepTimeLabel, { color: colors.textSecondary }]}>Bedtime</Text>
              <Text style={[styles.sleepTimeValue, { color: colors.text }]}>{realSleepStats.bedtime}</Text>
            </View>
            <View style={styles.sleepTimeItem}>
              <Text style={[styles.sleepTimeLabel, { color: colors.textSecondary }]}>Wake Time</Text>
              <Text style={[styles.sleepTimeValue, { color: colors.text }]}>{realSleepStats.wakeTime}</Text>
            </View>
            <View style={styles.sleepTimeItem}>
              <Text style={[styles.sleepTimeLabel, { color: colors.textSecondary }]}>Time Until Sleep</Text>
              <Text style={[styles.sleepTimeValue, { color: isSleepTime ? '#EF4444' : '#9B70D8' }]}>
                {getTimeUntilSleep()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.scheduleButton, { backgroundColor: colors.primary }]}
            onPress={scheduleSleepNotifications}
          >
            <MaterialCommunityIcons name="bell-plus" size={20} color="#FFFFFF" />
            <Text style={styles.scheduleButtonText}>Schedule Notifications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Unified Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 All Notifications</Text>
          <Text style={[styles.notificationCount, { color: colors.textSecondary }]}>
            {(notifications.filter(n => !n.read).length + sleepReminders.filter(r => r.active).length)} active
          </Text>
        </View>
        
        {/* Sleep Reminders as Notifications */}
        {sleepReminders.map((reminder) => (
          <TouchableOpacity 
            key={`reminder-${reminder.id}`} 
            style={[styles.notificationCard, { backgroundColor: colors.surface, shadowColor: colors.shadow, opacity: reminder.active ? 1 : 0.6 }]}
            onPress={() => toggleReminder(reminder.id)}
          >
            <View style={[styles.notificationIcon, { backgroundColor: reminder.active ? '#9B70D8' : '#9CA3AF' }]}>
              <MaterialCommunityIcons 
                name={reminder.type === 'bedtime' ? 'moon-waning-crescent' : 
                      reminder.type === 'wind_down' ? 'meditation' :
                      reminder.type === 'morning' ? 'weather-sunny' :
                      reminder.type === 'hydration' ? 'cup' : 'book-open'} 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: colors.text, fontWeight: reminder.active ? '600' : '400' }]}>
                {reminder.title}
              </Text>
              <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{reminder.message}</Text>
              <View style={styles.notificationTimeContainer}>
                <Text style={[styles.notificationTime, { color: colors.textMuted }]}>{reminder.time}</Text>
                {reminder.priority === 'high' && <Text style={styles.priorityBadgeHigh}>High</Text>}
                {reminder.priority === 'medium' && <Text style={styles.priorityBadgeMedium}>Medium</Text>}
                {reminder.priority === 'low' && <Text style={styles.priorityBadgeLow}>Low</Text>}
              </View>
            </View>
            {reminder.active && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {/* Improvement Notifications */}
        {notifications.map((notification) => (
          <TouchableOpacity 
            key={notification.id} 
            style={[styles.notificationCard, { backgroundColor: colors.surface, shadowColor: colors.shadow, opacity: notification.read ? 0.6 : 1 }]}
            onPress={() => markAsRead(notification.id)}
          >
            <View style={[styles.notificationIcon, { backgroundColor: notification.color }]}>
              <MaterialCommunityIcons name={notification.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: colors.text, fontWeight: notification.read ? '400' : '600' }]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{notification.message}</Text>
              <Text style={[styles.notificationTime, { color: colors.textMuted }]}>{notification.time}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {/* Sleep Statistics as Notification */}
        <TouchableOpacity style={[styles.notificationCard, { backgroundColor: colors.surface, shadowColor: colors.shadow, opacity: 1 }]} onPress={() => {}}>
          <View style={[styles.notificationIcon, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: colors.text, fontWeight: '600' }]}>📊 Sleep Statistics</Text>
            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
              {realSleepStats.sleepDuration}h avg sleep • {realSleepStats.sleepStreak} day streak • {realSleepStats.avgSleepScore}% sleep score
            </Text>
            <Text style={[styles.notificationTime, { color: colors.textMuted }]}>Updated now</Text>
          </View>
        </TouchableOpacity>
      </View>


      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Settings Modal */}
      {showSettings && (
        <View style={styles.settingsModal}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowSettings(false)}
          >
          <TouchableOpacity 
              style={[styles.settingsContainer, { backgroundColor: colors.surface }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
            {/* Settings Header */}
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>⚙️ Settings</Text>
          <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

            {/* Settings Content */}
            <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
              
              {/* Appearance Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 Appearance</Text>
                
                <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]} onPress={toggleDarkMode}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="theme-light-dark" size={24} color={colors.primary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Switch between light and dark themes</Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, isDarkMode && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, isDarkMode && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
      </View>

              {/* Notifications Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 Notifications</Text>
                
                <TouchableOpacity style={styles.settingItem} onPress={toggleNotifications}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="bell" size={24} color="#9B70D8" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Push Notifications</Text>
                      <Text style={styles.settingDescription}>Receive sleep reminders and updates</Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, notificationsEnabled && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Audio Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🔊 Audio</Text>
                
                <TouchableOpacity style={styles.settingItem} onPress={toggleSound}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="volume-high" size={24} color="#9B70D8" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Sound Effects</Text>
                      <Text style={styles.settingDescription}>Play sounds for interactions</Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, soundEnabled && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, soundEnabled && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Privacy Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🔒 Privacy & Security</Text>
                
                <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="lock-reset" size={24} color="#9B70D8" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Change Password</Text>
                      <Text style={styles.settingDescription}>Update your account password</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={togglePrivacyMode}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="shield-account" size={24} color="#9B70D8" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Privacy Mode</Text>
                      <Text style={styles.settingDescription}>Hide sensitive information</Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, privacyMode && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, privacyMode && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Data Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>💾 Data & Storage</Text>
                
                <TouchableOpacity style={styles.settingItem} onPress={toggleAutoSave}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="content-save" size={24} color="#9B70D8" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Auto Save</Text>
                      <Text style={styles.settingDescription}>Automatically save journal entries</Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, autoSave && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, autoSave && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Account Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Account</Text>
                
                <TouchableOpacity style={styles.settingItem} onPress={handleEditName}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="account-edit" size={24} color="#9B70D8" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Edit Name</Text>
                      <Text style={styles.settingDescription}>Change your display name</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                  <View style={styles.settingLeft}>
                    <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Logout</Text>
                      <Text style={styles.settingDescription}>Sign out of your account</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

    </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  inlineHeader: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9B70D8',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E6FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#9B70D8',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sleepAlert: {
    backgroundColor: '#9B70D8',
    margin: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sleepAlertContent: {
    marginLeft: 16,
    flex: 1,
  },
  sleepAlertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sleepAlertMessage: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  sleepStatusCard: {
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  sleepStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sleepStatusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
  },
  currentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B70D8',
  },
  sleepStatusContent: {
    gap: 16,
  },
  sleepTimeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepTimeItem: {
    alignItems: 'center',
    flex: 1,
  },
  sleepTimeLabel: {
    fontSize: 12,
    color: '#9B70D8',
    marginBottom: 4,
  },
  sleepTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A3E9E',
  },
  scheduleButton: {
    backgroundColor: '#9B70D8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 16,
  },
  notificationCount: {
    fontSize: 12,
    color: '#9B70D8',
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  reminderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 14,
    color: '#9B70D8',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    color: '#9B70D8',
    fontWeight: '500',
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#6A3E9E',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#9B70D8',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9B70D8',
  },
  notificationTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9B70D8',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9B70D8',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
  
  // Settings Modal Styles
  settingsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#9B70D8',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    maxHeight: 500,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#718096',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#9B70D8',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  // Notifications Header Styles
  // Header Card Styles (matching journal and relax format)
  headerCard: {
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCardText: {
    flex: 1,
  },
  headerCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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