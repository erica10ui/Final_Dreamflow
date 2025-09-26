import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
export default function OnboardingSleepType() {

  const handleNext = () => {
    router.push('/quiz-question-1');
  };


  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Discover Your Sleep Type</Text>
      
      {/* Description */}
      <Text style={styles.description}>
        Answer a few questions to personalize your experience.
      </Text>

      {/* Start Quiz Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.startQuizButton} onPress={handleNext}>
          <Text style={styles.startQuizButtonText}>Start Quiz</Text>
          <View style={styles.underline} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 80,
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  startQuizButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  startQuizButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  underline: {
    width: '100%',
    height: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
});
