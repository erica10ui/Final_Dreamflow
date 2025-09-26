import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

export default function AuthRouter({ children }) {
  const { isAuthenticated, isLoading, isNewUser } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // User not logged in, go to login screen
        router.replace('/');
      } else if (isNewUser) {
        // New user, go to onboarding flow
        router.replace('/welcomescreen');
      } else {
        // Existing user, go to main app
        router.replace('/(tabs)/home');
      }
    }
  }, [isAuthenticated, isLoading, isNewUser]);

  return children;
}
