import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMood } from '../contexts/MoodContext';
import { useTheme } from '../contexts/ThemeContext';

const MoodSelector = ({ visible, onClose, activityType = 'general', onMoodSelected }) => {
  const { addMoodEntry } = useMood();
  const { colors } = useTheme();
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(5);

  const moods = [
    { id: 'happy', emoji: '😊', name: 'Happy', color: '#10B981' },
    { id: 'calm', emoji: '😌', name: 'Calm', color: '#3B82F6' },
    { id: 'energized', emoji: '⚡', name: 'Energized', color: '#F59E0B' },
    { id: 'focused', emoji: '🎯', name: 'Focused', color: '#8B5CF6' },
    { id: 'relaxed', emoji: '🧘', name: 'Relaxed', color: '#06B6D4' },
    { id: 'grateful', emoji: '🙏', name: 'Grateful', color: '#84CC16' },
    { id: 'peaceful', emoji: '☮️', name: 'Peaceful', color: '#EC4899' },
    { id: 'content', emoji: '😌', name: 'Content', color: '#6B7280' },
  ];

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    
    try {
      // Add mood entry to database
      const moodEntry = await addMoodEntry({
        mood: mood.id,
        intensity: selectedIntensity,
        category: activityType,
        notes: `Mood after ${activityType} activity`
      });

      if (moodEntry) {
        Alert.alert(
          'Mood Recorded!',
          `Your ${mood.name.toLowerCase()} mood has been saved.`,
          [{ text: 'OK', onPress: () => {
            onMoodSelected?.(moodEntry);
            onClose();
          }}]
        );
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save mood. Please try again.');
    }
  };

  const renderIntensitySelector = () => (
    <View style={styles.intensityContainer}>
      <Text style={[styles.intensityLabel, { color: colors.text }]}>How intense is this feeling?</Text>
      <View style={styles.intensityButtons}>
        {[1, 2, 3, 4, 5].map((intensity) => (
          <TouchableOpacity
            key={intensity}
            style={[
              styles.intensityButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedIntensity === intensity && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedIntensity(intensity)}
          >
            <Text style={[
              styles.intensityText,
              { color: colors.text },
              selectedIntensity === intensity && { color: '#FFFFFF' }
            ]}>
              {intensity}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>How are you feeling?</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {renderIntensitySelector()}

          <View style={styles.moodsGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
                  { borderColor: mood.color },
                  selectedMood?.id === mood.id && { backgroundColor: mood.color + '20' }
                ]}
                onPress={() => handleMoodSelect(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodName, { color: mood.color }]}>
                  {mood.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.skipButton, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.skipButtonText, { color: colors.text }]}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  intensityContainer: {
    marginBottom: 20,
  },
  intensityLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  intensityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  intensityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  intensityTextSelected: {
    color: '#FFFFFF',
  },
  moodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default MoodSelector;
