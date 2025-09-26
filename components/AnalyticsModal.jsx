import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useJournal } from '../contexts/JournalContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function AnalyticsModal({ visible, onClose }) {
  console.log('🔍 AnalyticsModal rendered, visible:', visible);
  const { getStats, dreamEntries } = useJournal();
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, week, month

  // Update stats when dream entries change
  useEffect(() => {
    if (visible) {
      const currentStats = getStats();
      setStats(currentStats);
    }
  }, [visible, dreamEntries, getStats]);

  if (!stats) return null;

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

  const filteredEntries = getFilteredEntries();
  const filteredStats = {
    ...stats,
    totalDreams: filteredEntries.length,
    qualityDistribution: filteredEntries.reduce((acc, entry) => {
      acc[entry.sleepQuality] = (acc[entry.sleepQuality] || 0) + 1;
      return acc;
    }, {}),
    moodDistribution: filteredEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {})
  };

  const getQualityColor = (quality) => {
    const colors = {
      'Poor': '#EF4444',
      'Fair': '#F59E0B',
      'Good': '#10B981',
      'Great': '#3B82F6',
      'Excellent': '#8B5CF6'
    };
    return colors[quality] || '#6B7280';
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      '😊': '😊',
      '😌': '😌',
      '😴': '😴',
      '😰': '😰',
      '😤': '😤',
      '😢': '😢',
      '😡': '😡',
      '🤔': '🤔'
    };
    return emojis[mood] || '😊';
  };

  const renderBarChart = (data, colors, maxValue) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    return (
      <View style={styles.chartContainer}>
        {entries.map(([key, value], index) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <View key={key} style={styles.barItem}>
              <View style={styles.barLabel}>
                <Text style={styles.barLabelText}>
                  {typeof colors === 'function' ? colors(key) : key}
                </Text>
                <Text style={styles.barValueText}>{value}</Text>
              </View>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      width: `${percentage}%`,
                      backgroundColor: typeof colors === 'function' ? colors(key) : colors[key] || '#8B5CF6'
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Dream Analytics</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

            {/* Key Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="sleep" size={32} color="#8B5CF6" />
                <Text style={styles.statNumber}>{filteredStats.totalDreams}</Text>
                <Text style={styles.statLabel}>Total Dreams</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="fire" size={32} color="#F59E0B" />
                <Text style={styles.statNumber}>{stats.sleepStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="chart-line" size={32} color="#10B981" />
                <Text style={styles.statNumber}>{stats.recallRate}%</Text>
                <Text style={styles.statLabel}>Recall Rate</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="star" size={32} color="#3B82F6" />
                <Text style={styles.statNumber}>{stats.avgSleepQuality}</Text>
                <Text style={styles.statLabel}>Avg Quality</Text>
              </View>
            </View>

            {/* Sleep Quality Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Quality Distribution</Text>
              {renderBarChart(
                filteredStats.qualityDistribution,
                getQualityColor,
                Math.max(...Object.values(filteredStats.qualityDistribution))
              )}
            </View>

            {/* Mood Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mood Distribution</Text>
              {renderBarChart(
                filteredStats.moodDistribution,
                (mood) => getMoodEmoji(mood),
                Math.max(...Object.values(filteredStats.moodDistribution))
              )}
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityContainer}>
                {filteredEntries.slice(0, 5).map((entry, index) => (
                  <View key={entry.id} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Text style={styles.activityEmoji}>{entry.mood}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{entry.title}</Text>
                      <Text style={styles.activityDate}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[
                      styles.activityQuality,
                      { backgroundColor: getQualityColor(entry.sleepQuality) }
                    ]}>
                      <Text style={styles.activityQualityText}>{entry.sleepQuality}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  barItem: {
    marginBottom: 12,
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
  activityContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8D5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityQuality: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityQualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
