import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, StatusBar } from 'react-native';
import { JournalProvider } from '../contexts/JournalContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SoundProvider } from '../contexts/SoundContext';
import { SleepProvider } from '../contexts/SleepContext';
import { MoodProvider } from '../contexts/MoodContext';
import { ActivityTrackingProvider } from '../contexts/ActivityTrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { SimpleNotificationProvider } from '../contexts/SimpleNotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import AuthRouter from '../components/AuthRouter';
import NetworkStatus from '../components/NetworkStatus';
import ErrorBoundary from '../components/ErrorBoundary';

// Wrapper component to pass user to SleepProvider
function SleepProviderWrapper({ children }) {
  const { user } = useAuth();
  return <SleepProvider user={user}>{children}</SleepProvider>;
}

// Wrapper component to pass user to MoodProvider
function MoodProviderWrapper({ children }) {
  const { user } = useAuth();
  return <MoodProvider user={user}>{children}</MoodProvider>;
}

// Wrapper component to pass user to ActivityTrackingProvider
function ActivityTrackingProviderWrapper({ children }) {
  const { user } = useAuth();
  return <ActivityTrackingProvider user={user}>{children}</ActivityTrackingProvider>;
}

// Wrapper component to pass user to JournalProvider
function JournalProviderWrapper({ children }) {
  const { user } = useAuth();
  return <JournalProvider user={user}>{children}</JournalProvider>;
}

export default function Layout() {
  useEffect(() => {
    // Hide status bar for fullscreen experience
    StatusBar.setHidden(true, 'fade');
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
      // Show status bar when component unmounts
      StatusBar.setHidden(false, 'fade');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <SoundProvider>
              <JournalProviderWrapper>
                <SleepProviderWrapper>
                  <MoodProviderWrapper>
                    <ActivityTrackingProviderWrapper>
                      <SimpleNotificationProvider>
                    <AuthRouter>
                      <NetworkStatus />
                      <Stack
                        screenOptions={{
                          animation: 'none', // Disable slide animations
                          gestureEnabled: false, // Disable swipe gestures
                          headerShown: false, // Hide all headers by default
                        }}
                      />
                    </AuthRouter>
                      </SimpleNotificationProvider>
                    </ActivityTrackingProviderWrapper>
                  </MoodProviderWrapper>
                </SleepProviderWrapper>
              </JournalProviderWrapper>
            </SoundProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
