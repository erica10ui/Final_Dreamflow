import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { JournalProvider } from '../contexts/JournalContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SoundProvider } from '../contexts/SoundContext';
import { SleepProvider } from '../contexts/SleepContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import AuthRouter from '../components/AuthRouter';

export default function Layout() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.warn('Unhandled promise rejection:', event.reason);
      
      // Handle specific keep awake errors
      if (event.reason && event.reason.message && 
          event.reason.message.includes('Unable to activate keep awake')) {
        console.warn('Keep awake error handled gracefully:', event.reason.message);
        event.preventDefault(); // Prevent the error from crashing the app
        return;
      }
      
      // Handle other unhandled promise rejections
      if (event.reason && event.reason.message) {
        console.error('Unhandled promise rejection:', event.reason.message);
      }
    };

    // Add event listener for unhandled promise rejections (web only)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    // For React Native, we can also set up a global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Unable to activate keep awake')) {
        console.warn('Keep awake error handled gracefully:', message);
        return; // Don't log this as an error
      }
      originalConsoleError.apply(console, args);
    };

    // Cleanup
    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <SoundProvider>
            <JournalProvider>
              <SleepProvider>
                <AuthRouter>
                <Stack
                  screenOptions={{
                    animation: 'none', // Disable slide animations
                    gestureEnabled: false, // Disable swipe gestures
                    headerShown: false, // Hide all headers by default
                  }}
                >
                  <Stack.Screen 
                    name="index" 
                    options={{ 
                      headerShown: false,
                      title: 'Dream Journal'
                    }} 
                  />
                  <Stack.Screen 
                    name="(tabs)" 
                    options={{ 
                      headerShown: false,
                      title: 'Dream Journal'
                    }} 
                  />
                </Stack>
                </AuthRouter>
              </SleepProvider>
            </JournalProvider>
          </SoundProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
