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
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingSleepMentor() {
  const { colors } = useSafeTheme();
  const { completeOnboarding } = useAuth();
  
  const handleGetStarted = async () => {
    // Don't complete onboarding yet - let the quiz results screen do it
    router.push('/quiz-question-1');
  };

  const handleBack = () => {
    router.push('/onboarding-sos-relief');
  };

  const onGestureEvent = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 50; // Minimum swipe distance
      
      if (translationX < -threshold) {
        // Swipe left - go to home screen (finish onboarding)
        handleGetStarted();
      } else if (translationX > threshold) {
        // Swipe right - go back to previous screen
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
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Your Sleep Mentor</Text>
        
        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Get personalized tips and reminders for better sleep
        </Text>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../assets/onboard2.png')} 
            style={styles.onboardingImage}
            resizeMode="contain"
          />
        </View>

        {/* Swipe Hint */}
        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>← Swipe to go back or finish →</Text>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.backButton, { borderColor: colors.primary }]} onPress={handleBack}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.getStartedButton, { backgroundColor: colors.primary }]} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Get Started</Text>
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
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
    lineHeight: 24,
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
  pathContainer: {
    position: 'relative',
    width: 200,
    height: 120,
  },
  step: {
    position: 'absolute',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  step1: {
    width: 40,
    height: 20,
    bottom: 0,
    left: 0,
  },
  step2: {
    width: 40,
    height: 20,
    bottom: 20,
    left: 20,
  },
  step3: {
    width: 40,
    height: 20,
    bottom: 40,
    left: 40,
  },
  step4: {
    width: 40,
    height: 20,
    bottom: 60,
    left: 60,
  },
  step5: {
    width: 40,
    height: 20,
    bottom: 80,
    left: 80,
  },
  manFigure: {
    position: 'absolute',
    bottom: 25,
    left: 20,
  },
  manHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FBBF24',
    marginBottom: 4,
  },
  manBody: {
    width: 20,
    height: 30,
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    marginBottom: 4,
  },
  manArms: {
    position: 'absolute',
    top: 20,
    left: -8,
    width: 8,
    height: 20,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
  },
  manLegs: {
    position: 'absolute',
    top: 50,
    left: 2,
    width: 16,
    height: 25,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  manOutstretchedArm: {
    position: 'absolute',
    top: 15,
    right: -15,
    width: 12,
    height: 8,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  womanFigure: {
    position: 'absolute',
    bottom: 65,
    right: 20,
  },
  womanHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FBBF24',
    marginBottom: 4,
  },
  womanBody: {
    width: 20,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  womanArms: {
    position: 'absolute',
    top: 20,
    right: -8,
    width: 8,
    height: 20,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
  },
  womanLegs: {
    position: 'absolute',
    top: 50,
    left: 2,
    width: 16,
    height: 25,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  womanReachingArm: {
    position: 'absolute',
    top: 15,
    left: -15,
    width: 12,
    height: 8,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
    transform: [{ rotate: '-45deg' }],
  },
  thumbsUpContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  getStartedButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  getStartedButtonText: {
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


