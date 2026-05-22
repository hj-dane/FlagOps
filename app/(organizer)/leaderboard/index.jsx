// app/(organizer)/leaderboard/index.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Menu, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom } from '../../../store/globalStore';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const VIEW_TABS = ['Team Rankings', 'Player (Overall)', 'Player by Position'];
const POSITIONS = ['All', 'QB', 'WR', 'C', 'Rusher', 'DB'];
const MEDAL = ['🥇', '🥈', '🥉'];

const SortableHeader = ({ label, colKey, sortCol, setSortCol, theme }) => {
  const isActive = sortCol === colKey;
  return (
    <TouchableOpacity onPress={() => setSortCol(colKey)} style={styles.sortHeaderTouch}>
      <Text style={[styles.colHeaderText, { color: isActive ? '#FFD700' : '#FFFFFF' }]}>
        {label}{isActive ? ' ▼' : ''}
      </Text>
    </TouchableOpacity>
  );
};

export default function OrgLeaderboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(VIEW_TABS[0]);
  const [posFilter, setPosFilter] = useState('All');
  const [sortCol, setSortCol] = useState('tds');
  const [refreshing, setRefreshing] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [teamRankings, setTeamRankings] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) fetchTournaments();
  }, [profile]);

  useEffect(() => {
    if (selectedTournament?.id) fetchLeaderboardData(selectedTournament.id);
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
        setSelectedTournament(data[0]);
      }
    } catch (err) {
      console.error('fetchTournaments error:', err);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const fetchLeaderboardData = async (tournamentId) => {
    setLoadingData(true);
    try {
      // ── Team rankings: calculate wins/losses from completed matches ──
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score')
        .eq('tournament_id', tournamentId)
        .eq('status', 'completed');

      if (matchesError) throw matchesError;

      // Tally wins/losses/points per team from match results
      const tally = {};
      (matchesData || []).forEach((m) => {
        const homeId = m.home_team_id;
        const awayId = m.away_team_id;
        if (!tally[homeId]) tally[homeId] = { id: homeId, teamName: m.home_team_name, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
        if (!tally[awayId]) tally[awayId] = { id: awayId, teamName: m.away_team_name, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };

        const hs = m.home_score ?? 0;
        const as = m.away_score ?? 0;
        tally[homeId].pointsFor += hs;
        tally[homeId].pointsAgainst += as;
        tally[awayId].pointsFor += as;
        tally[awayId].pointsAgainst += hs;

        if (hs > as) { tally[homeId].wins++; tally[awayId].losses++; }
        else if (as > hs) { tally[awayId].wins++; tally[homeId].losses++; }
      });

      const formattedTeams = Object.values(tally)
        .map((t) => ({ ...t, pointsDiff: t.pointsFor - t.pointsAgainst }))
        .sort((a, b) => b.wins - a.wins || b.pointsDiff - a.pointsDiff)
        .map((t, idx) => ({ ...t, rank: idx + 1 }));

      setTeamRankings(formattedTeams);

      // ── Player stats: aggregate from match_stats for this tournament ──
      const { data: statsData, error: statsError } = await supabase
        .from('match_stats')
        .select('player_id, stat_type, value, players(id, name, position, teams(name))')
        .in('match_id',
          matchesData?.length > 0
            ? (await supabase.from('matches').select('id').eq('tournament_id', tournamentId)).data?.map((m) => m.id) || []
            : []
        );

      if (statsError) throw statsError;

      // Aggregate stats per player
      const playerMap = {};
      (statsData || []).forEach((s) => {
        const pid = s.player_id;
        if (!playerMap[pid]) {
          playerMap[pid] = {
            id: pid,
            name: s.players?.name || 'Unknown',
            position: s.players?.position || 'Unassigned',
            team: s.players?.teams?.name || '—',
            tds: 0, ints: 0, flagsPulled: 0, sacks: 0,
          };
        }
        const val = s.value || 1;
        const type = s.stat_type?.toLowerCase();
        if (type === 'td') playerMap[pid].tds += val;
        else if (type === 'int') playerMap[pid].ints += val;
        else if (type === 'flag pulled') playerMap[pid].flagsPulled += val;
        else if (type === 'sack') playerMap[pid].sacks += val;
      });

      setPlayerStats(Object.values(playerMap));
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedTournament?.id) await fetchLeaderboardData(selectedTournament.id);
    else if (profile?.organization_id) await fetchTournaments();
    setRefreshing(false);
  }, [selectedTournament, profile]);

  const playerOverallData = useMemo(() =>
    [...playerStats]
      .sort((a, b) => b[sortCol] - a[sortCol])
      .map((item, index) => ({ ...item, rank: index + 1 })),
    [playerStats, sortCol]
  );

  const playerByPositionData = useMemo(() => {
    const filtered = posFilter === 'All'
      ? playerStats
      : playerStats.filter((p) => p.position?.toUpperCase() === posFilter.toUpperCase());
    return [...filtered]
      .sort((a, b) => b.tds - a.tds || b.flagsPulled - a.flagsPulled)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [playerStats, posFilter]);

  const renderTeamRow = (entry, index) => (
    <View key={entry.id} style={[styles.tableRow, CARD_SHADOW, index === 0 && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
      <Text style={[styles.colRank, { fontSize: 18 }]}>{MEDAL[index] ?? entry.rank}</Text>
      <View style={styles.colTeam}>
        <Text style={[styles.cellBold, { color: theme.colors.onSurface }]}>{entry.teamName}</Text>
      </View>
      <Text style={[styles.colNum, { color: '#2E7D32', fontWeight: '800' }]}>{entry.wins}</Text>
      <Text style={[styles.colNum, { color: theme.colors.error, fontWeight: '700' }]}>{entry.losses}</Text>
      <Text style={[styles.colNum, { color: entry.pointsDiff >= 0 ? '#2E7D32' : theme.colors.error, fontWeight: '700' }]}>
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
      <ScreenHeader title="Leaderboard" />

      {/* Tournament Picker */}
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
            <Menu.Item key={t.id} onPress={() => { setSelectedTournament(t); setMenuVisible(false); }} title={t.name} />
          ))}
        </Menu>
      ) : (
        <View style={[styles.tournamentPicker, CARD_SHADOW, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No tournaments found</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={{ height: 48, marginBottom: SPACING.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {VIEW_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#EEEEEE' }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : theme.colors.onSurfaceVariant }]}>{tab}</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        >
          {activeTab === 'Team Rankings' && (
            <>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
                <Text style={[styles.colTeam, styles.colHeaderText]}>TEAM</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>W</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>L</Text>
                <Text style={[styles.colNum, styles.colHeaderText]}>+/-</Text>
              </View>
              {teamRankings.length === 0
                ? <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No completed match data yet</Text>
                : teamRankings.map((e, i) => renderTeamRow(e, i))
              }
            </>
          )}

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
              {playerOverallData.length === 0
                ? <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No match data yet</Text>
                : playerOverallData.map((e, i) => renderPlayerRow(e, i))
              }
            </>
          )}

          {activeTab === 'Player by Position' && (
            <>
              <View style={{ height: 40, marginBottom: SPACING.md }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs }}>
                  {POSITIONS.map((pos) => (
                    <TouchableOpacity key={pos} onPress={() => setPosFilter(pos)}
                      style={[styles.posPill, { backgroundColor: posFilter === pos ? theme.colors.primary : theme.colors.surface, borderWidth: 1, borderColor: posFilter === pos ? theme.colors.primary : '#EEEEEE' }]}>
                      <Text style={[styles.posPillText, { color: posFilter === pos ? '#FFF' : theme.colors.onSurfaceVariant }]}>{pos}</Text>
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
              {playerByPositionData.length === 0
                ? <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No {posFilter === 'All' ? '' : posFilter + ' '}stats yet</Text>
                : playerByPositionData.map((e, i) => renderPlayerRow(e, i))
              }
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
  tournamentPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md },
  tournamentPickerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  tabRow: { gap: SPACING.xs, paddingRight: SPACING.md, alignItems: 'center' },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20, justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 10, paddingHorizontal: SPACING.sm, marginBottom: 4 },
  colHeaderText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: SPACING.sm, marginBottom: 4, backgroundColor: '#FFF' },
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
