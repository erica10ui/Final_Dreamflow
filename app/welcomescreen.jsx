import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSound } from '../contexts/SoundContext';
import { useSafeTheme } from '../contexts/useSafeTheme';

export default function WelcomeScreen() {
  const { playSound } = useSound();
  const { colors } = useSafeTheme();

  const handleGetStarted = () => {
    playSound('success');
    router.push('/onboarding-sleep-mentor');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Welcome Content */}
      <View style={styles.welcomeContent}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome to</Text>
        <Text style={[styles.appName, { color: colors.text }]}>DreamFlow</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Personalized insomnia relief, just for you.
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.getStartedButton, { backgroundColor: colors.primary }]} onPress={handleGetStarted}>
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 0,
    paddingHorizontal: 20,
    lineHeight: 30,
    fontWeight: '400',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  getStartedButton: {
    paddingVertical: 20,
    paddingHorizontal: 56,
    borderRadius: 16,
    minWidth: 260,
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
