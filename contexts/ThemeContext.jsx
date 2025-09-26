import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, View } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themePreference');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
      // If no saved theme, keep the system preference that was set initially
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Keep the system preference that was set initially
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (theme) => {
    try {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      await AsyncStorage.setItem('themePreference', theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  // Theme colors
  const colors = {
    light: {
      // Background colors
      background: '#E8D5F2',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      
      // Text colors
      text: '#1F2937',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      
      // Primary colors
      primary: '#8B5CF6',
      primaryLight: '#F3E8FF',
      primaryDark: '#4C1D95',
      
      // Status colors
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      
      // Border colors
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      
      // Shadow colors
      shadow: '#000000',
      
      // Tab bar
      tabBar: '#FFFFFF',
      tabBarBorder: '#E5E7EB',
    },
    dark: {
      // Background colors
      background: '#0F0F23',
      surface: '#1A1A2E',
      card: '#16213E',
      
      // Text colors
      text: '#FFFFFF',
      textSecondary: '#D1D5DB',
      textTertiary: '#9CA3AF',
      
      // Primary colors
      primary: '#8B5CF6',
      primaryLight: '#2D1B69',
      primaryDark: '#A78BFA',
      
      // Status colors
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
      
      // Border colors
      border: '#374151',
      borderLight: '#4B5563',
      
      // Shadow colors
      shadow: '#000000',
      
      // Tab bar
      tabBar: '#1A1A2E',
      tabBarBorder: '#374151',
    }
  };

  const currentColors = colors[isDarkMode ? 'dark' : 'light'];

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    colors: currentColors,
    isLight: !isDarkMode,
    isDark: isDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

