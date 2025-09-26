import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function GoogleSignInPassword() {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    // Simulate successful Google sign-in
    Alert.alert('Success', 'Google sign-in successful!', [
      {
        text: 'OK',
        onPress: () => router.push('/welcomescreen')
      }
    ]);
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Google Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.googleLogo}>Google</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Welcome</Text>
      
      {/* Email Display */}
      <View style={styles.emailContainer}>
        <View style={styles.emailRow}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileText}>
              {email ? email.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.emailText}>{email}</Text>
          <TouchableOpacity onPress={handleBack}>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#5f6368" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color="#5f6368"
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password Link */}
      <TouchableOpacity style={styles.forgotContainer}>
        <Text style={styles.forgotLink}>Forgot password?</Text>
      </TouchableOpacity>

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
    marginBottom: 24,
    textAlign: 'left',
  },
  emailContainer: {
    marginBottom: 24,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#202124',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  forgotContainer: {
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  forgotLink: {
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

