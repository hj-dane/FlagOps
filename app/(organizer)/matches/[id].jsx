// app/(organizer)/matches/[id].jsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Button,
  Divider,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { MATCHES, MATCH_STATS, PLAYERS, TEAMS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const match = MATCHES.find((m) => m.id === id);
  const stats = MATCH_STATS[id] ?? [];

  const homeRoster = PLAYERS.filter((p) => p.teamId === match?.homeTeamId);
  const awayRoster = PLAYERS.filter((p) => p.teamId === match?.awayTeamId);

  const [cancelPending, setCancelPending] = useState(false);

  if (!match) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Match not found.</Text>
      </View>
    );
  }

  const isLive = match.status === 'Live';
  const isCompleted = match.status === 'Completed';
  const isUpcoming = match.status === 'Upcoming';
  const isCanceled = match.status === 'Canceled';

  const handleCancelMatch = () => {
    Alert.alert(
      'Cancel Match',
      'Submit a cancellation request to admin?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Submit Request',
          onPress: () => {
            // TODO: POST /change_requests { type: 'cancel_match', matchId: id }
            setCancelPending(true);
          },
        },
      ]
    );
  };

  // Group stats by team for the stats section
  const homeStats = stats.filter((s) => s.team === match.homeTeam);
  const awayStats = stats.filter((s) => s.team === match.awayTeam);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={theme.colors.primary}
        />
        <Text style={[styles.backText, { color: theme.colors.primary }]}>Matches</Text>
      </TouchableOpacity>

      {/* Cancel pending banner */}
      {cancelPending && (
        <View style={[styles.pendingBanner, { backgroundColor: '#FFB30018', borderColor: '#FFB30055' }]}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#FFB300" />
          <Text style={[styles.pendingBannerText, { color: '#FFB300' }]}>
            Cancellation request pending admin approval
          </Text>
        </View>
      )}

      {/* Scoreboard hero */}
      <Surface
        style={[
          styles.scoreCard,
          { backgroundColor: theme.colors.surface },
          isLive && { borderColor: '#00E67655' },
        ]}
        elevation={0}
      >
        {/* Tournament + meta */}
        <Text style={[styles.tournamentName, { color: theme.colors.onSurfaceVariant }]}>
          {match.tournamentName}
        </Text>
        <Text style={[styles.matchMeta, { color: theme.colors.onSurfaceVariant }]}>
          {match.date} · {match.time} · {match.location}
        </Text>

        <Divider style={{ backgroundColor: theme.colors.outline, marginVertical: SPACING.sm }} />

        {/* Score row */}
        <View style={styles.scoreRow}>
          {/* Home */}
          <View style={styles.teamBlock}>
            <Text style={[styles.teamName, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {match.homeTeam}
            </Text>
            <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>
              {match.homeScore}
            </Text>
            <Text style={[styles.teamLabel, { color: theme.colors.onSurfaceVariant }]}>HOME</Text>
          </View>

          {/* Centre */}
          <View style={styles.centreBlock}>
            <StatusPill status={match.status} />
            {(isLive || isCompleted) && (
              <Text style={[styles.vsDash, { color: theme.colors.onSurfaceVariant }]}>—</Text>
            )}
            {isUpcoming && (
              <Text style={[styles.vsText, { color: theme.colors.onSurfaceVariant }]}>VS</Text>
            )}
          </View>

          {/* Away */}
          <View style={[styles.teamBlock, { alignItems: 'flex-end' }]}>
            <Text
              style={[styles.teamName, { color: theme.colors.onSurface, textAlign: 'right' }]}
              numberOfLines={2}
            >
              {match.awayTeam}
            </Text>
            <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>
              {match.awayScore}
            </Text>
            <Text style={[styles.teamLabel, { color: theme.colors.onSurfaceVariant }]}>AWAY</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.colors.outline, marginVertical: SPACING.sm }} />

        {/* Primary CTA */}
        {isLive && (
          <Button
            mode="contained"
            icon="scoreboard"
            onPress={() =>
              router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: match.id } })
            }
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={styles.ctaBtn}
            contentStyle={{ paddingVertical: 4 }}
          >
            Go to Live Scoreboard
          </Button>
        )}

        {isUpcoming && !cancelPending && (
          <View style={styles.ctaRow}>
            <Button
              mode="contained"
              icon="play"
              onPress={() =>
                router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: match.id } })
              }
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={{ flex: 1 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Start Match
            </Button>
            <Button
              mode="outlined"
              onPress={handleCancelMatch}
              textColor={theme.colors.error}
              style={{ flex: 1, borderColor: theme.colors.error }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Cancel Match
            </Button>
          </View>
        )}

        {isCompleted && (
          <View
            style={[styles.finalBadge, { backgroundColor: theme.colors.secondary + '22' }]}
          >
            <MaterialCommunityIcons
              name="flag-checkered"
              size={14}
              color={theme.colors.secondary}
            />
            <Text style={[styles.finalText, { color: theme.colors.secondary }]}>
              Final Result
            </Text>
          </View>
        )}
      </Surface>

      {/* Rosters */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Rosters</Text>
      <View style={styles.rostersRow}>
        <RosterCard
          title={match.homeTeam}
          players={homeRoster}
          theme={theme}
          side="home"
        />
        <RosterCard
          title={match.awayTeam}
          players={awayRoster}
          theme={theme}
          side="away"
        />
      </View>

      {/* Stats log — only shown if there are recorded stats */}
      {stats.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Stats Log ({stats.length})
          </Text>

          {/* Home stats */}
          {homeStats.length > 0 && (
            <>
              <Text style={[styles.subSectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                {match.homeTeam}
              </Text>
              {homeStats.map((stat) => (
                <StatRow key={stat.id} stat={stat} theme={theme} />
              ))}
            </>
          )}

          {/* Away stats */}
          {awayStats.length > 0 && (
            <>
              <Text style={[styles.subSectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                {match.awayTeam}
              </Text>
              {awayStats.map((stat) => (
                <StatRow key={stat.id} stat={stat} theme={theme} />
              ))}
            </>
          )}
        </>
      )}

      {/* No stats yet */}
      {stats.length === 0 && (isLive || isUpcoming) && (
        <View style={styles.emptyStats}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={32}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyStatsText, { color: theme.colors.onSurfaceVariant }]}>
            No stats recorded yet
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function RosterCard({ title, players, theme, side }) {
  const accentColor = side === 'home' ? theme.colors.primary : theme.colors.secondary;
  return (
    <Surface
      style={[
        styles.rosterCard,
        { backgroundColor: theme.colors.surface, borderColor: accentColor + '33' },
      ]}
      elevation={0}
    >
      <Text style={[styles.rosterTitle, { color: accentColor }]} numberOfLines={1}>
        {title}
      </Text>
      <Divider style={{ backgroundColor: theme.colors.outline, marginBottom: SPACING.xs }} />
      {players.length === 0 ? (
        <Text style={[styles.rosterEmpty, { color: theme.colors.onSurfaceVariant }]}>
          No players
        </Text>
      ) : (
        players.map((p) => (
          <View key={p.id} style={styles.rosterRow}>
            <Text style={[styles.rosterJersey, { color: accentColor }]}>#{p.jerseyNumber}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rosterName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.rosterPos, { color: theme.colors.onSurfaceVariant }]}>
                {p.positions.join('/')}
              </Text>
            </View>
          </View>
        ))
      )}
    </Surface>
  );
}

function StatRow({ stat, theme }) {
  return (
    <Surface
      style={[styles.statRow, { backgroundColor: theme.colors.surfaceVariant }]}
      elevation={0}
    >
      <View style={[styles.statTypePill, { backgroundColor: theme.colors.primary + '22' }]}>
        <Text style={[styles.statTypeText, { color: theme.colors.primary }]}>
          {stat.statType}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statPlayer, { color: theme.colors.onSurface }]}>
          {stat.playerName}
        </Text>
        <Text style={[styles.statTime, { color: theme.colors.onSurfaceVariant }]}>
          {new Date(stat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Surface>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.xl * 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  backText: { fontSize: 14, fontWeight: '700' },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.sm,
  },
  pendingBannerText: { fontSize: 13, fontWeight: '600', flex: 1 },

  // Score card
  scoreCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1C2437',
    gap: SPACING.xs,
  },
  tournamentName: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    textAlign: 'center',
  },
  matchMeta: { fontSize: 12, textAlign: 'center' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  teamBlock: { flex: 1 },
  teamName: { fontSize: 14, fontWeight: '700' },
  scoreNum: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  teamLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  centreBlock: { alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.sm },
  vsDash: { fontSize: 22, fontWeight: '300' },
  vsText: { fontSize: 18, fontWeight: '700' },
  ctaBtn: { borderRadius: 10 },
  ctaRow: { flexDirection: 'row', gap: SPACING.sm },
  finalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: 8,
    paddingVertical: SPACING.xs,
  },
  finalText: { fontSize: 13, fontWeight: '700' },

  // Section titles
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  subSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },

  // Rosters
  rostersRow: { flexDirection: 'row', gap: SPACING.sm },
  rosterCard: {
    flex: 1,
    borderRadius: 12,
    padding: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  rosterTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 3,
  },
  rosterJersey: { fontSize: 12, fontWeight: '800', width: 28 },
  rosterName: { fontSize: 12, fontWeight: '600' },
  rosterPos: { fontSize: 10, marginTop: 1 },
  rosterEmpty: { fontSize: 12, fontStyle: 'italic' },

  // Stats
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#2A3348',
    marginBottom: SPACING.xs,
  },
  statTypePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  statTypeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statPlayer: { fontSize: 13, fontWeight: '700' },
  statTime: { fontSize: 11, marginTop: 1 },

  emptyStats: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  emptyStatsText: { fontSize: 14, fontStyle: 'italic' },
});