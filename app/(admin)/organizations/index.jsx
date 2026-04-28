// app/(admin)/organizations/index.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  Surface,
  useTheme,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { ORGANIZATIONS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

export default function AllOrganizationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(
    () =>
      ORGANIZATIONS.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: re-fetch from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderOrg = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(admin)/organizations/[id]', params: { id: item.id } })
      }
      activeOpacity={0.75}
    >
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.cardHeader}>
          <View style={styles.orgIcon}>
            <Text style={[styles.orgInitial, { color: theme.colors.primary }]}>
              {item.name[0]}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.orgName, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <MetaStat label="Teams" value={item.teamCount} theme={theme} />
              <MetaStat label="Players" value={item.playerCount} theme={theme} />
              <MetaStat label="Organizers" value={item.organizerCount} theme={theme} />
            </View>
          </View>
          <StatusPill status={item.status} />
        </View>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>
          Organizations
        </Text>
        <Text style={[styles.countBadge, { color: theme.colors.primary }]}>
          {ORGANIZATIONS.length}
        </Text>
      </View>

      <Searchbar
        placeholder="Search organizations…"
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
        renderItem={renderOrg}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No organizations found
            </Text>
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
      <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchbar: {
    marginBottom: SPACING.md,
    borderRadius: 10,
    elevation: 0,
  },
  list: { paddingBottom: SPACING.xl },
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1C2437',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00E67618',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00E67644',
  },
  orgInitial: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardBody: { flex: 1 },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaStat: { alignItems: 'center' },
  metaValue: { fontSize: 14, fontWeight: '800' },
  metaLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 15 },
});