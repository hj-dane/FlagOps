// app/(admin)/organizations/[id].jsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Surface, useTheme, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { ORGANIZATIONS, TEAMS, PLAYERS, MATCHES } from '../../../data/mockData';
import { SPACING } from '../../../theme';
import { TouchableOpacity } from 'react-native';

export default function OrgDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const org = ORGANIZATIONS.find((o) => o.id === id);
  const orgTeams = TEAMS.filter((t) => t.orgId === id);
  const orgPlayers = PLAYERS.filter((p) =>
    orgTeams.some((t) => t.id === p.teamId)
  );
  const orgMatches = MATCHES.filter((m) =>
    orgTeams.some((t) => t.id === m.homeTeamId || t.id === m.awayTeamId)
  );

  if (!org) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Organization not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.heroIcon}>
          <Text style={[styles.heroInitial, { color: theme.colors.primary }]}>{org.name[0]}</Text>
        </View>
        <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{org.name}</Text>
        <StatusPill status={org.status} />
        <View style={styles.heroStats}>
          <HeroStat label="Teams" value={org.teamCount} theme={theme} />
          <HeroStat label="Players" value={org.playerCount} theme={theme} />
          <HeroStat label="Organizers" value={org.organizerCount} theme={theme} />
        </View>
      </Surface>

      {/* Teams */}
      <SectionHeader title={`Teams (${orgTeams.length})`} theme={theme} />
      {orgTeams.length === 0 ? (
        <EmptyState text="No teams in this org" theme={theme} />
      ) : (
        orgTeams.map((team) => (
          <TouchableOpacity
            key={team.id}
            onPress={() => router.push({ pathname: '/(admin)/teams/[id]', params: { id: team.id } })}
            activeOpacity={0.75}
          >
            <Surface
              style={[styles.rowCard, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>{team.name}</Text>
                <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                  {team.playerCount} players · {team.jerseyColor}
                </Text>
              </View>
              <StatusPill status={team.status} />
            </Surface>
          </TouchableOpacity>
        ))
      )}

      {/* Players */}
      <SectionHeader title={`Players (${orgPlayers.length})`} theme={theme} />
      {orgPlayers.length === 0 ? (
        <EmptyState text="No players in this org" theme={theme} />
      ) : (
        orgPlayers.map((player) => (
          <TouchableOpacity
            key={player.id}
            onPress={() =>
              router.push({ pathname: '/(admin)/players/[id]', params: { id: player.id } })
            }
            activeOpacity={0.75}
          >
            <Surface
              style={[styles.rowCard, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <View style={styles.jerseyBadge}>
                <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>
                  #{player.jerseyNumber}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>{player.name}</Text>
                <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                  {player.positions.join(' / ')} · {player.teamName}
                </Text>
              </View>
              <StatusPill status={player.status} />
            </Surface>
          </TouchableOpacity>
        ))
      )}

      {/* Matches */}
      <SectionHeader title={`Matches (${orgMatches.length})`} theme={theme} />
      {orgMatches.length === 0 ? (
        <EmptyState text="No matches in this org" theme={theme} />
      ) : (
        orgMatches.map((match) => (
          <Surface
            key={match.id}
            style={[styles.rowCard, { backgroundColor: theme.colors.surfaceVariant }]}
            elevation={0}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                {match.homeTeam} vs {match.awayTeam}
              </Text>
              <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]}>
                {match.date} · {match.time} · {match.location}
              </Text>
            </View>
            <StatusPill status={match.status} />
          </Surface>
        ))
      )}
    </ScrollView>
  );
}

function SectionHeader({ title, theme }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{title}</Text>
  );
}

function HeroStat({ label, value, theme }) {
  return (
    <View style={styles.heroStat}>
      <Text style={[styles.heroStatValue, { color: theme.colors.primary }]}>{value}</Text>
      <Text style={[styles.heroStatLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

function EmptyState({ text, theme }) {
  return (
    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm },
  heroCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#1C2437',
    marginBottom: SPACING.sm,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#00E67618',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00E67644',
  },
  heroInitial: { fontSize: 30, fontWeight: '900' },
  heroName: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroStats: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontWeight: '900' },
  heroStatLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: '#2A3348',
  },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
  jerseyBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#00E67614',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: { fontSize: 13, fontWeight: '800' },
  emptyText: { fontSize: 13, fontStyle: 'italic', paddingVertical: SPACING.sm },
});