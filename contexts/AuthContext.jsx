import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firebaseReady } from '../lib/firebase.js';
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    if (firebaseReady) {
      console.log('AuthContext: Setting up Firebase auth state listener');
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          console.log('AuthContext: Auth state changed, user:', firebaseUser ? firebaseUser.uid : 'null');
          
          // Ignore auth state changes during registration
          if (isRegistering) {
            console.log('AuthContext: Ignoring auth state change during registration');
            return;
          }
          
          if (firebaseUser) {
            console.log('AuthContext: User authenticated, setting up user data');
            
            // Check if we already have user data to preserve new user status
            const existingUserData = await AsyncStorage.getItem('userData');
            const newUserFlag = await AsyncStorage.getItem('isNewUser');
            
            let userData;
            if (existingUserData) {
              // Use existing user data to preserve new user status and custom fields
              userData = JSON.parse(existingUserData);
              // Update with current Firebase user data
              userData.id = firebaseUser.uid;
              userData.email = firebaseUser.email;
              if (firebaseUser.displayName) {
                userData.displayName = firebaseUser.displayName;
              }
              console.log('AuthContext: Using existing user data');
            } else {
              // Create new user data
              userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                firstName: firebaseUser.displayName?.split(' ')[0] || 'Dream',
                lastName: firebaseUser.displayName?.split(' ')[1] || 'Explorer',
                username: firebaseUser.email?.split('@')[0],
                displayName: firebaseUser.displayName,
              };
              console.log('AuthContext: Created new user data');
            }
            
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
            
            // Check if user has completed onboarding
            await checkOnboardingStatus(firebaseUser.uid);
            console.log('AuthContext: Checking new user flag:', newUserFlag);
            console.log('AuthContext: Has completed onboarding:', hasCompletedOnboarding);
            
            if (newUserFlag === 'true' || !hasCompletedOnboarding) {
              console.log('AuthContext: User is new or hasn\'t completed onboarding');
              setIsNewUser(true);
              // Ensure the flag is set
              await AsyncStorage.setItem('isNewUser', 'true');
            } else {
              console.log('AuthContext: User has completed onboarding, is existing user');
              setIsNewUser(false);
            }
            
            console.log('AuthContext: User session restored successfully');
          } else {
            console.log('AuthContext: No user authenticated, clearing local data');
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('isNewUser');
            setUser(null);
            setIsAuthenticated(false);
            setIsNewUser(false);
          }
        } catch (error) {
          console.error('Auth state sync error:', error);
        } finally {
          setIsLoading(false);
        }
      });
      return unsubscribe;
    } else {
      console.log('AuthContext: Firebase not ready, falling back to local storage');
      // Fall back to local storage auth
      checkAuthStatus();
    }
  }, [isRegistering]);

  // Function to check if current session is still valid
  const checkSessionValidity = async () => {
    try {
      if (firebaseReady && auth.currentUser) {
        // Refresh the user token to check if it's still valid
        await auth.currentUser.getIdToken(true);
        console.log('AuthContext: Session is valid');
        return true;
      } else if (user) {
        // If Firebase is not ready but we have local user data, assume valid
        console.log('AuthContext: Using local session data');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      // If token refresh fails, clear the session
      await logout();
      return false;
    }
  };

  // Function to check onboarding completion status
  const checkOnboardingStatus = async (userId) => {
    try {
      const onboardingStatus = await AsyncStorage.getItem(`onboarding_completed_${userId}`);
      const isCompleted = onboardingStatus === 'true';
      console.log('AuthContext: Onboarding status for user', userId, ':', isCompleted);
      setHasCompletedOnboarding(isCompleted);
      return isCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
      return false;
    }
  };

  // Periodic session validation for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('AuthContext: Setting up periodic session validation');
      const interval = setInterval(async () => {
        const isValid = await checkSessionValidity();
        if (!isValid) {
          console.log('AuthContext: Session expired, clearing auth state');
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => {
        console.log('AuthContext: Clearing session validation interval');
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, user]);

  const checkAuthStatus = async () => {
    try {
      console.log('AuthContext: Checking local auth status');
      const userData = await AsyncStorage.getItem('userData');
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('AuthContext: Found local user data, restoring session');
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsNewUser(newUserFlag === 'true');
        console.log('AuthContext: Local session restored successfully');
      } else {
        console.log('AuthContext: No local user data found');
        setUser(null);
        setIsAuthenticated(false);
        setIsNewUser(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsNewUser(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      if (firebaseReady) {
        // Add retry logic for network failures
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
            
            // Check if this is a new user's first login
            const newUserFlag = await AsyncStorage.getItem('isNewUser');
            console.log('AuthContext: Login - checking new user flag:', newUserFlag);
            
            if (newUserFlag === 'true') {
              // This is a new user's first login after registration, mark them for onboarding
              console.log('AuthContext: New user logging in, setting isNewUser to true');
              setIsNewUser(true);
              // Keep the flag in AsyncStorage for onAuthStateChanged to pick up
              await AsyncStorage.setItem('isNewUser', 'true');
            } else {
              // Existing user - check their onboarding status
              console.log('AuthContext: Existing user logging in');
              setIsNewUser(false);
            }
            
            return { success: true };
          } catch (authError) {
            retryCount++;
            console.warn(`Login attempt ${retryCount} failed:`, authError.message);
            
            // Handle specific network errors
            if (authError.code === 'auth/network-request-failed' || 
                authError.message?.includes('fetch') || 
                authError.message?.includes('network')) {
              
              if (retryCount >= maxRetries) {
                console.warn('Max retries reached for login, using local fallback');
                break; // Fall through to local fallback
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              // Non-network error, don't retry
              setIsRegistering(false);
              throw authError;
            }
          }
        }
      }
      
      // Local fallback (either Firebase not ready or network failure)
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
      console.log('AuthContext: Starting registration process');
      setIsRegistering(true);
      
      if (firebaseReady) {
        // Add retry logic for network failures
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const displayName = [firstName, lastName].filter(Boolean).join(' ');
            if (displayName) {
              await updateProfile(cred.user, { displayName });
            }
            
            // Set user data and mark as authenticated
            const userData = {
              id: cred.user.uid,
              email: cred.user.email,
              firstName,
              lastName,
              username,
              displayName
            };
            
            console.log('AuthContext: Setting user data after registration:', userData);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            
            // Mark as new user for onboarding, but don't authenticate yet
            // This will be set when they actually log in
            await AsyncStorage.setItem('isNewUser', 'true');
            
            // Log out the user immediately after registration so they have to log in manually
            await signOut(auth);
            console.log('AuthContext: User logged out after registration, redirecting to login');
            
            setIsRegistering(false);
            return { success: true, user: userData };
          } catch (authError) {
            retryCount++;
            console.warn(`Registration attempt ${retryCount} failed:`, authError.message);
            
            // Handle specific network errors
            if (authError.code === 'auth/network-request-failed' || 
                authError.message?.includes('fetch') || 
                authError.message?.includes('network')) {
              
              if (retryCount >= maxRetries) {
                console.warn('Max retries reached for registration, using local fallback');
                setIsRegistering(false);
                break; // Fall through to local fallback
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              // Non-network error, don't retry
              setIsRegistering(false);
              throw authError;
            }
          }
        }
      }
      
      // Local fallback (either Firebase not ready or network failure)
      const newUser = {
        id: Date.now(),
        email,
        firstName,
        lastName,
        username,
        registerTime: new Date().toISOString()
      };
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      // Don't set isNewUser flag yet - let them go to login first
      setUser(newUser);
      setIsAuthenticated(true);
      setIsRegistering(false);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      setIsRegistering(false);
      return { success: false, error: error.message || 'Registration failed', errorCode: error?.code };
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout process');
      if (firebaseReady) {
        await signOut(auth);
        console.log('AuthContext: Firebase signout completed');
      }
      
      // Clear all auth state
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('isNewUser');
      setUser(null);
      setIsAuthenticated(false);
      setIsNewUser(false);
      
      console.log('AuthContext: User logged out successfully');
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
        const result = await signInWithPopup(auth, provider);
        
        // Check if this is a new user (first time signing in with Google)
        const isNewUser = result.additionalUserInfo?.isNewUser;
        if (isNewUser) {
          console.log('AuthContext: Google login - new user detected');
          await AsyncStorage.setItem('isNewUser', 'true');
          setIsNewUser(true);
        } else {
          console.log('AuthContext: Google login - existing user');
          setIsNewUser(false);
        }
        
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
      console.log('AuthContext: Completing onboarding');
      await AsyncStorage.removeItem('isNewUser');
      if (user?.id) {
        await AsyncStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        setHasCompletedOnboarding(true);
      }
      setIsNewUser(false);
      console.log('AuthContext: Onboarding completed, isNewUser set to false');
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
    hasCompletedOnboarding,
    login,
    register,
    logout,
    updateUser,
    googleLogin,
    completeOnboarding,
    checkSessionValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        // Check if this is a new user (first time signing in with Google)
        const isNewUser = result.additionalUserInfo?.isNewUser;
        if (isNewUser) {
          console.log('AuthContext: Google login - new user detected');
          await AsyncStorage.setItem('isNewUser', 'true');
          setIsNewUser(true);
        } else {
          console.log('AuthContext: Google login - existing user');
          setIsNewUser(false);
        }
        
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
      console.log('AuthContext: Completing onboarding');
      await AsyncStorage.removeItem('isNewUser');
      if (user?.id) {
        await AsyncStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        setHasCompletedOnboarding(true);
      }
      setIsNewUser(false);
      console.log('AuthContext: Onboarding completed, isNewUser set to false');
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
    hasCompletedOnboarding,
    login,
    register,
    logout,
    updateUser,
    googleLogin,
    completeOnboarding,
    checkSessionValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

