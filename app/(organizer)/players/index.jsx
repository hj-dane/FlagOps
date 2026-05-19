// app/(organizer)/players/index.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom } from '../../../store/globalStore';
import { APP_THEME, SPACING } from '../../../theme';
import StatusPill from '../../../components/StatusPill';

export default function PlayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchPlayers();
    }
  }, [profile]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          name,
          number,
          position,
          status,
          teams!inner(name, organization_id)
        `)
        .eq('teams.organization_id', profile.organization_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players roster:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live query filter context matching multi-keyword structures
  const filteredPlayers = players.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.position?.toLowerCase().includes(query) ||
      p.teams?.name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players Roster</Text>

      {/* Input Search Block */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, position, or team..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888888"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#AAAAAA" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching players found' : 'No registered players inside your organization.'}
          </Text>
        }
        renderItem={({ item }) => {
          // Normalize status field strings for precise StatusPill lookup dictionary matches
          const pillStatus = item.status
            ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
            : 'Pending';

          return (
            <TouchableOpacity
              style={styles.playerCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/players/${item.id}`)}
            >
              <View style={styles.playerNumberBox}>
                <Text style={styles.playerNumberText}>#{item.number || '00'}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerSubtitle}>
                  {item.position || 'Unassigned'} • {item.teams?.name || 'No Team Assigned'}
                </Text>
              </View>
              <StatusPill status={pillStatus} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    paddingHorizontal: 16,
    paddingTop: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: APP_THEME.colors.secondary,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.surfaceVariant,
    borderRadius: APP_THEME.roundness,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
    paddingHorizontal: 12,
    marginBottom: SPACING.md,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: APP_THEME.colors.onSurface,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 32,
    gap: 10,
  },
  playerCard: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.roundness,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
  },
  playerNumberBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
  },
  playerNumberText: {
    color: APP_THEME.colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: APP_THEME.colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },
  playerSubtitle: {
    color: APP_THEME.colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: '#AAAAAA',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
});