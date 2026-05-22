// app/(admin)/approvals/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const FILTERS = ['All', 'Tournaments', 'Teams', 'Players', 'Matches'];

const ENTITY_ICON = {
  tournament: 'trophy-outline',
  team: 'account-group-outline',
  player: 'account-outline',
  match: 'whistle-outline',
};

const CHANGE_COLORS = {
  create: '#4CAF50',
  edit: '#FF9800',
  delete: '#F44336',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ApprovalQueueScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchRequests = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*, profiles(name), organizations(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);


  const filtered = requests.filter((r) => {
    if (filter === 'All') return true;
    return r.entity_type?.toLowerCase() === filter.slice(0, -1).toLowerCase(); // strip trailing 's'
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(admin)/approvals/[id]', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons
            name={ENTITY_ICON[item.entity_type] || 'file-outline'}
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.entityName, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {item.entity_name || item.entity_type}
            </Text>
            <View style={[styles.changeTypePill, { backgroundColor: CHANGE_COLORS[item.change_type] + '22' }]}>
              <Text style={[styles.changeTypeText, { color: CHANGE_COLORS[item.change_type] }]}>
                {item.change_type?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.metaText}>
            {item.organizations?.name || '—'} · {item.profiles?.name || 'Unknown'} · {timeAgo(item.created_at)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>Pending</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Approval Queue" />

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && { backgroundColor: theme.colors.primary }]}
            textStyle={[styles.chipText, filter === f && { color: '#FFFFFF' }]}
            compact
          >
            {f}
          </Chip>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRequests} colors={[theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="check-circle-outline" size={52} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyText}>No pending {filter === 'All' ? '' : filter.toLowerCase()} requests</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800', flex: 1 },
  countBadge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  filterRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md, flexWrap: 'wrap' },
  chip: { borderRadius: 20, backgroundColor: '#F0F0F0' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#888' },
  list: { paddingBottom: 80 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  entityName: { fontSize: 14, fontWeight: '700', flex: 1 },
  changeTypePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  changeTypeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  metaText: { fontSize: 11, color: '#AAAAAA' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  pendingPill: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pendingPillText: { fontSize: 10, fontWeight: '800', color: '#E65100' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#CCCCCC' },
  emptyText: { fontSize: 13, color: '#AAAAAA' },
});
