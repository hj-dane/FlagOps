// app/(organizer)/stats/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Alert,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, useTheme, Searchbar, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom } from '../../../store/globalStore';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';

const STAT_TYPES = ['TD', 'INT', 'Flag Pulled', 'Sack', 'Completion', 'Rush'];

function isStatReadOnly(stat) {
  const matchStatus = stat.matches?.status || stat.matchStatus;
  if (matchStatus !== 'Completed') return false;
  
  const ts = stat.timestamp || stat.created_at;
  if (!ts) return false;
  
  // Enforce 24-hour read-only window post completion
  return new Date() - new Date(ts) > 24 * 60 * 60 * 1000;
}

export default function PlayerStatsScreen() {
  const theme = useTheme();
  const profile = useAtomValue(userProfileAtom);
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);

  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerStats, setSelectedPlayerStats] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  
  const [editStat, setEditStat] = useState(null);
  const [editStatType, setEditStatType] = useState('');
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchPlayers();
    }
  }, [profile]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          name,
          number,
          position,
          status,
          tds,
          ints,
          flags_pulled,
          sacks,
          teams!inner(name, organization_id)
        `)
        .eq('teams.organization_id', profile.organization_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);

      // Refresh the currently selected player data to keep career summaries live
      if (selectedPlayer) {
        const updatedSelected = data.find(p => p.id === selectedPlayer.id);
        if (updatedSelected) setSelectedPlayer(updatedSelected);
      }
    } catch (err) {
      console.error('Error fetching player lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStatsLog = async (playerId) => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase
        .from('player_match_stats')
        .select(`
          id,
          player_id,
          match_id,
          stat_type,
          value,
          timestamp,
          created_at,
          matches (
            status,
            home_team,
            away_team
          )
        `)
        .eq('player_id', playerId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setSelectedPlayerStats(data || []);
    } catch (err) {
      console.error('Error pulling down player metric log:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    fetchPlayerStatsLog(player.id);
  };

  const filteredPlayers = useMemo(() =>
    players.filter((p) =>
      p.name?.toLowerCase().includes(query.toLowerCase()) ||
      String(p.number || '').includes(query)
    ), [players, query]
  );

  const openEdit = (stat) => { 
    setEditStat(stat); 
    setEditStatType(stat.stat_type || stat.statType); 
    setEditValue(String(stat.value)); 
  };

  const saveEdit = async () => {
    if (!editValue || isNaN(Number(editValue))) {
      Alert.alert('Invalid Entry', 'Please supply a numerical quantity value.');
      return;
    }

    try {
      const { error } = await supabase
        .from('player_match_stats')
        .update({ 
          stat_type: editStatType, 
          value: Number(editValue) 
        })
        .eq('id', editStat.id);

      if (error) throw error;
      
      setEditStat(null);
      fetchPlayerStatsLog(selectedPlayer.id);
      fetchPlayers(); // Recalculate aggregates on server context
    } catch (err) {
      console.error('Error saving updated statistic structure:', err);
      Alert.alert('Error', 'Could not apply stat modification updates.');
    }
  };

  const deleteStat = (stat) => {
    const currentType = stat.stat_type || stat.statType;
    Alert.alert('Remove Entry', `Remove ${currentType} entry for ${selectedPlayer.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive', 
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('player_match_stats')
              .delete()
              .eq('id', stat.id);

            if (error) throw error;
            fetchPlayerStatsLog(selectedPlayer.id);
            fetchPlayers();
          } catch (err) {
            console.error('Error deleting specific statistic row:', err);
            Alert.alert('Error', 'Failed to remove target log entry.');
          }
        } 
      },
    ]);
  };

  const STAT_SUMMARY = [
    { key: 'tds', label: 'TDs' },
    { key: 'ints', label: 'INTs' },
    { key: 'flags_pulled', label: 'FP' },
    { key: 'sacks', label: 'Sacks' },
  ];

  const renderPlayerItem = ({ item }) => {
    const pillStatus = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
      : 'Pending';

    return (
      <TouchableOpacity onPress={() => handleSelectPlayer(item)} activeOpacity={0.7}>
        <View style={[
          styles.playerCard,
          CARD_SHADOW,
          selectedPlayer?.id === item.id && { borderWidth: 2, borderColor: theme.colors.primary },
        ]}>
          <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.jerseyNum}>#{item.number || '00'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
            <Text style={styles.playerMeta}>
              {item.position || 'Unassigned'} · {item.teams?.name || 'No Team Assigned'}
            </Text>
          </View>
          <StatusPill status={pillStatus} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && players.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Player Stats</Text>

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
        <FlatList
          data={filteredPlayers}
          keyExtractor={(item) => item.id.toString()}
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
                <Text style={styles.jerseyCircleNum}>#{selectedPlayer.number || '00'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedName, { color: theme.colors.onSurface }]}>{selectedPlayer.name}</Text>
                <Text style={styles.selectedMeta}>
                  {selectedPlayer.position || 'Unassigned'} · {selectedPlayer.teams?.name || 'No Team Assigned'}
                </Text>
              </View>
              <StatusPill 
                status={selectedPlayer.status ? (selectedPlayer.status.charAt(0).toUpperCase() + selectedPlayer.status.slice(1).toLowerCase()) : 'Pending'} 
              />
            </View>

            {/* Career stat summary aggregates */}
            <View style={styles.summaryRow}>
              {STAT_SUMMARY.map(({ key, label }) => (
                <View key={key} style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                    {selectedPlayer[key] ?? 0}
                  </Text>
                  <Text style={styles.summaryLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stat log header title section */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Match Stat Log ({selectedPlayerStats.length})
          </Text>

          {statsLoading ? (
            <ActivityIndicator color={theme.colors.primary} size="small" style={{ marginVertical: 20 }} />
          ) : selectedPlayerStats.length === 0 ? (
            <Text style={styles.emptyText}>No recorded stats for this player</Text>
          ) : (
            selectedPlayerStats.map((stat) => {
              const readOnly = isStatReadOnly(stat);
              const matchInfo = stat.matches;
              const matchDisplay = matchInfo 
                ? `${matchInfo.home_team || 'Home'} vs ${matchInfo.away_team || 'Away'}`
                : `Match ID: ${stat.match_id || stat.matchId}`;

              return (
                <View key={stat.id} style={[styles.statRow, CARD_SHADOW]}>
                  <View style={[styles.statTypePill, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.statTypeText}>{stat.stat_type || stat.statType}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.statMatch, { color: theme.colors.onSurface }]}>
                      {matchDisplay} (x{stat.value})
                    </Text>
                    <Text style={styles.statTime}>
                      {new Date(stat.timestamp || stat.created_at).toLocaleString()}{readOnly ? ' · Read-only' : ''}
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

      {/* Edit Stat Modal Sheet Container */}
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
                <Button mode="contained" onPress={saveEdit} buttonColor={theme.colors.primary} textColor="#FFFFFF" style={{ flex: 1 }} contentStyle={{ paddingVertical: 4 }}>Save</Button>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: SPACING.md, gap: SPACING.md },
  jerseyBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },
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