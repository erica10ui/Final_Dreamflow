import React, { createContext, useContext, useState, useEffect } from 'react';
// Note: expo-av is deprecated, but we're only using haptic feedback
// No actual audio functionality is implemented

const SoundContext = createContext();

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sounds, setSounds] = useState({});

  const playSound = async (soundName) => {
    if (!soundEnabled) return;

    try {
      // Check if we're in a web environment or if Haptics is not available
      if (typeof window !== 'undefined' || typeof require === 'undefined') {
        console.log(`Playing sound: ${soundName}`);
        return;
      }

      // For now, we'll use haptic feedback instead of sound files
      // This provides tactile feedback without requiring sound files
      const { Haptics } = require('expo-haptics');
      
      // Check if Haptics is available and has the required methods
      if (!Haptics || typeof Haptics.impactAsync !== 'function' || typeof Haptics.notificationAsync !== 'function') {
        console.log(`Playing sound: ${soundName}`);
        return;
      }
      
      switch (soundName) {
        case 'button':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'page':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        default:
          return;
      }
    } catch (error) {
      console.log('Haptic feedback error:', error);
      // Fallback: just log the sound name
      console.log(`Playing sound: ${soundName}`);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const value = {
    soundEnabled,
    playSound,
    toggleSound
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};
