import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { Text, useTheme, FAB, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { matchesAtom, tournamentsAtom, teamsAtom, userProfileAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import { SPACING, CARD_SHADOW } from '../../../theme';
import StatusPill from '../../../components/StatusPill';
import ScreenHeader from '../../../components/ScreenHeader';

const FILTER_TABS = ['All', 'Upcoming', 'Live', 'Completed'];

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '—';
  const d = new Date(dateTimeStr);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

function toISODateTime(date, time) {
  if (!date) return null;
  const combined = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  return new Date(combined).toISOString();
}

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  const [matches, setMatches] = useAtom(matchesAtom);
  const [tournaments, setTournaments] = useAtom(tournamentsAtom);
  const [teams] = useAtom(teamsAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    tournamentId: '', homeTeamId: '', awayTeamId: '',
    date: '', time: '', location: '',
  });

  const fetchMatches = useCallback(async () => {
    if (!profile?.organization_id) return;
    setIsLoading(true);
    const [matchRes, tournamentRes] = await Promise.all([
      supabase
        .from('matches')
        .select('id, home_team_name, away_team_name, date_time, location, status, tournament_id, home_score, away_score')
        .eq('organization_id', profile.organization_id)
        .order('date_time', { ascending: false }),
      supabase
        .from('tournaments')
        .select('id, name, status')
        .eq('organization_id', profile.organization_id)
        .order('start_date', { ascending: false }),
    ]);
    if (!matchRes.error) setMatches(matchRes.data || []);
    if (!tournamentRes.error) setTournaments(tournamentRes.data || []);
    setIsLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => { fetchMatches(); }, [fetchMatches])
  );

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'All') return matches;
    return matches.filter((m) => m.status?.toLowerCase() === activeFilter.toLowerCase());
  }, [matches, activeFilter]);

  const handleAddMatch = async () => {
    if (!form.homeTeamId || !form.awayTeamId) { Alert.alert('Both teams required'); return; }
    if (form.homeTeamId === form.awayTeamId) { Alert.alert('Teams must be different'); return; }
    if (!form.date.trim()) { Alert.alert('Date required'); return; }

    const homeTeam = teams.find((t) => t.id === form.homeTeamId);
    const awayTeam = teams.find((t) => t.id === form.awayTeamId);
    const dateTime = toISODateTime(form.date.trim(), form.time.trim());

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          tournament_id: form.tournamentId || null,
          home_team_id: form.homeTeamId,
          away_team_id: form.awayTeamId,
          home_team_name: homeTeam?.name || '',
          away_team_name: awayTeam?.name || '',
          date_time: dateTime,
          location: form.location.trim() || null,
          organization_id: profile.organization_id,
          status: 'upcoming',
          home_score: 0,
          away_score: 0,
        })
        .select()
        .single();
      if (error) throw error;
      setMatches((prev) => [data, ...prev]);
      setShowAddModal(false);
      setForm({ tournamentId: '', homeTeamId: '', awayTeamId: '', date: '', time: '', location: '' });
      Alert.alert('Match added', 'Match has been scheduled.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add match.');
    } finally {
      setAdding(false);
    }
  };

  const renderMatch = ({ item }) => {
    const isLive = item.status === 'live';
    const isUpcoming = item.status === 'upcoming';
    const statusLabel = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
      : 'Upcoming';

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(organizer)/matches/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.card, CARD_SHADOW, isLive && styles.liveCard]}>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.matchup, { color: theme.colors.onSurface }]}>
                {item.home_team_name} vs {item.away_team_name}
              </Text>
              <Text style={styles.matchMeta}>
                {formatDateTime(item.date_time)}
                {item.location ? ` · ${item.location}` : ''}
              </Text>
              {isLive && (
                <Text style={styles.scoreText}>
                  {item.home_score ?? 0} – {item.away_score ?? 0}
                </Text>
              )}
            </View>
            <StatusPill status={statusLabel} />
          </View>
          {isUpcoming && (
            <Button
              mode="contained"
              onPress={() => router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: item.id } })}
              style={styles.startBtn}
              buttonColor={theme.colors.primary}
              textColor="#FFF"
              compact
            >
              Start Match
            </Button>
          )}
          {isLive && (
            <Button
              mode="contained"
              onPress={() => router.push({ pathname: '/(organizer)/matches/live/[id]', params: { id: item.id } })}
              style={styles.startBtn}
              buttonColor="#E53935"
              textColor="#FFF"
              compact
            >
              Resume Live
            </Button>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const activeTeams = teams.filter((t) => t.status === 'active' || t.status === 'Active');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Matches" />

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveFilter(tab)}
            style={[styles.filterTab, activeFilter === tab && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
          >
            <Text style={[styles.filterTabText, { color: activeFilter === tab ? '#FFF' : '#888' }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          refreshing={isLoading}
          onRefresh={fetchMatches}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="whistle-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>{activeFilter === 'All' ? 'No matches yet' : `No ${activeFilter.toLowerCase()} matches`}</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFF"
        onPress={() => setShowAddModal(true)}
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Schedule Match</Text>
              <Text style={styles.modalSub}>Organizers can schedule matches directly</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <Text style={styles.pickerLabel}>Tournament (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                <TouchableOpacity
                  onPress={() => setForm((f) => ({ ...f, tournamentId: '' }))}
                  style={[styles.pill, { backgroundColor: !form.tournamentId ? '#333' : '#F0F0F0' }]}
                >
                  <Text style={[styles.pillText, { color: !form.tournamentId ? '#FFF' : '#888' }]}>None</Text>
                </TouchableOpacity>
                {tournaments.map((t) => (
                  <TouchableOpacity key={t.id} onPress={() => setForm((f) => ({ ...f, tournamentId: t.id }))}
                    style={[styles.pill, { backgroundColor: form.tournamentId === t.id ? '#333' : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: form.tournamentId === t.id ? '#FFF' : '#888' }]} numberOfLines={1}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Home Team *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {activeTeams.length === 0 ? (
                  <Text style={styles.noTeamsText}>No active teams available</Text>
                ) : (
                  activeTeams.map((t) => (
                    <TouchableOpacity key={t.id} onPress={() => setForm((f) => ({ ...f, homeTeamId: t.id }))}
                      style={[styles.pill, { backgroundColor: form.homeTeamId === t.id ? '#333' : '#F0F0F0' }]}>
                      <Text style={[styles.pillText, { color: form.homeTeamId === t.id ? '#FFF' : '#888' }]}>{t.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Text style={styles.pickerLabel}>Away Team *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {activeTeams.map((t) => (
                  <TouchableOpacity key={t.id} onPress={() => setForm((f) => ({ ...f, awayTeamId: t.id }))}
                    style={[styles.pill, { backgroundColor: form.awayTeamId === t.id ? '#333' : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: form.awayTeamId === t.id ? '#FFF' : '#888' }]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput label="Date (YYYY-MM-DD) *" value={form.date}
                onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />
              <TextInput label="Time (HH:MM)" value={form.time}
                onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />
              <TextInput label="Location" value={form.location}
                onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />

              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleAddMatch} loading={adding} disabled={adding}
                  buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}>Add Match</Button>
                <Button mode="outlined" onPress={() => setShowAddModal(false)} style={{ flex: 1 }}
                  textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  list: { paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.md, overflow: 'hidden' },
  liveCard: { borderWidth: 1.5, borderColor: '#E53935' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#E53935', letterSpacing: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matchup: { fontSize: 15, fontWeight: '700' },
  matchMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  scoreText: { fontSize: 18, fontWeight: '900', color: '#E53935', marginTop: 4 },
  startBtn: { marginTop: 12, borderRadius: 8 },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 14, color: '#AAAAAA', fontStyle: 'italic' },
  fab: { position: 'absolute', right: SPACING.md, bottom: SPACING.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFF', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { gap: SPACING.xs, marginBottom: SPACING.sm },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  noTeamsText: { fontSize: 12, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: 6 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
