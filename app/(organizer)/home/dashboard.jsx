// app/(organizer)/home/dashboard.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSetAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isSidebarOpenAtom } from '../../../store/globalStore';
import { mockTeams, mockPlayers } from '../../../data/mockData';
import { APP_THEME, STATUS_COLORS } from '../../../theme';

function StatBox({ value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function OrganizerDashboard() {
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);

  return (
    <View style={[styles.container, { backgroundColor: APP_THEME.colors.background }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Container Row */}
      <View style={styles.headerTitleRow}>
        <Text style={styles.screenTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.sidebarToggleBtn}>
          <MaterialCommunityIcons name="menu" size={26} color={APP_THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsMetricsRow}>
          <StatBox value={mockTeams.length} label="Active Teams" />
          <StatBox value={mockPlayers.length} label="Registered Players" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LEAGUE OVERVIEW</Text>
        </View>
        
        <Text style={styles.placeholderBodyText}>Welcome back, league coordinator. Use the top right menu block to access operational stats configurations.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
  },
  sidebarToggleBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  statsMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
  },
  statLabel: {
    fontSize: 11,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    color: APP_THEME.colors.primary,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  placeholderBodyText: {
    fontSize: 14,
    color: APP_THEME.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});