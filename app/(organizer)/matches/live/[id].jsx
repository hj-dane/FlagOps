import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { matchesAtom } from '../../../../store/globalStore';
import { supabase } from '../../../../utils/supabase';
import { SPACING, APP_THEME } from '../../../../theme';

const STAT_TYPES = ['TD', 'INT', 'Flag Pulled', 'Sack', 'Completion', 'Rush'];
const MATCH_DURATION_SECONDS = 50 * 60; // 50 minutes

export default function LiveMatchScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [matches, setMatches] = useAtom(matchesAtom);
  const [match, setMatch] = useState(() => matches.find((m) => m.id === id) || null);
  const [loadingMatch, setLoadingMatch] = useState(!match);

  const [seconds, setSeconds] = useState(MATCH_DURATION_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedStat, setSelectedStat] = useState(STAT_TYPES[0]);
  const [recordingStats, setRecordingStats] = useState(false);

  useEffect(() => {
    const initMatch = async () => {
      setLoadingMatch(true);
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score, status, location, date_time')
          .eq('id', id)
          .single();
        if (error) throw error;

        if (data.status !== 'completed' && data.status !== 'canceled') {
          await supabase
            .from('matches')
            .update({ status: 'live' })
            .eq('id', id);
          data.status = 'live';
        }

        setMatch(data);
        setMatches((prev) => {
          const exists = prev.find((m) => m.id === id);
          return exists ? prev.map((m) => m.id === id ? data : m) : [...prev, data];
        });
      } catch (err) {
        console.error('initMatch error:', err.message);
      } finally {
        setLoadingMatch(false);
      }
    };
    initMatch();
  }, [id]);

  useEffect(() => {
    if (!match) return;

    const fetchRosters = async () => {
      setLoadingRoster(true);
      try {
        const { data: freshMatch, error: matchErr } = await supabase
          .from('matches')
          .select('id, home_team_id, away_team_id, home_team_name, away_team_name')
          .eq('id', id)
          .single();

        if (matchErr || !freshMatch) {
          console.error('Could not re-fetch match:', matchErr);
          return;
        }

        const teamIds = [freshMatch.home_team_id, freshMatch.away_team_id].filter(Boolean);

        if (teamIds.length === 0) {
          console.warn('Match has no team IDs even after re-fetch');
          setLoadingRoster(false);
          return;
        }

        const { data, error } = await supabase
          .from('players')
          .select('id, name, jersey_number, position, team_id, status')
          .in('team_id', teamIds);

        if (error) throw error;
        setRoster(data || []);
      } catch (err) {
        console.error('fetchRosters error:', err.message);
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchRosters();
  }, [match?.id]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            handleTimeUp();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const handleTimeUp = useCallback(async () => {
    Alert.alert(
      "Time's Up!",
      'The 50-minute match time has ended. End the match now?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'End Match', onPress: async () => {
            await supabase.from('matches').update({ status: 'completed' }).eq('id', id);
            setMatches((prev) => prev.map((m) => m.id === id ? { ...m, status: 'completed' } : m));
            router.back();
          },
        },
      ]
    );
  }, [id]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const updateScore = useCallback(async (homeScore, awayScore) => {
    const { error } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', id);

    if (!error) {
      setMatch((prev) => prev ? { ...prev, home_score: homeScore, away_score: awayScore } : prev);
      setMatches((prev) =>
        prev.map((m) => m.id === id ? { ...m, home_score: homeScore, away_score: awayScore } : m)
      );
    } else {
      Alert.alert('Error', 'Failed to update score.');
    }
  }, [id]);

  const addTD = (side) => {
    const home = match?.home_score ?? 0;
    const away = match?.away_score ?? 0;
    if (side === 'home') updateScore(home + 6, away);
    else updateScore(home, away + 6);
  };

  const addPAT = (side, pts) => {
    const home = match?.home_score ?? 0;
    const away = match?.away_score ?? 0;
    if (side === 'home') updateScore(home + pts, away);
    else updateScore(home, away + pts);
  };

  const recordStat = async () => {
    if (!selectedPlayerId) { Alert.alert('Select a player first'); return; }
    setRecordingStats(true);
    try {
      const { error } = await supabase
        .from('match_stats')
        .insert({
          match_id: id,
          player_id: selectedPlayerId,
          stat_type: selectedStat,
          value: 1,
        });
      if (error) throw error;
      Alert.alert('Recorded', `${selectedStat} recorded.`);
    } catch (err) {
      Alert.alert('Error', 'Could not record stat.');
    } finally {
      setRecordingStats(false);
    }
  };

  const endMatch = () => {
    Alert.alert('End Match', 'Mark this match as completed? This will lock the scoreboard.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Match', style: 'destructive', onPress: async () => {
          const { error } = await supabase
            .from('matches')
            .update({ status: 'completed' })
            .eq('id', id);
          if (!error) {
            setTimerRunning(false);
            router.back();
          } else {
            Alert.alert('Error', 'Could not end match.');
          }
        },
      },
    ]);
  };

  if (loadingMatch || !match) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const timerColor = seconds < 120 ? '#E53935' : APP_THEME.colors.primary; // red in last 2 mins

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Live Match</Text>
        <View style={[styles.liveDot, { backgroundColor: APP_THEME.colors.primary }]} />
      </View>

      <Surface style={styles.scoreBoard} elevation={0}>
        <View style={styles.scoreRow}>
          <View style={styles.teamCol}>
            <Text style={styles.teamName} numberOfLines={1}>{match.home_team_name}</Text>
            <Text style={styles.score}>{homeScore}</Text>
          </View>
          <View style={styles.vsCol}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={[styles.timerText, { color: timerColor }]}>{formatTime(seconds)}</Text>
          </View>
          <View style={[styles.teamCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>{match.away_team_name}</Text>
            <Text style={styles.score}>{awayScore}</Text>
          </View>
        </View>

        <View style={styles.timerControls}>
          <Button
            mode={timerRunning ? 'outlined' : 'contained'}
            onPress={() => setTimerRunning((r) => !r)}
            buttonColor={timerRunning ? undefined : theme.colors.primary}
            textColor={timerRunning ? theme.colors.primary : '#FFF'}
            icon={timerRunning ? 'pause' : 'play'}
            compact
          >
            {timerRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => { setSeconds(MATCH_DURATION_SECONDS); setTimerRunning(false); }}
            icon="restart"
            textColor={theme.colors.primary}
            compact
          >
            Reset
          </Button>
        </View>
      </Surface>

      <Text style={styles.sectionLabel}>SCORING</Text>
      <View style={styles.scoringGrid}>
        <View style={styles.scoringCol}>
          <Text style={styles.teamNameSmall} numberOfLines={1}>{match.home_team_name}</Text>
          <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => addTD('home')} style={styles.scoreBtn}>+TD (+6)</Button>
          <View style={styles.patRow}>
            <Button mode="outlined" onPress={() => addPAT('home', 1)} style={[styles.patBtn, { flex: 1 }]} compact>PAT +1</Button>
            <Button mode="outlined" onPress={() => addPAT('home', 2)} style={[styles.patBtn, { flex: 1 }]} compact>PAT +2</Button>
          </View>
        </View>
        <View style={styles.scoringDivider} />
        <View style={styles.scoringCol}>
          <Text style={styles.teamNameSmall} numberOfLines={1}>{match.away_team_name}</Text>
          <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => addTD('away')} style={styles.scoreBtn}>+TD (+6)</Button>
          <View style={styles.patRow}>
            <Button mode="outlined" onPress={() => addPAT('away', 1)} style={[styles.patBtn, { flex: 1 }]} compact>PAT +1</Button>
            <Button mode="outlined" onPress={() => addPAT('away', 2)} style={[styles.patBtn, { flex: 1 }]} compact>PAT +2</Button>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>RECORD STAT</Text>
      <Surface style={styles.statPanel} elevation={0}>
        <Text style={styles.statSubLabel}>Select Player</Text>
        {loadingRoster ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 8 }} />
        ) : roster.length === 0 ? (
          <Text style={styles.emptyRosterText}>No players found for these teams</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {roster.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPlayerId(p.id)}
                style={[styles.pill, { backgroundColor: selectedPlayerId === p.id ? theme.colors.primary : '#F0F0F0' }]}
              >
                <Text style={[styles.pillText, { color: selectedPlayerId === p.id ? '#FFF' : '#888' }]}>
                  #{p.jersey_number ?? '?'} {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={[styles.statSubLabel, { marginTop: SPACING.sm }]}>Stat Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {STAT_TYPES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSelectedStat(s)}
              style={[styles.pill, { backgroundColor: selectedStat === s ? theme.colors.primary : '#F0F0F0' }]}
            >
              <Text style={[styles.pillText, { color: selectedStat === s ? '#FFF' : '#888' }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button
          mode="contained"
          onPress={recordStat}
          loading={recordingStats}
          disabled={recordingStats || !selectedPlayerId}
          buttonColor={theme.colors.primary}
          style={{ marginTop: SPACING.sm, borderRadius: 8 }}
          icon="check"
        >
          Confirm Stat
        </Button>
      </Surface>

      <Button
        mode="outlined"
        onPress={endMatch}
        textColor={theme.colors.error}
        style={[styles.endBtn, { borderColor: theme.colors.error }]}
        icon="flag-checkered"
      >
        End Match
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  backBtn: { marginRight: SPACING.sm },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  scoreBoard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: SPACING.lg, marginBottom: SPACING.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  teamCol: { flex: 1, alignItems: 'flex-start' },
  vsCol: { alignItems: 'center', paddingHorizontal: SPACING.sm },
  teamName: { color: '#AAAAAA', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  score: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', marginTop: 4 },
  vsText: { color: '#555', fontSize: 13, fontWeight: '700' },
  timerText: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  timerControls: { flexDirection: 'row', gap: SPACING.sm, justifyContent: 'center' },
  sectionLabel: { fontSize: 11, color: APP_THEME.colors.primary, letterSpacing: 1.5, fontWeight: '800', marginBottom: 10, marginTop: SPACING.md },
  scoringGrid: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  scoringCol: { flex: 1, gap: SPACING.xs },
  scoringDivider: { width: 1, backgroundColor: '#EEEEEE' },
  teamNameSmall: { fontSize: 12, fontWeight: '700', color: '#888', textAlign: 'center', marginBottom: 4 },
  scoreBtn: { borderRadius: 8 },
  patRow: { flexDirection: 'row', gap: 4 },
  patBtn: { borderRadius: 8 },
  statPanel: { backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md },
  statSubLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  pillRow: { gap: 6, paddingBottom: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  emptyRosterText: { fontSize: 12, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: 8 },
  endBtn: { borderRadius: 12, marginTop: SPACING.sm },
});
