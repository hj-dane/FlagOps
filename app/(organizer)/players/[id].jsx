import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, ActivityIndicator, useTheme, TextInput, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { playersAtom, teamsAtom, userProfileAtom } from '../../../store/globalStore';
import { APP_THEME, SPACING, CARD_SHADOW } from '../../../theme';
import StatusPill from '../../../components/StatusPill';
import ScreenHeader from '../../../components/ScreenHeader';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];

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
  const profile = useAtomValue(userProfileAtom);

  const [players, setPlayers] = useAtom(playersAtom);
  const [teams] = useAtom(teamsAtom);

  const [player, setPlayer] = useState(() => players.find((p) => p.id === id) || null);
  const [loading, setLoading] = useState(!player);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [editingField, setEditingField] = useState(null); 
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');

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
          .select('id, name, jersey_number, position, status, role, team_id, teams(name)')
          .eq('id', id)
          .single(),
        supabase
          .from('match_stats')
          .select('stat_type, value')
          .eq('player_id', id),
      ]);

      if (playerRes.error) throw playerRes.error;
      setPlayer(playerRes.data);
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

  const saveInlineField = async (field, value) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;

      const updated = { ...player, [field]: value };
      setPlayer(updated);
      setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
      setEditingField(null);
    } catch (err) {
      Alert.alert('Error', 'Could not save change.');
    } finally {
      setSaving(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedTeamId || selectedTeamId === player.team_id) {
      Alert.alert('Select a different team');
      return;
    }
    const newTeam = teams.find((t) => t.id === selectedTeamId);
    setReassigning(true);
    try {
      const { error } = await supabase.from('approval_requests').insert({
        entity_type: 'player',
        entity_id: id,
        entity_name: player.name,
        change_type: 'edit',
        status: 'pending',
        current_data: { team_id: player.team_id, team_name: player.teams?.name },
        proposed_data: { team_id: selectedTeamId, team_name: newTeam?.name },
      });
      if (error) throw error;
      setShowReassignModal(false);
      Alert.alert('Submitted', 'Team reassignment is pending admin approval.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit reassignment.');
    } finally {
      setReassigning(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Player', `Remove ${player?.name}? This requires admin approval.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit Request', style: 'destructive', onPress: async () => {
          setRemoving(true);
          try {
            const { error } = await supabase.from('approval_requests').insert({
              entity_type: 'player',
              entity_id: id,
              entity_name: player.name,
              change_type: 'delete',
              status: 'pending',
              current_data: {
                name: player.name,
                jersey_number: player.jersey_number,
                team_id: player.team_id,
              },
              proposed_data: {},
            });
            if (error) throw error;
            Alert.alert('Submitted', 'Removal request sent to admin.');
            router.back();
          } catch (err) {
            Alert.alert('Error', 'Could not submit removal request.');
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
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
        <Text style={styles.errorText}>Player not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pillStatus = player.status
    ? player.status.charAt(0).toUpperCase() + player.status.slice(1).toLowerCase()
    : 'Pending';

  const orgTeams = teams.filter((t) => t.status === 'active' || t.status === 'Active');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Player Profile" onBack={() => router.back()} />

      <View style={[styles.profileHeaderCard, CARD_SHADOW]}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarJerseyText}>#{player.jersey_number || '00'}</Text>
        </View>
        <Text style={styles.playerNameText}>{player.name}</Text>
        <Text style={styles.playerSubText}>
          {player.position || 'No Position'} • {player.teams?.name || 'No Team'}
        </Text>
        <View style={{ marginTop: 12 }}>
          <StatusPill status={pillStatus} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Details</Text>
      <View style={[styles.detailCard, CARD_SHADOW]}>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Jersey Number</Text>
          {editingField === 'jerseyNumber' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={jerseyNumber}
                onChangeText={(v) => setJerseyNumber(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                mode="outlined" dense style={styles.inlineInput}
                textColor={theme.colors.onSurface}
                activeOutlineColor={theme.colors.primary}
                outlineColor="#EEEEEE"
              />
              <TouchableOpacity onPress={() => saveInlineField('jersey_number', parseInt(jerseyNumber) || 0)} style={styles.saveIcon} disabled={saving}>
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingField(null); setJerseyNumber(String(player.jersey_number ?? '')); }} style={styles.saveIcon}>
                <MaterialCommunityIcons name="close" size={20} color="#AAAAAA" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.inlineDisplayRow} onPress={() => setEditingField('jerseyNumber')}>
              <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>#{player.jersey_number ?? '—'}</Text>
              <MaterialCommunityIcons name="pencil-outline" size={14} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Position</Text>
          {editingField === 'position' ? (
            <View style={styles.positionPills}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity key={pos}
                  onPress={() => { setPosition(pos); saveInlineField('position', pos); }}
                  style={[styles.posPill, { backgroundColor: position === pos ? theme.colors.primary : '#F0F0F0' }]}>
                  <Text style={[styles.posPillText, { color: position === pos ? '#FFF' : '#888' }]}>{pos}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setEditingField(null)} style={styles.saveIcon}>
                <MaterialCommunityIcons name="close" size={20} color="#AAAAAA" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.inlineDisplayRow} onPress={() => setEditingField('position')}>
              <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{player.position || '—'}</Text>
              <MaterialCommunityIcons name="pencil-outline" size={14} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Team</Text>
          <TouchableOpacity style={styles.inlineDisplayRow} onPress={() => setShowReassignModal(true)}>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{player.teams?.name || '—'}</Text>
            <MaterialCommunityIcons name="swap-horizontal" size={14} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Season Stats</Text>
      <View style={styles.statsGrid}>
        <StatTile label="TDs" value={statSummary.tds} />
        <StatTile label="INTs" value={statSummary.ints} />
        <StatTile label="Flags Pulled" value={statSummary.flags_pulled} />
        <StatTile label="Sacks" value={statSummary.sacks} />
      </View>

      <Divider style={{ marginVertical: SPACING.md }} />
      <Button
        mode="outlined"
        onPress={handleRemove}
        loading={removing}
        disabled={removing}
        textColor={theme.colors.error}
        style={[styles.removeBtn, { borderColor: theme.colors.error }]}
        icon="account-remove-outline"
      >
        Request Player Removal
      </Button>

      <Modal visible={showReassignModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Reassign to Team</Text>
              <Text style={styles.modalSub}>Requires admin approval</Text>
              <Divider style={{ marginVertical: SPACING.md }} />
              <ScrollView style={{ maxHeight: 280 }}>
                {orgTeams.map((t) => (
                  <TouchableOpacity key={t.id}
                    onPress={() => setSelectedTeamId(t.id)}
                    style={[styles.teamOption, selectedTeamId === t.id && { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.teamOptionText, { color: theme.colors.onSurface }]}>{t.name}</Text>
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
                  contentStyle={{ paddingVertical: 4 }}>Submit Request</Button>
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
  container: { flex: 1, backgroundColor: APP_THEME.colors.background, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_THEME.colors.background, padding: 24 },
  profileHeaderCard: { backgroundColor: '#FFF', borderRadius: APP_THEME.roundness, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: APP_THEME.colors.outline, marginBottom: 20 },
  avatarBadge: { width: 64, height: 64, borderRadius: 16, backgroundColor: APP_THEME.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: APP_THEME.colors.outline, marginBottom: 12 },
  avatarJerseyText: { fontSize: 20, fontWeight: '900', color: APP_THEME.colors.primary },
  playerNameText: { fontSize: 22, fontWeight: '900', color: APP_THEME.colors.secondary, textAlign: 'center' },
  playerSubText: { fontSize: 13, color: APP_THEME.colors.onSurfaceVariant, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  detailCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, minHeight: 52 },
  detailLabel: { fontSize: 12, color: '#AAAAAA', fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: '700', marginRight: 6 },
  inlineEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  inlineInput: { backgroundColor: '#FFF', height: 36, width: 80 },
  saveIcon: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8 },
  inlineDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  positionPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  posPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  posPillText: { fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SPACING.md },
  statTile: { width: '47%', flexGrow: 1, backgroundColor: '#FFF', borderRadius: APP_THEME.roundness, padding: 16, borderWidth: 1, borderColor: APP_THEME.colors.outline, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '900', color: APP_THEME.colors.secondary },
  statLabel: { fontSize: 10, fontWeight: '700', color: APP_THEME.colors.onSurfaceVariant, marginTop: 4, letterSpacing: 0.5 },
  removeBtn: { borderRadius: 12, marginBottom: SPACING.xl },
  errorText: { fontSize: 15, color: APP_THEME.colors.onSurfaceVariant, fontWeight: '600', marginTop: 12, marginBottom: 16, textAlign: 'center' },
  backBtn: { backgroundColor: APP_THEME.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: APP_THEME.roundness },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  teamOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: 10, marginBottom: SPACING.xs },
  teamOptionText: { fontSize: 14, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
