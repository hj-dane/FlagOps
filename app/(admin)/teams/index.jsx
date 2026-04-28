// app/(admin)/teams/index.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Searchbar, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { TEAMS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

export default function AllTeamsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(
    () =>
      TEAMS.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.orgName.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTeam = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(admin)/teams/[id]', params: { id: item.id } })
      }
      activeOpacity={0.75}
    >
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={[styles.colorSwatch, { backgroundColor: getJerseyColor(item.jerseyColor) }]} />
        <View style={styles.cardBody}>
          <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.orgName, { color: theme.colors.onSurfaceVariant }]}>
            {item.orgName}
          </Text>
          <Text style={[styles.playerCount, { color: theme.colors.onSurfaceVariant }]}>
            {item.playerCount} players
          </Text>
        </View>
        <StatusPill status={item.status} />
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>All Teams</Text>
        <Text style={[styles.countBadge, { color: theme.colors.primary }]}>{TEAMS.length}</Text>
      </View>

      <Searchbar
        placeholder="Search teams or org…"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
        inputStyle={{ color: theme.colors.onSurface }}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No teams found</Text>
          </View>
        }
      />
    </View>
  );
}

function getJerseyColor(color) {
  const map = {
    Red: '#EF5350', Blue: '#42A5F5', Green: '#00E676',
    Black: '#424242', Gold: '#FFB300', White: '#ECEFF1',
  };
  return map[color] ?? '#8B95A8';
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { fontSize: 18, fontWeight: '700' },
  searchbar: { marginBottom: SPACING.md, borderRadius: 10, elevation: 0 },
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
  colorSwatch: { width: 6, height: 48, borderRadius: 3 },
  cardBody: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: '700' },
  orgName: { fontSize: 12, marginTop: 2 },
  playerCount: { fontSize: 12, marginTop: 1 },
  empty: { alignItems: 'center', paddingTop: SPACING.xl * 2 },
});