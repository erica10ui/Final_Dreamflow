import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useJournal } from '../contexts/JournalContext';

const { width } = Dimensions.get('window');

export default function SimpleAnalyticsModal({ visible, onClose }) {
  console.log('🔍 SimpleAnalyticsModal rendered, visible:', visible);
  const { getStats, dreamEntries } = useJournal();
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, week, month
  const [filteredStats, setFilteredStats] = useState(null);

  // Filter entries based on selected period
  const getFilteredEntries = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return dreamEntries;
    }
    
    return dreamEntries.filter(entry => 
      new Date(entry.createdAt) >= filterDate
    );
  };

  // Update filtered stats when period or entries change
  useEffect(() => {
    if (visible) {
      const filteredEntries = getFilteredEntries();
      const baseStats = getStats();
      
      const qualityDistribution = filteredEntries.reduce((acc, entry) => {
        acc[entry.sleepQuality] = (acc[entry.sleepQuality] || 0) + 1;
        return acc;
      }, {});
      
      const moodDistribution = filteredEntries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});
      
      setFilteredStats({
        ...baseStats,
        totalDreams: filteredEntries.length,
        qualityDistribution,
        moodDistribution,
        filteredEntries
      });
    }
  }, [visible, selectedPeriod, dreamEntries]);

  if (!visible || !filteredStats) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Dream Analytics</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {['all', 'week', 'month'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive
                  ]}>
                    {period === 'all' ? 'All Time' : period === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredStats.totalDreams}</Text>
                <Text style={styles.statLabel}>Total Dreams</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredStats.sleepStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredStats.recallRate}%</Text>
                <Text style={styles.statLabel}>Recall Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredStats.avgSleepQuality}</Text>
                <Text style={styles.statLabel}>Avg Quality</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Sleep Quality Distribution</Text>
            <View style={styles.chartContainer}>
              {Object.entries(filteredStats.qualityDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([quality, count]) => {
                  const maxCount = Math.max(...Object.values(filteredStats.qualityDistribution));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const qualityColors = {
                    'Poor': '#EF4444',
                    'Fair': '#F59E0B', 
                    'Good': '#10B981',
                    'Great': '#3B82F6',
                    'Excellent': '#8B5CF6'
                  };
                  const barColor = qualityColors[quality] || '#8B5CF6';
                  
                  return (
                    <View key={quality} style={styles.barItem}>
                      <View style={styles.barLabel}>
                        <Text style={styles.barLabelText}>{quality}</Text>
                        <Text style={styles.barValueText}>{count}</Text>
                      </View>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: barColor
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
            </View>

            <Text style={styles.sectionTitle}>Mood Distribution</Text>
            <View style={styles.chartContainer}>
              {Object.entries(filteredStats.moodDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count]) => {
                  const maxCount = Math.max(...Object.values(filteredStats.moodDistribution));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <View key={mood} style={styles.barItem}>
                      <View style={styles.barLabel}>
                        <Text style={styles.barLabelText}>{mood}</Text>
                        <Text style={styles.barValueText}>{count}</Text>
                      </View>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: '#8B5CF6'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
            </View>

            <Text style={styles.sectionTitle}>Recent Dreams</Text>
            <View style={styles.recentContainer}>
              {filteredStats.filteredEntries.slice(0, 5).map((entry) => {
                const qualityColors = {
                  'Poor': '#EF4444',
                  'Fair': '#F59E0B',
                  'Good': '#10B981', 
                  'Great': '#3B82F6',
                  'Excellent': '#8B5CF6'
                };
                const qualityColor = qualityColors[entry.sleepQuality] || '#8B5CF6';
                
                return (
                  <View key={entry.id} style={styles.recentItem}>
                    <View style={styles.recentIcon}>
                      <Text style={styles.recentEmoji}>{entry.mood}</Text>
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentTitle}>{entry.title}</Text>
                      <Text style={styles.recentDate}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[
                      styles.recentQuality,
                      { backgroundColor: qualityColor }
                    ]}>
                      <Text style={styles.recentQualityText}>{entry.sleepQuality}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
    width: '95%',
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4C1D95',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  barItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  barLabel: {
    fontSize: 14,
    color: '#374151',
  },
  recentContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  recentMood: {
    fontSize: 12,
    color: '#8B5CF6',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  barValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8D5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentContent: {
    flex: 1,
  },
  recentQuality: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentQualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
