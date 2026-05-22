// app/(organizer)/tournaments/[id].jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, useTheme, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { tournamentsAtom } from '../../../store/globalStore';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const LEVELS = ['National', 'Local', 'Intercollegiate', 'Intramurals'];
const TYPES = ['Single Elimination', 'Double Elimination', 'Round Robin', 'League'];

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const [tournaments, setTournaments] = useAtom(tournamentsAtom);

  const [tournament, setTournament] = useState(() => tournaments.find((t) => t.id === id) || null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(!tournament);

  const [hasPendingEdit, setHasPendingEdit] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTournament = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setTournament(data);
      initEditForm(data);

      // Check for a pending edit request
      const { data: pendingReq } = await supabase
        .from('approval_requests')
        .select('id')
        .eq('entity_id', id)
        .eq('entity_type', 'tournament')
        .eq('change_type', 'edit')
        .eq('status', 'pending')
        .maybeSingle();
      setHasPendingEdit(!!pendingReq);

      // Fetch matches for this tournament
      const { data: matchData } = await supabase
        .from('matches')
        .select('id, home_team_name, away_team_name, date_time, status')
        .eq('tournament_id', id)
        .order('date_time', { ascending: true });
      setMatches(matchData || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load tournament.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTournament(); }, [fetchTournament]);

  const initEditForm = (data) => {
    setEditForm({
      name: data.name || '',
      startDate: data.start_date || '',
      endDate: data.end_date || '',
      location: data.location || '',
      description: data.description || '',
      type: data.type || TYPES[0],
      level: data.level || LEVELS[0],
    });
  };

  // Submit edit as a change_request (pending admin approval)
  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('approval_requests').insert({
        entity_type: 'tournament',
        entity_id: id,
        entity_name: editForm.name.trim(),
        change_type: 'edit',
        status: 'pending',
        current_data: {
          name: tournament.name,
          start_date: tournament.start_date,
          end_date: tournament.end_date,
          location: tournament.location,
          description: tournament.description,
          type: tournament.type,
          level: tournament.level,
        },
        proposed_data: {
          name: editForm.name.trim(),
          start_date: editForm.startDate.trim(),
          end_date: editForm.endDate.trim() || null,
          location: editForm.location.trim() || null,
          description: editForm.description.trim() || null,
          type: editForm.type,
          level: editForm.level,
        },
      });
      if (error) throw error;
      setHasPendingEdit(true);
      setShowEditModal(false);
      Alert.alert('Submitted', 'Your edit is pending admin approval. Current values are still shown.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit edit request.');
    } finally {
      setSaving(false);
    }
  };

  // Submit cancellation request
  const handleCancelTournament = () => {
    Alert.alert('Cancel Tournament', `Request to cancel "${tournament?.name}"? This requires admin approval.`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Submit Request', style: 'destructive', onPress: async () => {
          setCancelling(true);
          try {
            const { error } = await supabase.from('approval_requests').insert({
              entity_type: 'tournament',
              entity_id: id,
              entity_name: tournament.name,
              change_type: 'delete',
              status: 'pending',
              current_data: { name: tournament.name, status: tournament.status },
              proposed_data: { status: 'canceled' },
            });
            if (error) throw error;
            Alert.alert('Submitted', 'Cancellation request sent to admin.');
          } catch (err) {
            Alert.alert('Error', 'Could not submit cancellation request.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Tournament not found.</Text>
      </View>
    );
  }

  const statusLabel = tournament.status
    ? tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)
    : 'Pending';

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Tournament" onBack={() => router.back()} />

      {hasPendingEdit && (
        <View style={styles.pendingBanner}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#E65100" />
          <Text style={styles.pendingBannerText}>An edit is pending admin approval — current approved values shown</Text>
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, CARD_SHADOW]}>
        <View style={styles.infoHeaderRow}>
          <StatusPill status={statusLabel} />
          {!hasPendingEdit && tournament.status !== 'canceled' && tournament.status !== 'Canceled' && (
            <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.editBtnText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <Divider style={{ marginVertical: SPACING.sm }} />

        <Text style={[styles.tournamentTitle, { color: theme.colors.onSurface }]}>{tournament.name}</Text>

        {[
          { label: 'Start Date', value: tournament.start_date || '—' },
          { label: 'End Date', value: tournament.end_date || '—' },
          { label: 'Location', value: tournament.location || '—' },
          { label: 'Level', value: tournament.level || '—' },
          { label: 'Type', value: tournament.type || '—' },
          { label: 'Description', value: tournament.description || '—' },
        ].map(({ label, value }) => (
          <View key={label} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Matches */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Matches ({matches.length})</Text>
      {matches.length === 0 ? (
        <Text style={styles.emptyText}>No matches in this tournament yet</Text>
      ) : (
        matches.map((m) => {
          const mStatus = m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : 'Upcoming';
          return (
            <TouchableOpacity key={m.id}
              onPress={() => router.push({ pathname: '/(organizer)/matches/[id]', params: { id: m.id } })}
              activeOpacity={0.7}>
              <View style={[styles.matchCard, CARD_SHADOW]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.matchTeams, { color: theme.colors.onSurface }]}>
                    {m.home_team_name} vs {m.away_team_name}
                  </Text>
                  <Text style={styles.matchDate}>{m.date_time ? new Date(m.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Text>
                </View>
                <StatusPill status={mStatus} />
                <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Cancel button */}
      {tournament.status !== 'canceled' && tournament.status !== 'Canceled' && (
        <Button
          mode="outlined"
          onPress={handleCancelTournament}
          loading={cancelling}
          disabled={cancelling}
          textColor={theme.colors.error}
          style={[styles.cancelBtn, { borderColor: theme.colors.error }]}
          icon="cancel"
        >
          Request Cancellation
        </Button>
      )}

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Edit Tournament</Text>
              <Text style={styles.modalSub}>Changes require admin approval</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              {[
                { label: 'Tournament Name *', key: 'name' },
                { label: 'Start Date (YYYY-MM-DD)', key: 'startDate' },
                { label: 'End Date (YYYY-MM-DD)', key: 'endDate' },
                { label: 'Location', key: 'location' },
                { label: 'Description', key: 'description' },
              ].map(({ label, key }) => (
                <TextInput
                  key={key}
                  label={label}
                  value={editForm[key] || ''}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, [key]: v }))}
                  mode="outlined"
                  outlineColor="#EEEEEE"
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  style={styles.formInput}
                  multiline={key === 'description'}
                  numberOfLines={key === 'description' ? 2 : 1}
                />
              ))}

              <Text style={styles.pickerLabel}>Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity key={l} onPress={() => setEditForm((f) => ({ ...f, level: l }))}
                    style={[styles.pill, { backgroundColor: editForm.level === l ? theme.colors.primary : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: editForm.level === l ? '#FFF' : '#888' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity key={t} onPress={() => setEditForm((f) => ({ ...f, type: t }))}
                    style={[styles.pill, { backgroundColor: editForm.type === t ? theme.colors.primary : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: editForm.type === t ? '#FFF' : '#888' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleSaveEdit} loading={saving} disabled={saving}
                  buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}>Submit Edit</Button>
                <Button mode="outlined" onPress={() => { setShowEditModal(false); initEditForm(tournament); }}
                  style={{ flex: 1 }} textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: SPACING.sm, borderRadius: 10, gap: SPACING.xs, marginBottom: SPACING.md },
  pendingBannerText: { fontSize: 12, color: '#E65100', fontWeight: '600', flex: 1 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.lg },
  infoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  tournamentTitle: { fontSize: 20, fontWeight: '800', marginBottom: SPACING.sm },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  fieldLabel: { fontSize: 12, color: '#AAAAAA', fontWeight: '600' },
  fieldValue: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.sm },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: 8 },
  matchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: SPACING.sm, gap: SPACING.sm, marginBottom: SPACING.xs },
  matchTeams: { fontSize: 14, fontWeight: '700' },
  matchDate: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  cancelBtn: { borderRadius: 12, marginTop: SPACING.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFF', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { gap: SPACING.xs, marginBottom: SPACING.sm },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
