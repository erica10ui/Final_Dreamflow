import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeTheme } from '../contexts/useSafeTheme';

export default function QuizQuestion2() {
  const { colors } = useSafeTheme();
  const { answer1 } = useLocalSearchParams();
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const answers = [
    "Racing thoughts",
    "Not feeling sleepy", 
    "Restlessness in bed",
    "No clear reason"
  ];

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      router.push({
        pathname: '/quiz-question-3',
        params: { 
          answer1: answer1,
          answer2: selectedAnswer 
        }
      });
    }
  };

  const handleBack = () => {
    router.push('/quiz-question-1');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: '50%', backgroundColor: colors.primary }]} />
        </View>
      </View>

      {/* Question */}
      <Text style={[styles.question, { color: colors.text }]}>
        What is your biggest challenge with falling asleep?
      </Text>

      {/* Answer Options */}
      <View style={styles.answersContainer}>
        {answers.map((answer, index) => (
          <TouchableOpacity
            key={`q2-answer-${index}`}
            style={[
              styles.answerButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedAnswer === answer && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
            ]}
            onPress={() => handleAnswerSelect(answer)}
          >
            <Text style={[
              styles.answerText,
              { color: colors.text },
              selectedAnswer === answer && { color: colors.primary, fontWeight: '600' }
            ]}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.backButton, { borderColor: colors.primary }]} onPress={handleBack}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        
        {selectedAnswer && (
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 40,
    lineHeight: 32,
  },
  answersContainer: {
    flex: 1,
    gap: 16,
  },
  answerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  answerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
