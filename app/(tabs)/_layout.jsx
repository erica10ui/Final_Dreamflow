import { View, StyleSheet } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const TabIcon = ({ name, color, size = 24, focused = false }) => (
  <MaterialCommunityIcons 
    name={name} 
    size={size} 
    color={color} 
  />
);

const TabsLayout = () => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary, // Dynamic primary color for active tabs
        tabBarInactiveTintColor: isDarkMode ? colors.textMuted : '#9CA3AF', // Dynamic inactive color
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.card, // Dynamic card background
          borderTopWidth: 1,
          borderTopColor: colors.border, // Dynamic border color
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          // Add shadow for better visibility in dark mode
          ...(isDarkMode && {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
          color: isDarkMode ? colors.text : colors.textSecondary, // Dynamic label color
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="relax"
        options={{
          title: 'Relax',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="meditation" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="pencil" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="bell" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  activeTabIconContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
});

export default TabsLayout;
