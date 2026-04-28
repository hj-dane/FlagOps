// app/(organizer)/leaderboard/index.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, Surface, useTheme, Menu, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { TOURNAMENTS, ORG_LEADERBOARD } from '../../../data/mockData';
import { SPACING } from '../../../theme';

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

  // In a real app, data would be filtered by selectedTournament.id
  const teamData = ORG_LEADERBOARD.teamRankings;

  const playerOverallData = useMemo(() => {
    return [...ORG_LEADERBOARD.playerOverall].sort((a, b) => b[sortCol] - a[sortCol]);
  }, [sortCol]);

  const playerByPositionData = useMemo(() => {
    if (posFilter === 'All') return ORG_LEADERBOARD.playerOverall;
    return ORG_LEADERBOARD.playerByPosition[posFilter] ?? [];
  }, [posFilter]);

  const SortableHeader = ({ label, colKey }) => (
    <TouchableOpacity onPress={() => setSortCol(colKey)} style={styles.sortHeader}>
      <Text
        style={[
          styles.colHeaderText,
          { color: sortCol === colKey ? theme.colors.primary : theme.colors.onSurfaceVariant },
        ]}
      >
        {label}
        {sortCol === colKey ? ' ▼' : ''}
      </Text>
    </TouchableOpacity>
  );

  const renderTeamRow = (entry, index) => (
    <TouchableOpacity
      key={entry.teamName}
      onPress={() => router.push('/(organizer)/teams')}
      activeOpacity={0.75}
    >
      <Surface
        style={[
          styles.tableRow,
          {
            backgroundColor:
              index % 2 === 0 ? theme.colors.surface : theme.colors.surfaceVariant,
          },
          index === 0 && styles.topRow,
        ]}
        elevation={0}
      >
        <Text style={[styles.colRank, { color: theme.colors.onSurface }]}>
          {MEDAL[index] ?? entry.rank}
        </Text>
        <View style={styles.colTeam}>
          <Text style={[styles.cellBold, { color: theme.colors.onSurface }]}>{entry.teamName}</Text>
        </View>
        <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '800' }]}>
          {entry.wins}
        </Text>
        <Text style={[styles.colNum, { color: theme.colors.error }]}>{entry.losses}</Text>
        <Text
          style={[
            styles.colNum,
            { color: entry.pointsDiff >= 0 ? theme.colors.primary : theme.colors.error },
          ]}
        >
          {entry.pointsDiff > 0 ? `+${entry.pointsDiff}` : entry.pointsDiff}
        </Text>
      </Surface>
    </TouchableOpacity>
  );

  const renderPlayerRow = (entry, index) => (
    <TouchableOpacity
      key={`${entry.name}-${index}`}
      onPress={() => router.push('/(organizer)/players')}
      activeOpacity={0.75}
    >
      <Surface
        style={[
          styles.tableRow,
          {
            backgroundColor:
              index % 2 === 0 ? theme.colors.surface : theme.colors.surfaceVariant,
          },
          index === 0 && styles.topRow,
        ]}
        elevation={0}
      >
        <Text style={[styles.colRank, { color: theme.colors.onSurface }]}>
          {MEDAL[index] ?? entry.rank}
        </Text>
        <View style={styles.colTeam}>
          <Text style={[styles.cellBold, { color: theme.colors.onSurface }]}>{entry.name}</Text>
          <Text style={[styles.cellSub, { color: theme.colors.onSurfaceVariant }]}>{entry.team}</Text>
        </View>
        <Text style={[styles.colNum, { color: theme.colors.primary, fontWeight: '800' }]}>
          {entry.tds}
        </Text>
        <Text style={[styles.colNum, { color: theme.colors.onSurface }]}>{entry.ints}</Text>
        <Text style={[styles.colNum, { color: theme.colors.onSurface }]}>{entry.flagsPulled}</Text>
        <Text style={[styles.colNum, { color: theme.colors.onSurface }]}>{entry.sacks}</Text>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Leaderboard</Text>

      {/* Tournament picker */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(true)}
            icon="chevron-down"
            textColor={theme.colors.onSurface}
            style={[styles.tournamentPicker, { borderColor: theme.colors.outline }]}
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            {selectedTournament.name}
          </Button>
        }
      >
        {TOURNAMENTS.map((t) => (
          <Menu.Item
            key={t.id}
            onPress={() => { setSelectedTournament(t); setMenuVisible(false); }}
            title={t.name}
          />
        ))}
      </Menu>

      {/* View tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {VIEW_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── TEAM RANKINGS ── */}
        {activeTab === 'Team Rankings' && (
          <>
            <Surface
              style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <Text style={[styles.colRank, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>RK</Text>
              <Text style={[styles.colTeam, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>TEAM</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>W</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>L</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>+/-</Text>
            </Surface>
            {teamData.length === 0 ? (
              <EmptyState text="No match data yet for this tournament" theme={theme} />
            ) : (
              teamData.map((entry, i) => renderTeamRow(entry, i))
            )}
          </>
        )}

        {/* ── PLAYER OVERALL ── */}
        {activeTab === 'Player (Overall)' && (
          <>
            <Surface
              style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <Text style={[styles.colRank, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>RK</Text>
              <Text style={[styles.colTeam, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>PLAYER</Text>
              <SortableHeader label="TD" colKey="tds" />
              <SortableHeader label="INT" colKey="ints" />
              <SortableHeader label="FP" colKey="flagsPulled" />
              <SortableHeader label="SK" colKey="sacks" />
            </Surface>
            {playerOverallData.length === 0 ? (
              <EmptyState text="No match data yet for this tournament" theme={theme} />
            ) : (
              playerOverallData.map((entry, i) => renderPlayerRow(entry, i))
            )}
          </>
        )}

        {/* ── PLAYER BY POSITION ── */}
        {activeTab === 'Player by Position' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.posPillRow}
              style={{ marginBottom: SPACING.sm }}
            >
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setPosFilter(pos)}
                  style={[
                    styles.posPill,
                    {
                      backgroundColor:
                        posFilter === pos ? theme.colors.primary : theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.posPillText,
                      { color: posFilter === pos ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Surface
              style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <Text style={[styles.colRank, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>RK</Text>
              <Text style={[styles.colTeam, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>PLAYER</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>TD</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>INT</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>FP</Text>
              <Text style={[styles.colNum, styles.colHeaderText, { color: theme.colors.onSurfaceVariant }]}>SK</Text>
            </Surface>

            {playerByPositionData.length === 0 ? (
              <EmptyState
                text={`No ${posFilter === 'All' ? '' : posFilter + ' '}stats recorded yet`}
                theme={theme}
              />
            ) : (
              playerByPositionData.map((entry, i) => renderPlayerRow(entry, i))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ text, theme }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md },
  tournamentPicker: { borderRadius: 10, marginBottom: SPACING.md, alignSelf: 'stretch' },
  tabScroll: { marginBottom: SPACING.md },
  tabRow: { gap: SPACING.xs, paddingRight: SPACING.md },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '700' },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: 2,
  },
  colHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sortHeader: { width: 40, alignItems: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    marginBottom: 2,
  },
  topRow: { borderWidth: 1, borderColor: '#00E67644' },
  colRank: { width: 34, textAlign: 'center', fontSize: 16 },
  colTeam: { flex: 1 },
  colNum: { width: 40, textAlign: 'center', fontSize: 13 },
  cellBold: { fontSize: 13, fontWeight: '700' },
  cellSub: { fontSize: 11, marginTop: 1 },
  posPillRow: { gap: SPACING.xs, paddingRight: SPACING.md },
  posPill: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: 20 },
  posPillText: { fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
});