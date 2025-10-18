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
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { login, googleLogin } = useAuth();
  const { colors } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  
  // Real-time validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

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

  // Real-time password validation
  const validatePassword = (password) => {
    if (!password.trim()) {
      setPasswordError('');
      setIsPasswordValid(false);
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setIsPasswordValid(false);
      return;
    }
    setPasswordError('');
    setIsPasswordValid(true);
  };

  // Handle email change with real-time validation
  const handleEmailChange = (text) => {
    setEmail(text);
    validateEmail(text);
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (text) => {
    setPassword(text);
    validatePassword(text);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    // Validate fields
    validateEmail(email);
    validatePassword(password);
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    if (!isEmailValid || !isPasswordValid) {
      Alert.alert('Error', 'Please fix the validation errors before logging in');
      return;
    }
    
    try {
      setSubmitting(true);
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        // AuthRouter will handle navigation based on user status (new vs existing)
        // No need to show alert or redirect manually
      } else {
        const errorMessages = {
          'auth/invalid-credential': 'Wrong password. Please check your password and try again.',
          'auth/wrong-password': 'Wrong password. Please check your password and try again.',
          'auth/user-not-found': 'Please register first. No account found with this email.',
          'auth/too-many-requests': 'Too many attempts. Please try again later.',
          'auth/network-request-failed': 'Network error. Please check your internet connection.',
          'auth/invalid-email': 'Please enter a valid email address.'
        };
        Alert.alert('Login Failed', errorMessages[res.errorCode] || res.error || 'Invalid credentials');
      }
    } catch (e) {
      Alert.alert('Login Error', e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.subtitle}>Welcome back to your dream journey</Text>
        </View>

        <View style={styles.formContainer}>
          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                emailError ? styles.inputError : isEmailValid ? styles.inputSuccess : null
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
            <View style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
              passwordError ? styles.inputError : isPasswordValid ? styles.inputSuccess : null
            ]}>
              <TextInput
                placeholder="Enter your password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={handlePasswordChange}
                style={[styles.passwordInput, { color: colors.text }]}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={24}
                  color={passwordVisible ? "#9B70D8" : "#9B70D8"}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity onPress={() => router.push('/forgotpassword')} style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.loginButton, 
              (!isEmailValid || !isPasswordValid || submitting) ? styles.loginButtonDisabled : null
            ]} 
            onPress={handleLogin} 
            disabled={!isEmailValid || !isPasswordValid || submitting}
          >
            <Text style={[
              styles.loginButtonText,
              (!isEmailValid || !isPasswordValid || submitting) ? styles.loginButtonTextDisabled : null
            ]}>
              {submitting ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or Login with</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => router.push('/facebook-login')}
            >
              <FontAwesome name="facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={async () => {
                const res = await googleLogin();
                if (res.success) {
                  Alert.alert('Success', 'Logged in with Google');
                  router.push('/welcomescreen');
                } else if (res.error) {
                  Alert.alert('Google Sign-In', res.error);
                }
              }}
            >
              <FontAwesome name="google" size={24} color="#DB4437" />
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Register Now</Text>
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
  logo: {
    width: isWeb ? Math.min(width * 0.12, 120) : 100,
    height: isWeb ? Math.min(width * 0.12, 120) : 100,
    marginBottom: isWeb ? 30 : 25,
    borderRadius: 15,
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
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#9B70D8',
    fontWeight: '500',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#9B70D8', // Purple primary color - same as index
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
    // Professional gradient-like effect - same as index
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
  loginButtonText: {
    color: 'white',
    fontSize: isWeb ? 19 : 17,
    fontWeight: '700',
    letterSpacing: isWeb ? 0.5 : 0.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  socialButton: {
    width: isWeb ? 70 : 60,
    height: isWeb ? 70 : 60,
    borderRadius: isWeb ? 35 : 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#9B70D860',
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  registerText: {
    color: '#666',
    fontSize: 16,
  },
  registerLink: {
    color: '#9B70D8',
    fontSize: 16,
    fontWeight: '600',
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
  loginButtonDisabled: {
    backgroundColor: '#6A3E9E', // Darker purple when logging in
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonTextDisabled: {
    color: 'white',
  },
});
