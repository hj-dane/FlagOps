import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PENDING_COUNT = 3; // TODO: replace with realtime subscription value

export default function AdminLayout() {
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
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals/index"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color={color} />
              {PENDING_COUNT > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.tertiary }]}>
                  <Text style={styles.badgeText}>{PENDING_COUNT}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="organizations/index"
        options={{
          title: 'Orgs',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="office-building-outline" size={22} color={color} />
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
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={color} />
          ),
        }}
      />

      {/* ── Hidden drill-down screens (no tab entry) ── */}
      <Tabs.Screen name="organizations/[id]"  options={{ href: null }} />
      <Tabs.Screen name="teams/[id]"          options={{ href: null }} />
      <Tabs.Screen name="players/[id]"        options={{ href: null }} />
      <Tabs.Screen name="approvals/[id]"      options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#1A1000' },
});