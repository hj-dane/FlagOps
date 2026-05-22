import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { playersAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const POSITIONS = ['All', 'QB', 'WR', 'C', 'Rusher', 'DB'];

export default function AllPlayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [players, setPlayers] = useAtom(playersAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [posFilter, setPosFilter] = useState('All');

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('id, name, jersey_number, position, status, team_id, teams(name, organizations(name))')
      .order('name', { ascending: true });
    if (!error) setPlayers(data || []);
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const filtered = useMemo(() =>
    players.filter((p) => {
      const matchesQuery =
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        String(p.jersey_number || '').includes(query);
      const matchesPos = posFilter === 'All' || p.position === posFilter;
      return matchesQuery && matchesPos;
    }), [players, query, posFilter]
  );

  const handleDelete = (player) => {
    Alert.alert(
      'Delete Player',
      `Permanently delete ${player.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const { error } = await supabase.from('players').delete().eq('id', player.id);
            if (!error) {
              setPlayers((prev) => prev.filter((p) => p.id !== player.id));
            } else {
              Alert.alert('Error', 'Could not delete player.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="All Players" />

      <Searchbar
        placeholder="Search name or jersey #…"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface }}
        elevation={0}
      />

      <View style={styles.filterRow}>
        {POSITIONS.map((pos) => (
          <Chip
            key={pos}
            selected={posFilter === pos}
            onPress={() => setPosFilter(pos)}
            style={[styles.chip, posFilter === pos && { backgroundColor: theme.colors.primary }]}
            textStyle={[styles.chipText, posFilter === pos && { color: '#FFF' }]}
            compact
          >
            {pos}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const pillStatus = item.status
              ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
              : 'Active';
            return (
              <View style={[styles.card, CARD_SHADOW]}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => router.push({ pathname: '/(admin)/players/[id]', params: { id: item.id } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.jerseyNum}>#{item.jersey_number ?? '—'}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
                    <Text style={styles.playerMeta}>
                      {item.position || 'Unassigned'} · {item.teams?.name || '—'}
                    </Text>
                    {item.teams?.organizations?.name && (
                      <Text style={styles.orgLabel}>{item.teams.organizations.name}</Text>
                    )}
                  </View>
                  <StatusPill status={pillStatus} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPlayers(); }} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>{query || posFilter !== 'All' ? 'No players match' : 'No players found'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  searchbar: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#EEEEEE' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  chip: { borderRadius: 20, backgroundColor: '#F0F0F0' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#888' },
  list: { paddingBottom: SPACING.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  jerseyBadge: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jerseyNum: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  cardBody: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  orgLabel: { fontSize: 11, color: '#CCCCCC', marginTop: 1 },
  deleteBtn: { padding: SPACING.md, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15, color: '#AAAAAA' },
});
