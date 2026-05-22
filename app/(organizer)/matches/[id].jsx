// app/(organizer)/matches/[id].jsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, useTheme, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { matchesAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [matches, setMatches] = useAtom(matchesAtom);
  const [match, setMatch] = useState(() => matches.find((m) => m.id === id) || null);
  const [loading, setLoading] = useState(!match);
  const [cancelling, setCancelling] = useState(false);
  const [stats, setStats] = useState([]);

  const fetchMatch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('id, home_team_name, away_team_name, date_time, location, status, tournament_id, home_score, away_score')
        .eq('id', id)
        .single();
      if (error) throw error;
      setMatch(data);
      // Sync into global store
      setMatches((prev) => {
        const exists = prev.find((m) => m.id === id);
        return exists ? prev.map((m) => m.id === id ? data : m) : [...prev, data];
      });

      // Fetch match stats
      const { data: statData } = await supabase
        .from('match_stats')
        .select('id, player_name, stat_type, recorded_at')
        .eq('match_id', id)
        .order('recorded_at', { ascending: false });
      setStats(statData || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load match.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  const handleCancelMatch = () => {
    Alert.alert('Cancel Match', 'Submit a cancellation request for admin approval?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Submit Request', style: 'destructive', onPress: async () => {
          setCancelling(true);
          try {
            const { error } = await supabase.from('approval_requests').insert({
              entity_type: 'match',
              entity_id: id,
              entity_name: `${match.home_team_name} vs ${match.away_team_name}`,
              change_type: 'delete',
              status: 'pending',
              current_data: {
                home_team_name: match.home_team_name,
                away_team_name: match.away_team_name,
                date_time: match.date_time,
                status: match.status,
              },
              proposed_data: { status: 'Canceled' },
            });
            if (error) throw error;
            Alert.alert('Submitted', 'Cancellation request sent to admin.');
          } catch (err) {
            Alert.alert('Error', 'Could not submit cancellation request.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Match not found.</Text>
      </View>
    );
  }

  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isCanceled = match.status === 'canceled' || match.status === 'Canceled';

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <ScreenHeader title="Match" onBack={() => router.back()} />

      {/* Hero Scoreboard */}
      <Surface style={styles.heroScoreCard} elevation={0}>
        <View style={styles.statusRow}>
          <StatusPill status={match.status || 'Upcoming'} />
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </View>
          )}
        </View>

        <Text style={styles.metaSubtext}>
          {match.date_time ? new Date(match.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}{match.location ? ` · ${match.location}` : ''}
        </Text>

        <View style={styles.scoreboardMain}>
          <View style={styles.teamColumn}>
            <Text style={styles.teamLabelName} numberOfLines={1}>{match.home_team_name}</Text>
            <Text style={styles.pointsDisplay}>{match.home_score ?? 0}</Text>
          </View>
          <Text style={styles.vsDivider}>VS</Text>
          <View style={[styles.teamColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.teamLabelName, { textAlign: 'right' }]} numberOfLines={1}>{match.away_team_name}</Text>
            <Text style={styles.pointsDisplay}>{match.away_score ?? 0}</Text>
          </View>
        </View>

        {(isUpcoming || isLive) && (
          <Button
            mode="contained"
            icon={isLive ? 'play-circle' : 'whistle'}
            buttonColor={isLive ? '#E53935' : theme.colors.primary}
            onPress={() => router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: match.id } })}
            style={styles.actionBtn}
            textColor="#FFF"
          >
            {isLive ? 'Resume Live Tracking' : 'Launch Scoreboard'}
          </Button>
        )}
      </Surface>

      {/* Stats timeline */}
      <Text style={[styles.sectionHeading, { color: theme.colors.onSurface }]}>Match Stats ({stats.length})</Text>
      {stats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isUpcoming ? 'Stats recorded during live match.' : 'No stats recorded yet.'}
          </Text>
        </View>
      ) : (
        stats.map((s) => (
          <View key={s.id} style={[styles.statRow, CARD_SHADOW]}>
            <View style={[styles.statIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="flag-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statPlayer, { color: theme.colors.onSurface }]}>{s.player_name}</Text>
              <Text style={styles.statType}>{s.stat_type}</Text>
            </View>
            <Text style={styles.statTime}>
              {s.recorded_at ? new Date(s.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
        ))
      )}

      {/* Cancel action */}
      {!isCanceled && (isUpcoming || isLive) && (
        <>
          <Divider style={{ marginVertical: SPACING.md }} />
          <Button
            mode="outlined"
            onPress={handleCancelMatch}
            loading={cancelling}
            disabled={cancelling}
            textColor={theme.colors.error}
            style={[styles.cancelBtn, { borderColor: theme.colors.error }]}
            icon="cancel"
          >
            Request Match Cancellation
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroScoreCard: { backgroundColor: '#1E2538', borderRadius: 16, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  liveLabel: { fontSize: 10, fontWeight: '800', color: '#E53935', letterSpacing: 1 },
  metaSubtext: { color: '#6A7893', fontSize: 12, marginBottom: SPACING.sm },
  scoreboardMain: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: SPACING.md },
  teamColumn: { flex: 1, gap: 4 },
  teamLabelName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pointsDisplay: { color: '#FFFFFF', fontSize: 40, fontWeight: '900' },
  vsDivider: { color: '#4F5E7B', fontSize: 14, fontWeight: '700', marginHorizontal: SPACING.md },
  actionBtn: { borderRadius: 8, width: '100%', marginTop: SPACING.sm },
  sectionHeading: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  emptyContainer: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 13, fontStyle: 'italic' },
  statRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: SPACING.sm, gap: SPACING.sm, marginBottom: SPACING.xs },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statPlayer: { fontSize: 13, fontWeight: '700' },
  statType: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  statTime: { fontSize: 11, color: '#AAAAAA' },
  cancelBtn: { borderRadius: 12 },
});
