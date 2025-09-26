import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firebaseReady } from '../lib/firebase';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (firebaseReady) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(' ')[0] || 'Dream',
              lastName: firebaseUser.displayName?.split(' ')[1] || 'Explorer',
              username: firebaseUser.email?.split('@')[0],
            };
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            await AsyncStorage.removeItem('userData');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Auth state sync error:', error);
        } finally {
          setIsLoading(false);
        }
      });
      return unsubscribe;
    } else {
      // Fall back to local storage auth
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsNewUser(newUserFlag === 'true');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      if (firebaseReady) {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      }
      // Local fallback
      const userData = {
        id: Date.now(),
        email,
        firstName: 'Dream',
        lastName: 'Explorer',
        username: email.split('@')[0],
        loginTime: new Date().toISOString()
      };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed', errorCode: error?.code };
    }
  };

  const register = async ({ email, password, firstName, lastName, username }) => {
    try {
      if (firebaseReady) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = [firstName, lastName].filter(Boolean).join(' ');
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        // Mark as new user for onboarding
        setIsNewUser(true);
        await AsyncStorage.setItem('isNewUser', 'true');
        return { success: true };
      }
      // Local fallback
      const newUser = {
        id: Date.now(),
        email,
        firstName,
        lastName,
        username,
        registerTime: new Date().toISOString()
      };
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      await AsyncStorage.setItem('isNewUser', 'true');
      setUser(newUser);
      setIsAuthenticated(true);
      setIsNewUser(true);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed', errorCode: error?.code };
    }
  };

  const logout = async () => {
    try {
      if (firebaseReady) {
        await signOut(auth);
      } else {
        await AsyncStorage.removeItem('userData');
        setUser(null);
        setIsAuthenticated(false);
      }
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message || 'Logout failed' };
    }
  };

  const googleLogin = async () => {
    try {
      if (!firebaseReady) {
        return { success: false, error: 'Firebase not configured' };
      }
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        return { success: true };
      }
      // Native mobile via Google OAuth -> Firebase credential
      WebBrowser.maybeCompleteAuthSession();
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };
      const result = await AuthSession.startAsync({
        authUrl:
          `${discovery.authorizationEndpoint}` +
          `?client_id=${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=token` +
          `&scope=${encodeURIComponent('profile email')}`,
      });
      if (result.type !== 'success' || !result.params?.access_token) {
        return { success: false, error: 'Google sign-in cancelled' };
      }
      // Exchange Google OAuth token for Firebase credential via IdP (requires backend or googleIdToken)
      // Simplest path for Expo: use signInWithPopup on web or use native SDKs in dev build.
      return { success: false, error: 'Use web for Google login or provide native client config.' };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message || 'Google login failed' };
    }
  };

  const updateUser = async (updatedData) => {
    try {
      const newUserData = { ...user, ...updatedData };
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      setUser(newUserData);
      return { success: true, user: newUserData };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Update failed' };
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('isNewUser');
      setIsNewUser(false);
      return { success: true };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error: 'Failed to complete onboarding' };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isNewUser,
    login,
    register,
    logout,
    updateUser,
    googleLogin,
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

