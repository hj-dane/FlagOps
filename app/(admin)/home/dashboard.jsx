// app/(admin)/home/dashboard.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isSidebarOpenAtom, userProfileAtom } from '../../../store/globalStore';
import { mockTeams, mockPlayers } from '../../../data/mockData';
import { APP_THEME } from '../../../theme';
 
// ── Reusable Stat Box ──────────────────────────────────────────────────────────
function StatBox({ value, label, icon, accent }) {
  return (
    <View style={[styles.statBox, accent && { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={accent || APP_THEME.colors.primary}
          style={styles.statIcon}
        />
      )}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
 
// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}
 
// ── Quick Action Card ──────────────────────────────────────────────────────────
function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={APP_THEME.colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
 
// ── Recent Activity Row ────────────────────────────────────────────────────────
function ActivityRow({ icon, title, subtitle, time }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={APP_THEME.colors.primary} />
      </View>
      <View style={styles.activityText}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activitySubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}
 
// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);
  const userProfile = useAtomValue(userProfileAtom);
 
  // Derive mock aggregates — swap with real Supabase queries as needed
  const totalOrgs = 1; // placeholder; fetch from organizations table
  const totalTeams = mockTeams.length;
  const totalPlayers = mockPlayers.length;
  const pendingApprovals = 3; // placeholder
 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
 
      {/* ── Header Row ── */}
      <View style={styles.headerTitleRow}>
        <View>
          <Text style={styles.greeting}>
            Hello, {userProfile?.name?.split(' ')[0] ?? 'Admin'} 👋
          </Text>
          <Text style={styles.screenTitle}>Admin Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsSidebarOpen(true)}
          style={styles.sidebarToggleBtn}
        >
          <MaterialCommunityIcons name="menu" size={26} color={APP_THEME.colors.primary} />
        </TouchableOpacity>
      </View>
 
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Platform Stats ── */}
        <SectionHeader title="PLATFORM OVERVIEW" />
        <View style={styles.statsGrid}>
          <StatBox
            value={totalOrgs}
            label="Organizations"
            icon="domain"
            accent="#4CAF50"
          />
          <StatBox
            value={totalTeams}
            label="Active Teams"
            icon="shield-outline"
            accent={APP_THEME.colors.primary}
          />
          <StatBox
            value={totalPlayers}
            label="Total Players"
            icon="account-group-outline"
            accent="#2196F3"
          />
          <StatBox
            value={pendingApprovals}
            label="Pending Approvals"
            icon="clock-alert-outline"
            accent="#FF9800"
          />
        </View>
 
        {/* ── Quick Actions ── */}
        <SectionHeader title="QUICK ACTIONS" />
        <View style={styles.quickActionsRow}>
          <QuickAction icon="domain-plus" label="Add Org" onPress={() => {}} />
          <QuickAction icon="account-plus-outline" label="Add Player" onPress={() => {}} />
          <QuickAction icon="shield-plus-outline" label="Add Team" onPress={() => {}} />
          <QuickAction icon="trophy-outline" label="Leaderboard" onPress={() => {}} />
        </View>
 
        {/* ── Recent Activity ── */}
        <SectionHeader title="RECENT ACTIVITY" />
        <View style={styles.activityCard}>
          <ActivityRow
            icon="account-check-outline"
            title="New player registered"
            subtitle="Jordan Miles · Eagles"
            time="2m ago"
          />
          <View style={styles.activityDivider} />
          <ActivityRow
            icon="shield-check-outline"
            title="Team approved"
            subtitle="Thunder Hawks · Division A"
            time="14m ago"
          />
          <View style={styles.activityDivider} />
          <ActivityRow
            icon="domain"
            title="Organization created"
            subtitle="Cebu Flag Football League"
            time="1h ago"
          />
          <View style={styles.activityDivider} />
          <ActivityRow
            icon="trophy-outline"
            title="Tournament finalized"
            subtitle="Spring Cup 2026"
            time="3h ago"
          />
        </View>
 
        {/* ── System Note ── */}
        <View style={styles.noteCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={APP_THEME.colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.noteText}>
            You have{' '}
            <Text style={styles.noteHighlight}>{pendingApprovals} pending approvals</Text>{' '}
            that require your attention. Visit Organizations or Teams to review.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
 
// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: APP_THEME.colors.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 2,
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
    paddingBottom: 40,
  },
 
  // Section Header
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    color: APP_THEME.colors.primary,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
 
  // Stats Grid (2-column)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
  },
  statLabel: {
    fontSize: 11,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '600',
  },
 
  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 28,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_THEME.colors.onSurface,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
 
  // Activity Feed
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 20,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.onSurface,
  },
  activitySubtitle: {
    fontSize: 12,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
  },
 
  // Note Banner
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: APP_THEME.colors.onSurface,
    lineHeight: 19,
  },
  noteHighlight: {
    fontWeight: '800',
    color: '#E65100',
  },
});
 