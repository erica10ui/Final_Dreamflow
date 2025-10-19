import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';

// Database Collection Structure
const COLLECTIONS = {
  USERS: 'users',
  SLEEP_SESSIONS: 'sleep_sessions',
  JOURNAL_ENTRIES: 'journal_entries',
  MOOD_ENTRIES: 'mood_entries',
  ACTIVITY_SESSIONS: 'activity_sessions'
};

// Database utility functions
class DatabaseManager {
  constructor(userId) {
    this.userId = userId;
    if (!userId) {
      throw new Error('User ID is required for DatabaseManager');
    }
  }

  // Get user-specific collection reference
  getUserCollection(collectionName) {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    return collection(db, COLLECTIONS.USERS, this.userId, collectionName);
  }

  // Get user document reference
  getUserDoc() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    return doc(db, COLLECTIONS.USERS, this.userId);
  }

  // Sleep Sessions Management
  async addSleepSession(sessionData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const sleepSessionsRef = this.getUserCollection(COLLECTIONS.SLEEP_SESSIONS);
      const session = {
        ...sessionData,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(sleepSessionsRef, session);
      return { id: docRef.id, ...session };
    } catch (error) {
      console.error('Error adding sleep session:', error);
      throw error;
    }
  }

  async getSleepSessions(limitCount = 30) {
    try {
      if (!this.userId) {
        return [];
      }

      const sleepSessionsRef = this.getUserCollection(COLLECTIONS.SLEEP_SESSIONS);
      const q = query(
        sleepSessionsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting sleep sessions:', error);
      return [];
    }
  }

  async updateSleepSession(sessionId, updateData) {
    try {
      if (!this.userId || !sessionId) {
        throw new Error('User ID and session ID are required');
      }

      const sessionRef = doc(this.getUserCollection(COLLECTIONS.SLEEP_SESSIONS), sessionId);
      await updateDoc(sessionRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating sleep session:', error);
      throw error;
    }
  }

  // Journal Entries Management
  async addJournalEntry(entryData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const journalRef = this.getUserCollection(COLLECTIONS.JOURNAL_ENTRIES);
      const entry = {
        ...entryData,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(journalRef, entry);
      return { id: docRef.id, ...entry };
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw error;
    }
  }

  async getJournalEntries(limitCount = 50) {
    try {
      if (!this.userId) {
        return [];
      }

      const journalRef = this.getUserCollection(COLLECTIONS.JOURNAL_ENTRIES);
      const q = query(
        journalRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async updateJournalEntry(entryId, updateData) {
    try {
      if (!this.userId || !entryId) {
        throw new Error('User ID and entry ID are required');
      }

      const entryRef = doc(this.getUserCollection(COLLECTIONS.JOURNAL_ENTRIES), entryId);
      await updateDoc(entryRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  async deleteJournalEntry(entryId) {
    try {
      if (!this.userId || !entryId) {
        throw new Error('User ID and entry ID are required');
      }

      const entryRef = doc(this.getUserCollection(COLLECTIONS.JOURNAL_ENTRIES), entryId);
      await deleteDoc(entryRef);
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Mood Entries Management
  async addMoodEntry(moodData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const moodRef = this.getUserCollection(COLLECTIONS.MOOD_ENTRIES);
      const entry = {
        ...moodData,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(moodRef, entry);
      return { id: docRef.id, ...entry };
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw error;
    }
  }

  async getMoodEntries(limitCount = 100) {
    try {
      if (!this.userId) {
        return [];
      }

      const moodRef = this.getUserCollection(COLLECTIONS.MOOD_ENTRIES);
      const q = query(
        moodRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting mood entries:', error);
      return [];
    }
  }

  // Activity Sessions Management
  async addActivitySession(activityData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const activityRef = this.getUserCollection(COLLECTIONS.ACTIVITY_SESSIONS);
      const session = {
        ...activityData,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(activityRef, session);
      return { id: docRef.id, ...session };
    } catch (error) {
      console.error('Error adding activity session:', error);
      throw error;
    }
  }

  async getActivitySessions(activityType = null, limitCount = 100) {
    try {
      if (!this.userId) {
        return [];
      }

      const activityRef = this.getUserCollection(COLLECTIONS.ACTIVITY_SESSIONS);
      let q = query(
        activityRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (activityType) {
        q = query(
          activityRef,
          where('type', '==', activityType),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting activity sessions:', error);
      return [];
    }
  }

  // User Statistics Management
  async updateUserStatistics(statsData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const userDocRef = this.getUserDoc();
      await setDoc(userDocRef, {
        statistics: {
          ...statsData,
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating user statistics:', error);
      throw error;
    }
  }

  async getUserStatistics() {
    try {
      if (!this.userId) {
        return {};
      }

      const userDocRef = this.getUserDoc();
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data().statistics || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {};
    }
  }

  // User Goals Management
  async updateUserGoals(goalsData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const userDocRef = this.getUserDoc();
      await setDoc(userDocRef, {
        goals: {
          ...goalsData,
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating user goals:', error);
      throw error;
    }
  }

  async getUserGoals() {
    try {
      if (!this.userId) {
        return {};
      }

      const userDocRef = this.getUserDoc();
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data().goals || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting user goals:', error);
      return {};
    }
  }

  // User Streaks Management
  async updateUserStreaks(streaksData) {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const userDocRef = this.getUserDoc();
      await setDoc(userDocRef, {
        streaks: {
          ...streaksData,
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating user streaks:', error);
      throw error;
    }
  }

  async getUserStreaks() {
    try {
      if (!this.userId) {
        return {};
      }

      const userDocRef = this.getUserDoc();
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data().streaks || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting user streaks:', error);
      return {};
    }
  }

  // Comprehensive Statistics Calculation
  async calculateComprehensiveStatistics() {
    try {
      if (!this.userId) {
        return {};
      }

      const [sleepSessions, journalEntries, moodEntries, activitySessions] = await Promise.all([
        this.getSleepSessions(30),
        this.getJournalEntries(30),
        this.getMoodEntries(30),
        this.getActivitySessions(null, 30)
      ]);

      // Calculate sleep statistics
      const sleepStats = this.calculateSleepStatistics(sleepSessions);
      
      // Calculate journal statistics
      const journalStats = this.calculateJournalStatistics(journalEntries);
      
      // Calculate mood statistics
      const moodStats = this.calculateMoodStatistics(moodEntries);
      
      // Calculate activity statistics
      const activityStats = this.calculateActivityStatistics(activitySessions);

      // Calculate overall wellness score
      const wellnessScore = this.calculateWellnessScore(sleepStats, journalStats, moodStats, activityStats);

      return {
        sleep: sleepStats,
        journal: journalStats,
        mood: moodStats,
        activities: activityStats,
        wellness: {
          score: wellnessScore,
          lastCalculated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error calculating comprehensive statistics:', error);
      return {};
    }
  }

  calculateSleepStatistics(sleepSessions) {
    if (!sleepSessions || sleepSessions.length === 0) {
      return {
        totalSessions: 0,
        averageDuration: 0,
        totalDuration: 0,
        longestSession: 0,
        shortestSession: 0,
        last7Days: 0,
        last30Days: 0
      };
    }

    const durations = sleepSessions.map(session => session.duration || 0);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / sleepSessions.length;
    
    const last7Days = sleepSessions.filter(session => {
      const sessionDate = new Date(session.createdAt?.toDate?.() || session.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length;

    return {
      totalSessions: sleepSessions.length,
      averageDuration: Math.round(averageDuration * 10) / 10,
      totalDuration: Math.round(totalDuration * 10) / 10,
      longestSession: Math.max(...durations),
      shortestSession: Math.min(...durations),
      last7Days,
      last30Days: sleepSessions.length
    };
  }

  calculateJournalStatistics(journalEntries) {
    if (!journalEntries || journalEntries.length === 0) {
      return {
        totalEntries: 0,
        last7Days: 0,
        last30Days: 0,
        averageWordsPerEntry: 0
      };
    }

    const last7Days = journalEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt?.toDate?.() || entry.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;

    const totalWords = journalEntries.reduce((sum, entry) => {
      return sum + (entry.content ? entry.content.split(' ').length : 0);
    }, 0);

    return {
      totalEntries: journalEntries.length,
      last7Days,
      last30Days: journalEntries.length,
      averageWordsPerEntry: Math.round(totalWords / journalEntries.length)
    };
  }

  calculateMoodStatistics(moodEntries) {
    if (!moodEntries || moodEntries.length === 0) {
      return {
        totalEntries: 0,
        averageMood: 0,
        mostCommonMood: 'neutral',
        last7Days: 0,
        last30Days: 0
      };
    }

    const last7Days = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt?.toDate?.() || entry.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;

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

    return {
      totalEntries: moodEntries.length,
      averageMood: Math.round(averageMood * 10) / 10,
      mostCommonMood,
      last7Days,
      last30Days: moodEntries.length
    };
  }

  calculateActivityStatistics(activitySessions) {
    if (!activitySessions || activitySessions.length === 0) {
      return {
        totalSessions: 0,
        last7Days: 0,
        last30Days: 0,
        byType: {}
      };
    }

    const last7Days = activitySessions.filter(session => {
      const sessionDate = new Date(session.createdAt?.toDate?.() || session.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length;

    const byType = {};
    activitySessions.forEach(session => {
      const type = session.type || 'unknown';
      if (!byType[type]) {
        byType[type] = {
          count: 0,
          totalDuration: 0,
          averageDuration: 0
        };
      }
      byType[type].count++;
      byType[type].totalDuration += session.duration || 0;
    });

    // Calculate averages
    Object.keys(byType).forEach(type => {
      byType[type].averageDuration = Math.round((byType[type].totalDuration / byType[type].count) * 10) / 10;
    });

    return {
      totalSessions: activitySessions.length,
      last7Days,
      last30Days: activitySessions.length,
      byType
    };
  }

  calculateWellnessScore(sleepStats, journalStats, moodStats, activityStats) {
    const sleepScore = Math.min((sleepStats.averageDuration / 8) * 100, 100);
    const journalScore = Math.min((journalStats.last7Days / 7) * 100, 100);
    const moodScore = (moodStats.averageMood / 5) * 100;
    const activityScore = Math.min((activityStats.last7Days / 14) * 100, 100); // 2 activities per day target

    return Math.round((sleepScore * 0.3 + journalScore * 0.2 + moodScore * 0.3 + activityScore * 0.2));
  }

  // Clear all user data
  async clearAllUserData() {
    try {
      if (!this.userId) {
        throw new Error('User ID is required');
      }

      const batch = writeBatch(db);
      
      // Clear all subcollections
      const collections = [
        COLLECTIONS.SLEEP_SESSIONS,
        COLLECTIONS.JOURNAL_ENTRIES,
        COLLECTIONS.MOOD_ENTRIES,
        COLLECTIONS.ACTIVITY_SESSIONS
      ];

      for (const collectionName of collections) {
        const collectionRef = this.getUserCollection(collectionName);
        const querySnapshot = await getDocs(collectionRef);
        querySnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      // Clear user document
      const userDocRef = this.getUserDoc();
      batch.delete(userDocRef);

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }
}

// Export default instance creator
export const createDatabaseManager = (userId) => new DatabaseManager(userId);

export { COLLECTIONS, DatabaseManager };