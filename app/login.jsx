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

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { login, googleLogin } = useAuth();
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
        Alert.alert('Success', 'Login successful');
        router.push('/welcomescreen');
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
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back! Glad to see you, Again!</Text>
        </View>

        <View style={styles.formContainer}>
          <View>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              style={[
                styles.input,
                emailError ? styles.inputError : isEmailValid ? styles.inputSuccess : null
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View>
            <View style={[
              styles.inputContainer,
              passwordError ? styles.inputError : isPasswordValid ? styles.inputSuccess : null
            ]}>
              <TextInput
                placeholder="Enter your password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={handlePasswordChange}
                style={styles.passwordInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={passwordVisible ? 'eye-off' : 'eye'}
                  size={24}
                  color="gray"
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
    backgroundColor: '#E8D5F2',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: isWeb ? '100vh' : '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: isWeb ? 40 : 30,
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
  title: {
    fontSize: isWeb ? 32 : 28,
    fontWeight: '700',
    marginBottom: isWeb ? 50 : 40,
    color: '#4C1D95', // Darker purple for better contrast
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: isWeb ? 16 : 12,
    paddingHorizontal: 20,
    height: isWeb ? 60 : 56,
    marginBottom: 20,
    fontSize: isWeb ? 18 : 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: isWeb ? 16 : 12,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    height: isWeb ? 60 : 56,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: isWeb ? 18 : 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 6,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#8B5CF6',
    fontWeight: '500',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#6366F1', // Professional indigo
    paddingVertical: isWeb ? 20 : 18,
    paddingHorizontal: isWeb ? 32 : 24,
    borderRadius: isWeb ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    minWidth: isWeb ? 320 : width * 0.75,
    maxWidth: isWeb ? 420 : width * 0.85,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: isWeb ? 8 : 4,
    },
    shadowOpacity: isWeb ? 0.25 : 0.2,
    shadowRadius: isWeb ? 16 : 8,
    elevation: isWeb ? 12 : 6,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: isWeb ? 18 : 16,
    fontWeight: '600',
    letterSpacing: isWeb ? 0.3 : 0,
    textAlign: 'center',
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
    borderColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#8B5CF6',
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
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonTextDisabled: {
    color: '#6B7280',
  },
});
