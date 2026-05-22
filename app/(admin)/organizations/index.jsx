// app/(admin)/organizations/index.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { organizationsAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

export default function AllOrganizationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [orgs, setOrgs] = useAtom(organizationsAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const fetchOrgs = useCallback(async () => {
    try {
      // Read stored counts directly from organizations table
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, active_teams, active_players, organizer_count, created_at')
        .order('name', { ascending: true });

      if (error) throw error;
      console.log('Org data sample:', JSON.stringify(data?.[0]));
      setOrgs(data || []);
    } catch (err) {
      console.error('fetchOrgs error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchOrgs();
  }, [fetchOrgs]);

  const filtered = useMemo(
    () => orgs.filter((o) => o.name?.toLowerCase().includes(query.toLowerCase())),
    [orgs, query]
  );

  const renderOrg = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(admin)/organizations/[id]', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={[styles.orgAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.orgInitial}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.orgName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          <View style={styles.metaRow}>
            <MetaStat label="Teams" value={item.active_teams ?? item.team_count ?? 0} theme={theme} />
            <MetaStat label="Players" value={item.active_players ?? item.player_count ?? 0} theme={theme} />
            <MetaStat label="Organizers" value={item.organizer_count ?? 0} theme={theme} />
          </View>
        </View>
        <View style={styles.cardRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Organizations" />

      <Searchbar
        placeholder="Search organizations..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface }}
        elevation={0}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderOrg}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrgs(); }}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="office-building-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>{query ? 'No organizations match' : 'No organizations found'}</Text>
            </View>
          }
        />
      )}
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
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  list: { paddingBottom: SPACING.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  orgAvatar: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  orgInitial: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  cardBody: { flex: 1 },
  orgName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: SPACING.md },
  metaStat: { alignItems: 'center' },
  metaValue: { fontSize: 15, fontWeight: '800' },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#AAAAAA', textTransform: 'uppercase' },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 14, color: '#AAAAAA', fontStyle: 'italic' },
});
