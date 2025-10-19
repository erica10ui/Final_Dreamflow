import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDatabaseManager } from '../lib/database.js';
import { getDocs, writeBatch } from 'firebase/firestore';

const MoodContext = createContext();

export const useMood = () => {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
};

export const MoodProvider = ({ children, user }) => {
  const [moodEntries, setMoodEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbManager, setDbManager] = useState(null);

  // Initialize database manager when user changes
  useEffect(() => {
    if (user && user.uid) {
      const manager = createDatabaseManager(user.uid);
      setDbManager(manager);
      loadMoodEntries(manager);
    } else {
      setDbManager(null);
      loadMoodEntriesFromStorage();
    }
  }, [user]);

  // Load mood entries from organized Firebase structure
  const loadMoodEntries = async (manager) => {
    if (!manager) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Load mood entries from dedicated collection
      const entries = await manager.getMoodEntries(100);
      setMoodEntries(entries);
      
      // Also load from AsyncStorage as fallback
      await loadMoodEntriesFromStorage();
    } catch (error) {
      console.error('Error loading mood entries from Firebase:', error);
      await loadMoodEntriesFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Load mood entries from AsyncStorage (fallback)
  const loadMoodEntriesFromStorage = async () => {
    try {
      const entriesData = await AsyncStorage.getItem('moodEntries');
      if (entriesData) {
        setMoodEntries(JSON.parse(entriesData));
      }
    } catch (error) {
      console.error('Error loading mood entries from storage:', error);
    }
  };

  // Add mood entry to organized database
  const addMoodEntry = async (moodData) => {
    if (!dbManager) {
      // Fallback to AsyncStorage
      const newEntry = {
        id: `mood_${Date.now()}`,
        ...moodData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedEntries = [newEntry, ...moodEntries];
      setMoodEntries(updatedEntries);
      await AsyncStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
      return newEntry;
    }

    try {
      const entry = await dbManager.addMoodEntry(moodData);
      
      // Update local state
      setMoodEntries(prev => [entry, ...prev]);
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('moodEntries', JSON.stringify([entry, ...moodEntries]));
      
      console.log('Mood entry saved to organized database:', entry);
      return entry;
    } catch (error) {
      console.error('Error saving mood entry:', error);
      // Fallback to AsyncStorage
      const newEntry = {
        id: `mood_${Date.now()}`,
        ...moodData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedEntries = [newEntry, ...moodEntries];
      setMoodEntries(updatedEntries);
      await AsyncStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
      return newEntry;
    }
  };

  // Get mood statistics
  const getMoodStats = () => {
    if (moodEntries.length === 0) {
      return {
        totalEntries: 0,
        averageMood: 0,
        mostCommonMood: 'neutral',
        last7Days: 0,
        last30Days: 0,
        moodTrend: 'stable'
      };
    }

    const last7Days = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt?.toDate?.() || entry.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    const last30Days = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt?.toDate?.() || entry.createdAt);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return entryDate >= monthAgo;
    });

    // Calculate mood statistics
    const moodCounts = {};
    const intensities = [];

    moodEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      intensities.push(entry.intensity || 5);
    });

    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'neutral'
    );

    const averageMood = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;

    // Calculate mood trend (comparing last 7 days vs previous 7 days)
    const previous7Days = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt?.toDate?.() || entry.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return entryDate >= twoWeeksAgo && entryDate < weekAgo;
    });

    const last7DaysAvg = last7Days.length > 0 
      ? last7Days.reduce((sum, entry) => sum + (entry.intensity || 5), 0) / last7Days.length 
      : 0;
    
    const previous7DaysAvg = previous7Days.length > 0 
      ? previous7Days.reduce((sum, entry) => sum + (entry.intensity || 5), 0) / previous7Days.length 
      : 0;

    let moodTrend = 'stable';
    if (last7DaysAvg > previous7DaysAvg + 0.5) {
      moodTrend = 'improving';
    } else if (last7DaysAvg < previous7DaysAvg - 0.5) {
      moodTrend = 'declining';
    }

    return {
      totalEntries: moodEntries.length,
      averageMood: Math.round(averageMood * 10) / 10,
      mostCommonMood,
      last7Days: last7Days.length,
      last30Days: last30Days.length,
      moodTrend
    };
  };

  // Get mood entries by category
  const getMoodEntriesByCategory = (category) => {
    return moodEntries.filter(entry => entry.category === category);
  };

  // Get mood entries by date range
  const getMoodEntriesByDateRange = (startDate, endDate) => {
    return moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt?.toDate?.() || entry.createdAt);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  // Clear all mood data
  const clearAllMoodData = async () => {
    if (!dbManager) {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('moodEntries');
      setMoodEntries([]);
      return;
    }

    try {
      // Clear mood entries from organized database
      const moodRef = dbManager.getUserCollection('mood_entries');
      const querySnapshot = await getDocs(moodRef);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Reset local state
      setMoodEntries([]);
      
      // Clear AsyncStorage as well
      await AsyncStorage.removeItem('moodEntries');
      
      console.log('All mood data cleared for user');
    } catch (error) {
      console.error('Error clearing mood data:', error);
    }
  };

  const value = {
    // State
    moodEntries,
    isLoading,
    
    // Actions
    addMoodEntry,
    getMoodStats,
    getMoodEntriesByCategory,
    getMoodEntriesByDateRange,
    clearAllMoodData,
    loadMoodEntries: () => loadMoodEntries(dbManager)
  };

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
};