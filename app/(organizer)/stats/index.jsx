// app/(organizer)/stats/index.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Alert,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, Searchbar, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom } from '../../../store/globalStore';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const STAT_TYPES = ['TD', 'INT', 'Flag Pulled', 'Sack', 'Completion', 'Rush'];

// Stat entries older than 24h on a completed match are read-only
function isStatReadOnly(stat) {
  if (stat.match_status !== 'completed') return false;
  return new Date() - new Date(stat.recorded_at) > 24 * 60 * 60 * 1000;
}

export default function PlayerStatsScreen() {
  const theme = useTheme();
  const profile = useAtomValue(userProfileAtom);

  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [editStat, setEditStat] = useState(null);
  const [editStatType, setEditStatType] = useState('');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Fetch players for this org (two-step via team IDs) ──
  useEffect(() => {
    if (!profile?.organization_id) return;
    const fetchPlayers = async () => {
      setLoadingPlayers(true);
      try {
        const { data, error } = await supabase
          .from('player_organizations')
          .select('player_id, players(id, name, jersey_number, position, status, team_id, teams(name))')
          .eq('organization_id', profile.organization_id);

        if (error) throw error;
        const playerList = (data || [])
          .map((r) => r.players)
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));
        setPlayers(playerList);
      } catch (err) {
        console.error('Error fetching players for stats:', err);
      } finally {
        setLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, [profile]);

  // ── Fetch stat log for selected player ──
  const fetchStats = useCallback(async (playerId) => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('match_stats')
        .select('id, stat_type, value, recorded_at, match_id, matches(home_team_name, away_team_name, status)')
        .eq('player_id', playerId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((s) => ({
        ...s,
        match_status: s.matches?.status || '',
        matchLabel: s.matches ? `${s.matches.home_team_name} vs ${s.matches.away_team_name}` : s.match_id,
      }));
      setPlayerStats(formatted);
    } catch (err) {
      console.error('Error fetching match stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    fetchStats(player.id);
  };

  // ── Edit stat ──
  const openEdit = (stat) => {
    setEditStat(stat);
    setEditStatType(stat.stat_type);
    setEditValue(String(stat.value));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('match_stats')
        .update({ stat_type: editStatType, value: Number(editValue) })
        .eq('id', editStat.id);

      if (error) throw error;

      setPlayerStats((prev) =>
        prev.map((s) => s.id === editStat.id ? { ...s, stat_type: editStatType, value: Number(editValue) } : s)
      );
      setEditStat(null);
    } catch (err) {
      Alert.alert('Error', 'Could not save stat edit.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete stat ──
  const deleteStat = (stat) => {
    Alert.alert('Remove Entry', `Remove this ${stat.stat_type} entry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase
              .from('match_stats')
              .delete()
              .eq('id', stat.id);

            if (error) throw error;
            setPlayerStats((prev) => prev.filter((s) => s.id !== stat.id));
          } catch (err) {
            Alert.alert('Error', 'Could not remove stat entry.');
          }
        }
      },
    ]);
  };

  const filteredPlayers = useMemo(() =>
    players.filter((p) =>
      p.name?.toLowerCase().includes(query.toLowerCase()) ||
      String(p.jersey_number || '').includes(query)
    ), [players, query]
  );

  // Aggregate stats from match_stats log for the selected player
  const statSummary = {
    tds: playerStats.filter((s) => s.stat_type?.toLowerCase() === 'td').reduce((acc, s) => acc + (s.value || 1), 0),
    ints: playerStats.filter((s) => s.stat_type?.toLowerCase() === 'int').reduce((acc, s) => acc + (s.value || 1), 0),
    flags_pulled: playerStats.filter((s) => s.stat_type?.toLowerCase() === 'flag pulled').reduce((acc, s) => acc + (s.value || 1), 0),
    sacks: playerStats.filter((s) => s.stat_type?.toLowerCase() === 'sack').reduce((acc, s) => acc + (s.value || 1), 0),
    matches_played: new Set(playerStats.map((s) => s.match_id)).size,
  };
  const STAT_SUMMARY = [
    { key: 'tds', label: 'TDs' },
    { key: 'ints', label: 'INTs' },
    { key: 'flags_pulled', label: 'FP' },
    { key: 'sacks', label: 'Sacks' },
    { key: 'matches_played', label: 'GP' },
  ];

  const renderPlayerItem = ({ item }) => {
    const pillStatus = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
      : 'Active';
    return (
      <TouchableOpacity onPress={() => handleSelectPlayer(item)} activeOpacity={0.7}>
        <View style={[
          styles.playerCard, CARD_SHADOW,
          selectedPlayer?.id === item.id && { borderWidth: 2, borderColor: theme.colors.primary },
        ]}>
          <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.jerseyNum}>#{item.jersey_number || '00'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
            <Text style={styles.playerMeta}>{item.position || 'Unassigned'} · {item.teams?.name || 'No Team'}</Text>
          </View>
          <StatusPill status={pillStatus} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Player Stats" />

      <Searchbar
        placeholder="Search player name or jersey #…"
        value={query}
        onChangeText={(q) => { setQuery(q); setSelectedPlayer(null); }}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
        iconColor="#AAAAAA"
        placeholderTextColor="#AAAAAA"
        elevation={0}
      />

      {!selectedPlayer ? (
        loadingPlayers ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredPlayers}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayerItem}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.xs }} />}
            contentContainerStyle={{ paddingBottom: SPACING.xl }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="account-search-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No players found</Text>
              </View>
            }
          />
        )
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}>
          {/* Player header */}
          <View style={[styles.playerHeader, CARD_SHADOW]}>
            <TouchableOpacity onPress={() => setSelectedPlayer(null)} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.primary} />
              <Text style={[styles.backText, { color: theme.colors.primary }]}>All Players</Text>
            </TouchableOpacity>
            <Divider style={{ marginVertical: SPACING.sm }} />
            <View style={styles.playerHeaderRow}>
              <View style={[styles.jerseyCircle, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.jerseyCircleNum}>#{selectedPlayer.jersey_number || '00'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedName, { color: theme.colors.onSurface }]}>{selectedPlayer.name}</Text>
                <Text style={styles.selectedMeta}>{selectedPlayer.position || 'Unassigned'} · {selectedPlayer.teams?.name}</Text>
              </View>
              <StatusPill status={selectedPlayer.status ? selectedPlayer.status.charAt(0).toUpperCase() + selectedPlayer.status.slice(1) : 'Active'} />
            </View>

            <View style={styles.summaryRow}>
              {STAT_SUMMARY.map(({ key, label }) => (
                <View key={key} style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{statSummary[key] || 0}</Text>
                  <Text style={styles.summaryLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Match Stat Log ({playerStats.length})
          </Text>

          {loadingStats ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: SPACING.md }} />
          ) : playerStats.length === 0 ? (
            <Text style={styles.emptyText}>No recorded stats for this player</Text>
          ) : (
            playerStats.map((stat) => {
              const readOnly = isStatReadOnly(stat);
              return (
                <View key={stat.id} style={[styles.statRow, CARD_SHADOW]}>
                  <View style={[styles.statTypePill, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.statTypeText}>{stat.stat_type}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.statMatch, { color: theme.colors.onSurface }]}>{stat.matchLabel}</Text>
                    <Text style={styles.statTime}>
                      {new Date(stat.recorded_at).toLocaleString()}{readOnly ? ' · Read-only' : ''}
                    </Text>
                  </View>
                  {!readOnly && (
                    <View style={styles.statActions}>
                      <TouchableOpacity onPress={() => openEdit(stat)} style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}>
                        <MaterialCommunityIcons name="pencil-outline" size={15} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteStat(stat)} style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}>
                        <MaterialCommunityIcons name="close" size={15} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Edit Stat Modal */}
      <Modal visible={!!editStat} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Edit Stat Entry</Text>
              <Divider style={{ marginVertical: SPACING.md }} />
              <Text style={styles.fieldLabel}>Stat Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
                {STAT_TYPES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setEditStatType(s)}
                    style={[styles.pill, { backgroundColor: editStatType === s ? theme.colors.primary : '#F0F0F0' }]}
                  >
                    <Text style={[styles.pillText, { color: editStatType === s ? '#FFFFFF' : '#888888' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                label="Value"
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
              />
              <View style={styles.modalActions}>
                <Button mode="contained" onPress={saveEdit} loading={saving} disabled={saving} buttonColor={theme.colors.primary} textColor="#FFFFFF" style={{ flex: 1 }} contentStyle={{ paddingVertical: 4 }}>Save</Button>
                <Button mode="outlined" onPress={() => setEditStat(null)} style={{ flex: 1 }} textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: SPACING.md, gap: SPACING.md },
  jerseyBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic' },
  playerHeader: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontWeight: '700' },
  playerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  jerseyCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  jerseyCircleNum: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  selectedName: { fontSize: 18, fontWeight: '800' },
  selectedMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: SPACING.sm },
  statRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: SPACING.sm, gap: SPACING.sm, marginBottom: SPACING.xs },
  statTypePill: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 8, minWidth: 72, alignItems: 'center' },
  statTypeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  statMatch: { fontSize: 13, fontWeight: '700' },
  statTime: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  statActions: { flexDirection: 'row', gap: SPACING.xs },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '700' },
  formInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
