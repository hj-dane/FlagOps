// app/(admin)/teams/index.jsx
import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { TEAMS } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

const JERSEY_COLORS = {
  Red: '#EF5350', Blue: '#42A5F5', Green: '#66BB6A',
  Black: '#616161', Gold: '#FFB300', White: '#EEEEEE', Teal: '#26C6DA',
};

export default function AllTeamsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(
    () => TEAMS.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.orgName.toLowerCase().includes(query.toLowerCase())
    ), [query]
  );

  const renderTeam = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(admin)/teams/[id]', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.swatch, { backgroundColor: JERSEY_COLORS[item.jerseyColor] ?? '#CCCCCC' }]} />
        <View style={styles.cardBody}>
          <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <Text style={styles.orgName}>{item.orgName}</Text>
          <Text style={styles.playerCount}>{item.playerCount} players</Text>
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
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>All Teams</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.countBadgeText}>{TEAMS.length}</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="shield-off-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No teams found</Text>
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
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  list: { paddingBottom: SPACING.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  swatch: { width: 6, height: 52, borderRadius: 3 },
  cardBody: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: '700' },
  orgName: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  playerCount: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15, color: '#AAAAAA' },
});