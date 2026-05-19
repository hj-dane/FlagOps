// app/(organizer)/players/[id].jsx
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { APP_THEME, SPACING } from '../../../theme';
import StatusPill from '../../../components/StatusPill';

function StatTile({ label, value }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PlayerDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlayerDetails();
    }
  }, [id]);

  const fetchPlayerDetails = async () => {
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
          tds,
          ints,
          flags_pulled,
          sacks,
          teams(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (err) {
      console.error('Error fetching player metadata profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="account-alert" size={48} color="#AAAAAA" />
        <Text style={styles.errorText}>Player profile could not be found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Roster</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pillStatus = player.status
    ? player.status.charAt(0).toUpperCase() + player.status.slice(1).toLowerCase()
    : 'Pending';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Back Action Bar */}
      <TouchableOpacity style={styles.backNavigationRow} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.secondary} />
        <Text style={styles.backNavigationText}>Back to Roster</Text>
      </TouchableOpacity>

      {/* Main Feature Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarJerseyText}>#{player.number || '00'}</Text>
        </View>
        <Text style={styles.playerNameText}>{player.name}</Text>
        <Text style={styles.playerSubText}>
          {player.position || 'Position Unset'} • {player.teams?.name || 'Free Agent'}
        </Text>
        <View style={styles.pillWrapper}>
          <StatusPill status={pillStatus} />
        </View>
      </View>

      {/* Metric Segmentation Banner */}
      <Text style={styles.sectionTitle}>SEASON STATISTICS</Text>

      {/* Performance Grid Structure */}
      <View style={styles.statsGrid}>
        <StatTile label="TOUCHDOWNS" value={player.tds || 0} />
        <StatTile label="INTERCEPTIONS" value={player.ints || 0} />
        <StatTile label="FLAGS PULLED" value={player.flags_pulled || 0} />
        <StatTile label="SACKS" value={player.sacks || 0} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.background,
    padding: 24,
  },
  backNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  backNavigationText: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.secondary,
    marginLeft: 6,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.roundness,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
    marginBottom: 24,
  },
  avatarBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.outline,
    marginBottom: 12,
  },
  avatarJerseyText: {
    fontSize: 20,
    fontWeight: '900',
    color: APP_THEME.colors.primary,
  },
  playerNameText: {
    fontSize: 22,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
    textAlign: 'center',
  },
  playerSubText: {
    fontSize: 13,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  pillWrapper: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    color: APP_THEME.colors.primary,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 40,
  },
  statTile: {
    width: '48%', // Flexible cross-axis spacing wrapper split
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.roundness,
    padding: 16,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 15,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: APP_THEME.roundness,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});