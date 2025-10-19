import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../lib/firebase';

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
              // Regular user not logged in, go to main landing page (index)
              console.log('AuthRouter: User not authenticated, redirecting to main landing page');
              router.replace('/');
            }
          } catch (error) {
            console.error('Error checking new user flag:', error);
            console.log('AuthRouter: Error occurred, redirecting to main landing page');
            router.replace('/');
          }
        };
        checkNewUser();
      } else if (isNewUser === true) {
        // New user logged in, go to welcome screen first, then onboarding flow
        console.log('AuthRouter: New user authenticated, redirecting to welcome screen');
        router.replace('/welcomescreen');
      } else if (isNewUser === false) {
        // Existing user, go to main app
        console.log('AuthRouter: Existing user authenticated, redirecting to home');
        router.replace('/(tabs)/home');
      } else {
        // isNewUser is undefined/null, check AsyncStorage directly
        console.log('AuthRouter: isNewUser is undefined, checking AsyncStorage directly');
        const checkUserStatus = async () => {
          try {
            const newUserFlag = await AsyncStorage.getItem('isNewUser');
            const userId = auth?.currentUser?.uid;
            const hasCompletedOnboarding = userId ? await AsyncStorage.getItem(`onboarding_completed_${userId}`) : null;
            
            console.log('AuthRouter: Direct check - newUserFlag:', newUserFlag, 'hasCompletedOnboarding:', hasCompletedOnboarding);
            
            if (newUserFlag === 'true' && hasCompletedOnboarding !== 'true') {
              console.log('AuthRouter: Direct check - New user, redirecting to welcome screen');
              router.replace('/welcomescreen');
            } else {
              console.log('AuthRouter: Direct check - Existing user, redirecting to home');
              router.replace('/(tabs)/home');
            }
          } catch (error) {
            console.error('AuthRouter: Error in direct check:', error);
            router.replace('/(tabs)/home');
          }
        };
        checkUserStatus();
      }
    }
  }, [isAuthenticated, isLoading, isNewUser]);

  return children;
}
