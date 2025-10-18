import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, firebaseReady } from '../lib/firebase';
import {
  collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, getDoc, writeBatch,
  serverTimestamp, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const JournalContext = createContext();

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};

export const JournalProvider = ({ children }) => {
  const [dreamEntries, setDreamEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState(null);
  const { user } = useAuth();

  // Setup real-time listener for Firestore
  const setupRealtimeListener = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for real-time listener');
        return;
      }

      // Ensure user document exists with retry logic
      const userDocRef = doc(db, 'users', user.id);
      let userDoc;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          userDoc = await getDoc(userDocRef);
          break;
        } catch (fetchError) {
          retryCount++;
          console.warn(`LOG  ⚠️ Fetch attempt ${retryCount} failed:`, fetchError.message);
          
          if (retryCount >= maxRetries) {
            console.error('LOG  ❌ Max retries reached for user document fetch');
            // Fallback to local storage
            await loadEntries();
            return;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
      
      if (!userDoc.exists()) {
        try {
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || user.firstName + ' ' + user.lastName,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });
          console.log('LOG  👤 User document created for:', user.id);
        } catch (setDocError) {
          console.error('LOG  ❌ Error creating user document:', setDocError.message);
          // Continue with listener setup even if user doc creation fails
        }
      } else {
        console.log('LOG  👤 User document ensured for:', user.id);
      }

      // Set up real-time listener for journal entries
      const entriesRef = collection(db, 'users', user.id, 'journalEntries');
      
      // Try to create ordered query, fallback to simple query if indexing fails
      let q;
      try {
        q = query(entriesRef, orderBy('createdAt', 'desc'));
      } catch (orderByError) {
        console.log('OrderBy query failed, using simple query:', orderByError.message);
        q = entriesRef;
      }

      const unsubscribeListener = onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString()
        }));

        // If using simple query, sort manually
        if (q === entriesRef) {
          entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Remove duplicate entries by ID
        const ids = entries.map(entry => entry.id);
        const uniqueIds = [...new Set(ids)];
        
        if (ids.length !== uniqueIds.length) {
          console.log('LOG  🔄 Removing duplicate entries');
          const uniqueEntries = entries.filter((entry, index) => 
            ids.indexOf(entry.id) === index
          );
          setDreamEntries(uniqueEntries);
        } else {
          setDreamEntries(entries);
        }

        console.log('LOG  📡 Real-time update received:', entries.length, 'entries');
        setIsLoading(false);
      }, (error) => {
        console.error('LOG  ❌ Real-time listener error:', error);
        
        // Handle specific network errors
        if (error.code === 'unavailable' || error.message?.includes('fetch')) {
          console.warn('LOG  🌐 Network unavailable, falling back to local storage');
          loadEntries();
        } else {
          setIsLoading(false);
        }
      });

      setUnsubscribe(() => unsubscribeListener);
    } catch (error) {
      console.error('LOG  ❌ Setup real-time listener error:', error);
      
      // Handle network errors gracefully
      if (error.code === 'unavailable' || error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('LOG  🌐 Network error detected, using local storage fallback');
        await loadEntries();
      } else {
        setIsLoading(false);
      }
    }
  };

  // Load entries from local storage (fallback)
  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('dreamEntries');
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setDreamEntries(parsedEntries);
        console.log('LOG  📱 Loaded entries from local storage:', parsedEntries.length);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('LOG  ❌ Error loading entries from local storage:', error);
      setIsLoading(false);
    }
  };

  // Add new entry
  const addEntry = async (entryData) => {
    try {
      const entry = {
        ...entryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (firebaseReady && user?.id) {
        // Save to Firestore with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const userDocRef = doc(db, 'users', user.id);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName || user.firstName + ' ' + user.lastName,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
              });
            }

            const journalRef = collection(db, 'users', user.id, 'journalEntries');
            const docRef = await addDoc(journalRef, {
              ...entry,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });

            const newEntry = { id: docRef.id, ...entry };
            console.log('LOG  ✅ Dream entry saved to Firestore:', newEntry.id);
            
            // Don't update local state here - let the realtime listener handle it
            return newEntry;
          } catch (firestoreError) {
            retryCount++;
            console.warn(`LOG  ⚠️ Firestore save attempt ${retryCount} failed:`, firestoreError.message);
            
            // Handle specific network errors
            if (firestoreError.code === 'unavailable' || 
                firestoreError.message?.includes('fetch') || 
                firestoreError.message?.includes('network')) {
              
              if (retryCount >= maxRetries) {
                console.warn('LOG  🌐 Max retries reached, falling back to local storage');
                break; // Fall through to local storage fallback
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              // Non-network error, don't retry
              throw firestoreError;
            }
          }
        }
      }
      
      // Fallback to local storage (either Firebase not ready, no user, or network failure)
      const newEntry = {
        id: Date.now().toString(),
        ...entry
      };
      
      const updatedEntries = [newEntry, ...dreamEntries];
      setDreamEntries(updatedEntries);
      await AsyncStorage.setItem('dreamEntries', JSON.stringify(updatedEntries));
      
      console.log('LOG  ✅ Dream entry saved to local storage:', newEntry.id);
      return newEntry;
    } catch (error) {
      console.error('LOG  ❌ Error saving dream entry:', error);
      
      // For critical errors, still try to save locally
      try {
        const fallbackEntry = {
          id: Date.now().toString(),
          ...entryData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedEntries = [fallbackEntry, ...dreamEntries];
        setDreamEntries(updatedEntries);
        await AsyncStorage.setItem('dreamEntries', JSON.stringify(updatedEntries));
        
        console.log('LOG  🆘 Emergency fallback save to local storage:', fallbackEntry.id);
        return fallbackEntry;
      } catch (fallbackError) {
        console.error('LOG  💥 Critical error - unable to save entry anywhere:', fallbackError);
        throw new Error('Unable to save entry. Please check your connection and try again.');
      }
    }
  };

  // Update existing entry
  const updateEntry = async (entryId, updatedData) => {
    try {
      const updatedEntry = {
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      if (firebaseReady && user?.id) {
        // Update in Firestore with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const entryRef = doc(db, 'users', user.id, 'journalEntries', entryId);
            await updateDoc(entryRef, {
              ...updatedEntry,
              updatedAt: serverTimestamp()
            });
            console.log('LOG  ✅ Dream entry updated in Firestore:', entryId);
            return; // Success, exit retry loop
          } catch (firestoreError) {
            retryCount++;
            console.warn(`LOG  ⚠️ Firestore update attempt ${retryCount} failed:`, firestoreError.message);
            
            // Handle specific network errors
            if (firestoreError.code === 'unavailable' || 
                firestoreError.message?.includes('fetch') || 
                firestoreError.message?.includes('network')) {
              
              if (retryCount >= maxRetries) {
                console.warn('LOG  🌐 Max retries reached, falling back to local storage');
                break; // Fall through to local storage fallback
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              // Non-network error, don't retry
              throw firestoreError;
            }
          }
        }
      }
      
      // Fallback to local storage
      const updatedEntries = dreamEntries.map(entry =>
        entry.id === entryId ? { ...entry, ...updatedEntry } : entry
      );
      setDreamEntries(updatedEntries);
      await AsyncStorage.setItem('dreamEntries', JSON.stringify(updatedEntries));
      console.log('LOG  ✅ Dream entry updated in local storage:', entryId);
    } catch (error) {
      console.error('LOG  ❌ Error updating dream entry:', error);
      throw error;
    }
  };

  // Delete entry
  const deleteEntry = async (entryId) => {
    try {
      if (firebaseReady && user?.id) {
        // Delete from Firestore with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const entryRef = doc(db, 'users', user.id, 'journalEntries', entryId);
            await deleteDoc(entryRef);
            console.log('LOG  ✅ Dream entry deleted from Firestore:', entryId);
            return; // Success, exit retry loop
          } catch (firestoreError) {
            retryCount++;
            console.warn(`LOG  ⚠️ Firestore delete attempt ${retryCount} failed:`, firestoreError.message);
            
            // Handle specific network errors
            if (firestoreError.code === 'unavailable' || 
                firestoreError.message?.includes('fetch') || 
                firestoreError.message?.includes('network')) {
              
              if (retryCount >= maxRetries) {
                console.warn('LOG  🌐 Max retries reached, falling back to local storage');
                break; // Fall through to local storage fallback
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              // Non-network error, don't retry
              throw firestoreError;
            }
          }
        }
      }
      
      // Fallback to local storage
      const updatedEntries = dreamEntries.filter(entry => entry.id !== entryId);
      setDreamEntries(updatedEntries);
      await AsyncStorage.setItem('dreamEntries', JSON.stringify(updatedEntries));
      console.log('LOG  ✅ Dream entry deleted from local storage:', entryId);
    } catch (error) {
      console.error('LOG  ❌ Error deleting dream entry:', error);
      throw error;
    }
  };

  // Get entry by ID with fallback
  const getEntryById = async (entryId) => {
    try {
      // First try to find in current state
      const localEntry = dreamEntries.find(entry => entry.id === entryId);
      if (localEntry) {
        return localEntry;
      }

      // If not found locally and Firebase is available, try to fetch from Firestore
      if (firebaseReady && user?.id) {
        try {
          const entryRef = doc(db, 'users', user.id, 'journalEntries', entryId);
          const entrySnap = await getDoc(entryRef);
          
          if (entrySnap.exists()) {
            const data = entrySnap.data();
            return {
              id: entrySnap.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
            };
          }
        } catch (fetchError) {
          console.warn('LOG  ⚠️ Error fetching entry from Firestore:', fetchError.message);
          // Continue to local storage fallback
        }
      }

      // Fallback to local storage
      try {
        const storedEntries = await AsyncStorage.getItem('dreamEntries');
        if (storedEntries) {
          const parsedEntries = JSON.parse(storedEntries);
          return parsedEntries.find(entry => entry.id === entryId);
        }
      } catch (storageError) {
        console.warn('LOG  ⚠️ Error reading from local storage:', storageError.message);
      }

      return null;
    } catch (error) {
      console.error('LOG  ❌ Error getting entry by ID:', error);
      return null;
    }
  };

  // Refresh entries
  const refreshEntries = async () => {
    if (firebaseReady && user?.id) {
      await setupRealtimeListener();
    } else {
      await loadEntries();
    }
  };

  // Get statistics
  const getStats = () => {
    const totalDreams = dreamEntries.length;
    
    if (totalDreams === 0) {
      return {
        totalDreams: 0,
        sleepStreak: 0,
        recallRate: 0,
        avgSleepQuality: 0,
        qualityDistribution: {},
        moodDistribution: {},
        lastEntryDate: null
      };
    }

    // Calculate sleep streak
    const sortedEntries = [...dreamEntries].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].createdAt);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate average sleep quality
    const qualityValues = { 'Excellent': 5, 'Good': 4, 'Fair': 3, 'Poor': 2 };
    const totalQuality = dreamEntries.reduce((sum, entry) => 
      sum + (qualityValues[entry.sleepQuality] || 3), 0
    );
    const avgQuality = totalQuality / totalDreams;

    // Quality distribution
    const qualityCounts = {};
    dreamEntries.forEach(entry => {
      qualityCounts[entry.sleepQuality] = (qualityCounts[entry.sleepQuality] || 0) + 1;
    });

    // Mood distribution
    const moodCounts = {};
    dreamEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    return {
      totalDreams,
      sleepStreak: currentStreak,
      recallRate: Math.round((totalDreams / 30) * 100),
      avgSleepQuality: Math.round(avgQuality * 10) / 10,
      qualityDistribution: qualityCounts,
      moodDistribution: moodCounts,
      lastEntryDate: dreamEntries.length > 0 
        ? new Date(Math.max(...dreamEntries.map(e => new Date(e.createdAt))))
        : null
    };
  };

  // Setup listener when user changes
  useEffect(() => {
    if (firebaseReady && user?.id) {
      setupRealtimeListener();
    } else {
      loadEntries();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    };
  }, [user, firebaseReady]);

  const value = {
    dreamEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    isLoading,
    refreshEntries,
    firebaseReady,
    getStats
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
};