import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { adminStatsAtom, isSidebarOpenAtom } from "../../../store/globalStore";
import { supabase } from "../../../utils/supabase";
import { APP_THEME, SPACING, CARD_SHADOW } from '../../../theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useAtom(adminStatsAtom);
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [approvals, orgs, players, teams, recentReqs] = await Promise.all([
        supabase.from('approval_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('approval_requests')
          .select('id, entity_type, entity_name, change_type, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setStats({
        pendingApprovals: approvals.count ?? 0,
        totalOrganizations: orgs.count ?? 0,
        totalPlayers: players.count ?? 0,
        totalTeams: teams.count ?? 0,
      });
      setRecentRequests(recentReqs.data || []);
    } catch (err) {
      console.error('fetchDashboardData error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#FFF3E0', text: '#E65100' };
      case 'approved': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'rejected': return { bg: '#FFEBEE', text: '#C62828' };
      default: return { bg: '#F5F5F5', text: '#888' };
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'create': return 'plus-circle-outline';
      case 'edit': return 'pencil-outline';
      case 'delete': return 'trash-can-outline';
      default: return 'circle-outline';
    }
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'team': return 'account-group-outline';
      case 'player': return 'account-outline';
      case 'tournament': return 'trophy-outline';
      case 'match': return 'whistle-outline';
      default: return 'file-outline';
    }
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: APP_THEME.colors.background }]}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const summaryCards = [
    { label: 'Pending', value: stats.pendingApprovals, icon: 'shield-alert-outline', color: stats.pendingApprovals > 0 ? '#E65100' : '#4CAF50', bg: stats.pendingApprovals > 0 ? '#FFF3E0' : '#E8F5E9', onPress: () => router.push('/(admin)/approvals') },
    { label: 'Orgs', value: stats.totalOrganizations, icon: 'office-building-outline', color: APP_THEME.colors.primary, bg: APP_THEME.colors.primaryContainer, onPress: () => router.push('/(admin)/organizations') },
    { label: 'Teams', value: stats.totalTeams, icon: 'account-group-outline', color: '#1565C0', bg: '#E3F2FD', onPress: () => router.push('/(admin)/teams') },
    { label: 'Players', value: stats.totalPlayers, icon: 'account-outline', color: '#6A1B9A', bg: '#F3E5F5', onPress: () => router.push('/(admin)/players') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: APP_THEME.colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.screenTitle}>Overview</Text>
        </View>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={24} color={APP_THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_THEME.colors.primary]} />}
      >
        
        {stats.pendingApprovals > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(admin)/approvals')}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconWrap}>
              <MaterialCommunityIcons name="shield-alert" size={22} color="#E65100" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertSub}>Tap to review requests</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#E65100" />
          </TouchableOpacity>
        )}

        {stats.pendingApprovals === 0 && (
          <View style={styles.allClearBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#2E7D32" />
            <Text style={styles.allClearText}>All caught up — no pending approvals</Text>
          </View>
        )}

      
        <View style={styles.grid}>
          {summaryCards.map(({ label, value, icon, color, bg, onPress }) => (
            <TouchableOpacity key={label} style={[styles.card, CARD_SHADOW]} onPress={onPress} activeOpacity={0.75}>
              <View style={[styles.cardIconWrap, { backgroundColor: bg }]}>
                <MaterialCommunityIcons name={icon} size={22} color={color} />
              </View>
              <Text style={[styles.cardValue, { color }]}>{value}</Text>
              <Text style={styles.cardLabel}>{label}</Text>
              <View style={styles.cardArrow}>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#CCCCCC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          {[
            { label: 'Approvals', icon: 'shield-check-outline', route: '/(admin)/approvals', color: '#E65100', bg: '#FFF3E0' },
            { label: 'Organizations', icon: 'office-building-outline', route: '/(admin)/organizations', color: APP_THEME.colors.primary, bg: APP_THEME.colors.primaryContainer },
            { label: 'Leaderboard', icon: 'trophy-outline', route: '/(admin)/leaderboard', color: '#F9A825', bg: '#FFFDE7' },
          ].map(({ label, icon, route, color, bg }) => (
            <TouchableOpacity
              key={label}
              style={[styles.actionChip, { backgroundColor: bg }]}
              onPress={() => router.push(route)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name={icon} size={18} color={color} />
              <Text style={[styles.actionChipText, { color }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        
        <Text style={styles.sectionTitle}>RECENT REQUESTS</Text>
        {recentRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="inbox-outline" size={32} color="#CCCCCC" />
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        ) : (
          recentRequests.map((req) => {
            const statusStyle = getStatusColor(req.status);
            return (
              <TouchableOpacity
                key={req.id}
                style={[styles.requestCard, CARD_SHADOW]}
                onPress={() => router.push('/(admin)/approvals')}
                activeOpacity={0.75}
              >
                <View style={[styles.reqIconWrap, { backgroundColor: '#F5F5F5' }]}>
                  <MaterialCommunityIcons name={getEntityIcon(req.entity_type)} size={18} color="#888" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqName} numberOfLines={1}>{req.entity_name || req.entity_type}</Text>
                  <View style={styles.reqMeta}>
                    <MaterialCommunityIcons name={getChangeIcon(req.change_type)} size={12} color="#AAAAAA" />
                    <Text style={styles.reqMetaText}>
                      {req.change_type} · {req.entity_type}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                    {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  greeting: { fontSize: 12, fontWeight: '700', color: APP_THEME.colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  screenTitle: { fontSize: 28, fontWeight: '900', color: APP_THEME.colors.secondary, marginTop: 2 },
  menuBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW },
  scrollContent: { paddingHorizontal: SPACING.md, paddingBottom: 40 },

  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 14, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: '#FFB74D' },
  alertIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#E65100' },
  alertSub: { fontSize: 11, color: '#E65100', opacity: 0.7, marginTop: 2 },
  allClearBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm },
  allClearText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SPACING.md },
  card: { width: '47%', backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.md, gap: 6 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardValue: { fontSize: 30, fontWeight: '900' },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#AAAAAA' },
  cardArrow: { position: 'absolute', top: SPACING.md, right: SPACING.md },

  sectionTitle: { fontSize: 11, fontWeight: '800', color: APP_THEME.colors.primary, letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.md },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, flexWrap: 'wrap' },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: 20 },
  actionChipText: { fontSize: 13, fontWeight: '700' },

  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.xs },
  reqIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reqName: { fontSize: 14, fontWeight: '700', color: APP_THEME.colors.onSurface },
  reqMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  reqMetaText: { fontSize: 11, color: '#AAAAAA' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '800' },

  emptyCard: { backgroundColor: '#FFF', borderRadius: 14, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic' },
});
