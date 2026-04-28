// app/(admin)/players/index.jsx
import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { PLAYERS } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

const POSITIONS = ['All', 'QB', 'WR', 'C', 'Rusher', 'DB'];

export default function AllPlayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() =>
    PLAYERS.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || String(p.jerseyNumber).includes(query);
      const matchesPos = posFilter === 'All' || p.positions.includes(posFilter);
      return matchesQuery && matchesPos;
    }), [query, posFilter]
  );

  const renderPlayer = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(admin)/players/[id]', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.jerseyNum}>#{item.jerseyNumber}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <Text style={styles.playerMeta}>{item.positions.join(' / ')} · {item.teamName}</Text>
          <Text style={styles.orgLabel}>{item.orgName}</Text>
        </View>
        <View style={styles.cardRight}>
          <StatusPill status={item.status} />
          <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" style={{ marginTop: 6 }} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>All Players</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.countBadgeText}>{PLAYERS.length}</Text>
        </View>
      </View>

      <Searchbar
        placeholder="Search name or jersey #…"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
        iconColor="#AAAAAA"
        placeholderTextColor="#AAAAAA"
        elevation={0}
      />

      {/* Position filter */}
      <View style={styles.filterRow}>
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            onPress={() => setPosFilter(pos)}
            style={[
              styles.filterPill,
              posFilter === pos
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE' },
            ]}
          >
            <Text style={[styles.filterPillText, { color: posFilter === pos ? '#FFFFFF' : '#888888' }]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-off-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800' },
  countBadge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#EEEEEE' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  list: { paddingBottom: SPACING.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  jerseyBadge: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  cardBody: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  orgLabel: { fontSize: 11, color: '#CCCCCC', marginTop: 1 },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15, color: '#AAAAAA' },
});