import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Text, Searchbar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { teamsAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

export default function AllTeamsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [teams, setTeams] = useAtom(teamsAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, jersey_color, status, player_count, organization_id, organizations(name)')
        .order('name', { ascending: true });
      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('fetchTeams error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const filtered = useMemo(() =>
    teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [teams, query]
  );

  const renderTeam = ({ item }) => {
    const statusLabel = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
      : 'Active';
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(admin)/teams/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.card, CARD_SHADOW]}>
          <View style={[styles.swatch, { backgroundColor: item.jersey_color || '#CCCCCC' }]} />
          <View style={styles.cardBody}>
            <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>{item.name}</Text>
            <Text style={styles.orgName}>{item.organizations?.name || '—'}</Text>
            <Text style={styles.playerCount}>{item.player_count ?? 0} players</Text>
          </View>
          <View style={styles.cardRight}>
            <StatusPill status={statusLabel} />
            <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" style={{ marginTop: 6 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="All Teams" />

      <Searchbar
        placeholder="Search teams..."
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
          renderItem={renderTeam}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeams(); }} colors={[theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>{query ? 'No teams match your search' : 'No teams found'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
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
