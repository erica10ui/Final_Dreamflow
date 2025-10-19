import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(null);

export { ThemeContext };

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      console.log('ThemeContext: Loading theme preference...');
      const savedTheme = await AsyncStorage.getItem('themePreference');
      console.log('ThemeContext: Saved theme from storage:', savedTheme);
      
      if (savedTheme !== null) {
        const shouldBeDark = savedTheme === 'dark';
        console.log('ThemeContext: Setting dark mode to:', shouldBeDark);
        setIsDarkMode(shouldBeDark);
      } else {
        console.log('ThemeContext: No saved theme found, using default (light mode)');
        setIsDarkMode(false);
      }
    } catch (error) {
      console.error('ThemeContext: Error loading theme preference:', error);
      setIsDarkMode(false); // Fallback to light mode
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      const themeString = newTheme ? 'dark' : 'light';
      
      console.log('ThemeContext: Toggling theme from', isDarkMode ? 'dark' : 'light', 'to', themeString);
      
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('themePreference', themeString);
      
      console.log('ThemeContext: Theme preference saved successfully:', themeString);
    } catch (error) {
      console.error('ThemeContext: Error saving theme preference:', error);
    }
  };

  // Theme colors
  const colors = {
    light: {
      // Background colors - Matching the image exactly
      background: '#F0E6FA', // Light lavender background from image
      surface: '#FFFFFF', // Pure white cards and surfaces
      card: '#FFFFFF', // Pure white cards
      
      // Text colors
      text: '#2D3748',
      textSecondary: '#4A5568',
      textMuted: '#718096',
      
      // Primary colors
      primary: '#9B70D8',
      primaryLight: '#F0E6FA',
      primaryDark: '#6B46C1',
      
      // Border colors
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      
      // Status colors
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      
      // Shadow colors
      shadow: '#9B70D8',
      shadowLight: '#000000',
    },
    dark: {
      // Background colors - Lighter dark palette
      background: '#1A1A2E',
      surface: '#2A2A3E',
      card: '#2A2A3E',
      
      // Text colors
      text: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#CBD5E0',
      
      // Primary colors
      primary: '#9B70D8',
      primaryLight: '#2D1B69',
      primaryDark: '#6B46C1',
      
      // Border colors
      border: '#2D3748',
      borderLight: '#4A5568',
      
      // Status colors
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      
      // Shadow colors
      shadow: '#000000',
      shadowLight: '#9B70D8',
      
      // Special dark mode colors
      moon: '#F7FAFC',
      stars: '#E2E8F0',
      nightSky: '#0A0A1A',
    }
  };

  const currentColors = colors[isDarkMode ? 'dark' : 'light'];

  // Debug function to check theme state
  const debugTheme = () => {
    console.log('=== THEME DEBUG INFO ===');
    console.log('isDarkMode:', isDarkMode);
    console.log('isLoading:', isLoading);
    console.log('currentColors:', currentColors);
    console.log('========================');
  };

  const value = {
    isDarkMode,
    isLoading,
    toggleTheme,
    colors: currentColors,
    debugTheme, // Add debug function for development
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
