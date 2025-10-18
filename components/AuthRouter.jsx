import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthRouter({ children }) {
  const { isAuthenticated, isLoading, isNewUser } = useAuth();

  useEffect(() => {
    console.log('AuthRouter: State changed - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'isNewUser:', isNewUser);
    
    if (!isLoading) {
      if (!isAuthenticated) {
        // Check if user just registered (has isNewUser flag but not authenticated)
        const checkNewUser = async () => {
          try {
            const newUserFlag = await AsyncStorage.getItem('isNewUser');
            console.log('AuthRouter: Checking new user flag for unauthenticated user:', newUserFlag);
            if (newUserFlag === 'true') {
              // User just registered, redirect to login
              console.log('AuthRouter: New user detected, redirecting to login');
              router.replace('/login');
            } else {
              // Regular user not logged in, go to welcome screen
              console.log('AuthRouter: User not authenticated, redirecting to welcome screen');
              router.replace('/');
            }
          } catch (error) {
            console.error('Error checking new user flag:', error);
            console.log('AuthRouter: Error occurred, redirecting to welcome screen');
            router.replace('/');
          }
        };
        checkNewUser();
      } else if (isNewUser) {
        // New user logged in, go to onboarding flow
        console.log('AuthRouter: New user authenticated, redirecting to onboarding');
        router.replace('/onboarding-sleep-type');
      } else {
        // Existing user, go to main app
        console.log('AuthRouter: Existing user authenticated, redirecting to home');
        router.replace('/(tabs)/home');
      }
    }
  }, [isAuthenticated, isLoading, isNewUser]);

  return children;
}
