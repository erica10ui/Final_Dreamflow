import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSimpleNotification } from '../contexts/SimpleNotificationContext';

export default function NotificationTest() {
  const [isLoading, setIsLoading] = useState(false);
  const { requestPermissions, scheduleNotification, permissionStatus } = useSimpleNotification();

  const testPermissions = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermissions();
      Alert.alert(
        'Permission Result',
        granted ? 'Permissions granted!' : 'Permissions denied',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Permission error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    setIsLoading(true);
    try {
      if (scheduleNotification) {
        await scheduleNotification({
          title: 'Test Notification',
          body: 'This is a test notification from DreamFlow',
          time: new Date(Date.now() + 5000).toTimeString().slice(0, 5) // 5 seconds from now
        });
        Alert.alert('Success', 'Test notification scheduled!');
      } else {
        Alert.alert('Error', 'Notification scheduling not available');
      }
    } catch (error) {
      Alert.alert('Error', `Notification error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      <Text style={styles.status}>Status: {permissionStatus}</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testPermissions}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Permissions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    backgroundColor: '#9B70D8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});