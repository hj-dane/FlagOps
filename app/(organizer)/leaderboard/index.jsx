// app/(organizer)/leaderboard/index.jsx
import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Menu, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { TOURNAMENTS, ORG_LEADERBOARD } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

const VIEW_TABS = ['Team Rankings', 'Player (Overall)', 'Player by Position'];
const POSITIONS = ['All', 'QB', 'WR', 'C', 'Rusher', 'DB'];
const MEDAL = ['🥇', '🥈', '🥉'];

export default function OrgLeaderboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[0]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(VIEW_TABS[0]);
  const [posFilter, setPosFilter] = useState('All');
  const [sortCol, setSortCol] = useState('tds');

  const playerOverallData = useMemo(() =>
    [...ORG_LEADERBOARD.playerOverall].sort((a, b) => b[sortCol] - a[sortCol]),
    [sortCol]
  );

  const playerByPositionData = useMemo(() =>
    posFilter === 'All' ? ORG_LEADERBOARD.playerOverall : (ORG_LEADERBOARD.playerByPosition[posFilter] ?? []),
    [posFilter]
  );

  const SortableHeader = ({ label, colKey }) => (
    <TouchableOpacity onPress={() => setSortCol(colKey)} style={{ width: 40, alignItems: 'center' }}>
      <Text style={[styles.colHeaderText, { color: sortCol === colKey ? theme.colors.primary : '#AAAAAA' }]}>
        {label}{sortCol === colKey ? ' ▼' : ''}
      </Text>
    </TouchableOpacity>
  );

  const renderTeamRow = (entry, index) => (
    <View key={entry.teamName} style={[styles.tableRow, CARD_SHADOW, index === 0 && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
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
    <View key={`${entry.name}-${index}`} style={[styles.tableRow, CARD_SHADOW, index === 0 && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
      <Text style={[styles.colRank, { fontSize: 18 }]}>{MEDAL[index] ?? entry.rank}</Text>
      <View style={styles.colTeam}>
        <Text style={[styles.cellBold, { color: theme.colors.onSurface }]}>{entry.name}</Text>
        <Text style={styles.cellSub}>{entry.team}</Text>
      </View>
      <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '800' }]}>{entry.tds}</Text>
      <Text style={[styles.colNum, { color: '#1A1A1A' }]}>{entry.ints}</Text>
      <Text style={[styles.colNum, { color: '#1A1A1A' }]}>{entry.flagsPulled}</Text>
      <Text style={[styles.colNum, { color: '#1A1A1A' }]}>{entry.sacks}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Leaderboard</Text>

      {/* Tournament picker */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={[styles.tournamentPicker, CARD_SHADOW]}
          >
            <Text style={[styles.tournamentPickerText, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {selectedTournament.name}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#AAAAAA" />
          </TouchableOpacity>
        }
      >
        {TOURNAMENTS.map((t) => (
          <Menu.Item key={t.id} onPress={() => { setSelectedTournament(t); setMenuVisible(false); }} title={t.name} />
        ))}
      </Menu>

      {/* View tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={{ marginBottom: SPACING.md }}>
        {VIEW_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab ? { backgroundColor: theme.colors.primary } : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#FFFFFF' : '#888888' }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Team Rankings */}
        {activeTab === 'Team Rankings' && (
          <>
            <View style={[styles.tableHeader, { backgroundColor: '#1A1A1A' }]}>
              <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
              <Text style={[styles.colTeam, styles.colHeaderText]}>TEAM</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>W</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>L</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>+/-</Text>
            </View>
            {ORG_LEADERBOARD.teamRankings.length === 0
              ? <Text style={styles.emptyText}>No match data yet</Text>
              : ORG_LEADERBOARD.teamRankings.map((e, i) => renderTeamRow(e, i))}
          </>
        )}

        {/* Player Overall */}
        {activeTab === 'Player (Overall)' && (
          <>
            <View style={[styles.tableHeader, { backgroundColor: '#1A1A1A' }]}>
              <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
              <Text style={[styles.colTeam, styles.colHeaderText]}>PLAYER</Text>
              <SortableHeader label="TD" colKey="tds" />
              <SortableHeader label="INT" colKey="ints" />
              <SortableHeader label="FP" colKey="flagsPulled" />
              <SortableHeader label="SK" colKey="sacks" />
            </View>
            {playerOverallData.length === 0
              ? <Text style={styles.emptyText}>No match data yet</Text>
              : playerOverallData.map((e, i) => renderPlayerRow(e, i))}
          </>
        )}

        {/* Player by Position */}
        {activeTab === 'Player by Position' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setPosFilter(pos)}
                  style={[styles.posPill, { backgroundColor: posFilter === pos ? theme.colors.primary : '#FFFFFF', borderWidth: 1, borderColor: posFilter === pos ? theme.colors.primary : '#EEEEEE' }]}
                >
                  <Text style={[styles.posPillText, { color: posFilter === pos ? '#FFFFFF' : '#888888' }]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={[styles.tableHeader, { backgroundColor: '#1A1A1A' }]}>
              <Text style={[styles.colRank, styles.colHeaderText]}>RK</Text>
              <Text style={[styles.colTeam, styles.colHeaderText]}>PLAYER</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>TD</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>INT</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>FP</Text>
              <Text style={[styles.colNum, styles.colHeaderText]}>SK</Text>
            </View>
            {playerByPositionData.length === 0
              ? <Text style={styles.emptyText}>No {posFilter === 'All' ? '' : posFilter + ' '}stats yet</Text>
              : playerByPositionData.map((e, i) => renderPlayerRow(e, i))}
          </>
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

import { MaterialCommunityIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md, paddingTop: SPACING.lg },
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  tournamentPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md,
  },
  tournamentPickerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  tabRow: { gap: SPACING.xs, paddingRight: SPACING.md },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 10, paddingHorizontal: SPACING.sm, marginBottom: 4 },
  colHeaderText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: SPACING.sm, marginBottom: 4 },
  colRank: { width: 36, textAlign: 'center' },
  colTeam: { flex: 1 },
  colNum: { width: 40, textAlign: 'center', fontSize: 13 },
  cellBold: { fontSize: 13, fontWeight: '700' },
  cellSub: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  posPill: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: 20 },
  posPillText: { fontSize: 12, fontWeight: '700' },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', textAlign: 'center', paddingTop: SPACING.xl },
});