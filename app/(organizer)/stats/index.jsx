import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Searchbar,
  Button,
  TextInput,
  Divider,
} from 'react-native-paper';
import StatusPill from '../../../components/StatusPill';
import { PLAYERS, MATCH_STATS, MATCHES } from '../../../data/mockData';
import { SPACING } from '../../../theme';

const STAT_TYPES = ['TD', 'INT', 'Flag Pulled', 'Sack', 'Completion', 'Rush'];

// Flatten all match stats into one list for the organizer's org
const ALL_STATS = Object.values(MATCH_STATS).flat();

// Check if stat is read-only (match completed > 24h ago — simplified check for mock)
function isStatReadOnly(stat) {
  const match = MATCHES.find((m) => m.id === stat.matchId);
  if (!match) return false;
  if (match.status !== 'Completed') return false;
  const matchDate = new Date(stat.timestamp);
  const now = new Date();
  return now - matchDate > 24 * 60 * 60 * 1000;
}

export default function PlayerStatsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(ALL_STATS);

  // Edit modal
  const [editStat, setEditStat] = useState(null);
  const [editStatType, setEditStatType] = useState('');
  const [editValue, setEditValue] = useState('');

  const filteredPlayers = useMemo(
    () =>
      PLAYERS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        String(p.jerseyNumber).includes(query)
      ),
    [query]
  );

  const selectedPlayerStats = useMemo(() => {
    if (!selectedPlayer) return [];
    return playerStats.filter((s) => s.playerId === selectedPlayer.id);
  }, [selectedPlayer, playerStats]);

  const openEditModal = (stat) => {
    setEditStat(stat);
    setEditStatType(stat.statType);
    setEditValue(String(stat.value));
  };

  const saveStatEdit = () => {
    setPlayerStats((prev) =>
      prev.map((s) =>
        s.id === editStat.id
          ? { ...s, statType: editStatType, value: Number(editValue) }
          : s
      )
    );
    // TODO: PATCH /stats/:id
    setEditStat(null);
  };

  const deleteStat = (stat) => {
    Alert.alert(
      'Remove Stat Entry',
      `Remove ${stat.statType} for ${stat.playerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPlayerStats((prev) => prev.filter((s) => s.id !== stat.id));
            // TODO: DELETE /stats/:id
          },
        },
      ]
    );
  };

  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedPlayer(item)} activeOpacity={0.75}>
      <Surface
        style={[
          styles.playerCard,
          {
            backgroundColor:
              selectedPlayer?.id === item.id
                ? theme.colors.surfaceVariant
                : theme.colors.surface,
            borderColor:
              selectedPlayer?.id === item.id
                ? theme.colors.primary
                : '#1C2437',
          },
        ]}
        elevation={0}
      >
        <View style={styles.jerseyBadge}>
          <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>#{item.jerseyNumber}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.playerMeta, { color: theme.colors.onSurfaceVariant }]}>
            {item.positions.join(' / ')} · {item.teamName}
          </Text>
        </View>
        <StatusPill status={item.status} />
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Player Stats</Text>

      {/* Player search */}
      <Searchbar
        placeholder="Search player name or jersey #…"
        value={query}
        onChangeText={(q) => { setQuery(q); setSelectedPlayer(null); }}
        style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
        inputStyle={{ color: theme.colors.onSurface }}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      {!selectedPlayer ? (
        // Player list
        <FlatList
          data={filteredPlayers}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayerItem}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.xs }} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No players found</Text>
            </View>
          }
        />
      ) : (
        // Stat detail for selected player
        <ScrollView contentContainerStyle={styles.statDetail} showsVerticalScrollIndicator={false}>
          {/* Player header */}
          <Surface
            style={[styles.playerHeader, { backgroundColor: theme.colors.surface }]}
            elevation={0}
          >
            <TouchableOpacity onPress={() => setSelectedPlayer(null)} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: theme.colors.primary }]}>← All Players</Text>
            </TouchableOpacity>
            <Divider style={{ backgroundColor: theme.colors.outline, marginVertical: SPACING.sm }} />
            <View style={styles.playerHeaderRow}>
              <View style={styles.jerseyCircle}>
                <Text style={[styles.jerseyNumLg, { color: theme.colors.primary }]}>
                  #{selectedPlayer.jerseyNumber}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedPlayerName, { color: theme.colors.onSurface }]}>
                  {selectedPlayer.name}
                </Text>
                <Text style={[styles.selectedPlayerMeta, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedPlayer.positions.join(' / ')} · {selectedPlayer.teamName}
                </Text>
              </View>
              <StatusPill status={selectedPlayer.status} />
            </View>

            {/* Career stat summary */}
            <View style={styles.summaryRow}>
              {[
                { label: 'TDs', value: selectedPlayer.stats.tds },
                { label: 'INTs', value: selectedPlayer.stats.ints },
                { label: 'FP', value: selectedPlayer.stats.flagsPulled },
                { label: 'Sacks', value: selectedPlayer.stats.sacks },
                { label: 'GP', value: selectedPlayer.stats.matchesPlayed },
              ].map(({ label, value }) => (
                <View key={label} style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{value}</Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </Surface>

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Match Stat Log ({selectedPlayerStats.length})
          </Text>

          {selectedPlayerStats.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No recorded stats for this player
            </Text>
          ) : (
            selectedPlayerStats.map((stat) => {
              const readOnly = isStatReadOnly(stat);
              const match = MATCHES.find((m) => m.id === stat.matchId);
              return (
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
                    <Text style={[styles.statMatchLabel, { color: theme.colors.onSurface }]}>
                      {match
                        ? `${match.homeTeam} vs ${match.awayTeam}`
                        : stat.matchId}
                    </Text>
                    <Text style={[styles.statTimestamp, { color: theme.colors.onSurfaceVariant }]}>
                      {new Date(stat.timestamp).toLocaleString()}
                      {readOnly ? ' · Read-only' : ''}
                    </Text>
                  </View>
                  {!readOnly && (
                    <View style={styles.statActions}>
                      <TouchableOpacity
                        onPress={() => openEditModal(stat)}
                        style={[styles.iconBtn, { backgroundColor: theme.colors.primary + '22' }]}
                      >
                        <Text style={{ color: theme.colors.primary, fontSize: 13 }}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteStat(stat)}
                        style={[styles.iconBtn, { backgroundColor: theme.colors.error + '22' }]}
                      >
                        <Text style={{ color: theme.colors.error, fontSize: 13 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Surface>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Edit Stat Modal */}
      <Modal visible={!!editStat} animationType="slide" transparent>
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
                Edit Stat Entry
              </Text>
              <Divider style={{ backgroundColor: theme.colors.outline, marginBottom: SPACING.md }} />

              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>Stat Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: SPACING.xs, marginBottom: SPACING.md }}
              >
                {STAT_TYPES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setEditStatType(s)}
                    style={[
                      styles.statTypePillBtn,
                      {
                        backgroundColor:
                          editStatType === s
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          editStatType === s
                            ? theme.colors.onPrimary
                            : theme.colors.onSurfaceVariant,
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                label="Value"
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                mode="outlined"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={saveStatEdit}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={{ flex: 1 }}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setEditStat(null)}
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md },
  searchbar: { marginBottom: SPACING.md, borderRadius: 10, elevation: 0 },
  list: { paddingBottom: SPACING.xl },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
  },
  jerseyBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00E67614',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00E67630',
  },
  jerseyNum: { fontSize: 14, fontWeight: '900' },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerMeta: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: SPACING.xl * 2 },
  statDetail: { paddingBottom: SPACING.xl * 2 },
  playerHeader: {
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1C2437',
    marginBottom: SPACING.md,
  },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { fontSize: 14, fontWeight: '700' },
  playerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  jerseyCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00E67618',
    borderWidth: 2,
    borderColor: '#00E67655',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNumLg: { fontSize: 16, fontWeight: '900' },
  selectedPlayerName: { fontSize: 18, fontWeight: '800' },
  selectedPlayerMeta: { fontSize: 12, marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#1C2437',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
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
  statTypeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statMatchLabel: { fontSize: 13, fontWeight: '700' },
  statTimestamp: { fontSize: 11, marginTop: 1 },
  statActions: { flexDirection: 'row', gap: SPACING.xs },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: SPACING.sm },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  statTypePillBtn: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  formInput: { backgroundColor: 'transparent', marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});