import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDatabaseManager } from '../lib/database.js';

const ActivityTrackingContext = createContext();

export const useActivityTracking = () => {
  const context = useContext(ActivityTrackingContext);
  if (!context) {
    throw new Error('useActivityTracking must be used within an ActivityTrackingProvider');
  }
  return context;
};

export const ActivityTrackingProvider = ({ children, user }) => {
  const [activities, setActivities] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [goals, setGoals] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dbManager, setDbManager] = useState(null);

  // Activity types
  const ACTIVITY_TYPES = {
    SLEEP: 'sleep',
    DREAM_JOURNAL: 'dream_journal',
    BREATHING: 'breathing',
    MEDITATION: 'meditation',
    MUSIC: 'music',
    YOGA: 'yoga',
    WORKOUT: 'workout',
    EBOOKS: 'ebooks',
    GAMES: 'games'
  };

  // Initialize database manager when user changes
  useEffect(() => {
    if (user && user.uid) {
      const manager = createDatabaseManager(user.uid);
      setDbManager(manager);
      loadActivityDataFromFirebase(manager);
    } else {
      setDbManager(null);
      setIsLoading(false);
    }
  }, [user]);

  // Firebase functions
  const saveActivityDataToFirebase = async (dataType, data) => {
    if (!user || !user.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        [dataType]: data,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      console.log(`Activity data saved to Firebase: ${dataType}`);
    } catch (error) {
      console.error('Error saving activity data to Firebase:', error);
    }
  };

  const loadActivityDataFromFirebase = async (manager) => {
    if (!manager) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Load activity sessions from dedicated collection
      const activitySessions = await manager.getActivitySessions(null, 100);
      setActivities(activitySessions);
      
      // Load user goals and streaks from user document
      const [userGoals, userStreaks] = await Promise.all([
        manager.getUserGoals(),
        manager.getUserStreaks()
      ]);
      
      setGoals(userGoals);
      setStreaks(userStreaks);
      
      // If no goals exist, initialize default goals
      if (Object.keys(userGoals).length === 0) {
        await initializeDefaultGoals(manager);
      }
      
      // Also load from AsyncStorage as fallback
      await loadActivityDataFromStorage();
    } catch (error) {
      console.error('Error loading activity data from Firebase:', error);
      await loadActivityDataFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityDataFromStorage = async () => {
    try {
      const [activitiesData, streaksData, goalsData] = await Promise.all([
        AsyncStorage.getItem('activities'),
        AsyncStorage.getItem('streaks'),
        AsyncStorage.getItem('goals')
      ]);

      if (activitiesData) setActivities(JSON.parse(activitiesData));
      if (streaksData) setStreaks(JSON.parse(streaksData));
      if (goalsData) setGoals(JSON.parse(goalsData));
    } catch (error) {
      console.error('Error loading activity data from storage:', error);
    }
  };

  const saveActivityData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      if (user && user.uid) {
        await saveActivityDataToFirebase(key, data);
      }
    } catch (error) {
      console.error('Error saving activity data:', error);
    }
  };

  // Initialize default goals for new users
  const initializeDefaultGoals = async () => {
    const defaultGoals = {
      sleep: { target: 8, unit: 'hours', current: 0 },
      dream_journal: { target: 7, unit: 'entries', current: 0 },
      breathing: { target: 5, unit: 'sessions', current: 0 },
      meditation: { target: 3, unit: 'sessions', current: 0 },
      music: { target: 4, unit: 'sessions', current: 0 },
      yoga: { target: 2, unit: 'sessions', current: 0 },
      workout: { target: 3, unit: 'sessions', current: 0 },
      ebooks: { target: 2, unit: 'sessions', current: 0 },
      games: { target: 1, unit: 'sessions', current: 0 }
    };

    setGoals(defaultGoals);
    await saveActivityData('goals', defaultGoals);
  };

  // Record an activity
  const recordActivity = async (activityData) => {
    if (!dbManager) return null;
    
    try {
      const newActivity = {
        type: activityData.type,
        category: activityData.category || 'general',
        duration: activityData.duration || 0,
        intensity: activityData.intensity || 5,
        mood: activityData.mood || 'neutral',
        notes: activityData.notes || '',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };

      // Save to organized database
      const activity = await dbManager.addActivitySession(newActivity);
      
      // Add to local state
      setActivities(prev => [activity, ...prev]);
      
      // Update streaks
      await updateStreaks(activity);
      
      // Update goals progress
      await updateGoalsProgress(activity);
      
      console.log('Activity recorded successfully:', activity);
      return activity;
    } catch (error) {
      console.error('Error recording activity:', error);
      return null;
    }
  };

  // Update streaks based on activity
  const updateStreaks = async (activity) => {
    if (!dbManager) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const activityType = activity.type;
      
      // Get current streak for this activity type
      const currentStreak = streaks[activityType] || { count: 0, lastDate: null };
      
      // Check if this is a new day
      if (currentStreak.lastDate !== today) {
        // Check if yesterday had activity (for streak continuation)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const hadActivityYesterday = activities.some(a => 
          a.type === activityType && a.date === yesterdayStr
        );
        
        if (hadActivityYesterday || currentStreak.count === 0) {
          // Continue or start streak
          const newStreak = {
            count: currentStreak.count + 1,
            lastDate: today,
            startDate: currentStreak.count === 0 ? today : currentStreak.startDate
          };
          
          const updatedStreaks = { ...streaks, [activityType]: newStreak };
          setStreaks(updatedStreaks);
          await dbManager.updateUserStreaks(updatedStreaks);
        }
      }
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  };

  // Update goals progress
  const updateGoalsProgress = async (activity) => {
    if (!dbManager) return;
    
    try {
      const activityType = activity.type;
      const currentGoal = goals[activityType];
      
      if (currentGoal) {
        // Count activities for today
        const today = new Date().toISOString().split('T')[0];
        const todayActivities = activities.filter(a => 
          a.type === activityType && a.date === today
        );
        
        const newGoal = {
          ...currentGoal,
          current: todayActivities.length
        };
        
        const updatedGoals = { ...goals, [activityType]: newGoal };
        setGoals(updatedGoals);
        await dbManager.updateUserGoals(updatedGoals);
      }
    } catch (error) {
      console.error('Error updating goals progress:', error);
    }
  };

  // Get comprehensive statistics
  const getComprehensiveStats = () => {
    const last7Days = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo;
    });

    const last30Days = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return activityDate >= monthAgo;
    });

    // Calculate activity-specific stats
    const activityStats = {};
    Object.values(ACTIVITY_TYPES).forEach(type => {
      const typeActivities = last30Days.filter(a => a.type === type);
      const totalDuration = typeActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
      const avgDuration = typeActivities.length > 0 ? totalDuration / typeActivities.length : 0;
      
      activityStats[type] = {
        totalSessions: typeActivities.length,
        totalDuration: Math.round(totalDuration * 10) / 10,
        averageDuration: Math.round(avgDuration * 10) / 10,
        currentStreak: streaks[type]?.count || 0,
        goalProgress: goals[type]?.current || 0,
        goalTarget: goals[type]?.target || 0,
        goalAchievement: goals[type] ? Math.round((goals[type].current / goals[type].target) * 100) : 0
      };
    });

    // Calculate overall wellness score
    const totalActivities = last30Days.length;
    const totalStreakDays = Object.values(streaks).reduce((sum, streak) => sum + streak.count, 0);
    const goalAchievements = Object.values(goals).filter(goal => goal.current >= goal.target).length;
    const totalGoals = Object.keys(goals).length;
    
    const wellnessScore = Math.round(
      (totalActivities * 0.3 + totalStreakDays * 0.4 + (goalAchievements / totalGoals) * 100 * 0.3)
    );

    return {
      totalActivities: activities.length,
      last7Days: last7Days.length,
      last30Days: last30Days.length,
      activityStats,
      streaks,
      goals,
      wellnessScore,
      totalStreakDays,
      goalAchievements,
      totalGoals
    };
  };

  // Get sleep statistics (integrated with other activities)
  const getSleepStats = () => {
    const sleepActivities = activities.filter(a => a.type === ACTIVITY_TYPES.SLEEP);
    const last7Days = sleepActivities.slice(-7);
    const totalSleep = last7Days.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSleep = last7Days.length > 0 ? totalSleep / last7Days.length : 0;
    const sleepStreak = streaks[ACTIVITY_TYPES.SLEEP]?.count || 0;
    const goalAchievement = last7Days.filter(session => (session.duration || 0) >= (goals[ACTIVITY_TYPES.SLEEP]?.target || 8)).length;

    return {
      totalSessions: sleepActivities.length,
      averageSleep: Math.round(averageSleep * 10) / 10,
      sleepStreak,
      goalAchievement,
      last7Days: last7Days.length,
      totalSleep: Math.round(totalSleep * 10) / 10
    };
  };

  // Clear all activity data
  const clearAllActivityData = async () => {
    if (!dbManager) return;
    
    try {
      await dbManager.clearAllUserData();
      
      setActivities([]);
      setStreaks({});
      setGoals({});
      
      await AsyncStorage.removeItem('activities');
      await AsyncStorage.removeItem('streaks');
      await AsyncStorage.removeItem('goals');
      
      console.log('All activity data cleared for user');
    } catch (error) {
      console.error('Error clearing activity data:', error);
    }
  };

  const value = {
    activities,
    streaks,
    goals,
    isLoading,
    ACTIVITY_TYPES,
    recordActivity,
    getComprehensiveStats,
    getSleepStats,
    clearAllActivityData,
    loadActivityDataFromFirebase: () => loadActivityDataFromFirebase(dbManager),
    updateStreaks,
    updateGoalsProgress,
    dbManager
  };

  return (
    <ActivityTrackingContext.Provider value={value}>
      {children}
    </ActivityTrackingContext.Provider>
  );
};
