import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mockTeams, mockPlayers } from '../data/mockData';

// Status styles (unchanged colors)
const STATUS_STYLES = {
  active: { bg: '#c8f13520', text: '#c8f135', label: 'Active' },
  questionable: { bg: '#ff8c4220', text: '#ff8c42', label: 'Quest.' },
  out: { bg: '#ff5a5a20', text: '#ff5a5a', label: 'Out' },
};

// Small stat box (slightly refined spacing)
function StatBox({ value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Player Card (more breathing room + alignment fix)
function PlayerCard({ player }) {
  const s = STATUS_STYLES[player.status];

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerNumber}>
        <Text style={styles.playerNumberText}>#{player.number}</Text>
      </View>

      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPos}>
          {player.pos} • {player.stats}
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
        <Text style={[styles.statusText, { color: s.text }]}>
          {s.label}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

  const TEAM = mockTeams[0];

  const PLAYERS = mockPlayers
    .filter(p => p.teamId === TEAM.id)
    .map(p => ({
      id: p.id,
      name: p.name,
      pos: p.positions.join(', '),
      number: p.jerseyNumber,
      stats: `${p.stats.touchdowns} TD`,
      status: p.status,
    }));

  const teamRecord = {
    record: '0-0',
    wins: 0,
    losses: 0,
    rank: 1,
    nextGame: {
      opponent: 'TBD',
      date: 'TBD',
      time: '',
      location: '',
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f0a" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topGreeting}>Welcome back 👋</Text>
          <Text style={styles.topTeam}>{TEAM.name}</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>TC</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* Record */}
        <View style={styles.recordBanner}>
          <View>
            <Text style={styles.recordLabel}>SEASON RECORD</Text>
            <Text style={styles.recordValue}>{teamRecord.record}</Text>
            <Text style={styles.recordSub}>
              Ranked #{teamRecord.rank}
            </Text>
          </View>

          <View style={styles.recordRight}>
            <StatBox value={teamRecord.wins} label="W" />
            <StatBox value={teamRecord.losses} label="L" />
            <StatBox value="0%" label="WIN %" />
          </View>
        </View>

        {/* Players */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ROSTER</Text>
        </View>

        <View style={styles.rosterList}>
          {PLAYERS.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {['home', 'plays', 'roster', 'stats'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.navTab}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.navLabel}>
              {tab.toUpperCase()}
            </Text>

            {activeTab === tab && <View style={styles.navDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// 🔥 IMPROVED STYLES (same colors, better spacing + polish)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f0a' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: 'center',
  },

  topGreeting: {
    fontSize: 13,
    color: '#5a7a5a',
    marginBottom: 2,
  },

  topTeam: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#c8f135',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: '900',
    color: '#0a0f0a',
  },

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  recordBanner: {
    backgroundColor: '#131a13',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#1e2d1e',
  },

  recordLabel: {
    fontSize: 10,
    color: '#5a7a5a',
    letterSpacing: 2,
    marginBottom: 6,
  },

  recordValue: {
    fontSize: 42,
    color: '#c8f135',
    fontWeight: '900',
  },

  recordSub: {
    fontSize: 12,
    color: '#5a7a5a',
    marginTop: 4,
  },

  recordRight: {
    flexDirection: 'row',
    gap: 8,
  },

  statBox: {
    backgroundColor: '#0d130d',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2d1e',
  },

  statValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '900',
  },

  statLabel: {
    fontSize: 10,
    color: '#5a7a5a',
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 11,
    color: '#c8f135',
    letterSpacing: 2,
    fontWeight: '800',
  },

  rosterList: {
    gap: 10,
    marginBottom: 30,
  },

  playerCard: {
    backgroundColor: '#131a13',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2d1e',
  },

  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0d130d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  playerNumberText: {
    color: '#c8f135',
    fontWeight: '800',
  },

  playerInfo: {
    flex: 1,
  },

  playerName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  playerPos: {
    fontSize: 12,
    color: '#5a7a5a',
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  logoutBtn: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2d1e',
    alignItems: 'center',
  },

  logoutText: {
    color: '#5a7a5a',
    fontWeight: '700',
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#131a13',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e2d1e',
  },

  navTab: {
    flex: 1,
    alignItems: 'center',
  },

  navLabel: {
    fontSize: 10,
    color: '#3a4a3a',
  },

  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c8f135',
    marginTop: 4,
  },
});