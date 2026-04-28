// app/(admin)/leaderboard/index.jsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LEADERBOARD_ENTRIES } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function AdminLeaderboardScreen() {
  const theme = useTheme();
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('Apr 23, 2025 · 10:45 AM');
  const [data, setData] = useState(LEADERBOARD_ENTRIES);

  const handleGenerate = () => {
    setGenerating(true);
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
          <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Rankings</Text>
          <Text style={styles.lastGen}>Updated {lastGenerated}</Text>
        </View>
        <Button
          mode="contained"
          onPress={handleGenerate}
          loading={generating}
          disabled={generating}
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
          icon="refresh"
          style={{ borderRadius: 12 }}
          contentStyle={{ paddingHorizontal: 8 }}
        >
          Generate
        </Button>
      </View>

      {generating ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>Recalculating from match data…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.xl }}>

          {/* Table header */}
          <View style={[styles.tableHeader, CARD_SHADOW]}>
            <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
            <Text style={[styles.colTeam, styles.colHeaderText]}>TEAM</Text>
            <Text style={[styles.colNum, styles.colHeaderText]}>W</Text>
            <Text style={[styles.colNum, styles.colHeaderText]}>L</Text>
            <Text style={[styles.colNum, styles.colHeaderText]}>+/-</Text>
          </View>

          {data.map((entry, index) => (
            <View
              key={entry.rank}
              style={[
                styles.tableRow,
                CARD_SHADOW,
                index === 0 && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.colRank, { fontSize: 18 }]}>
                {MEDAL[index] ?? entry.rank}
              </Text>
              <View style={styles.colTeam}>
                <Text style={[styles.teamNameText, { color: theme.colors.onSurface }]}>{entry.teamName}</Text>
                <Text style={styles.orgNameText}>{entry.orgName}</Text>
              </View>
              <Text style={[styles.colNum, { color: '#2E7D32', fontWeight: '800', fontSize: 15 }]}>{entry.wins}</Text>
              <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '700', fontSize: 15 }]}>{entry.losses}</Text>
              <Text style={[styles.colNum, { color: entry.pointsDiff >= 0 ? '#2E7D32' : theme.colors.primary, fontWeight: '700', fontSize: 14 }]}>
                {entry.pointsDiff > 0 ? `+${entry.pointsDiff}` : entry.pointsDiff}
              </Text>
            </View>
          ))}

          {/* Top Scorers */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: SPACING.sm }]}>
            Top Scorers
          </Text>
          {data.slice(0, 3).map((entry, i) => (
            <View key={`scorer-${i}`} style={[styles.scorerCard, CARD_SHADOW]}>
              <View style={[styles.scorerRankCircle, { backgroundColor: i === 0 ? theme.colors.primary : '#F5F5F5' }]}>
                <Text style={[styles.scorerRankText, { color: i === 0 ? '#FFFFFF' : '#888888' }]}>
                  #{i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scorerName, { color: theme.colors.onSurface }]}>{entry.topScorer}</Text>
                <Text style={styles.scorerTeam}>{entry.teamName}</Text>
              </View>
              <View style={styles.tdBadge}>
                <Text style={[styles.tdCount, { color: theme.colors.primary }]}>{entry.tds}</Text>
                <Text style={styles.tdLabel}>TDs</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md, paddingTop: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800' },
  lastGen: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { fontSize: 14, color: '#AAAAAA' },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md,
  },
  colHeaderText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.md,
  },
  colRank: { width: 36, textAlign: 'center' },
  colTeam: { flex: 1 },
  colNum: { width: 44, textAlign: 'center' },
  teamNameText: { fontSize: 14, fontWeight: '700' },
  orgNameText: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  scorerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: SPACING.md, gap: SPACING.md,
  },
  scorerRankCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scorerRankText: { fontSize: 12, fontWeight: '800' },
  scorerName: { fontSize: 14, fontWeight: '700' },
  scorerTeam: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  tdBadge: { alignItems: 'center' },
  tdCount: { fontSize: 26, fontWeight: '900' },
  tdLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase' },
});