import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

export default function FacebookLogin() {
  const handleContinue = () => {
    // Simulate successful Facebook login
    Alert.alert('Success', 'Facebook login successful!', [
      {
        text: 'OK',
        onPress: () => router.push('/welcomescreen')
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Log In With Facebook</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* User Confirmation */}
        <Text style={styles.userName}>Continue as Erica N. Manguilimotan</Text>
        
        {/* Permissions */}
        <Text style={styles.permissionsText}>
          Erica will receive: your public profile, friend list, email address and verified mobile number.
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  header: {
    backgroundColor: '#1877F2',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1e21',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionsText: {
    fontSize: 16,
    color: '#1c1e21',
    textAlign: 'left',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: '#1877F2',
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

