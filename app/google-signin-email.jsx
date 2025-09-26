import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

export default function GoogleSignInEmail() {
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }
    
    // Navigate to password screen with email
    router.push({
      pathname: '/google-signin-password',
      params: { email: email.trim() }
    });
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      {/* Google Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.googleLogo}>Google</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Continue to DreamFlow</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email or phone"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Forgot Email Link */}
      <TouchableOpacity style={styles.forgotContainer}>
        <Text style={styles.forgotLink}>Forgot email?</Text>
      </TouchableOpacity>

      {/* Guest Mode Info */}
      <View style={styles.guestModeContainer}>
        <Text style={styles.guestModeText}>
          Not your computer? Use Guest mode to sign in privately.
        </Text>
        <TouchableOpacity>
          <Text style={styles.learnMoreLink}>Learn more</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleCreateAccount}>
          <Text style={styles.createAccountLink}>Create account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  googleLogo: {
    fontSize: 32,
    fontWeight: '400',
    color: '#4285F4',
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    color: '#202124',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 40,
    textAlign: 'left',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#202124',
  },
  forgotContainer: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  forgotLink: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  guestModeContainer: {
    marginBottom: 40,
  },
  guestModeText: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
    marginBottom: 8,
  },
  learnMoreLink: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  createAccountLink: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

