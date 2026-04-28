// app/(organizer)/matches/index.jsx
import React, { useState, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, useTheme, FAB, Button, TextInput, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { MATCHES } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

const FILTER_TABS = ['All', 'Upcoming', 'Live', 'Completed'];

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ tournament: '', homeTeam: '', awayTeam: '', date: '', time: '', location: '' });

  const filtered = useMemo(() =>
    activeFilter === 'All' ? MATCHES : MATCHES.filter((m) => m.status === activeFilter),
    [activeFilter]
  );

  const handleAddMatch = () => {
    // TODO: POST /matches
    setShowAddModal(false);
    setForm({ tournament: '', homeTeam: '', awayTeam: '', date: '', time: '', location: '' });
  };

  const renderMatch = ({ item }) => {
    const isLive = item.status === 'Live';
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(organizer)/matches/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.card, CARD_SHADOW, isLive && styles.liveCard]}>
          {isLive && <View style={[styles.liveBar, { backgroundColor: theme.colors.primary }]} />}

          <View style={styles.cardInner}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.matchup, { color: theme.colors.onSurface }]}>
                  {item.homeTeam} vs {item.awayTeam}
                </Text>
                <Text style={styles.matchMeta}>{item.date} · {item.time} · {item.location}</Text>
                <Text style={styles.tournamentLabel}>{item.tournamentName}</Text>
              </View>
              <StatusPill status={item.status} />
            </View>

            {isLive && (
              <View style={[styles.liveScoreRow, { backgroundColor: '#1A1A1A', borderRadius: 12 }]}>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreTeamLabel} numberOfLines={1}>{item.homeTeam}</Text>
                  <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{item.homeScore}</Text>
                </View>
                <Text style={styles.scoreSep}>—</Text>
                <View style={[styles.scoreBlock, { alignItems: 'flex-end' }]}>
                  <Text style={styles.scoreTeamLabel} numberOfLines={1}>{item.awayTeam}</Text>
                  <Text style={[styles.scoreNum, { color: theme.colors.primary }]}>{item.awayScore}</Text>
                </View>
              </View>
            )}

            {item.status === 'Upcoming' && (
              <Button
                mode="contained"
                compact
                onPress={() => router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: item.id } })}
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
                style={styles.startBtn}
                icon="play"
              >
                Start Match
              </Button>
            )}
          </View>
        </View>
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
              activeFilter === tab
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE' },
            ]}
          >
            <Text style={[styles.filterTabText, { color: activeFilter === tab ? '#FFFFFF' : '#888888' }]}>
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
            <MaterialCommunityIcons name="whistle-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} matches</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        label="Add Match"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => setShowAddModal(true)}
      />

      {/* Add Match Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add New Match</Text>
              <Text style={styles.modalSub}>No approval needed — direct save</Text>
              <Divider style={{ marginVertical: SPACING.md }} />
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
                    outlineColor="#EEEEEE"
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.onSurface}
                    style={styles.formInput}
                  />
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleAddMatch} buttonColor={theme.colors.primary} textColor="#FFFFFF" style={{ flex: 1 }} contentStyle={{ paddingVertical: 4 }}>
                  Add Match
                </Button>
                <Button mode="outlined" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  filterRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterTabText: { fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  liveCard: { borderWidth: 1, borderColor: '#E8302A22' },
  liveBar: { height: 4, width: '100%' },
  cardInner: { padding: SPACING.md, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  matchup: { fontSize: 15, fontWeight: '700' },
  matchMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  tournamentLabel: { fontSize: 11, color: '#CCCCCC', marginTop: 1 },
  liveScoreRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: SPACING.md,
  },
  scoreBlock: { flex: 1 },
  scoreTeamLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase' },
  scoreNum: { fontSize: 36, fontWeight: '900' },
  scoreSep: { fontSize: 20, color: '#444444', fontWeight: '300' },
  startBtn: { alignSelf: 'flex-start', borderRadius: 20 },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15, color: '#AAAAAA' },
  fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.md, borderRadius: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSub: { fontSize: 13, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});