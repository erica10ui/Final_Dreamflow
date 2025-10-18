import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useJournal } from '../../contexts/JournalContext';
import { useSound } from '../../contexts/SoundContext';
import { useTheme } from '../../contexts/ThemeContext';
import { router } from 'expo-router';

export default function JournalScreen() {
  const {
    dreamEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    isLoading,
    refreshEntries,
    firebaseReady,
    getStats,
  } = useJournal();
  const { playSound } = useSound();
  const { colors, isDarkMode } = useTheme();

  // Stars Background Component (shinning stars with crescent emoji)
  const renderStars = () => {
    if (!isDarkMode) return null;
    
    return (
      <View style={styles.nightSkyContainer}>
        {/* Crescent Emoji */}
        <View style={styles.crescentContainer}>
          <Text style={styles.crescentEmoji}>🌙</Text>
        </View>
        
        {/* Shinning Stars */}
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: Math.random() * 0.8 + 0.2,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState('😊');
  const [sleepQuality, setSleepQuality] = useState('Good');
  const [tags, setTags] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const moodOptions = ['😊', '😢', '😴', '😰', '😍'];
  const qualityOptions = ['Excellent', 'Good', 'Fair', 'Poor'];

  // Sort entries by date (newest first)
  const filteredAndSortedEntries = dreamEntries
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

  const handleAddEntry = () => {
    setTitle('');
    setDescription('');
    setMood('😊');
    setSleepQuality('Good');
    setTags('');
    setShowAddModal(true);
    playSound('button');
  };

  const handleSaveEntry = async () => {
    // Prevent multiple submissions
    if (isSaving) {
      console.log('LOG  ⏳ Save already in progress, ignoring duplicate click');
      return;
    }

    if (!title || !description) {
      Alert.alert('Error', 'Please enter a title and description for your dream.');
      playSound('error');
      return;
    }

    setIsSaving(true);
    const newEntry = {
      title,
      description,
      mood,
      sleepQuality,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      createdAt: new Date().toISOString(),
    };
    console.log('LOG  💾 Attempting to save dream entry...');
    try {
      await addEntry(newEntry);
      setShowAddModal(false);
      playSound('success');
      console.log('LOG  ✅ Dream entry saved successfully!');
      Alert.alert(
        'Success! 🌙',
        'Your dream has been successfully logged in your journal!',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('LOG  ❌ Error saving dream entry:', error);
      Alert.alert('Error', 'Failed to save dream entry. Please try again.');
      playSound('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEntry = (id) => {
    const entryToEdit = dreamEntries.find(entry => entry.id === id);
    if (entryToEdit) {
      setCurrentEntryId(id);
      setTitle(entryToEdit.title);
      setDescription(entryToEdit.description);
      setMood(entryToEdit.mood);
      setSleepQuality(entryToEdit.sleepQuality);
      setTags(entryToEdit.tags ? entryToEdit.tags.join(', ') : '');
      setShowEditModal(true);
      playSound('button');
    }
  };

  const handleUpdateEntry = async () => {
    // Prevent multiple submissions
    if (isUpdating) {
      console.log('LOG  ⏳ Update already in progress, ignoring duplicate click');
      return;
    }

    if (!title || !description) {
      Alert.alert('Error', 'Please enter a title and description for your dream.');
      playSound('error');
      return;
    }
    if (!currentEntryId) return;

    setIsUpdating(true);
    const updatedEntry = {
      title,
      description,
      mood,
      sleepQuality,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateEntry(currentEntryId, updatedEntry);
      setShowEditModal(false);
      playSound('success');
      Alert.alert(
        'Updated! ✨',
        'Your dream entry has been successfully updated!',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error updating dream entry:', error);
      Alert.alert('Error', 'Failed to update dream entry. Please try again.');
      playSound('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => playSound('button'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Prevent multiple deletions
            if (isDeleting) {
              console.log('LOG  ⏳ Delete already in progress, ignoring duplicate click');
              return;
            }

            setIsDeleting(true);
            try {
              await deleteEntry(id);
              playSound('success');
              Alert.alert(
                'Deleted! 🗑️',
                'Your dream entry has been successfully deleted.',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (error) {
              console.error('Error deleting dream entry:', error);
              Alert.alert('Error', 'Failed to delete dream entry. Please try again.');
              playSound('error');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshEntries();
    setRefreshing(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={48} color={colors.primary} />
        <Text style={styles.loadingText}>Loading your dreams...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {renderStars()}
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconContainer, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="book-open-variant" size={32} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Dream Journal</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Capture and explore your dreams</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]} onPress={handleAddEntry}>
              <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <MaterialCommunityIcons name="bookmark" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{dreamEntries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dreams</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <MaterialCommunityIcons name="fire" size={24} color={colors.warning} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{getStats().sleepStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <MaterialCommunityIcons name="star" size={24} color={colors.success} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{Math.round(getStats().avgSleepQuality * 20)}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quality</Text>
        </View>
      </View>

      {/* Dream Entries */}
      <View style={styles.dreamEntriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Dreams</Text>
          <Text style={styles.sectionSubtitle}>{filteredAndSortedEntries.length} entries</Text>
        </View>

        <View style={styles.dreamEntriesContainer}>
          {filteredAndSortedEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <MaterialCommunityIcons name="sleep" size={64} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyStateTitle}>No dreams yet</Text>
              <Text style={styles.emptyStateText}>
                Start your dream journey by adding your first entry
              </Text>
              <TouchableOpacity style={styles.addFirstEntryButton} onPress={handleAddEntry}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addFirstEntryText}>Add Your First Dream</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredAndSortedEntries.map((entry) => (
              <View key={entry.id} style={[styles.dreamEntry, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                <View style={styles.dreamEntryHeader}>
                  <View style={styles.dreamEntryInfo}>
                    <View style={styles.dreamEntryTitleRow}>
                      <Text style={[styles.dreamEntryTitle, { color: colors.text }]}>{entry.title || 'Untitled Dream'}</Text>
                    </View>
                    <View style={styles.dreamEntryDateTag}>
                      <Text style={[styles.dreamEntryDate, { color: colors.primary }]}>{formatDate(entry.createdAt)}</Text>
                    </View>
                    <Text style={[styles.dreamEntryDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {entry.description}
                    </Text>
                    <View style={styles.dreamEntryFooter}>
                      <View style={styles.dreamEntryMood}>
                        <Text style={styles.moodEmoji}>{entry.mood}</Text>
                        <Text style={styles.moodText}>{entry.sleepQuality}</Text>
                      </View>
                      {entry.tags && entry.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          {entry.tags.slice(0, 1).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.dreamEntryActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditEntry(entry.id)}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color="#9B70D8" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteEntry(entry.id)}
                    >
                      <MaterialCommunityIcons name="trash-can" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Dream</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter dream title"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your dream..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mood</Text>
              <View style={styles.moodContainer}>
                {moodOptions.map((moodOption) => (
                  <TouchableOpacity
                    key={moodOption}
                    style={[
                      styles.moodButton,
                      mood === moodOption && styles.moodButtonActive,
                    ]}
                    onPress={() => setMood(moodOption)}
                  >
                    <Text style={styles.moodText}>{moodOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sleep Quality</Text>
              <View style={styles.qualityContainer}>
                {qualityOptions.map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      sleepQuality === quality && styles.qualityButtonActive,
                    ]}
                    onPress={() => setSleepQuality(quality)}
                  >
                    <Text
                      style={[
                        styles.qualityText,
                        sleepQuality === quality && styles.qualityTextActive,
                      ]}
                    >
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tags (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={tags}
                onChangeText={setTags}
                placeholder="Enter tags separated by commas"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveEntry}
              disabled={isSaving}
            >
              <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
                {isSaving ? 'Saving...' : 'Save Dream'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Dream</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter dream title"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your dream..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mood</Text>
              <View style={styles.moodContainer}>
                {moodOptions.map((moodOption) => (
                  <TouchableOpacity
                    key={moodOption}
                    style={[
                      styles.moodButton,
                      mood === moodOption && styles.moodButtonActive,
                    ]}
                    onPress={() => setMood(moodOption)}
                  >
                    <Text style={styles.moodText}>{moodOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sleep Quality</Text>
              <View style={styles.qualityContainer}>
                {qualityOptions.map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      sleepQuality === quality && styles.qualityButtonActive,
                    ]}
                    onPress={() => setSleepQuality(quality)}
                  >
                    <Text
                      style={[
                        styles.qualityText,
                        sleepQuality === quality && styles.qualityTextActive,
                      ]}
                    >
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tags (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={tags}
                onChangeText={setTags}
                placeholder="Enter tags separated by commas"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
              onPress={handleUpdateEntry}
              disabled={isUpdating}
            >
              <Text style={[styles.saveButtonText, isUpdating && styles.saveButtonTextDisabled]}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100, // Add bottom padding to ensure content is not covered by bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0E6FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6A3E9E',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9B70D8',
    fontWeight: '400',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9B70D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6A3E9E',
    fontWeight: '500',
  },
  dreamEntriesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9B70D8',
    fontWeight: '500',
  },
  dreamEntriesContainer: {
    gap: 16,
  },
  dreamEntry: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  dreamEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dreamEntryInfo: {
    flex: 1,
  },
  dreamEntryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  dreamEntryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
  },
  dreamEntryDateTag: {
    marginBottom: 6,
  },
  dreamEntryDate: {
    fontSize: 13,
    color: '#9B70D8',
    fontWeight: '600',
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dreamEntryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  dreamEntryDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  dreamEntryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dreamEntryMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#9B70D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  addFirstEntryButton: {
    backgroundColor: '#9B70D8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addFirstEntryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  moodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  moodButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  moodButtonActive: {
    backgroundColor: '#9B70D8',
    borderColor: '#9B70D8',
  },
  moodText: {
    fontSize: 24,
  },
  qualityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  qualityButtonActive: {
    backgroundColor: '#9B70D8',
    borderColor: '#9B70D8',
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  qualityTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#9B70D8',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Stars and Crescent Styles
  nightSkyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  crescentContainer: {
    position: 'absolute',
    top: 80,
    right: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crescentEmoji: {
    fontSize: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
});