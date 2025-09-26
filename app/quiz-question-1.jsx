import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

export default function QuizQuestion1() {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const answers = [
    "Stress or anxiety",
    "Noise or light", 
    "Unknown reasons",
    "Physical discomfort"
  ];

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      router.push({
        pathname: '/quiz-question-2',
        params: { answer1: selectedAnswer }
      });
    }
  };

  const handleBack = () => {
    router.push('/onboarding-sleep-type');
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '25%' }]} />
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>
        What often causes you to wake up during the night?
      </Text>

      {/* Answer Options */}
      <View style={styles.answersContainer}>
        {answers.map((answer, index) => (
          <TouchableOpacity
            key={`q1-answer-${index}`}
            style={[
              styles.answerButton,
              selectedAnswer === answer && styles.answerButtonSelected
            ]}
            onPress={() => handleAnswerSelect(answer)}
          >
            <Text style={[
              styles.answerText,
              selectedAnswer === answer && styles.answerTextSelected
            ]}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        {selectedAnswer && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
    backgroundColor: '#E8D5F2',
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
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'left',
    marginBottom: 40,
    lineHeight: 32,
  },
  answersContainer: {
    flex: 1,
    gap: 16,
  },
  answerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  answerButtonSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#8B5CF6',
  },
  answerText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  answerTextSelected: {
    color: '#7C3AED',
    fontWeight: '600',
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
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
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




