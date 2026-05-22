import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../../utils/supabase';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function AdminLeaderboardScreen() {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score')
        .eq('status', 'completed');
      if (error) throw error;

      const tally = {};
      (matches || []).forEach((m) => {
        const homeId = m.home_team_id;
        const awayId = m.away_team_id;
        if (!tally[homeId]) tally[homeId] = { team_id: homeId, team_name: m.home_team_name, wins: 0, losses: 0, points_for: 0, points_against: 0 };
        if (!tally[awayId]) tally[awayId] = { team_id: awayId, team_name: m.away_team_name, wins: 0, losses: 0, points_for: 0, points_against: 0 };
        const hs = m.home_score ?? 0;
        const as = m.away_score ?? 0;
        tally[homeId].points_for += hs; tally[homeId].points_against += as;
        tally[awayId].points_for += as; tally[awayId].points_against += hs;
        if (hs > as) { tally[homeId].wins++; tally[awayId].losses++; }
        else if (as > hs) { tally[awayId].wins++; tally[homeId].losses++; }
      });

      const rows = Object.values(tally)
        .map((r) => ({ ...r, points_differential: r.points_for - r.points_against }))
        .sort((a, b) => b.wins - a.wins || b.points_differential - a.points_differential);

      setData(rows);
      setLastGenerated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('fetchLeaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await fetchLeaderboard();
    setIsGenerating(false);
    Alert.alert('Done', 'Leaderboard recalculated from completed matches.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Rankings" />

      <View style={styles.actionRow}>
        <Text style={styles.lastGen}>{lastGenerated ? `Last sync: ${lastGenerated}` : 'Not yet loaded'}</Text>
        <View style={styles.btnGroup}>
          <Button
            mode="outlined"
            onPress={fetchLeaderboard}
            loading={isLoading}
            disabled={isLoading || isGenerating}
            icon="refresh"
            style={styles.refreshBtn}
            compact
          >
            Refresh
          </Button>
          <Button
            mode="contained"
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={isLoading || isGenerating}
            buttonColor={theme.colors.primary}
            icon="calculator"
            style={styles.generateBtn}
            compact
          >
            Generate
          </Button>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.xl }}>
          {/* Table Header */}
          <View style={[styles.tableHeader, CARD_SHADOW]}>
            <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
            <Text style={[styles.colTeam, styles.colHeaderText]}>TEAM</Text>
            <Text style={[styles.colNum, styles.colHeaderText]}>W</Text>
            <Text style={[styles.colNum, styles.colHeaderText]}>L</Text>
            <Text style={[styles.colNum, styles.colHeaderText]}>+/-</Text>
          </View>

          {data.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No leaderboard data. Press "Generate" to calculate from match results.</Text>
            </View>
          ) : (
            data.map((entry, index) => (
              <View key={entry.id || entry.team_id} style={[styles.tableRow, CARD_SHADOW]}>
                <Text style={styles.colRank}>{MEDAL[index] ?? index + 1}</Text>
                <View style={styles.colTeam}>
                  <Text style={styles.teamNameText}>{entry.team_name}</Text>
                </View>
                <Text style={styles.colNum}>{entry.wins ?? 0}</Text>
                <Text style={styles.colNum}>{entry.losses ?? 0}</Text>
                <Text style={[styles.colNum, { color: (entry.points_differential ?? 0) >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {entry.points_differential ?? 0}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md, paddingTop: SPACING.lg },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  lastGen: { fontSize: 11, color: '#AAAAAA', flex: 1 },
  btnGroup: { flexDirection: 'row', gap: SPACING.xs },
  refreshBtn: { borderRadius: 8 },
  generateBtn: { borderRadius: 8 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, padding: SPACING.md },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: SPACING.md },
  colRank: { width: 36, textAlign: 'center' },
  colTeam: { flex: 1 },
  colNum: { width: 44, textAlign: 'center', fontWeight: '700' },
  colHeaderText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' },
  teamNameText: { fontSize: 14, fontWeight: '700' },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#AAAAAA', textAlign: 'center', fontStyle: 'italic' },
});
