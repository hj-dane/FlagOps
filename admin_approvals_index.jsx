// app/(admin)/approvals/index.jsx
import React, { Suspense } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import {
  approvalsAtom,
  filteredApprovalsAtom,
  approvalQueryAtom,
  approvalFilterAtom,
  pendingCountAtom,
} from '../../../store/atoms';
import { SPACING, CARD_SHADOW } from '../../../theme';

const FILTERS = ['All', 'team', 'player', 'tournament'];

const ENTITY_ICONS = {
  team: 'shield-outline',
  player: 'account-outline',
  tournament: 'trophy-outline',
};

// ── Inner list (inside Suspense) ─────────────────────────────────────────────
function ApprovalList() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery]   = useAtom(approvalQueryAtom);
  const [filter, setFilter] = useAtom(approvalFilterAtom);
  const filtered            = useAtomValue(filteredApprovalsAtom);
  const pendingCount        = useAtomValue(pendingCountAtom);

  // Pull-to-refresh: re-trigger the async atom
  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = useAtomCallback(
    React.useCallback((get, set) => {
      set(approvalsAtom); // atomWithRefresh — calling set() triggers a refetch
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(admin)/approvals/[id]', params: { id: item.id } })
      }
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons
            name={ENTITY_ICONS[item.entity_type] ?? 'file-outline'}
            size={22}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.entityName, { color: theme.colors.onSurface }]}>
            {item.entity_name}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
            {item.change_type === 'create' ? 'New' : 'Edit'}{' '}
            {item.entity_type?.charAt(0).toUpperCase() + item.entity_type?.slice(1)} · {item.org_name}
          </Text>
          <Text style={[styles.submittedBy, { color: theme.colors.onSurfaceVariant }]}>
            {item.organizer_name} · {new Date(item.created_at).toLocaleDateString()}
          </Text>
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
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Approvals</Text>
        {pendingCount > 0 && (
          <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.countBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      <Searchbar
        placeholder="Search by entity, org, or organizer…"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
        iconColor="#AAAAAA"
        placeholderTextColor="#AAAAAA"
        elevation={0}
      />

      {/* Type filter */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterPill,
              filter === f
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE' },
            ]}
          >
            <Text style={[styles.filterPillText, { color: filter === f ? '#FFFFFF' : '#888888' }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
            <MaterialCommunityIcons name="check-all" size={48} color="#CCCCCC" />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No pending approvals
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ── Screen (wraps list in Suspense) ──────────────────────────────────────────
export default function ApprovalQueueScreen() {
  const theme = useTheme();
  return (
    <Suspense
      fallback={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      }
    >
      <ApprovalList />
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
  list: { paddingBottom: SPACING.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  iconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  entityName: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  submittedBy: { fontSize: 11, marginTop: 1 },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15 },
});
