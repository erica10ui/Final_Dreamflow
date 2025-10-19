import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { createDatabaseManager } from '../lib/database.js';

const FirebaseDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setIsLoading(true);
    const info = {
      userId: user.uid,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    };

    try {
      // Test database manager creation
      const dbManager = createDatabaseManager(user.uid);
      info.dbManagerCreated = true;

      // Test sleep session
      try {
        const sleepSession = await dbManager.addSleepSession({
          startTime: new Date().toISOString(),
          duration: 8.5,
          quality: 'Good',
          notes: 'Debug test sleep session'
        });
        info.sleepSessionCreated = true;
        info.sleepSessionId = sleepSession.id;
      } catch (error) {
        info.sleepSessionError = error.message;
      }

      // Test journal entry
      try {
        const journalEntry = await dbManager.addJournalEntry({
          title: 'Debug Test Journal',
          content: 'This is a debug test journal entry.',
          mood: 'happy'
        });
        info.journalEntryCreated = true;
        info.journalEntryId = journalEntry.id;
      } catch (error) {
        info.journalEntryError = error.message;
      }

      // Test mood entry
      try {
        const moodEntry = await dbManager.addMoodEntry({
          mood: 'calm',
          intensity: 5,
          category: 'debug'
        });
        info.moodEntryCreated = true;
        info.moodEntryId = moodEntry.id;
      } catch (error) {
        info.moodEntryError = error.message;
      }

      // Test activity session
      try {
        const activitySession = await dbManager.addActivitySession({
          type: 'meditation',
          category: 'debug',
          duration: 10,
          intensity: 4,
          mood: 'peaceful',
          notes: 'Debug test meditation session'
        });
        info.activitySessionCreated = true;
        info.activitySessionId = activitySession.id;
      } catch (error) {
        info.activitySessionError = error.message;
      }

      // Test statistics calculation
      try {
        const stats = await dbManager.calculateComprehensiveStatistics();
        info.statisticsCalculated = true;
        info.statistics = stats;
      } catch (error) {
        info.statisticsError = error.message;
      }

    } catch (error) {
      info.generalError = error.message;
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const clearTestData = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      const dbManager = createDatabaseManager(user.uid);
      await dbManager.clearAllUserData();
      Alert.alert('Success', 'All test data cleared!');
      setDebugInfo({});
    } catch (error) {
      Alert.alert('Error', `Failed to clear data: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Debug Tool</Text>
      
      <View style={styles.userInfo}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user?.uid || 'Not logged in'}</Text>
        
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || 'Not available'}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={runDebugTest}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Run Debug Test'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.clearButton]}
        onPress={clearTestData}
      >
        <Text style={styles.buttonText}>Clear Test Data</Text>
      </TouchableOpacity>

      {Object.keys(debugInfo).length > 0 && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>Debug Results:</Text>
          {Object.entries(debugInfo).map(([key, value]) => (
            <View key={key} style={styles.debugItem}>
              <Text style={styles.debugKey}>{key}:</Text>
              <Text style={styles.debugValue}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  userInfo: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  value: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#9B70D8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  debugItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  debugKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  debugValue: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 5,
  },
});

export default FirebaseDebug;

