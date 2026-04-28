// app/(organizer)/matches/index.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  FAB,
  Button,
  TextInput,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { MATCHES, TOURNAMENTS, TEAMS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

const FILTER_TABS = ['All', 'Upcoming', 'Live', 'Completed'];

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add match form state
  const [form, setForm] = useState({
    tournament: '',
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    location: '',
  });

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return MATCHES;
    return MATCHES.filter((m) => m.status === activeFilter);
  }, [activeFilter]);

  const handleAddMatch = () => {
    // TODO: POST /matches  — no approval needed for organizer
    setShowAddModal(false);
    setForm({ tournament: '', homeTeam: '', awayTeam: '', date: '', time: '', location: '' });
  };

  const renderMatch = ({ item }) => {
    const isLive = item.status === 'Live';
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: '/(organizer)/matches/[id]', params: { id: item.id } })
        }
        activeOpacity={0.75}
      >
        <Surface
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface },
            isLive && styles.liveCard,
          ]}
          elevation={0}
        >
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.matchup, { color: theme.colors.onSurface }]}>
                {item.homeTeam} vs {item.awayTeam}
              </Text>
              <Text style={[styles.matchMeta, { color: theme.colors.onSurfaceVariant }]}>
                {item.date} · {item.time} · {item.location}
              </Text>
              <Text style={[styles.tournamentLabel, { color: theme.colors.onSurfaceVariant }]}>
                {item.tournamentName}
              </Text>
            </View>
            <StatusPill status={item.status} />
          </View>

          {isLive && (
            <View style={[styles.liveScore, { borderTopColor: theme.colors.outline }]}>
              <ScoreBlock team={item.homeTeam} score={item.homeScore} theme={theme} />
              <Text style={[styles.scoreDash, { color: theme.colors.onSurfaceVariant }]}>—</Text>
              <ScoreBlock team={item.awayTeam} score={item.awayScore} theme={theme} isAway />
            </View>
          )}

          {item.status === 'Upcoming' && (
            <Button
              mode="contained"
              compact
              onPress={() =>
                router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: item.id } })
              }
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={styles.startBtn}
            >
              Start Match
            </Button>
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Matches</Text>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveFilter(tab)}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === tab ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: activeFilter === tab ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No {activeFilter.toLowerCase()} matches
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        label="Add Match"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setShowAddModal(true)}
      />

      {/* Add Match Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <Surface
              style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}
              elevation={4}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Add New Match
              </Text>
              <Divider style={{ backgroundColor: theme.colors.outline, marginBottom: SPACING.md }} />

              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { key: 'tournament', label: 'Tournament' },
                  { key: 'homeTeam', label: 'Home Team' },
                  { key: 'awayTeam', label: 'Away Team' },
                  { key: 'date', label: 'Date (YYYY-MM-DD)' },
                  { key: 'time', label: 'Time (e.g. 10:00 AM)' },
                  { key: 'location', label: 'Location / Field' },
                ].map(({ key, label }) => (
                  <TextInput
                    key={key}
                    label={label}
                    value={form[key]}
                    onChangeText={(val) => setForm((f) => ({ ...f, [key]: val }))}
                    mode="outlined"
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.onSurface}
                    style={styles.formInput}
                  />
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleAddMatch}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={{ flex: 1 }}
                >
                  Add Match
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                  textColor={theme.colors.onSurface}
                >
                  Cancel
                </Button>
              </View>
            </Surface>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ScoreBlock({ team, score, theme, isAway }) {
  return (
    <View style={[styles.scoreBlock, isAway && { alignItems: 'flex-end' }]}>
      <Text style={[styles.scoreTeam, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
        {team}
      </Text>
      <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  filterTab: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  filterTabText: { fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: 100 },
  card: {
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1C2437',
    gap: SPACING.sm,
  },
  liveCard: { borderColor: '#00E67655' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  matchup: { fontSize: 15, fontWeight: '700' },
  matchMeta: { fontSize: 12, marginTop: 2 },
  tournamentLabel: { fontSize: 11, marginTop: 1 },
  liveScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  scoreBlock: { flex: 1 },
  scoreTeam: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreNum: { fontSize: 32, fontWeight: '900' },
  scoreDash: { fontSize: 20, fontWeight: '300' },
  startBtn: { alignSelf: 'flex-start', borderRadius: 8 },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.md,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: SPACING.sm },
  formInput: { backgroundColor: 'transparent', marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  empty: { alignItems: 'center', paddingTop: SPACING.xl * 2 },
});