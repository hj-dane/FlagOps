// app/(organizer)/teams/index.jsx
import React, { Suspense } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme, FAB, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { teamsAtom, filteredTeamsAtom, teamQueryAtom } from '../../../store/atoms';
import { SPACING, CARD_SHADOW } from '../../../theme';

// ── List (inside Suspense) ────────────────────────────────────────────────────
function TeamList() {
  const theme  = useTheme();
  const router = useRouter();

  const [query, setQuery] = useAtom(teamQueryAtom);
  const filtered          = useAtomValue(filteredTeamsAtom);
  const allTeams          = useAtomValue(teamsAtom);

  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = useAtomCallback(
    React.useCallback((get, set) => { set(teamsAtom); }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };

  const renderTeam = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(organizer)/teams/[id]', params: { id: item.id } })
      }
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.swatch, { backgroundColor: item.jersey_color ?? '#CCCCCC' }]} />
        <View style={styles.cardBody}>
          <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.orgName, { color: theme.colors.onSurfaceVariant }]}>{item.organization_name}</Text>
          <View style={styles.playerCountRow}>
            <MaterialCommunityIcons name="account-group-outline" size={13} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.playerCount, { color: theme.colors.onSurfaceVariant }]}>
              {item.player_count} players
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <StatusPill status={item.status?.charAt(0).toUpperCase() + item.status?.slice(1)} />
          <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" style={{ marginTop: 6 }} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>My Teams</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.countBadgeText}>{allTeams?.length ?? 0}</Text>
        </View>
      </View>

      <Searchbar
        placeholder="Search teams or org…"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
        iconColor="#AAAAAA"
        placeholderTextColor="#AAAAAA"
        elevation={0}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
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
            <MaterialCommunityIcons name="shield-off-outline" size={48} color="#CCCCCC" />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No teams found</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => {
          // TODO: router.push('/(organizer)/teams/new') — will submit approval request
        }}
      />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OrganizerTeamsScreen() {
  const theme = useTheme();
  return (
    <Suspense
      fallback={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      }
    >
      <TeamList />
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
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  list: { paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  swatch: { width: 6, height: 52, borderRadius: 3, flexShrink: 0 },
  cardBody: { flex: 1, gap: 2 },
  teamName: { fontSize: 15, fontWeight: '700' },
  orgName: { fontSize: 12 },
  playerCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  playerCount: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15 },
  fab: { position: 'absolute', right: 0, bottom: SPACING.lg },
});
