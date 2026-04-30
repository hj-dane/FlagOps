import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockTeams, mockPlayers } from '../../../data/mockData';
import { APP_THEME, SPACING, STATUS_COLORS } from '../../../theme';

// Status styles using theme
const getStatusStyle = (status) => {
  const statusConfig = STATUS_COLORS[status.charAt(0).toUpperCase() + status.slice(1)];
  if (statusConfig) {
    return { bg: statusConfig.bg, text: statusConfig.text, label: status.charAt(0).toUpperCase() + status.slice(1) };
  }
  return { bg: '#F5F5F5', text: '#757575', label: status };
};

// Small stat box
function StatBox({ value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Player Card
function PlayerCard({ player }) {
  const s = getStatusStyle(player.status);

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerNumber}>
        <Text style={styles.playerNumberText}>#{player.number}</Text>
      </View>

      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPos}>
          {player.pos} • {player.stats}
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
        <Text style={[styles.statusText, { color: s.text }]}>
          {s.label}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const TEAM = mockTeams[0];

  const PLAYERS = mockPlayers
    .filter(p => p.teamId === TEAM.id)
    .map(p => ({
      id: p.id,
      name: p.name,
      pos: p.positions.join(', '),
      number: p.jerseyNumber,
      stats: `${p.stats.touchdowns} TD`,
      status: p.status,
    }));

  const teamRecord = {
    record: '0-0',
    wins: 0,
    losses: 0,
    rank: 1,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_THEME.colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Bar with Welcome and Avatar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topGreeting}>Welcome back 👋</Text>
            <Text style={styles.topTeam}>{TEAM.name}</Text>
          </View>

          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => router.push('/(organizer)/profile')}
          >
            <Text style={styles.avatarText}>TC</Text>
          </TouchableOpacity>
        </View>

        {/* Record Banner */}
        <View style={styles.recordBanner}>
          <View>
            <Text style={styles.recordLabel}>SEASON RECORD</Text>
            <Text style={styles.recordValue}>{teamRecord.record}</Text>
            <Text style={styles.recordSub}>
              Ranked #{teamRecord.rank}
            </Text>
          </View>

          <View style={styles.recordRight}>
            <StatBox value={teamRecord.wins} label="W" />
            <StatBox value={teamRecord.losses} label="L" />
            <StatBox value="0%" label="WIN %" />
          </View>
        </View>

        {/* Players Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ROSTER</Text>
        </View>

        <View style={styles.rosterList}>
          {PLAYERS.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </View>

        {/* View All Players Link */}
        <TouchableOpacity 
          style={styles.viewAllBtn}
          onPress={() => router.push('/(organizer)/players')}
        >
          <Text style={styles.viewAllText}>View All Players →</Text>
        </TouchableOpacity>

        {/* Add bottom padding to account for tab bar + gesture bar */}
        <View style={{ height: insets.bottom + 70 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },

  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    marginTop: SPACING.sm,
  },

  topGreeting: {
    fontSize: 13,
    color: APP_THEME.colors.onSurfaceVariant,
    marginBottom: 2,
  },

  topTeam: {
    fontSize: 24,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: '900',
    color: APP_THEME.colors.onPrimary,
    fontSize: 16,
  },

  recordBanner: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.roundness * 1.67,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
    marginTop: SPACING.sm,
    ...APP_THEME.shadow,
  },

  recordLabel: {
    fontSize: 10,
    color: APP_THEME.colors.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 6,
  },

  recordValue: {
    fontSize: 42,
    color: APP_THEME.colors.primary,
    fontWeight: '900',
  },

  recordSub: {
    fontSize: 12,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 4,
  },

  recordRight: {
    flexDirection: 'row',
    gap: 8,
  },

  statBox: {
    backgroundColor: APP_THEME.colors.surfaceVariant,
    borderRadius: APP_THEME.roundness,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
  },

  statValue: {
    fontSize: 18,
    color: APP_THEME.colors.onSurface,
    fontWeight: '900',
  },

  statLabel: {
    fontSize: 10,
    color: APP_THEME.colors.onSurfaceVariant,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 11,
    color: APP_THEME.colors.primary,
    letterSpacing: 2,
    fontWeight: '800',
  },

  rosterList: {
    gap: 10,
    marginBottom: 16,
  },

  playerCard: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.roundness,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...APP_THEME.shadow,
  },

  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
  },

  playerNumberText: {
    color: APP_THEME.colors.primary,
    fontWeight: '800',
  },

  playerInfo: {
    flex: 1,
  },

  playerName: {
    color: APP_THEME.colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },

  playerPos: {
    fontSize: 12,
    color: APP_THEME.colors.onSurfaceVariant,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },

  viewAllText: {
    color: APP_THEME.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});