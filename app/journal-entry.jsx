import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useSound } from '../contexts/SoundContext';
import { useJournal } from '../contexts/JournalContext';
import { useTheme } from '../contexts/ThemeContext';

// ✅ Import Firebase
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";


export default function JournalEntry() {
  const { id } = useLocalSearchParams();
  const { colors, isDarkMode } = useTheme();

  // Stars Background Component (shining stars with crescent emoji)
  const renderStars = () => {
    if (!isDarkMode) return null;
    
    return (
      <View style={styles.nightSkyContainer}>
        {/* Crescent Emoji */}
        <View style={styles.crescentContainer}>
          <Text style={styles.crescentEmoji}>🌙</Text>
        </View>
        
        {/* Animated Stars */}
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
              },
            ]}
          />
        ))}
      </View>
    );
  };
  const { playSound } = useSound();
  const { getEntryById, isRealtimeConnected } = useJournal();

  const [entry, setEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mood: '😊',
    sleepQuality: 'Good'
  });

  const moods = ['😊', '😌', '😴', '😰', '😤', '😢', '😡', '🤔'];
  const sleepQualities = ['Excellent', 'Great', 'Good', 'Fair', 'Poor'];

  // ✅ Fetch entry from Firestore or real-time context
  useEffect(() => {
    const fetchEntry = async () => {
      if (id && id !== 'new') {
        try {
          // First try to get from real-time context
          const contextEntry = await getEntryById(id);
          if (contextEntry) {
            setEntry(contextEntry);
            setFormData({
              title: contextEntry.title,
              description: contextEntry.description,
              mood: contextEntry.mood,
              sleepQuality: contextEntry.sleepQuality
            });
            return;
          }

          // Fallback to direct Firestore fetch
          const user = auth.currentUser;
          if (!user) return;

          const userDocRef = doc(db, "users", user.uid);
          const entryDocRef = doc(userDocRef, "journalEntries", id);

          const snap = await getDoc(entryDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setEntry({ id: snap.id, ...data });
            setFormData({
              title: data.title,
              description: data.description,
              mood: data.mood,
              sleepQuality: data.sleepQuality
            });
          }
        } catch (err) {
          console.error("Error fetching entry:", err);
        }
      } else {
        setIsEditing(true);
      }
    };

    fetchEntry();
  }, [id, getEntryById]);

  // ✅ Save entry (add or update)
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      playSound('error');
      Alert.alert('Error', 'Please fill in both title and description');
      return;
    }

    setIsLoading(true);
    playSound('button');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const userDocRef = doc(db, "users", user.uid);
      const journalRef = collection(userDocRef, "journalEntries");

      if (id && id !== 'new') {
        // 🔄 Update Firestore entry
        const entryDocRef = doc(journalRef, id);
        await updateDoc(entryDocRef, formData);
        playSound('success');
        Alert.alert('Success', 'Dream entry updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        // 🆕 Add new entry
        await addDoc(journalRef, {
          ...formData,
          createdAt: new Date()
        });
        playSound('success');
        Alert.alert('Success', 'Dream entry created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error(error);
      playSound('error');
      Alert.alert('Error', 'Failed to save dream entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Delete entry from Firestore
  const handleDelete = () => {
    playSound('button');
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this dream entry?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => playSound('button')
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) throw new Error("Not logged in");

              const userDocRef = doc(db, "users", user.uid);
              const entryDocRef = doc(userDocRef, "journalEntries", id);

              await deleteDoc(entryDocRef);

              playSound('success');
              Alert.alert('Deleted', 'Dream entry deleted successfully!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error(error);
              playSound('error');
              Alert.alert('Error', 'Failed to delete dream entry.');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    playSound('button');
    setIsEditing(true);
  };

  const handleCancel = () => {
    playSound('button');
    if (id && id !== 'new') {
      setIsEditing(false);
    } else {
      router.back();
    }
  };

  const getSleepQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return '#10B981';
      case 'Great': return '#8B5CF6';
      case 'Good': return '#3B82F6';
      case 'Fair': return '#F59E0B';
      case 'Poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!entry && id !== 'new') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {renderStars()}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#8B5CF6" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        {/* Real-time Status */}
        {isRealtimeConnected && (
          <View style={styles.realtimeIndicator}>
            <View style={styles.realtimeDot} />
            <Text style={styles.realtimeText}>Live</Text>
          </View>
        )}
        
        <View style={styles.headerActions}>
          {!isEditing ? (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#8B5CF6" />
              </TouchableOpacity>
              {id && id !== 'new' && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleDelete}
                >
                  <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : (id && id !== 'new' ? 'Update' : 'Save')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Entry Content */}
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        {isEditing ? (
          <>
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
              placeholder="Dream title..."
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholderTextColor={colors.textMuted}
            />
            
            <TextInput
              style={[styles.descriptionInput, { 
                color: colors.text, 
                borderColor: colors.border, 
                backgroundColor: colors.card 
              }]}
              placeholder="Describe your dream..."
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              multiline
              numberOfLines={8}
              placeholderTextColor={colors.textMuted}
            />

            {/* Mood Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How did you feel?</Text>
              <View style={styles.moodContainer}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodButton,
                      formData.mood === mood && styles.moodButtonSelected
                    ]}
                    onPress={() => setFormData({...formData, mood})}
                  >
                    <Text style={styles.moodEmoji}>{mood}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sleep Quality Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Quality</Text>
              <View style={styles.qualityContainer}>
                {sleepQualities.map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      { borderColor: getSleepQualityColor(quality) },
                      formData.sleepQuality === quality && {
                        backgroundColor: getSleepQualityColor(quality)
                      }
                    ]}
                    onPress={() => setFormData({...formData, sleepQuality: quality})}
                  >
                    <Text style={[
                      styles.qualityText,
                      formData.sleepQuality === quality && styles.qualityTextSelected
                    ]}>
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.entryTitle}>{entry?.title}</Text>
            
            <View style={styles.entryMeta}>
              <View style={styles.moodDisplay}>
                <Text style={styles.moodEmoji}>{entry?.mood}</Text>
                <Text style={styles.moodLabel}>Mood</Text>
              </View>
              <View style={[styles.qualityBadge, { backgroundColor: getSleepQualityColor(entry?.sleepQuality) }]}>
                <Text style={styles.qualityBadgeText}>{entry?.sleepQuality}</Text>
              </View>
            </View>
            
            <Text style={styles.entryDescription}>{entry?.description}</Text>
          </>
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
    marginLeft: 8,
    fontWeight: '600',
  },
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  realtimeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  moodEmoji: {
    fontSize: 24,
  },
  qualityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  qualityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#F3F4F6',
  },
  qualityText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  qualityTextSelected: {
    color: '#FFFFFF',
  },
  entryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  moodDisplay: {
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qualityBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  entryDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 50,
  },
  // Stars Animation Styles
  nightSkyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  crescentContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
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
