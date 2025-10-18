import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Dimensions, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { useSafeTheme } from '../contexts/useSafeTheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useSafeTheme();

  // Real-time validation states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [isFirstNameValid, setIsFirstNameValid] = useState(false);
  const [isLastNameValid, setIsLastNameValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  const { register, googleLogin } = useAuth();
  const { playSound } = useSound();

  // Real-time validation functions
  const validateFirstName = (name) => {
    if (!name.trim()) {
      setFirstNameError('');
      setIsFirstNameValid(false);
      return;
    }
    if (name.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters');
      setIsFirstNameValid(false);
      return;
    }
    setFirstNameError('');
    setIsFirstNameValid(true);
  };

  const validateLastName = (name) => {
    if (!name.trim()) {
      setLastNameError('');
      setIsLastNameValid(false);
      return;
    }
    if (name.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      setIsLastNameValid(false);
      return;
    }
    setLastNameError('');
    setIsLastNameValid(true);
  };

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

  const validateUsername = (username) => {
    if (!username.trim()) {
      setUsernameError('');
      setIsUsernameValid(false);
      return;
    }
    if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsUsernameValid(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setIsUsernameValid(false);
      return;
    }
    setUsernameError('');
    setIsUsernameValid(true);
  };

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

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('');
      setIsConfirmPasswordValid(false);
      return;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      setIsConfirmPasswordValid(false);
      return;
    }
    setConfirmPasswordError('');
    setIsConfirmPasswordValid(true);
  };

  // Handle input changes with real-time validation
  const handleFirstNameChange = (text) => {
    setFirstName(text);
    validateFirstName(text);
  };

  const handleLastNameChange = (text) => {
    setLastName(text);
    validateLastName(text);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    validateEmail(text);
  };

  const handleUsernameChange = (text) => {
    setUsername(text);
    validateUsername(text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validatePassword(text);
    // Re-validate confirm password when password changes
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    validateConfirmPassword(text);
  };

  const handleRegister = async () => {
    // Validate all fields
    validateFirstName(firstName);
    validateLastName(lastName);
    validateEmail(email);
    validateUsername(username);
    validatePassword(password);
    validateConfirmPassword(confirmPassword);

    // Check if all fields are valid
    const allFieldsValid = isFirstNameValid && isLastNameValid && isEmailValid && 
                          isUsernameValid && isPasswordValid && isConfirmPasswordValid;

    if (!allFieldsValid) {
      playSound('error');
      Alert.alert('Error', 'Please fix all validation errors before registering');
      return;
    }

    setIsLoading(true);
    playSound('button');

    try {
      const result = await register({
        firstName,
        lastName,
        email,
        username,
        password
      });

      if (result.success) {
        playSound('success');
        Alert.alert(
          'Registration Successful!', 
          'Your account has been created. Please log in to continue.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        playSound('error');
        const errorMessages = {
          'auth/email-already-in-use': 'Email already exists. Please try logging in instead.',
          'auth/invalid-email': 'Please enter a valid email address.',
          'auth/weak-password': 'Password should be at least 6 characters.',
          'auth/network-request-failed': 'Network error. Please check your internet connection.'
        };
        Alert.alert('Registration Failed', errorMessages[result.errorCode] || result.error || 'Registration failed');
      }
    } catch (error) {
      playSound('error');
      Alert.alert('Error', 'An unexpected error occurred');
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
          <Text style={styles.subtitle}>Create your account to start your dream journey</Text>
        </View>

        <View style={styles.formContainer}>
          {/* First Name */}
          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>First Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                firstNameError ? styles.inputError : isFirstNameValid ? styles.inputSuccess : null
              ]}
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={handleFirstNameChange}
              autoCapitalize="words"
            />
            {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
          </View>

          {/* Last Name */}
          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Last Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                lastNameError ? styles.inputError : isLastNameValid ? styles.inputSuccess : null
              ]}
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={handleLastNameChange}
              autoCapitalize="words"
            />
            {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
          </View>

          {/* Email */}
          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                emailError ? styles.inputError : isEmailValid ? styles.inputSuccess : null
              ]}
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Username */}
          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                usernameError ? styles.inputError : isUsernameValid ? styles.inputSuccess : null
              ]}
              placeholder="Choose a username"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
            />
            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
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
                  color="#9B70D8"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View>
            <View style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
              confirmPasswordError ? styles.inputError : isConfirmPasswordValid ? styles.inputSuccess : null
            ]}>
              <TextInput
                placeholder="Confirm password"
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                style={styles.passwordInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

          <TouchableOpacity 
            style={[
              styles.registerButton,
              (!isFirstNameValid || !isLastNameValid || !isEmailValid || 
               !isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || isLoading) 
                ? styles.registerButtonDisabled : null
            ]} 
            onPress={handleRegister}
            disabled={!isFirstNameValid || !isLastNameValid || !isEmailValid || 
                     !isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || isLoading}
          >
            <Text style={[
              styles.buttonText,
              (!isFirstNameValid || !isLastNameValid || !isEmailValid || 
               !isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || isLoading)
                ? styles.buttonTextDisabled : null
            ]}>
              {isLoading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or Register with</Text>

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
                  playSound('success');
                  Alert.alert('Success', 'Logged in with Google');
                  // AuthRouter will handle the proper navigation based on user status
                } else if (res.error) {
                  playSound('error');
                  Alert.alert('Google Sign-In', res.error);
                }
              }}
            >
              <FontAwesome name="google" size={24} color="#DB4437" />
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login Now</Text>
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
  registerButton: {
    backgroundColor: '#9B70D8', // Purple primary color - same as index
    borderWidth: 0,
    paddingVertical: isWeb ? 22 : 20,
    paddingHorizontal: isWeb ? 36 : 28,
    borderRadius: isWeb ? 16 : 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  buttonText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
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
  registerButtonDisabled: {
    backgroundColor: '#6A3E9E', // Darker purple when loading
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonTextDisabled: {
    color: 'white',
  },
});
