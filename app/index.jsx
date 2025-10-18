import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeTheme } from '../contexts/useSafeTheme';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function Index() {
  const { colors } = useSafeTheme();

  // AuthRouter will handle navigation for authenticated users

  const handleGetStarted = () => {
    router.push('/login');
  };


  // Show welcome screen
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.buttonColumn}>
        <TouchableOpacity
          style={[styles.button, styles.getStartedButton]}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isWeb ? Math.min(width * 0.1, 50) : 25,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: isWeb ? height : '100%',
  },
  logo: {
    width: isWeb ? Math.min(width * 0.25, 200) : 180,
    height: isWeb ? Math.min(width * 0.25, 200) : 180,
    marginBottom: isWeb ? 40 : 30,
    borderRadius: 25, // Rounded corners to match splash screen
  },
  buttonColumn: {
    gap: isWeb ? 16 : 14,
    alignItems: 'center',
    marginTop: isWeb ? 60 : 50,
    width: '100%',
    maxWidth: isWeb ? 420 : width * 0.85,
    paddingHorizontal: isWeb ? 20 : 0,
  },
  button: {
    width: '100%',
    minWidth: isWeb ? 320 : width * 0.75,
    maxWidth: isWeb ? 420 : width * 0.85,
    paddingVertical: isWeb ? 20 : 18,
    paddingHorizontal: isWeb ? 32 : 24,
    borderRadius: isWeb ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isWeb ? 8 : 4,
    },
    shadowOpacity: isWeb ? 0.15 : 0.1,
    shadowRadius: isWeb ? 16 : 8,
    elevation: isWeb ? 12 : 6,
    // Web-specific hover effects
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'translateY(0)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  getStartedButton: {
    backgroundColor: '#9B70D8', // Match login screen primary color
    borderWidth: 0,
    // Professional gradient-like effect
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: isWeb ? 10 : 6,
    },
    shadowOpacity: isWeb ? 0.3 : 0.25,
    shadowRadius: isWeb ? 20 : 12,
    elevation: isWeb ? 15 : 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: isWeb ? 18 : 16,
    fontWeight: '600',
    letterSpacing: isWeb ? 0.3 : 0,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: isWeb ? 18 : 16,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
});
