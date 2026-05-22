import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSetAtom, useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isSidebarOpenAtom, userProfileAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import { APP_THEME, SPACING, CARD_SHADOW } from '../../../theme';

export default function OrganizerDashboard() {
  const router = useRouter();
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);
  const profile = useAtomValue(userProfileAtom);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentRejection, setRecentRejection] = useState(null);

  const fetchData = useCallback(async () => {
    if (!profile?.organization_id) return;
    try {
      const now = new Date().toISOString();

      const [liveRes, tourRes, matchCountRes, requestRes, rejectionRes] = await Promise.all([
        supabase
          .from('matches')
          .select('id, home_team_name, away_team_name, home_score, away_score, status')
          .eq('organization_id', profile.organization_id)
          .eq('status', 'live'),

        supabase
          .from('tournaments')
          .select('id, name, start_date, end_date, location, level')
          .eq('organization_id', profile.organization_id)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .limit(3),

        supabase
          .from('matches')
          .select('id', { count: 'exact' })
          .eq('organization_id', profile.organization_id),

        supabase
          .from('approval_requests')
          .select('id, entity_type, entity_name, change_type, created_at')
          .eq('organization_id', profile.organization_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),

        supabase
          .from('approval_requests')
          .select('id, entity_type, entity_name, rejection_reason')
          .eq('organization_id', profile.organization_id)
          .eq('status', 'rejected')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setLiveMatches(liveRes.data || []);
      setUpcomingTournaments(tourRes.data || []);
      setTotalMatches(matchCountRes.count || 0);
      setPendingRequests(requestRes.data || []);
      setRecentRejection(rejectionRes.data || null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: APP_THEME.colors.background }]}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: APP_THEME.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)}>
          <MaterialCommunityIcons name="menu" size={26} color={APP_THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[APP_THEME.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {recentRejection && (
          <TouchableOpacity
            style={styles.rejectionBanner}
            onPress={() => alert(recentRejection.rejection_reason || 'No reason provided.')}
          >
            <MaterialCommunityIcons name="alert-circle" size={18} color="#C62828" />
            <Text style={styles.rejectionText}>
              Request rejected: {recentRejection.entity_name || recentRejection.entity_type}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#C62828" />
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, CARD_SHADOW]}>
            <MaterialCommunityIcons name="whistle-outline" size={22} color={APP_THEME.colors.primary} />
            <Text style={styles.statValue}>{totalMatches}</Text>
            <Text style={styles.statLabel}>Total Matches</Text>
          </View>
          <View style={[styles.statCard, CARD_SHADOW]}>
            <MaterialCommunityIcons name="trophy-outline" size={22} color={APP_THEME.colors.primary} />
            <Text style={styles.statValue}>{upcomingTournaments.length}</Text>
            <Text style={styles.statLabel}>Upcoming Tournaments</Text>
          </View>
          <View style={[styles.statCard, CARD_SHADOW, pendingRequests.length > 0 && { borderColor: '#E65100', borderWidth: 1.5 }]}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={pendingRequests.length > 0 ? '#E65100' : APP_THEME.colors.primary} />
            <Text style={[styles.statValue, pendingRequests.length > 0 && { color: '#E65100' }]}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {liveMatches.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionLabel}>LIVE NOW</Text>
              </View>
            </View>
            {liveMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[styles.liveCard, CARD_SHADOW]}
                onPress={() => router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: match.id } })}
                activeOpacity={0.8}
              >
                <View style={styles.liveScoreRow}>
                  <View style={styles.liveTeam}>
                    <Text style={styles.liveTeamName} numberOfLines={1}>{match.home_team_name}</Text>
                    <Text style={styles.liveScore}>{match.home_score ?? 0}</Text>
                  </View>
                  <Text style={styles.liveVs}>VS</Text>
                  <View style={[styles.liveTeam, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.liveTeamName, { textAlign: 'right' }]} numberOfLines={1}>{match.away_team_name}</Text>
                    <Text style={styles.liveScore}>{match.away_score ?? 0}</Text>
                  </View>
                </View>
                <View style={styles.resumeRow}>
                  <MaterialCommunityIcons name="play-circle" size={14} color="#FFF" />
                  <Text style={styles.resumeText}>Resume Live Tracking</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>UPCOMING TOURNAMENTS</Text>
          <TouchableOpacity onPress={() => router.push('/(organizer)/tournaments')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {upcomingTournaments.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming tournaments</Text>
        ) : (
          upcomingTournaments.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tournamentCard, CARD_SHADOW]}
              onPress={() => router.push({ pathname: '/(organizer)/tournaments/[id]', params: { id: t.id } })}
              activeOpacity={0.7}
            >
              <View style={[styles.tournamentIcon, { backgroundColor: APP_THEME.colors.primaryContainer }]}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color={APP_THEME.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tournamentName, { color: APP_THEME.colors.onSurface }]}>{t.name}</Text>
                <Text style={styles.tournamentMeta}>
                  {t.start_date || '—'}{t.location ? ` · ${t.location}` : ''}
                </Text>
                {t.level && <Text style={styles.tournamentLevel}>{t.level}</Text>}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          ))
        )}

        {pendingRequests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>PENDING REQUESTS</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
            {pendingRequests.map((req) => (
              <View key={req.id} style={[styles.pendingItem, CARD_SHADOW]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#E65100" />
                <Text style={styles.pendingText} numberOfLines={1}>
                  {req.change_type?.charAt(0).toUpperCase() + req.change_type?.slice(1)} {req.entity_type}: {req.entity_name || '—'}
                </Text>
                <View style={styles.amberPill}>
                  <Text style={styles.amberPillText}>Pending</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: SPACING.md, marginBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '900', color: APP_THEME.colors.secondary },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  rejectionBanner: { backgroundColor: '#FFCDD2', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  rejectionText: { color: '#C62828', fontSize: 13, fontWeight: '700', flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: APP_THEME.colors.secondary },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: SPACING.md },
  sectionLabel: { fontSize: 11, color: APP_THEME.colors.primary, letterSpacing: 1.5, fontWeight: '800' },
  seeAll: { fontSize: 12, color: APP_THEME.colors.primary, fontWeight: '700' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  liveCard: { backgroundColor: '#1E2538', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.sm },
  liveScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  liveTeam: { flex: 1 },
  liveTeamName: { color: '#AAAAAA', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  liveScore: { color: '#FFF', fontSize: 36, fontWeight: '900', marginTop: 2 },
  liveVs: { color: '#4F5E7B', fontSize: 13, fontWeight: '700', marginHorizontal: 12 },
  resumeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: APP_THEME.colors.primary, borderRadius: 8, padding: 8, justifyContent: 'center' },
  resumeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  tournamentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: SPACING.md, gap: SPACING.md, marginBottom: SPACING.xs },
  tournamentIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tournamentName: { fontSize: 14, fontWeight: '700' },
  tournamentMeta: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  tournamentLevel: { fontSize: 10, color: APP_THEME.colors.primary, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  pendingItem: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pendingText: { fontSize: 13, flex: 1, color: APP_THEME.colors.onSurface },
  amberPill: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  amberPillText: { color: '#E65100', fontSize: 10, fontWeight: '800' },
  countBadge: { backgroundColor: APP_THEME.colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: 8 },
});
