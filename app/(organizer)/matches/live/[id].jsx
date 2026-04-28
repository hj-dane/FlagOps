// app/(organizer)/matches/live/[id].jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { Text, useTheme, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MATCHES, MATCH_STATS, PLAYERS } from '../../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../../theme';

const STAT_TYPES = ['TD', 'INT', 'Flag Pulled', 'Sack', 'Completion', 'Rush'];

export default function LiveMatchScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const match = MATCHES.find((m) => m.id === id) ?? MATCHES[0];
  const allPlayers = PLAYERS.filter((p) => p.teamId === match.homeTeamId || p.teamId === match.awayTeamId);

  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState('Not Started');
  const intervalRef = useRef(null);
  const [isOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [statModalVisible, setStatModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedStat, setSelectedStat] = useState(STAT_TYPES[0]);
  const [patModalVisible, setPatModalVisible] = useState(false);
  const [patTeam, setPatTeam] = useState('home');
  const [statsLog, setStatsLog] = useState(MATCH_STATS[id] ?? []);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const queueAction = useCallback((action) => {
    if (!isOnline) setOfflineQueue((q) => [...q, { ...action, timestamp: new Date().toISOString() }]);
  }, [isOnline]);

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

  const recordStat = () => {
    if (!selectedPlayer) { Alert.alert('Select a player first'); return; }
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
    setStatModalVisible(false);
    setSelectedPlayer(null);
    setSelectedStat(STAT_TYPES[0]);
  };

  const handleEndMatch = () => {
    Alert.alert('End Match', `Final: ${match.homeTeam} ${homeScore} – ${awayScore} ${match.awayTeam}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Match', style: 'destructive', onPress: () => { setTimerRunning(false); setMatchPhase('Full Time'); } },
    ]);
  };

  const isCompleted = matchPhase === 'Full Time';

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="wifi-off" size={14} color="#E65100" />
          <Text style={styles.offlineText}>Offline — {offlineQueue.length} queued</Text>
        </View>
      )}

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
        <Text style={[styles.backText, { color: theme.colors.primary }]}>Matches</Text>
      </TouchableOpacity>

      {/* Scoreboard — dark card like reference */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreCardMeta}>{match.tournamentName} · {match.location}</Text>

        <View style={styles.scoreRow}>
          <View style={styles.teamBlock}>
            <Text style={styles.scoreTeamName} numberOfLines={2}>{match.homeTeam}</Text>
            <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{homeScore}</Text>
            <Text style={styles.scoreLabel}>HOME</Text>
          </View>
          <View style={styles.scoreCentre}>
            <Text style={styles.scoreTimer}>{isCompleted ? 'FINAL' : formatTime(seconds)}</Text>
            <Text style={styles.scorePhase}>{matchPhase}</Text>
          </View>
          <View style={[styles.teamBlock, { alignItems: 'flex-end' }]}>
            <Text style={[styles.scoreTeamName, { textAlign: 'right' }]} numberOfLines={2}>{match.awayTeam}</Text>
            <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{awayScore}</Text>
            <Text style={styles.scoreLabel}>AWAY</Text>
          </View>
        </View>

        {/* Timer controls */}
        {!isCompleted && (
          <View style={styles.timerControls}>
            {matchPhase === 'Not Started' && (
              <TouchableOpacity
                style={[styles.kickoffBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => { setTimerRunning(true); setMatchPhase('1st Half'); }}
              >
                <MaterialCommunityIcons name="play" size={16} color="#FFFFFF" />
                <Text style={styles.kickoffBtnText}>Kickoff</Text>
              </TouchableOpacity>
            )}
            {(matchPhase === '1st Half' || matchPhase === '2nd Half') && (
              <View style={styles.timerBtnRow}>
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: timerRunning ? '#333333' : theme.colors.primary }]}
                  onPress={() => setTimerRunning((r) => !r)}
                >
                  <MaterialCommunityIcons name={timerRunning ? 'pause' : 'play'} size={16} color="#FFFFFF" />
                  <Text style={styles.timerBtnText}>{timerRunning ? 'Pause' : 'Resume'}</Text>
                </TouchableOpacity>
                {matchPhase === '1st Half' && (
                  <TouchableOpacity
                    style={[styles.timerBtn, { backgroundColor: '#333333' }]}
                    onPress={() => { setTimerRunning(false); setMatchPhase('Halftime'); setSeconds(0); }}
                  >
                    <Text style={styles.timerBtnText}>End Half</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {matchPhase === 'Halftime' && (
              <TouchableOpacity
                style={[styles.kickoffBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => { setTimerRunning(true); setMatchPhase('2nd Half'); }}
              >
                <Text style={styles.kickoffBtnText}>Start 2nd Half</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Scoring buttons */}
      {!isCompleted && (
        <View style={[styles.section, CARD_SHADOW]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Scoring</Text>
          <View style={styles.scoreGrid}>
            {[
              { label: `+TD  ${match.homeTeam}`, onPress: () => addTD('home'), primary: true },
              { label: `+TD  ${match.awayTeam}`, onPress: () => addTD('away'), primary: true },
              { label: `+PAT  ${match.homeTeam}`, onPress: () => { setPatTeam('home'); setPatModalVisible(true); }, primary: false },
              { label: `+PAT  ${match.awayTeam}`, onPress: () => { setPatTeam('away'); setPatModalVisible(true); }, primary: false },
            ].map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.onPress}
                style={[
                  styles.scoreBtn,
                  { backgroundColor: btn.primary ? theme.colors.primary : '#F5F5F5' },
                ]}
              >
                <Text style={[styles.scoreBtnText, { color: btn.primary ? '#FFFFFF' : '#1A1A1A' }]} numberOfLines={2}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Record stat */}
      {!isCompleted && (
        <Button
          mode="outlined"
          icon="clipboard-plus"
          onPress={() => setStatModalVisible(true)}
          textColor={theme.colors.primary}
          style={[styles.statBtn, { borderColor: theme.colors.primary }]}
          contentStyle={{ paddingVertical: 4 }}
        >
          Record Player Stat
        </Button>
      )}

      {/* Stats log */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: SPACING.sm }]}>
        Stats Log ({statsLog.length})
      </Text>
      {statsLog.length === 0 ? (
        <Text style={styles.emptyText}>No stats recorded yet</Text>
      ) : (
        statsLog.map((stat) => (
          <View key={stat.id} style={[styles.statRow, CARD_SHADOW]}>
            <View style={[styles.statTypePill, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.statTypeText}>{stat.statType}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statPlayer, { color: theme.colors.onSurface }]}>{stat.playerName}</Text>
              <Text style={styles.statTeam}>{stat.team} · {new Date(stat.timestamp).toLocaleTimeString()}</Text>
            </View>
          </View>
        ))
      )}

      {/* End / Cancel */}
      {!isCompleted && (
        <View style={styles.bottomActions}>
          <Button mode="contained" onPress={handleEndMatch} buttonColor={theme.colors.primary} textColor="#FFFFFF" style={{ flex: 1 }} icon="flag-checkered" contentStyle={{ paddingVertical: 4 }}>
            End Match
          </Button>
          <Button mode="outlined" onPress={() => Alert.alert('Cancel Match', 'Submit request to admin?', [{ text: 'Cancel' }, { text: 'Submit', onPress: () => Alert.alert('Submitted') }])} textColor={theme.colors.error} style={{ flex: 1, borderColor: theme.colors.error }} contentStyle={{ paddingVertical: 4 }}>
            Cancel
          </Button>
        </View>
      )}

      {/* PAT Modal */}
      <Modal visible={patModalVisible} transparent animationType="fade">
        <View style={styles.centreModalOverlay}>
          <View style={styles.centreModal}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              PAT — {patTeam === 'home' ? match.homeTeam : match.awayTeam}
            </Text>
            <View style={styles.patBtns}>
              <Button mode="contained" onPress={() => addPAT(patTeam, 1)} buttonColor={theme.colors.primary} textColor="#FFFFFF" style={{ flex: 1 }}>+1 pt</Button>
              <Button mode="outlined" onPress={() => addPAT(patTeam, 2)} textColor={theme.colors.primary} style={{ flex: 1, borderColor: theme.colors.primary }}>+2 pts</Button>
            </View>
            <Button mode="text" onPress={() => setPatModalVisible(false)} textColor="#AAAAAA">Cancel</Button>
          </View>
        </View>
      </Modal>

      {/* Stat Recording Modal */}
      <Modal visible={statModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Record Stat</Text>
            <Divider style={{ marginVertical: SPACING.md }} />

            <Text style={styles.fieldLabel}>Stat Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
              {STAT_TYPES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedStat(s)}
                  style={[styles.pill, { backgroundColor: selectedStat === s ? theme.colors.primary : '#F0F0F0' }]}
                >
                  <Text style={[styles.pillText, { color: selectedStat === s ? '#FFFFFF' : '#888888' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Player</Text>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {allPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  onPress={() => setSelectedPlayer(player)}
                  style={[
                    styles.playerPickerRow,
                    { backgroundColor: selectedPlayer?.id === player.id ? '#FFEBEE' : '#F5F5F5',
                      borderColor: selectedPlayer?.id === player.id ? theme.colors.primary : 'transparent',
                      borderWidth: selectedPlayer?.id === player.id ? 1 : 0 },
                  ]}
                >
                  <View style={[styles.pickJerseyBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.pickJerseyNum}>#{player.jerseyNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickPlayerName, { color: theme.colors.onSurface }]}>{player.name}</Text>
                    <Text style={styles.pickPlayerMeta}>{player.teamName} · {player.positions.join('/')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button mode="contained" onPress={recordStat} buttonColor={theme.colors.primary} textColor="#FFFFFF" style={{ marginTop: SPACING.md, borderRadius: 12 }} icon="check" contentStyle={{ paddingVertical: 4 }}>
              Confirm Stat
            </Button>
            <Button mode="text" onPress={() => setStatModalVisible(false)} textColor="#AAAAAA" style={{ marginTop: 4 }}>Cancel</Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl * 2 },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: '#FFF3E0', borderRadius: 10, padding: SPACING.sm },
  offlineText: { fontSize: 13, fontWeight: '600', color: '#E65100' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, alignSelf: 'flex-start', marginBottom: SPACING.xs },
  backText: { fontSize: 14, fontWeight: '700' },
  // Score card — dark surface
  scoreCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: SPACING.lg, gap: SPACING.md },
  scoreCardMeta: { fontSize: 11, color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamBlock: { flex: 1 },
  scoreTeamName: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scoreNum: { fontSize: 56, fontWeight: '900', lineHeight: 62 },
  scoreLabel: { fontSize: 9, color: '#666666', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  scoreCentre: { alignItems: 'center', paddingHorizontal: SPACING.sm },
  scoreTimer: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  scorePhase: { fontSize: 10, color: '#888888', textTransform: 'uppercase', letterSpacing: 1 },
  timerControls: { borderTopWidth: 1, borderTopColor: '#333333', paddingTop: SPACING.md },
  kickoffBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, borderRadius: 12, paddingVertical: 10 },
  kickoffBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  timerBtnRow: { flexDirection: 'row', gap: SPACING.sm },
  timerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10 },
  timerBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  // Scoring
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  scoreBtn: { flex: 1, minWidth: '45%', borderRadius: 12, padding: SPACING.md, alignItems: 'center' },
  scoreBtnText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  statBtn: { borderRadius: 12 },
  // Stats log
  statRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: SPACING.sm, gap: SPACING.sm },
  statTypePill: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 8, minWidth: 72, alignItems: 'center' },
  statTypeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  statPlayer: { fontSize: 13, fontWeight: '700' },
  statTeam: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic' },
  bottomActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  // Modals
  centreModalOverlay: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center' },
  centreModal: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: SPACING.lg, width: '80%', gap: SPACING.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '700' },
  playerPickerRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: SPACING.sm, gap: SPACING.sm, marginBottom: SPACING.xs },
  pickJerseyBadge: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pickJerseyNum: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  pickPlayerName: { fontSize: 13, fontWeight: '700' },
  pickPlayerMeta: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  patBtns: { flexDirection: 'row', gap: SPACING.sm },
});