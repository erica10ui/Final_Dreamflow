import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db, firebaseReady } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const FirebaseTest = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [testData, setTestData] = useState(null);

  useEffect(() => {
    testFirebaseConnection();
  }, [user]);

  const testFirebaseConnection = async () => {
    try {
      if (!firebaseReady) {
        setConnectionStatus('❌ Firebase not initialized');
        return;
      }

      if (!user || !user.uid) {
        setConnectionStatus('⚠️ No user logged in');
        return;
      }

      // Test 1: Write to Firestore
      const testDocRef = doc(db, 'users', user.uid, 'test', 'connection');
      await setDoc(testDocRef, {
        message: 'Firebase connection test',
        timestamp: new Date().toISOString(),
        userId: user.uid
      });

      // Test 2: Read from Firestore
      const testDoc = await getDoc(testDocRef);
      if (testDoc.exists()) {
        const data = testDoc.data();
        setTestData(data);
        setConnectionStatus('✅ Firebase connected successfully!');
      } else {
        setConnectionStatus('❌ Failed to read test data');
      }

    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setConnectionStatus(`❌ Connection failed: ${error.message}`);
    }
  };

  const testOrganizedDatabase = async () => {
    try {
      if (!user || !user.uid) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // Test organized database structure
      const { createDatabaseManager } = require('../lib/database');
      const dbManager = createDatabaseManager(user.uid);

      // Test sleep session
      const sleepSession = await dbManager.addSleepSession({
        startTime: new Date().toISOString(),
        duration: 8.5,
        quality: 'Good',
        notes: 'Test sleep session'
      });

      // Test journal entry
      const journalEntry = await dbManager.addJournalEntry({
        title: 'Test Journal Entry',
        content: 'This is a test journal entry to verify Firebase connection.',
        mood: 'happy'
      });

      // Test mood entry
      const moodEntry = await dbManager.addMoodEntry({
        mood: 'calm',
        intensity: 5,
        category: 'test'
      });

      // Test activity session
      const activitySession = await dbManager.addActivitySession({
        type: 'meditation',
        category: 'test',
        duration: 10,
        intensity: 4,
        mood: 'peaceful',
        notes: 'Test meditation session'
      });

      Alert.alert(
        'Success!', 
        `Organized database test completed successfully!\n\n` +
        `✅ Sleep Session: ${sleepSession.id}\n` +
        `✅ Journal Entry: ${journalEntry.id}\n` +
        `✅ Mood Entry: ${moodEntry.id}\n` +
        `✅ Activity Session: ${activitySession.id}`
      );

    } catch (error) {
      console.error('Organized database test failed:', error);
      Alert.alert('Error', `Database test failed: ${error.message}`);
    }
  };

  const clearTestData = async () => {
    try {
      if (!user || !user.uid) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      const { createDatabaseManager } = require('../lib/database');
      const dbManager = createDatabaseManager(user.uid);
      
      await dbManager.clearAllUserData();
      
      Alert.alert('Success', 'All test data cleared successfully!');
      setTestData(null);
      setConnectionStatus('✅ Test data cleared');
    } catch (error) {
      console.error('Clear test data failed:', error);
      Alert.alert('Error', `Failed to clear test data: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Connection Status:</Text>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      {testData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataLabel}>Test Data:</Text>
          <Text style={styles.dataText}>
            Message: {testData.message}
          </Text>
          <Text style={styles.dataText}>
            Timestamp: {testData.timestamp}
          </Text>
          <Text style={styles.dataText}>
            User ID: {testData.userId}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testFirebaseConnection}
        >
          <Text style={styles.buttonText}>Test Basic Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, styles.organizedButton]}
          onPress={testOrganizedDatabase}
        >
          <Text style={styles.buttonText}>Test Organized Database</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, styles.clearButton]}
          onPress={clearTestData}
        >
          <Text style={styles.buttonText}>Clear Test Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Database Structure:</Text>
        <Text style={styles.infoText}>• users/{user?.uid}/sleep_sessions/</Text>
        <Text style={styles.infoText}>• users/{user?.uid}/journal_entries/</Text>
        <Text style={styles.infoText}>• users/{user?.uid}/mood_entries/</Text>
        <Text style={styles.infoText}>• users/{user?.uid}/activity_sessions/</Text>
        <Text style={styles.infoText}>• users/{user?.uid} (user document)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  statusContainer: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dataContainer: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 10,
  },
  dataText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#9B70D8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  organizedButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#9B70D8',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default FirebaseTest;

