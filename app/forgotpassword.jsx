import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Keyboard,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  
  // Real-time validation states
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('');
      setIsEmailValid(false);
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
      return;
    }
    setEmailError('');
    setIsEmailValid(true);
  };

  // Handle email change with real-time validation
  const handleEmailChange = (text) => {
    setEmail(text);
    validateEmail(text);
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    
    // Validate email
    validateEmail(email);
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    if (!isEmailValid) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await resetPassword(email.trim());
      
      if (result.success) {
        Alert.alert(
          'Reset Link Sent',
          'Please check your email for password reset instructions.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        const errorMessages = {
          'auth/user-not-found': 'No account found with this email address.',
          'auth/invalid-email': 'Please enter a valid email address.',
          'auth/too-many-requests': 'Too many attempts. Please try again later.',
          'auth/network-request-failed': 'Network error. Please check your internet connection.'
        };
        Alert.alert('Reset Failed', errorMessages[result.errorCode] || result.error || 'Failed to send reset email');
      }
    } catch (e) {
      Alert.alert('Reset Error', e?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="weather-night" size={24} color="#9B70D8" style={styles.starIcon} />
            <MaterialCommunityIcons name="star" size={20} color="#9B70D8" style={styles.starIcon2} />
            <Text style={styles.dreamFlowTitle}>DreamFlow</Text>
            <MaterialCommunityIcons name="star" size={18} color="#9B70D8" style={styles.starIcon3} />
            <MaterialCommunityIcons name="weather-night" size={22} color="#9B70D8" style={styles.starIcon4} />
          </View>
          <Text style={styles.subtitle}>Reset your password to continue your dream journey</Text>
        </View>

        <View style={styles.formContainer}>
          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <View style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
              emailError ? styles.inputError : isEmailValid ? styles.inputSuccess : null
            ]}>
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                style={[styles.passwordInput, { color: colors.text }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <TouchableOpacity 
            style={[
              styles.resetButton, 
              (!isEmailValid || isLoading) ? styles.resetButtonDisabled : null
            ]} 
            onPress={handleResetPassword} 
            disabled={!isEmailValid || isLoading}
          >
            <Text style={[
              styles.resetButtonText,
              (!isEmailValid || isLoading) ? styles.resetButtonTextDisabled : null
            ]}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>

          <View style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.backToLoginLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E6FA', // Light lavender background from image
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: isWeb ? 60 : 40,
    paddingBottom: isWeb ? 40 : 30,
    minHeight: isWeb ? '100vh' : '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: isWeb ? 30 : 20,
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isWeb ? 20 : 15,
  },
  starIcon: {
    position: 'absolute',
    top: -10,
    left: -30,
    opacity: 0.8,
  },
  starIcon2: {
    position: 'absolute',
    top: -5,
    right: -25,
    opacity: 0.7,
  },
  starIcon3: {
    position: 'absolute',
    bottom: -8,
    left: -20,
    opacity: 0.6,
  },
  starIcon4: {
    position: 'absolute',
    bottom: -5,
    right: -30,
    opacity: 0.8,
  },
  formContainer: {
    width: '100%',
    maxWidth: isWeb ? 420 : width * 0.9,
    alignSelf: 'center',
  },
  dreamFlowTitle: {
    fontSize: isWeb ? 48 : 42,
    fontWeight: '800',
    marginBottom: isWeb ? 15 : 12,
    color: '#9B70D8', // Using theme primary color
    textAlign: 'center',
    letterSpacing: isWeb ? 2 : 1,
    textShadowColor: '#9B70D830',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: isWeb ? 18 : 16,
    fontWeight: '500',
    marginBottom: isWeb ? 20 : 15,
    color: '#6A3E9E', // Using theme secondary text color
    textAlign: 'center',
    letterSpacing: isWeb ? 0.5 : 0,
  },
  inputLabel: {
    fontSize: isWeb ? 16 : 14,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: isWeb ? 12 : 10,
    marginLeft: 8,
    letterSpacing: isWeb ? 0.5 : 0,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: isWeb ? 20 : 16,
    paddingHorizontal: isWeb ? 24 : 20,
    height: isWeb ? 64 : 58,
    marginBottom: isWeb ? 24 : 20,
    fontSize: isWeb ? 18 : 16,
    color: '#333333', // Dark text color for better readability
    borderWidth: 0,
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: isWeb ? 8 : 4,
    },
    shadowOpacity: isWeb ? 0.15 : 0.1,
    shadowRadius: isWeb ? 16 : 8,
    elevation: isWeb ? 8 : 4,
    // Add subtle gradient effect
    borderLeftWidth: 4,
    borderLeftColor: '#9B70D8',
    placeholderTextColor: '#9B70D8', // Purple placeholder text
  },
  resetButton: {
    backgroundColor: '#9B70D8', // Purple primary color - same as login
    borderWidth: 0,
    paddingVertical: isWeb ? 22 : 20,
    paddingHorizontal: isWeb ? 36 : 28,
    borderRadius: isWeb ? 16 : 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    minWidth: isWeb ? 320 : width * 0.75,
    maxWidth: isWeb ? 420 : width * 0.85,
    // Professional gradient-like effect - same as login
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: isWeb ? 10 : 6,
    },
    shadowOpacity: isWeb ? 0.3 : 0.25,
    shadowRadius: isWeb ? 20 : 12,
    elevation: isWeb ? 15 : 8,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
  },
  resetButtonText: {
    color: 'white',
    fontSize: isWeb ? 19 : 17,
    fontWeight: '700',
    letterSpacing: isWeb ? 0.5 : 0.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  backToLoginText: {
    color: '#666',
    fontSize: 16,
  },
  backToLoginLink: {
    color: '#9B70D8',
    fontSize: 16,
    fontWeight: '600',
  },
  // Input container styles (matching password design)
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: isWeb ? 20 : 16,
    alignItems: 'center',
    marginBottom: isWeb ? 24 : 20,
    paddingHorizontal: isWeb ? 24 : 20,
    height: isWeb ? 64 : 58,
    borderWidth: 0,
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: isWeb ? 8 : 4,
    },
    shadowOpacity: isWeb ? 0.15 : 0.1,
    shadowRadius: isWeb ? 16 : 8,
    elevation: isWeb ? 8 : 4,
    // Add subtle gradient effect
    borderLeftWidth: 4,
    borderLeftColor: '#9B70D8',
  },
  passwordInput: {
    flex: 1,
    fontSize: isWeb ? 18 : 16,
    color: '#333333', // Dark text color for better readability
  },
  eyeIcon: {
    padding: 6,
  },
  // Validation styles
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 8,
  },
  resetButtonDisabled: {
    backgroundColor: '#6A3E9E', // Darker purple when loading
    shadowOpacity: 0.1,
    elevation: 2,
  },
  resetButtonTextDisabled: {
    color: 'white',
  },
});

