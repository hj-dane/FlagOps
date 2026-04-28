// app/(organizer)/matches/live/[id].jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Button,
  Divider,
  Portal,
  Modal,
  SegmentedButtons,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MATCHES, MATCH_STATS, PLAYERS } from '../../../../data/mockData';
import { SPACING } from '../../../../theme';

const STAT_TYPES = ['TD', 'INT', 'Flag Pulled', 'Sack', 'Completion', 'Rush'];

export default function LiveMatchScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const match = MATCHES.find((m) => m.id === id) ?? MATCHES[0];
  const allPlayers = PLAYERS.filter(
    (p) => p.teamId === match.homeTeamId || p.teamId === match.awayTeamId
  );

  // Score state
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);

  // Timer state (count-up in seconds)
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState('Not Started'); // Not Started | 1st Half | Halftime | 2nd Half | Full Time
  const intervalRef = useRef(null);

  // Offline queue
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Stat recording modal
  const [statModalVisible, setStatModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedStat, setSelectedStat] = useState(STAT_TYPES[0]);

  // PAT modal
  const [patModalVisible, setPatModalVisible] = useState(false);
  const [patTeam, setPatTeam] = useState('home');

  // Stats log
  const [statsLog, setStatsLog] = useState(MATCH_STATS[id] ?? []);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Score actions
  const addTD = (team) => {
    if (team === 'home') setHomeScore((s) => s + 6);
    else setAwayScore((s) => s + 6);
    queueAction({ type: 'TD', team, points: 6 });
  };

  const addPAT = (team, pts) => {
    if (team === 'home') setHomeScore((s) => s + pts);
    else setAwayScore((s) => s + pts);
    queueAction({ type: 'PAT', team, points: pts });
    setPatModalVisible(false);
  };

  const queueAction = useCallback(
    (action) => {
      const entry = { ...action, timestamp: new Date().toISOString(), synced: isOnline };
      if (!isOnline) {
        setOfflineQueue((q) => [...q, entry]);
      }
      // TODO: if online, POST /matches/:id/actions directly
    },
    [isOnline]
  );

  const recordStat = () => {
    if (!selectedPlayer) {
      Alert.alert('Select a player first');
      return;
    }
    const stat = {
      id: `stat-${Date.now()}`,
      matchId: id,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      team: selectedPlayer.teamName,
      statType: selectedStat,
      value: 1,
      timestamp: new Date().toISOString(),
    };
    setStatsLog((prev) => [stat, ...prev]);
    if (!isOnline) {
      setOfflineQueue((q) => [...q, { ...stat, synced: false }]);
    }
    // TODO: POST /stats  when online
    setStatModalVisible(false);
    setSelectedPlayer(null);
    setSelectedStat(STAT_TYPES[0]);
  };

  const handleEndMatch = () => {
    Alert.alert(
      'End Match',
      `Final Score: ${match.homeTeam} ${homeScore} – ${awayScore} ${match.awayTeam}\n\nConfirm to lock the scoreboard and finalize stats.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Match',
          style: 'destructive',
          onPress: () => {
            // TODO: PATCH /matches/:id  { status: 'Completed' }
            setTimerRunning(false);
            setMatchPhase('Full Time');
          },
        },
      ]
    );
  };

  const handleCancelMatch = () => {
    Alert.alert(
      'Cancel Match',
      'Submit cancellation request to admin?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Submit Request',
          onPress: () => {
            // TODO: POST /change_requests  { type: 'cancel_match', matchId: id }
            Alert.alert('Submitted', 'Cancellation request sent to admin.');
          },
        },
      ]
    );
  };

  const isCompleted = matchPhase === 'Full Time';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Offline banner */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: '#FFB30022' }]}>
          <Text style={[styles.offlineText, { color: '#FFB300' }]}>
            ⚠ Offline — {offlineQueue.length} action{offlineQueue.length !== 1 ? 's' : ''} queued · will sync on reconnect
          </Text>
        </View>
      )}

      {/* Scoreboard */}
      <Surface style={[styles.scoreboardCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text style={[styles.tournamentName, { color: theme.colors.onSurfaceVariant }]}>
          {match.tournamentName} · {match.location}
        </Text>

        <View style={styles.scoreRow}>
          <View style={styles.teamBlock}>
            <Text style={[styles.teamLabel, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {match.homeTeam}
            </Text>
            <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{homeScore}</Text>
          </View>

          <View style={styles.centerBlock}>
            <Text style={[styles.timer, { color: isCompleted ? theme.colors.secondary : theme.colors.onSurface }]}>
              {isCompleted ? 'FINAL' : formatTime(seconds)}
            </Text>
            <Text style={[styles.phase, { color: theme.colors.onSurfaceVariant }]}>{matchPhase}</Text>
          </View>

          <View style={[styles.teamBlock, { alignItems: 'flex-end' }]}>
            <Text style={[styles.teamLabel, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {match.awayTeam}
            </Text>
            <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{awayScore}</Text>
          </View>
        </View>

        {/* Timer controls */}
        {!isCompleted && (
          <View style={styles.timerControls}>
            <Button
              mode={timerRunning ? 'outlined' : 'contained'}
              onPress={() => setTimerRunning((r) => !r)}
              buttonColor={timerRunning ? undefined : theme.colors.primary}
              textColor={timerRunning ? theme.colors.onSurface : theme.colors.onPrimary}
              icon={timerRunning ? 'pause' : 'play'}
              style={{ flex: 1 }}
            >
              {timerRunning ? 'Pause' : 'Start'}
            </Button>

            {matchPhase === '1st Half' && (
              <Button
                mode="outlined"
                onPress={() => { setTimerRunning(false); setMatchPhase('Halftime'); setSeconds(0); }}
                textColor={theme.colors.onSurface}
                style={{ flex: 1 }}
              >
                End Half
              </Button>
            )}
            {matchPhase === 'Halftime' && (
              <Button
                mode="outlined"
                onPress={() => { setTimerRunning(true); setMatchPhase('2nd Half'); }}
                textColor={theme.colors.onSurface}
                style={{ flex: 1 }}
              >
                Start 2nd Half
              </Button>
            )}
            {matchPhase === 'Not Started' && (
              <Button
                mode="outlined"
                onPress={() => { setTimerRunning(true); setMatchPhase('1st Half'); }}
                textColor={theme.colors.primary}
                style={{ flex: 1, borderColor: theme.colors.primary }}
              >
                Kickoff
              </Button>
            )}
          </View>
        )}
      </Surface>

      {/* Scoring actions */}
      {!isCompleted && (
        <Surface style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Scoring</Text>
          <View style={styles.actionGrid}>
            <ScoreButton label={`+TD ${match.homeTeam}`} onPress={() => addTD('home')} theme={theme} />
            <ScoreButton label={`+TD ${match.awayTeam}`} onPress={() => addTD('away')} theme={theme} />
            <ScoreButton
              label={`+PAT ${match.homeTeam}`}
              onPress={() => { setPatTeam('home'); setPatModalVisible(true); }}
              theme={theme}
              secondary
            />
            <ScoreButton
              label={`+PAT ${match.awayTeam}`}
              onPress={() => { setPatTeam('away'); setPatModalVisible(true); }}
              theme={theme}
              secondary
            />
          </View>
        </Surface>
      )}

      {/* Stat recording */}
      {!isCompleted && (
        <Button
          mode="contained"
          icon="clipboard-plus"
          onPress={() => setStatModalVisible(true)}
          buttonColor={theme.colors.surfaceVariant}
          textColor={theme.colors.onSurface}
          style={styles.statBtn}
        >
          Record Player Stat
        </Button>
      )}

      {/* Stats log */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Stats Log ({statsLog.length})
      </Text>
      {statsLog.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No stats recorded yet
        </Text>
      ) : (
        statsLog.map((stat) => (
          <Surface
            key={stat.id}
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
              <Text style={[styles.statTeam, { color: theme.colors.onSurfaceVariant }]}>
                {stat.team} · {new Date(stat.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </Surface>
        ))
      )}

      {/* End / Cancel match */}
      {!isCompleted && (
        <View style={styles.bottomActions}>
          <Button
            mode="contained"
            onPress={handleEndMatch}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={{ flex: 1 }}
            icon="flag-checkered"
          >
            End Match
          </Button>
          <Button
            mode="outlined"
            onPress={handleCancelMatch}
            textColor={theme.colors.error}
            style={{ flex: 1, borderColor: theme.colors.error }}
          >
            Cancel Match
          </Button>
        </View>
      )}

      {/* PAT Modal */}
      <Portal>
        <Modal
          visible={patModalVisible}
          onDismiss={() => setPatModalVisible(false)}
          contentContainerStyle={[styles.smallModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            PAT — {patTeam === 'home' ? match.homeTeam : match.awayTeam}
          </Text>
          <View style={styles.patBtns}>
            <Button
              mode="contained"
              onPress={() => addPAT(patTeam, 1)}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={{ flex: 1 }}
            >
              +1 pt
            </Button>
            <Button
              mode="contained"
              onPress={() => addPAT(patTeam, 2)}
              buttonColor={theme.colors.secondary}
              textColor="#001A09"
              style={{ flex: 1 }}
            >
              +2 pts
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Stat Recording Modal */}
      <Portal>
        <Modal
          visible={statModalVisible}
          onDismiss={() => setStatModalVisible(false)}
          contentContainerStyle={[styles.statModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Record Stat</Text>
          <Divider style={{ backgroundColor: theme.colors.outline, marginBottom: SPACING.md }} />

          <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>Stat Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            <View style={styles.statTypeRow}>
              {STAT_TYPES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedStat(s)}
                  style={[
                    styles.statTypePillBtn,
                    {
                      backgroundColor:
                        selectedStat === s ? theme.colors.primary : theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedStat === s ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>Player</Text>
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {allPlayers.map((player) => (
              <TouchableOpacity
                key={player.id}
                onPress={() => setSelectedPlayer(player)}
                style={[
                  styles.playerPickerRow,
                  {
                    backgroundColor:
                      selectedPlayer?.id === player.id
                        ? theme.colors.primary + '22'
                        : theme.colors.surfaceVariant,
                    borderColor:
                      selectedPlayer?.id === player.id
                        ? theme.colors.primary
                        : '#2A3348',
                  },
                ]}
              >
                <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>
                  #{player.jerseyNumber}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerPickerName, { color: theme.colors.onSurface }]}>
                    {player.name}
                  </Text>
                  <Text style={[styles.playerPickerMeta, { color: theme.colors.onSurfaceVariant }]}>
                    {player.teamName} · {player.positions.join('/')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button
            mode="contained"
            onPress={recordStat}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={{ marginTop: SPACING.md }}
            icon="check"
          >
            Confirm Stat
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

function ScoreButton({ label, onPress, theme, secondary }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.scoreBtn,
        {
          backgroundColor: secondary
            ? theme.colors.surfaceVariant
            : theme.colors.primary + '22',
          borderColor: secondary ? theme.colors.outline : theme.colors.primary + '55',
        },
      ]}
    >
      <Text
        style={[
          styles.scoreBtnText,
          { color: secondary ? theme.colors.onSurface : theme.colors.primary },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl * 2 },
  offlineBanner: {
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  offlineText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  scoreboardCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#00E67644',
  },
  tournamentName: { fontSize: 11, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  teamBlock: { flex: 1 },
  teamLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreNum: { fontSize: 56, fontWeight: '900', lineHeight: 60 },
  centerBlock: { alignItems: 'center' },
  timer: { fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  phase: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  timerControls: { flexDirection: 'row', gap: SPACING.sm },
  actionsCard: {
    borderRadius: 14,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#1C2437',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  scoreBtn: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  scoreBtnText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  statBtn: { borderRadius: 10 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#2A3348',
  },
  statTypePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  statTypeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statPlayer: { fontSize: 13, fontWeight: '700' },
  statTeam: { fontSize: 11, marginTop: 1 },
  bottomActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
  smallModal: {
    margin: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  patBtns: { flexDirection: 'row', gap: SPACING.sm },
  statModal: {
    margin: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  statTypeRow: { flexDirection: 'row', gap: SPACING.xs },
  statTypePillBtn: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  playerPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  jerseyNum: { fontSize: 14, fontWeight: '900', width: 36, textAlign: 'center' },
  playerPickerName: { fontSize: 13, fontWeight: '700' },
  playerPickerMeta: { fontSize: 11, marginTop: 1 },
});