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

const { width } = Dimensions.get('window');

export default function NotificationScreen() {
  const { user } = useAuth();
  const { playSound } = useSound();
  const { getStats, dreamEntries } = useJournal();
  
  // State for notifications and sleep tracking
  const [notifications, setNotifications] = useState([]);
  const [sleepReminders, setSleepReminders] = useState([]);
  const [sleepStats, setSleepStats] = useState({
    bedtime: '22:00',
    wakeTime: '07:00',
    sleepDuration: 9,
    sleepQuality: 4.2,
    sleepStreak: 7,
    totalSleepHours: 63,
    avgSleepScore: 85,
    improvementRate: 12
  });
  
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
      
      // Check if it's sleep time
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      const [bedHour, bedMinute] = sleepStats.bedtime.split(':').map(Number);
      const bedTimeMinutes = bedHour * 60 + bedMinute;
      
      const timeDiff = bedTimeMinutes - currentTimeMinutes;
      const newIsSleepTime = timeDiff <= 30 && timeDiff >= 0;
      const newTimeToSleep = Math.max(0, timeDiff);
      
      // Only update state if values have changed
      setIsSleepTime(prev => prev !== newIsSleepTime ? newIsSleepTime : prev);
      setTimeToSleep(prev => prev !== newTimeToSleep ? newTimeToSleep : prev);
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepStats.bedtime]); // Include sleepStats.bedtime in dependencies

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
      message: `It's ${sleepStats.bedtime} - your optimal bedtime`,
      time: sleepStats.bedtime,
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
      message: `Time to wake up at ${sleepStats.wakeTime}`,
      time: sleepStats.wakeTime,
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
  ], [sleepStats.bedtime, sleepStats.wakeTime]);

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
      message: `You've maintained your sleep schedule for ${sleepStats.sleepStreak} days!`,
      time: '2 hours ago',
      read: false,
      icon: 'trophy',
      color: '#F59E0B'
    },
    {
      id: 2,
      type: 'improvement',
      title: '📈 Sleep Quality Up!',
      message: `Your sleep quality improved by ${sleepStats.improvementRate}% this week`,
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
      color: '#8B5CF6'
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
  ], [sleepStats.sleepStreak, sleepStats.improvementRate, stats.totalDreams]);

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
    if (timeToSleep <= 0) return 'Now!';
    const hours = Math.floor(timeToSleep / 60);
    const minutes = timeToSleep % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Schedule sleep notifications (simplified for web compatibility)
  const scheduleSleepNotifications = async () => {
    try {
      // For web compatibility, we'll just show an alert
      Alert.alert('Success', 'Sleep notifications scheduled! (Note: Full notifications require a development build)');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>🔔 Notifications</Text>
            <Text style={styles.headerSubtitle}>Sleep reminders & improvements</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {
              playSound('button');
              router.push('/settings');
            }}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleep Time Alert */}
      {isSleepTime && (
        <Animated.View style={[styles.sleepAlert, { transform: [{ scale: pulseAnim }] }]}>
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
      <View style={styles.sleepStatusCard}>
        <View style={styles.sleepStatusHeader}>
          <Text style={styles.sleepStatusTitle}>🌙 Sleep Status</Text>
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
        </View>
        
        <View style={styles.sleepStatusContent}>
          <View style={styles.sleepTimeInfo}>
            <View style={styles.sleepTimeItem}>
              <Text style={styles.sleepTimeLabel}>Bedtime</Text>
              <Text style={styles.sleepTimeValue}>{sleepStats.bedtime}</Text>
            </View>
            <View style={styles.sleepTimeItem}>
              <Text style={styles.sleepTimeLabel}>Wake Time</Text>
              <Text style={styles.sleepTimeValue}>{sleepStats.wakeTime}</Text>
            </View>
            <View style={styles.sleepTimeItem}>
              <Text style={styles.sleepTimeLabel}>Time Until Sleep</Text>
              <Text style={[styles.sleepTimeValue, { color: isSleepTime ? '#EF4444' : '#8B5CF6' }]}>
                {getTimeUntilSleep()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.scheduleButton}
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
          <Text style={styles.sectionTitle}>🔔 All Notifications</Text>
          <Text style={styles.notificationCount}>
            {(notifications.filter(n => !n.read).length + sleepReminders.filter(r => r.active).length)} active
          </Text>
        </View>
        
        {/* Sleep Reminders as Notifications */}
        {sleepReminders.map((reminder) => (
          <TouchableOpacity 
            key={`reminder-${reminder.id}`} 
            style={[styles.notificationCard, { opacity: reminder.active ? 1 : 0.6 }]}
            onPress={() => toggleReminder(reminder.id)}
          >
            <View style={[styles.notificationIcon, { backgroundColor: reminder.active ? '#8B5CF6' : '#9CA3AF' }]}>
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
              <Text style={[styles.notificationTitle, { fontWeight: reminder.active ? '600' : '400' }]}>
                {reminder.title}
              </Text>
              <Text style={styles.notificationMessage}>{reminder.message}</Text>
              <View style={styles.notificationTimeContainer}>
                <Text style={styles.notificationTime}>{reminder.time}</Text>
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
            style={[styles.notificationCard, { opacity: notification.read ? 0.6 : 1 }]}
            onPress={() => markAsRead(notification.id)}
          >
            <View style={[styles.notificationIcon, { backgroundColor: notification.color }]}>
              <MaterialCommunityIcons name={notification.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { fontWeight: notification.read ? '400' : '600' }]}>
                {notification.title}
              </Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {/* Sleep Statistics as Notification */}
        <TouchableOpacity style={[styles.notificationCard, { opacity: 1 }]} onPress={() => {}}>
          <View style={[styles.notificationIcon, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { fontWeight: '600' }]}>📊 Sleep Statistics</Text>
            <Text style={styles.notificationMessage}>
              {sleepStats.sleepDuration}h avg sleep • {sleepStats.sleepStreak} day streak • {sleepStats.avgSleepScore}% sleep score
            </Text>
            <Text style={styles.notificationTime}>Updated now</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              playSound('button');
              router.push('/(tabs)/journal');
            }}
          >
            <MaterialCommunityIcons name="book-open" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Dream Journal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              playSound('button');
              router.push('/(tabs)/relax');
            }}
          >
            <MaterialCommunityIcons name="meditation" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Relax Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              playSound('button');
              Alert.alert('Sleep Settings', 'Sleep settings coming soon!');
            }}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  header: {
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
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepAlert: {
    backgroundColor: '#8B5CF6',
    margin: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
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
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#1F2937',
  },
  currentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  sleepTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  scheduleButton: {
    backgroundColor: '#8B5CF6',
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
    color: '#1F2937',
    marginBottom: 16,
  },
  notificationCount: {
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3E8FF',
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
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    color: '#8B5CF6',
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
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
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
    backgroundColor: '#8B5CF6',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});