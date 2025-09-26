import { View } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const TabIcon = ({ name, color, size = 24 }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
    <MaterialCommunityIcons name={name} size={size} color={color} />
  </View>
);

const TabsLayout = () => {
  const { colors } = useTheme();
  
  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary, // Purple when active
          tabBarInactiveTintColor: colors.textTertiary,   // Gray when inactive
          tabBarShowLabel: true,
          headerShown: false, // Hide default headers
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 0.5,
            borderTopColor: colors.tabBarBorder,
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="relax"
        options={{
          title: 'Relax',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon name="meditation" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon name="pencil" color={color} />,
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'Music',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon name="music" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Notifications',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon name="bell" color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
