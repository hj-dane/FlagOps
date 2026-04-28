// app/(admin)/players/index.jsx
import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { PLAYERS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

const POSITIONS = ['All', 'QB', 'WR', 'C', 'Rusher', 'DB'];

export default function AllPlayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return PLAYERS.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        String(p.jerseyNumber).includes(query);
      const matchesPos =
        posFilter === 'All' || p.positions.includes(posFilter);
      return matchesQuery && matchesPos;
    });
  }, [query, posFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderPlayer = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(admin)/players/[id]', params: { id: item.id } })
      }
      activeOpacity={0.75}
    >
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.jerseyBadge}>
          <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>#{item.jerseyNumber}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.playerMeta, { color: theme.colors.onSurfaceVariant }]}>
            {item.positions.join(' / ')} · {item.teamName}
          </Text>
          <Text style={[styles.orgLabel, { color: theme.colors.onSurfaceVariant }]}>
            {item.orgName}
          </Text>
        </View>
        <StatusPill status={item.status} />
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>All Players</Text>
        <Text style={[styles.countBadge, { color: theme.colors.primary }]}>{PLAYERS.length}</Text>
      </View>

      <Searchbar
        placeholder="Search name or jersey #…"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
        inputStyle={{ color: theme.colors.onSurface }}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      {/* Position filter pills */}
      <View style={styles.filterRow}>
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            onPress={() => setPosFilter(pos)}
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  posFilter === pos ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: posFilter === pos ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
              ]}
            >
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No players found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { fontSize: 18, fontWeight: '700' },
  searchbar: { marginBottom: SPACING.md, borderRadius: 10, elevation: 0 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: 20,
  },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  list: { paddingBottom: SPACING.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#1C2437',
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
  cardBody: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerMeta: { fontSize: 12, marginTop: 2 },
  orgLabel: { fontSize: 11, marginTop: 1 },
  empty: { alignItems: 'center', paddingTop: SPACING.xl * 2 },
});