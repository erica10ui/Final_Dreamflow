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
import { useSafeTheme } from '../contexts/useSafeTheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OnboardingSosRelief() {
  const { colors } = useSafeTheme();
  
  const handleNext = () => {
    router.push('/onboarding-sleep-type');
  };

  const handleBack = () => {
    router.push('/onboarding-sleep-mentor');
  };

  const handleSkip = () => {
    router.push('/quiz-question-1');
  };

  const onGestureEvent = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 50; // Minimum swipe distance
      
      if (translationX < -threshold) {
        // Swipe left - go to next screen
        handleNext();
      } else if (translationX > threshold) {
        // Swipe right - go back to welcome screen
        handleBack();
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
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.border }]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Instant SOS Relief</Text>
        
        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Use calming tools during restless nights with one tap
        </Text>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../assets/onboard3.png')} 
            style={styles.onboardingImage}
            resizeMode="contain"
          />
        </View>

        {/* Swipe Hint */}
        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>← Swipe to navigate →</Text>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.skipButton, { borderColor: colors.primary }]} onPress={handleSkip}>
            <Text style={[styles.skipButtonText, { color: colors.primary }]}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
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
    textAlign: 'left',
    marginBottom: 16,
  },
  description: {
    fontSize: isWeb ? 18 : 16,
    textAlign: 'left',
    marginBottom: 60,
    lineHeight: isWeb ? 28 : 24,
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
  musicPlayerContainer: {
    position: 'absolute',
    left: -40,
    top: 20,
  },
  musicPlayer: {
    width: 80,
    height: 120,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  playerScreen: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicNote: {
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#8B5CF6',
  },
  foliage: {
    position: 'absolute',
    bottom: -10,
    left: -15,
  },
  leaf: {
    position: 'absolute',
    width: 12,
    height: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  leaf1: {
    transform: [{ rotate: '-30deg' }],
    bottom: 0,
    left: 0,
  },
  leaf2: {
    transform: [{ rotate: '0deg' }],
    bottom: 5,
    left: 8,
  },
  leaf3: {
    transform: [{ rotate: '30deg' }],
    bottom: 10,
    left: 16,
  },
  leaf4: {
    transform: [{ rotate: '60deg' }],
    bottom: 15,
    left: 24,
  },
  characterContainer: {
    position: 'absolute',
    right: -20,
    top: 10,
  },
  character: {
    position: 'relative',
    alignItems: 'center',
  },
  characterHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    marginBottom: 4,
  },
  characterBody: {
    width: 28,
    height: 40,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    marginBottom: 4,
  },
  arm: {
    position: 'absolute',
    width: 8,
    height: 20,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
  },
  leftArm: {
    top: 8,
    left: -12,
    transform: [{ rotate: '-45deg' }],
  },
  rightArm: {
    top: 8,
    right: -12,
    transform: [{ rotate: '45deg' }],
  },
  leg: {
    position: 'absolute',
    width: 12,
    height: 25,
    backgroundColor: '#1F2937',
    borderRadius: 2,
  },
  leftLeg: {
    top: 60,
    left: 4,
  },
  rightLeg: {
    top: 60,
    right: 4,
  },
  musicalNotes: {
    position: 'absolute',
    top: -20,
    left: -30,
    width: 80,
    height: 60,
  },
  floatingNote: {
    position: 'absolute',
  },
  note1: {
    top: 0,
    left: 10,
  },
  note2: {
    top: 15,
    right: 5,
  },
  note3: {
    top: 30,
    left: 5,
  },
  note4: {
    top: 45,
    right: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: isWeb ? 16 : 12,
    paddingHorizontal: isWeb ? 40 : 32,
    borderRadius: 8,
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


