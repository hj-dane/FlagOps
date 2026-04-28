import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OrganizerLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tournaments/index"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="trophy-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches/index"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="whistle-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams/index"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="shield-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="players/index"
        options={{
          title: 'Players',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard/index"
        options={{
          title: 'Rankings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="podium" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats/index"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-bar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={color} />
          ),
        }}
      />

      {/* ── Hidden drill-down screens (no tab entry) ── */}
      <Tabs.Screen name="matches/[id]"        options={{ href: null }} />
      <Tabs.Screen name="matches/live/[id]"   options={{ href: null }} />
      <Tabs.Screen name="tournaments/[id]"    options={{ href: null }} />
      <Tabs.Screen name="teams/[id]"          options={{ href: null }} />
      <Tabs.Screen name="players/[id]"        options={{ href: null }} />
    </Tabs>
  );
}