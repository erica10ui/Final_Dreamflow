import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSound } from '../contexts/SoundContext';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function Index() {
  const { playSound } = useSound();

  const handleLogin = () => {
    playSound('button');
    router.push('/login');
  };

  const handleRegister = () => {
    playSound('button');
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.buttonColumn}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
    paddingHorizontal: isWeb ? Math.min(width * 0.1, 50) : 25,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: isWeb ? height : '100%',
  },
  logo: {
    width: isWeb ? Math.min(width * 0.15, 160) : 140,
    height: isWeb ? Math.min(width * 0.15, 160) : 140,
    marginBottom: isWeb ? 30 : 20,
    borderRadius: 20, // Rounded corners to match splash screen
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
  loginButton: {
    backgroundColor: '#8B5CF6', // Purple to match logo
    borderWidth: 0,
    // Professional gradient-like effect
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: isWeb ? 8 : 4,
    },
    shadowOpacity: isWeb ? 0.25 : 0.2,
    shadowRadius: isWeb ? 16 : 8,
    elevation: isWeb ? 12 : 6,
  },
  registerButton: {
    backgroundColor: '#FFFFFF', // Clean white background
    borderWidth: 2,
    borderColor: '#8B5CF6', // Purple to match logo
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: isWeb ? 8 : 4,
    },
    shadowOpacity: isWeb ? 0.15 : 0.1,
    shadowRadius: isWeb ? 16 : 8,
    elevation: isWeb ? 12 : 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: isWeb ? 18 : 16,
    fontWeight: '600',
    letterSpacing: isWeb ? 0.3 : 0,
    textAlign: 'center',
  },
  registerButtonText: {
    color: '#8B5CF6', // Purple text for white button
    fontSize: isWeb ? 18 : 16,
    fontWeight: '600',
    letterSpacing: isWeb ? 0.3 : 0,
    textAlign: 'center',
  },
});
