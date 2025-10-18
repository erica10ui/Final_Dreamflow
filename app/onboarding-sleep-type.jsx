import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeTheme } from '../contexts/useSafeTheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function OnboardingSleepType() {
  const { colors } = useSafeTheme();
  
  const handleNext = () => {
    router.push('/onboarding-sos-relief');
  };

  const onGestureEvent = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 50; // Minimum swipe distance
      
      if (translationX < -threshold) {
        // Swipe left - go to next screen
        handleNext();
      }
    }
  };

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.border }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.border }]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Discover Your Sleep Type</Text>
        
        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Answer a few questions to personalize your sleep experience and get tailored recommendations.
        </Text>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../assets/onboard1.png')} 
            style={styles.onboardingImage}
            resizeMode="contain"
          />
        </View>

        {/* Swipe Hint */}
        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>← Swipe to continue →</Text>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: isWeb ? 32 : 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: isWeb ? 40 : 36,
  },
  description: {
    fontSize: isWeb ? 18 : 16,
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: isWeb ? 28 : 24,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onboardingImage: {
    width: isWeb ? Math.min(width * 0.8, 400) : width * 0.9,
    height: isWeb ? Math.min(width * 0.6, 300) : width * 0.7,
    borderRadius: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  nextButton: {
    paddingVertical: isWeb ? 16 : 12,
    paddingHorizontal: isWeb ? 40 : 32,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});
