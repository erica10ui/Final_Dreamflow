import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSound } from '../contexts/SoundContext';

export default function WelcomeScreen() {
  const { playSound } = useSound();

  const handleGetStarted = () => {
    playSound('success');
    router.push('/onboarding-sleep-type');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to</Text>
      <Text style={styles.appName}>DreamFlow</Text>
      <Text style={styles.subtitle}>
        Personalized insomnia relief, just for you.
      </Text>

      <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D5F2',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1e21',
    textAlign: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1e21',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1c1e21',
    marginBottom: 60,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  getStartedButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
