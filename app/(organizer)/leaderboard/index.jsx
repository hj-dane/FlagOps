import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Menu, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom } from '../../../store/globalStore';
import { SPACING, CARD_SHADOW } from '../../../theme';

const VIEW_TABS = ['Team Rankings', 'Player (Overall)', 'Player by Position'];
const POSITIONS = ['All', 'QB', 'WR', 'RB', 'C', 'Rusher', 'DB', 'LB', 'DL', 'OL', 'Safety'];
const MEDAL = ['🥇', '🥈', '🥉'];

// Moved outside to prevent full remounts and component recreation cycles on state changes
const SortableHeader = ({ label, colKey, sortCol, setSortCol, theme }) => {
  const isActive = sortCol === colKey;
  return (
    <TouchableOpacity 
      onPress={() => setSortCol(colKey)} 
      style={styles.sortHeaderTouch}
    >
      <Text style={[styles.colHeaderText, { color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
        {label}{isActive ? ' 🔽' : ''}
      </Text>
    </TouchableOpacity>
  );
};

export default function OrgLeaderboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  // Core component UI states
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(VIEW_TABS[0]);
  const [posFilter, setPosFilter] = useState('All');
  const [sortCol, setSortCol] = useState('tds');
  const [refreshing, setRefreshing] = useState(false);

  // Supabase live storage states
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [teamRankings, setTeamRankings] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Phase 1: Fetch all tournaments tied to this organization
  useEffect(() => {
    if (profile?.organization_id) {
      fetchTournaments();
    }
  }, [profile]);

  // Phase 2: Fetch rankings and stats whenever the tournament selection changes
  useEffect(() => {
    if (selectedTournament?.id) {
      fetchLeaderboardData(selectedTournament.id);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    setLoadingTournaments(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setTournaments(data);
        setSelectedTournament(data[0]); // Set the most recent tournament as default
      }
    } catch (err) {
      console.error('Error fetching tournaments for leaderboard:', err);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const fetchLeaderboardData = async (tournamentId) => {
    setLoadingData(true);
    try {
      // 1. Fetch team data and scope cleanly to the active tournamentId
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, wins, losses, points_diff')
        .eq('organization_id', profile.organization_id)
        .eq('tournament_id', tournamentId); // FIXED: Scoped to selected tournament

      if (teamsError) throw teamsError;

      // Sort teams by wins descending, then by point differential descending
      const formattedTeams = (teamsData || [])
        .map((t) => ({
          id: t.id,
          teamName: t.name,
          wins: t.wins || 0,
          losses: t.losses || 0,
          pointsDiff: t.points_diff || 0,
        }))
        .sort((a, b) => b.wins - a.wins || b.pointsDiff - a.pointsDiff)
        .map((t, idx) => ({ ...t, rank: idx + 1 }));

      setTeamRankings(formattedTeams);

      // 2. Fetch player stats scoped through the matching tournament boundary
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          name,
          position,
          tds,
          ints,
          flags_pulled,
          sacks,
          teams!inner(name, organization_id, tournament_id)
        `)
        .eq('teams.organization_id', profile.organization_id)
        .eq('teams.tournament_id', tournamentId); // FIXED: Scoped to selected tournament

      if (playersError) throw playersError;

      const formattedPlayers = (playersData || []).map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position || 'Unassigned',
        team: p.teams?.name || 'No Team',
        tds: p.tds || 0,
        ints: p.ints || 0,
        flagsPulled: p.flags_pulled || 0,
        sacks: p.sacks || 0,
      }));

      setPlayerStats(formattedPlayers);
    } catch (err) {
      console.error('Error hydrating leaderboard data pools:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedTournament?.id) {
      await fetchLeaderboardData(selectedTournament.id);
    } else if (profile?.organization_id) {
      await fetchTournaments();
    }
    setRefreshing(false);
  }, [selectedTournament, profile]);

  // Client-side memoized sorting handlers matching your original interactions
  const playerOverallData = useMemo(() => {
    return [...playerStats]
      .sort((a, b) => b[sortCol] - a[sortCol])
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [playerStats, sortCol]);

  const playerByPositionData = useMemo(() => {
    const filtered = posFilter === 'All'
      ? playerStats
      : playerStats.filter((p) => p.position.toUpperCase() === posFilter.toUpperCase());
    
    // Sort position tab by Touchdowns default to determine rank position
    return [...filtered]
      .sort((a, b) => b.tds - a.tds || b.flagsPulled - a.flagsPulled)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [playerStats, posFilter]);

  const renderTeamRow = (entry, index) => (
    <View key={entry.id || entry.teamName} style={[styles.tableRow, CARD_SHADOW, index === 0 && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
      <Text style={[styles.colRank, { fontSize: 18 }]}>{MEDAL[index] ?? entry.rank}</Text>
      <View style={styles.colTeam}>
        <Text style={[styles.cellBold, { color: theme.colors.onSurface }]}>{entry.teamName}</Text>
      </View>
      <Text style={[styles.colNum, { color: '#2E7D32', fontWeight: '800' }]}>{entry.wins}</Text>
      <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '700' }]}>{entry.losses}</Text>
      <Text style={[styles.colNum, { color: entry.pointsDiff >= 0 ? '#2E7D32' : theme.colors.primary, fontWeight: '700' }]}>
        {entry.pointsDiff > 0 ? `+${entry.pointsDiff}` : entry.pointsDiff}
      </Text>
    </View>
  );

  const renderPlayerRow = (entry, index) => (
    <View key={`${entry.id}-${index}`} style={[styles.tableRow, CARD_SHADOW, index === 0 && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
      <Text style={[styles.colRank, { fontSize: 18 }]}>{MEDAL[index] ?? entry.rank}</Text>
      <View style={styles.colTeam}>
        <Text style={[styles.cellBold, { color: theme.colors.onSurface }]}>{entry.name}</Text>
        <Text style={[styles.cellSub, { color: theme.colors.onSurfaceVariant }]}>{entry.team}</Text>
      </View>
      <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '800' }]}>{entry.tds}</Text>
      <Text style={[styles.colNum, { color: theme.colors.onSurface }]}>{entry.ints}</Text>
      <Text style={[styles.colNum, { color: theme.colors.onSurface }]}>{entry.flagsPulled}</Text>
      <Text style={[styles.colNum, { color: theme.colors.onSurface }]}>{entry.sacks}</Text>
    </View>
  );

  if (loadingTournaments) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Leaderboard</Text>

      {/* Tournament Picker Menu */}
      {tournaments.length > 0 && selectedTournament ? (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={[styles.tournamentPicker, CARD_SHADOW, { backgroundColor: theme.colors.surface }]}
            >
              <Text style={[styles.tournamentPickerText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {selectedTournament.name}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          }
        >
          {tournaments.map((t) => (
            <Menu.Item 
              key={t.id} 
              onPress={() => { setSelectedTournament(t); setMenuVisible(false); }} 
              title={t.name} 
            />
          ))}
        </Menu>
      ) : (
        <View style={[styles.tournamentPicker, CARD_SHADOW, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No active tournaments found</Text>
        </View>
      )}

      {/* Domain View Navigation Tabs */}
      <View style={{ height: 48, marginBottom: SPACING.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {VIEW_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab, 
                activeTab === tab 
                  ? { backgroundColor: theme.colors.primary } 
                  : { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outlineVariant }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#FFFFFF' : theme.colors.onSurfaceVariant }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingData ? (
        <View style={styles.dataLoaderContainer}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {/* View Segment 1: Team Standings */}
          {activeTab === 'Team Rankings' && (
            <>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
                <Text style={[styles.colTeam, styles.colHeaderText]}>TEAM</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>W</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>L</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>+/-</Text>
              </View>
              {teamRankings.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No match data yet</Text>
              ) : (
                teamRankings.map((e, i) => renderTeamRow(e, i))
              )}
            </>
          )}

          {/* View Segment 2: Individual Player Standings (Global sorting context) */}
          {activeTab === 'Player (Overall)' && (
            <>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
                <Text style={[styles.colTeam, styles.colHeaderText]}>PLAYER</Text>
                <SortableHeader label="TD" colKey="tds" sortCol={sortCol} setSortCol={setSortCol} theme={theme} />
                <SortableHeader label="INT" colKey="ints" sortCol={sortCol} setSortCol={setSortCol} theme={theme} />
                <SortableHeader label="FP" colKey="flagsPulled" sortCol={sortCol} setSortCol={setSortCol} theme={theme} />
                <SortableHeader label="SK" colKey="sacks" sortCol={sortCol} setSortCol={setSortCol} theme={theme} />
              </View>
              {playerOverallData.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No match data yet</Text>
              ) : (
                playerOverallData.map((e, i) => renderPlayerRow(e, i))
              )}
            </>
          )}

          {/* View Segment 3: Filtered Positioning Roster Group */}
          {activeTab === 'Player by Position' && (
            <>
              <View style={{ height: 40, marginBottom: SPACING.md }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs }}>
                  {POSITIONS.map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      onPress={() => setPosFilter(pos)}
                      style={[
                        styles.posPill, 
                        { 
                          backgroundColor: posFilter === pos ? theme.colors.primary : theme.colors.surface, 
                          borderWidth: 1, 
                          borderColor: posFilter === pos ? theme.colors.primary : theme.colors.outlineVariant 
                        }
                      ]}
                    >
                      <Text style={[styles.posPillText, { color: posFilter === pos ? '#FFFFFF' : theme.colors.onSurfaceVariant }]}>{pos}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
                <Text style={[styles.colTeam, styles.colHeaderText]}>PLAYER</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>TD</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>INT</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>FP</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>SK</Text>
              </View>
              {playerByPositionData.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  No {posFilter === 'All' ? '' : posFilter + ' '}stats yet
                </Text>
              ) : (
                playerByPositionData.map((e, i) => renderPlayerRow(e, i))
              )}
            </>
          )}
          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md, paddingTop: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dataLoaderContainer: { paddingVertical: SPACING.xl, alignItems: 'center' },
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  tournamentPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md,
  },
  tournamentPickerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  tabRow: { gap: SPACING.xs, paddingRight: SPACING.md, alignItems: 'center' },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20, justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 10, paddingHorizontal: SPACING.sm, marginBottom: 4 },
  colHeaderText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: SPACING.sm, marginBottom: 4 },
  colRank: { width: 36, textAlign: 'center' },
  colTeam: { flex: 1 },
  colNum: { width: 40, textAlign: 'center', fontSize: 13 },
  cellBold: { fontSize: 13, fontWeight: '700' },
  cellSub: { fontSize: 11, marginTop: 1 },
  posPill: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: 20, justifyContent: 'center' },
  posPillText: { fontSize: 12, fontWeight: '700' },
  emptyText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: SPACING.md },
  sortHeaderTouch: { width: 40, alignItems: 'center' },
});