// app/(admin)/leaderboard/index.jsx
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { LEADERBOARD_ENTRIES } from '../../../data/mockData';
import { SPACING } from '../../../theme';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function AdminLeaderboardScreen() {
  const theme = useTheme();
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('Apr 23, 2025 · 10:45 AM');
  const [data, setData] = useState(LEADERBOARD_ENTRIES);

  const handleGenerate = () => {
    setGenerating(true);
    // TODO: POST /leaderboard/generate  then refresh data
    setTimeout(() => {
      setGenerating(false);
      setLastGenerated(new Date().toLocaleString());
    }, 1800);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>
            Cross-Org Rankings
          </Text>
          <Text style={[styles.lastGen, { color: theme.colors.onSurfaceVariant }]}>
            Last generated: {lastGenerated}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handleGenerate}
          loading={generating}
          disabled={generating}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          icon="refresh"
          style={{ borderRadius: 10 }}
        >
          Generate
        </Button>
      </View>

      {generating ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Recalculating from match data…
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.tableContainer} showsVerticalScrollIndicator={false}>
          {/* Table header */}
          <Surface
            style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}
            elevation={0}
          >
            <Text style={[styles.colRank, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              RK
            </Text>
            <Text style={[styles.colTeam, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              TEAM
            </Text>
            <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              W
            </Text>
            <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              L
            </Text>
            <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              +/-
            </Text>
          </Surface>

          {data.map((entry, index) => (
            <Surface
              key={entry.rank}
              style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? theme.colors.surface : theme.colors.surfaceVariant },
                entry.rank === 1 && styles.topRow,
              ]}
              elevation={0}
            >
              <Text style={[styles.colRank, { color: theme.colors.onSurface }]}>
                {MEDAL[index] ?? entry.rank}
              </Text>
              <View style={styles.colTeam}>
                <Text style={[styles.teamNameText, { color: theme.colors.onSurface }]}>
                  {entry.teamName}
                </Text>
                <Text style={[styles.orgNameText, { color: theme.colors.onSurfaceVariant }]}>
                  {entry.orgName}
                </Text>
              </View>
              <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '800' }]}>
                {entry.wins}
              </Text>
              <Text style={[styles.colNum, { color: theme.colors.error, fontWeight: '700' }]}>
                {entry.losses}
              </Text>
              <Text
                style={[
                  styles.colNum,
                  {
                    color: entry.pointsDiff >= 0 ? theme.colors.primary : theme.colors.error,
                    fontWeight: '700',
                  },
                ]}
              >
                {entry.pointsDiff > 0 ? `+${entry.pointsDiff}` : entry.pointsDiff}
              </Text>
            </Surface>
          ))}

          {/* Top Scorer callout */}
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Top Scorers</Text>
          {data.slice(0, 3).map((entry) => (
            <Surface
              key={`scorer-${entry.rank}`}
              style={[styles.scorerCard, { backgroundColor: theme.colors.surface }]}
              elevation={0}
            >
              <Text style={[styles.scorerRank, { color: theme.colors.primary }]}>#{entry.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scorerName, { color: theme.colors.onSurface }]}>
                  {entry.topScorer}
                </Text>
                <Text style={[styles.scorerTeam, { color: theme.colors.onSurfaceVariant }]}>
                  {entry.teamName}
                </Text>
              </View>
              <View style={styles.tdBadge}>
                <Text style={[styles.tdCount, { color: theme.colors.primary }]}>{entry.tds}</Text>
                <Text style={[styles.tdLabel, { color: theme.colors.onSurfaceVariant }]}>TDs</Text>
              </View>
            </Surface>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  screenTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  lastGen: { fontSize: 11, marginTop: 2 },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: { fontSize: 14 },
  tableContainer: { gap: 2, paddingBottom: SPACING.xl },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: 4,
  },
  colHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  },
  topRow: {
    borderWidth: 1,
    borderColor: '#00E67644',
  },
  colRank: { width: 36, fontSize: 16, textAlign: 'center' },
  colTeam: { flex: 1 },
  colNum: { width: 44, textAlign: 'center', fontSize: 14 },
  teamNameText: { fontSize: 14, fontWeight: '700' },
  orgNameText: { fontSize: 11, marginTop: 1 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scorerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: '#1C2437',
  },
  scorerRank: { fontSize: 18, fontWeight: '900', width: 30 },
  scorerName: { fontSize: 14, fontWeight: '700' },
  scorerTeam: { fontSize: 12, marginTop: 2 },
  tdBadge: { alignItems: 'center' },
  tdCount: { fontSize: 24, fontWeight: '900' },
  tdLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});