// app/(organizer)/tournaments/index.jsx
import React, { Suspense } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme, FAB, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import {
  tournamentsAtom,
  filteredTournamentsAtom,
  tournamentQueryAtom,
  tournamentStatusFilterAtom,
} from '../../../store/atoms';
import { SPACING, CARD_SHADOW } from '../../../theme';

const STATUS_FILTERS = ['All', 'active', 'pending', 'completed'];

// ── List (inside Suspense) ────────────────────────────────────────────────────
function TournamentList() {
  const theme  = useTheme();
  const router = useRouter();

  const [query, setQuery]   = useAtom(tournamentQueryAtom);
  const [status, setStatus] = useAtom(tournamentStatusFilterAtom);
  const filtered            = useAtomValue(filteredTournamentsAtom);

  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = useAtomCallback(
    React.useCallback((get, set) => { set(tournamentsAtom); }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };

  const renderTournament = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(organizer)/tournaments/[id]', params: { id: item.id } })
      }
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={styles.cardTop}>
          <View style={[styles.trophyWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="trophy-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tournamentName, { color: theme.colors.onSurface }]}>{item.name}</Text>
            <Text style={[styles.tournamentMeta, { color: theme.colors.onSurfaceVariant }]}>
              {item.type} · {item.level}
            </Text>
          </View>
          <StatusPill status={item.status?.charAt(0).toUpperCase() + item.status?.slice(1)} />
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailChip}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>{item.location}</Text>
          </View>
          <View style={styles.detailChip}>
            <MaterialCommunityIcons name="calendar-range" size={13} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {new Date(item.start_date).toLocaleDateString()} – {new Date(item.end_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Tournaments</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.countBadgeText}>{filtered.length}</Text>
        </View>
      </View>

      <Searchbar
        placeholder="Search name or location…"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
        iconColor="#AAAAAA"
        placeholderTextColor="#AAAAAA"
        elevation={0}
      />

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setStatus(f)}
            style={[
              styles.filterPill,
              status === f
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE' },
            ]}
          >
            <Text style={[styles.filterPillText, { color: status === f ? '#FFFFFF' : '#888888' }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTournament}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="trophy-broken" size={48} color="#CCCCCC" />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No tournaments found</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => {
          // TODO: router.push('/(organizer)/tournaments/new')
        }}
      />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TournamentsScreen() {
  const theme = useTheme();
  return (
    <Suspense
      fallback={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      }
    >
      <TournamentList />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800' },
  countBadge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#EEEEEE' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  list: { paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  trophyWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tournamentName: { fontSize: 15, fontWeight: '700' },
  tournamentMeta: { fontSize: 12, marginTop: 2 },
  cardDetails: { gap: 4, paddingLeft: 46 + SPACING.md },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12 },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15 },
  fab: { position: 'absolute', right: 0, bottom: SPACING.lg },
});
