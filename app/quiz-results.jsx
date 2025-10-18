import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeTheme } from '../contexts/useSafeTheme';

const { width, height } = Dimensions.get('window');

export default function QuizResults() {
  const { colors } = useSafeTheme();
  const { answer1, answer2, answer3 } = useLocalSearchParams();
  const { completeOnboarding } = useAuth();
  const [confetti, setConfetti] = useState([]);
  const [showConfetti, setShowConfetti] = useState(true);

  // Generate confetti pieces
  useEffect(() => {
    const confettiPieces = [];
    for (let i = 0; i < 50; i++) {
      confettiPieces.push({
        id: i,
        x: Math.random() * width,
        y: -50,
        rotation: Math.random() * 360,
        color: ['#8B5CF6', '#7C3AED', '#A855F7', '#C084FC', '#DDD6FE'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        speed: Math.random() * 3 + 2,
      });
    }
    setConfetti(confettiPieces);

    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/home');
  };

  const handleRetakeQuiz = () => {
    router.push('/quiz-question-1');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Confetti Animation */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {confetti.map((piece) => (
            <Animated.View
              key={piece.id}
              style={[
                styles.confettiPiece,
                {
                  left: piece.x,
                  top: piece.y,
                  backgroundColor: piece.color,
                  width: piece.size,
                  height: piece.size,
                  transform: [{ rotate: `${piece.rotation}deg` }],
                },
              ]}
            />
          ))}
        </View>
      )}

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Results Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>🎉 You're a Night Owl! 🎉</Text>
          
          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Here's what can help you sleep better.
          </Text>

          {/* Personalized Recommendations */}
          <View style={styles.recommendationsContainer}>
            <View style={[styles.recommendationItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>🌙 Evening Routine</Text>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                Create a consistent bedtime routine 1 hour before sleep. This helps signal to your body that it's time to wind down and prepare for rest.
              </Text>
            </View>

            <View style={[styles.recommendationItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>📱 Digital Sunset</Text>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                Avoid screens 30 minutes before bed to reduce blue light exposure. Consider using blue light filters or reading a book instead.
              </Text>
            </View>

            <View style={[styles.recommendationItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>🧘 Relaxation</Text>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                Try meditation, deep breathing exercises, or gentle stretching to calm your mind and release tension from the day.
              </Text>
            </View>

            <View style={[styles.recommendationItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>🌡️ Environment</Text>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                Keep your bedroom cool (65-68°F), dark, and quiet for optimal sleep. Consider blackout curtains and white noise if needed.
              </Text>
            </View>

            <View style={[styles.recommendationItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>⏰ Consistent Schedule</Text>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body's internal clock.
              </Text>
            </View>

            <View style={[styles.recommendationItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>🍵 Evening Drinks</Text>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                Avoid caffeine after 2 PM and limit alcohol before bed. Try herbal teas like chamomile or valerian root instead.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.retakeButton, { borderColor: colors.primary }]} onPress={handleRetakeQuiz}>
          <Text style={[styles.retakeButtonText, { color: colors.primary }]}>Retake Quiz</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.getStartedButton, { backgroundColor: colors.primary }]} onPress={handleGetStarted}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  recommendationsContainer: {
    width: '100%',
    gap: 20,
  },
  recommendationItem: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  getStartedButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});




