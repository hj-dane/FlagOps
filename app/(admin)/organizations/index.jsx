// app/(admin)/organizations/index.jsx
import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { ORGANIZATIONS } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

export default function AllOrganizationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(
    () => ORGANIZATIONS.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderOrg = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(admin)/organizations/[id]', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.orgAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.orgInitial}>{item.name[0]}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.orgName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <View style={styles.metaRow}>
            <MetaStat label="Teams" value={item.teamCount} theme={theme} />
            <MetaStat label="Players" value={item.playerCount} theme={theme} />
            <MetaStat label="Organizers" value={item.organizerCount} theme={theme} />
          </View>
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
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Organizations</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.countBadgeText}>{ORGANIZATIONS.length}</Text>
        </View>
      </View>

      <Searchbar
        placeholder="Search organizations…"
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
        renderItem={renderOrg}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="office-building-off-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No organizations found</Text>
          </View>
        }
      />
    </View>
  );
}

function MetaStat({ label, value, theme }) {
  return (
    <View style={styles.metaStat}>
      <Text style={[styles.metaValue, { color: theme.colors.primary }]}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800' },
  countBadge: {
    minWidth: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  searchbar: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE',
  },
  list: { paddingBottom: SPACING.xl },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: SPACING.md, gap: SPACING.md,
  },
  orgAvatar: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  orgInitial: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  cardBody: { flex: 1 },
  orgName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: SPACING.md },
  metaStat: { alignItems: 'center' },
  metaValue: { fontSize: 15, fontWeight: '800' },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#AAAAAA', textTransform: 'uppercase' },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15, color: '#AAAAAA' },
});