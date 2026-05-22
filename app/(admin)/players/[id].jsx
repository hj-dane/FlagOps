// app/(admin)/players/[id].jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, useTheme, TextInput, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { playersAtom, teamsAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];
const STAT_LABELS = [
  { key: 'tds', label: 'Touchdowns' },
  { key: 'ints', label: 'Interceptions' },
  { key: 'flags_pulled', label: 'Flags Pulled' },
  { key: 'sacks', label: 'Sacks' },
];

export default function AdminPlayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [players, setPlayers] = useAtom(playersAtom);
  const [teams] = useAtom(teamsAtom);

  const [player, setPlayer] = useState(() => players.find((p) => p.id === id) || null);
  const [loading, setLoading] = useState(!player);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');

  // Reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const [statSummary, setStatSummary] = useState({ tds: 0, ints: 0, flags_pulled: 0, sacks: 0 });

  const fetchPlayer = useCallback(async () => {
    setLoading(true);
    try {
      const [playerRes, statsRes] = await Promise.all([
        supabase
          .from('players')
          .select('id, name, jersey_number, position, status, role, team_id, teams(name, organizations(name))')
          .eq('id', id)
          .single(),
        supabase
          .from('match_stats')
          .select('stat_type, value')
          .eq('player_id', id),
      ]);

      if (playerRes.error) throw playerRes.error;
      setPlayer(playerRes.data);
      setName(playerRes.data.name || '');
      setJerseyNumber(String(playerRes.data.jersey_number ?? ''));
      setPosition(playerRes.data.position || '');

      const stats = statsRes.data || [];
      setStatSummary({
        tds: stats.filter((s) => s.stat_type?.toLowerCase() === 'td').reduce((acc, s) => acc + (s.value || 1), 0),
        ints: stats.filter((s) => s.stat_type?.toLowerCase() === 'int').reduce((acc, s) => acc + (s.value || 1), 0),
        flags_pulled: stats.filter((s) => s.stat_type?.toLowerCase() === 'flag pulled').reduce((acc, s) => acc + (s.value || 1), 0),
        sacks: stats.filter((s) => s.stat_type?.toLowerCase() === 'sack').reduce((acc, s) => acc + (s.value || 1), 0),
      });
    } catch (err) {
      console.error('fetchPlayer error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPlayer(); }, [fetchPlayer]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        name: name.trim(),
        jersey_number: parseInt(jerseyNumber) || null,
        position: position || null,
      };
      const { error } = await supabase.from('players').update(updates).eq('id', id);
      if (error) throw error;

      const updated = { ...player, ...updates };
      setPlayer(updated);
      setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
      setEditing(false);
      Alert.alert('Saved', 'Admin override applied.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Admin can reassign player to any team across any org directly
  const handleReassign = async () => {
    if (!selectedTeamId || selectedTeamId === player.team_id) {
      Alert.alert('Select a different team');
      return;
    }
    const newTeam = teams.find((t) => t.id === selectedTeamId);
    setReassigning(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ team_id: selectedTeamId })
        .eq('id', id);
      if (error) throw error;

      const updated = { ...player, team_id: selectedTeamId, teams: newTeam };
      setPlayer(updated);
      setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, team_id: selectedTeamId } : p));
      setShowReassignModal(false);
      Alert.alert('Reassigned', `Player moved to ${newTeam?.name}.`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reassign player.');
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Player not found.</Text>
      </View>
    );
  }

  const statusLabel = player.status
    ? player.status.charAt(0).toUpperCase() + player.status.slice(1)
    : 'Active';

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <ScreenHeader title="Player" onBack={() => router.back()} />

      <Surface style={[styles.heroCard, CARD_SHADOW]} elevation={0}>
        <View style={styles.heroTop}>
          <View style={styles.jerseyCircle}>
            <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>#{player.jersey_number ?? '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{player.name}</Text>
            <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
              {player.position || 'No position'} · {player.teams?.name || 'No team'}
            </Text>
            {player.teams?.organizations?.name && (
              <Text style={[styles.heroOrg, { color: theme.colors.onSurfaceVariant }]}>
                {player.teams.organizations.name}
              </Text>
            )}
          </View>
          <StatusPill status={statusLabel} />
        </View>

        <Divider style={{ marginVertical: SPACING.sm }} />

        {editing ? (
          <View style={styles.editForm}>
            <TextInput label="Full Name" value={name} onChangeText={setName}
              mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface} style={styles.formInput} />
            <TextInput label="Jersey Number" value={jerseyNumber} onChangeText={(v) => setJerseyNumber(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric" mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface} style={styles.formInput} />

            <Text style={styles.pickerLabel}>Position</Text>
            <View style={styles.positionRow}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity key={pos} onPress={() => setPosition(pos)}
                  style={[styles.posPill, { backgroundColor: position === pos ? theme.colors.primary : '#F0F0F0' }]}>
                  <Text style={[styles.posPillText, { color: position === pos ? '#FFF' : '#888' }]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editActions}>
              <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving}
                buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}>Save Override</Button>
              <Button mode="outlined" onPress={() => { setEditing(false); setName(player.name); setJerseyNumber(String(player.jersey_number ?? '')); setPosition(player.position || ''); }}
                style={{ flex: 1 }} textColor={theme.colors.onSurface}>Cancel</Button>
            </View>
          </View>
        ) : (
          <View style={styles.displayFields}>
            {[
              { label: 'Name', value: player.name },
              { label: 'Jersey #', value: `#${player.jersey_number ?? '—'}` },
              { label: 'Position', value: player.position || '—' },
              { label: 'Team', value: player.teams?.name || '—' },
              { label: 'Role', value: player.role || 'None' },
            ].map(({ label, value }) => (
              <View key={label} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>{value}</Text>
              </View>
            ))}
            <View style={styles.actionBtns}>
              <Button mode="outlined" icon="pencil" onPress={() => setEditing(true)}
                textColor={theme.colors.primary} style={{ flex: 1 }}>Admin Override Edit</Button>
              <Button mode="outlined" icon="swap-horizontal" onPress={() => setShowReassignModal(true)}
                textColor={theme.colors.primary} style={{ flex: 1 }}>Reassign Team</Button>
            </View>
          </View>
        )}
      </Surface>

      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Career Stats</Text>
      <View style={styles.statsGrid}>
        {STAT_LABELS.map(({ key, label }) => (
          <Surface key={key} style={[styles.statCard, CARD_SHADOW]} elevation={0}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{statSummary[key] ?? 0}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </Surface>
        ))}
      </View>

      {/* Reassign Modal — admin can move to any team across any org */}
      <Modal visible={showReassignModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Reassign Player</Text>
              <Text style={styles.modalSub}>Admin override — takes effect immediately</Text>
              <Divider style={{ marginVertical: SPACING.md }} />
              <ScrollView style={{ maxHeight: 300 }}>
                {teams.map((t) => (
                  <TouchableOpacity key={t.id} onPress={() => setSelectedTeamId(t.id)}
                    style={[styles.teamOption, selectedTeamId === t.id && { backgroundColor: theme.colors.primaryContainer }]}>
                    <View>
                      <Text style={[styles.teamOptionText, { color: theme.colors.onSurface }]}>{t.name}</Text>
                      <Text style={styles.teamOptionOrg}>{t.organizations?.name || ''}</Text>
                    </View>
                    {selectedTeamId === t.id && (
                      <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleReassign} loading={reassigning}
                  disabled={reassigning || !selectedTeamId}
                  buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}>Reassign</Button>
                <Button mode="outlined" onPress={() => setShowReassignModal(false)}
                  style={{ flex: 1 }} textColor={theme.colors.onSurface}
                  contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, paddingBottom: 60, gap: SPACING.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderRadius: 16, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: '#1C2437', marginBottom: SPACING.sm, backgroundColor: '#FFF' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  jerseyCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#00E67618', alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 16, fontWeight: '900' },
  heroName: { fontSize: 20, fontWeight: '800' },
  heroSub: { fontSize: 12, marginTop: 2 },
  heroOrg: { fontSize: 11, marginTop: 1, fontStyle: 'italic' },
  editForm: { gap: SPACING.sm },
  formInput: { backgroundColor: '#FFF' },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5 },
  positionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  posPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  posPillText: { fontSize: 12, fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: SPACING.sm },
  displayFields: { gap: SPACING.xs },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  fieldLabel: { fontSize: 12, color: '#AAAAAA', fontWeight: '600' },
  fieldValue: { fontSize: 14, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { borderRadius: 12, padding: SPACING.md, alignItems: 'center', minWidth: '28%', flex: 1, borderWidth: 1, borderColor: '#1C2437', backgroundColor: '#FFF' },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  teamOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: 10, marginBottom: SPACING.xs },
  teamOptionText: { fontSize: 14, fontWeight: '600' },
  teamOptionOrg: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
