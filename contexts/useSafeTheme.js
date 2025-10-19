import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export const useSafeTheme = () => {
  try {
    const context = useContext(ThemeContext);
    
    // Provide fallback values if context is not available
    if (!context) {
      console.warn('useSafeTheme: ThemeContext not found, using fallback values');
      return {
        isDarkMode: false,
        isLoading: false,
        colors: {
          background: '#F0E6FA',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          text: '#2D3748',
          textSecondary: '#4A5568',
          textMuted: '#718096',
          primary: '#9B70D8',
          primaryLight: '#F0E6FA',
          primaryDark: '#6B46C1',
          border: '#E5E7EB',
          borderLight: '#F3F4F6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          shadow: '#9B70D8',
          shadowLight: '#000000',
        },
        toggleTheme: () => {
          console.warn('useSafeTheme: toggleTheme called but ThemeContext not available');
        },
      };
    }
    
    return context;
  } catch (error) {
    console.error('useSafeTheme: Error accessing ThemeContext:', error);
    // Return fallback values if there's any error
    return {
      isDarkMode: false,
      isLoading: false,
      colors: {
        background: '#F0E6FA',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        text: '#2D3748',
        textSecondary: '#4A5568',
        textMuted: '#718096',
        primary: '#9B70D8',
        primaryLight: '#F0E6FA',
        primaryDark: '#6B46C1',
        border: '#E5E7EB',
        borderLight: '#F3F4F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        shadow: '#9B70D8',
        shadowLight: '#000000',
      },
      toggleTheme: () => {
        console.warn('useSafeTheme: toggleTheme called but ThemeContext not available');
      },
    };
  }
};
