// app/(organizer)/teams/[id].jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { useAtomValue } from 'jotai';
import { userProfileAtom } from '../../../store/globalStore';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];
const ROLES = ['None', 'Captain', 'Vice-Captain'];

export default function OrganizerTeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState('');
  const [jerseyColor, setJerseyColor] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(false);

  const [deletePending, setDeletePending] = useState(false);
  const [removePendingIds, setRemovePendingIds] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', jerseyNumber: '', position: POSITIONS[0], role: 'None' });
  const [adding, setAdding] = useState(false);

  // ── Fetch team + roster ──
  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .select('id, name, jersey_color, status, organization_id, created_at, organizations(name)')
        .eq('id', id)
        .single();

      if (teamErr) throw teamErr;
      setTeam(teamData);
      setTeamName(teamData.name);
      setJerseyColor(teamData.jersey_color || '');
      setDeletePending(teamData.status === 'pending_delete');

      const { data: players, error: playersErr } = await supabase
        .from('players')
        .select('id, name, jersey_number, position, role, status')
        .eq('team_id', id)
        .order('name', { ascending: true });

      if (playersErr) throw playersErr;
      setRoster(players || []);
    } catch (err) {
      console.error('Error fetching team detail:', err);
      Alert.alert('Error', 'Could not load team data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  // ── Inline field save (direct — no approval needed for minor edits) ──
  const saveField = async (field, value) => {
    setSavingField(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      setTeam((prev) => ({ ...prev, [field]: value }));
      setEditingField(null);
    } catch (err) {
      Alert.alert('Error', 'Could not save change.');
    } finally {
      setSavingField(false);
    }
  };

  // ── Add player (reuse if exists, create if not) ──
  const handleAddPlayer = async () => {
    if (!addForm.name.trim()) { Alert.alert('Name required'); return; }

    setAdding(true);
    try {
      const playerName = addForm.name.trim();
      const orgId = team?.organization_id || profile?.organization_id;

      // Check if player already exists on this team
      const { data: existing } = await supabase
        .from('players')
        .select('id, name, jersey_number, position, status, team_id')
        .eq('team_id', id)
        .ilike('name', playerName)
        .maybeSingle();

      let player = existing;

      if (existing) {
        // Player exists — just link to this org
        const { error: linkErr } = await supabase
          .from('player_organizations')
          .insert({ player_id: existing.id, organization_id: orgId });

        if (linkErr && linkErr.code !== '23505') throw linkErr;
        Alert.alert('Player added', `"${playerName}" already exists and has been linked to your organization.`);
      } else {
        // Check jersey duplicate
        const duplicate = roster.some((p) => String(p.jersey_number) === addForm.jerseyNumber.trim());
        if (duplicate) {
          Alert.alert('Duplicate jersey number', 'That number is already taken on this team.');
          setAdding(false);
          return;
        }

        // Create new player
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert({
            name: playerName,
            jersey_number: Number(addForm.jerseyNumber) || null,
            position: addForm.position,
            role: addForm.role === 'None' ? null : addForm.role,
            team_id: id,
            organization_id: orgId,
            status: 'active',
          })
          .select()
          .single();

        if (error) throw error;
        player = newPlayer;

        // Link to org
        if (orgId) {
          await supabase
            .from('player_organizations')
            .insert({ player_id: newPlayer.id, organization_id: orgId });
        }
        Alert.alert('Player added', `"${playerName}" has been added to the roster.`);
      }

      setRoster((prev) => {
        const exists = prev.find((p) => p.id === player.id);
        return exists ? prev : [...prev, player];
      });
      setShowAddModal(false);
      setAddForm({ name: '', jerseyNumber: '', position: POSITIONS[0], role: 'None' });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add player.');
    } finally {
      setAdding(false);
    }
  };

  // ── Remove player (pending approval) ──
  const handleRemovePlayer = (player) => {
    Alert.alert('Remove Player', `Remove ${player.name}? This requires admin approval.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit Request', style: 'destructive', onPress: async () => {
          try {
            const { error: reqErr } = await supabase
              .from('approval_requests')
              .insert({
                entity_type: 'player',
                entity_id: player.id,
                entity_name: player.name,
                change_type: 'delete',
                status: 'pending',
                current_data: {
                  name: player.name,
                  jersey_number: player.jersey_number,
                  position: player.position,
                  team_id: id,
                },
                proposed_data: {},
              });
            if (reqErr) throw reqErr;
            setRemovePendingIds((prev) => [...prev, player.id]);
          } catch (err) {
            Alert.alert('Error', 'Could not submit removal request.');
          }
        }
      },
    ]);
  };

  // ── Delete team (pending approval) ──
  const handleDeleteTeam = () => {
    Alert.alert('Delete Team', `Delete "${teamName}"? This requires admin approval.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit Request', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .insert({
                entity_type: 'team',
                entity_id: id,
                entity_name: teamName,
                change_type: 'delete',
                status: 'pending',
                organization_id: team?.organization_id || profile?.organization_id,
                current_data: {
                  name: teamName,
                  jersey_color: team?.jersey_color,
                  status: team?.status,
                },
                proposed_data: {},
              });
            if (error) throw error;
            setDeletePending(true);
            Alert.alert('Submitted', 'Deletion request sent to admin for approval.');
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not submit deletion request.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Team not found.</Text>
      </View>
    );
  }

  const statusLabel = deletePending ? 'Pending' : (team.status ? team.status.charAt(0).toUpperCase() + team.status.slice(1) : 'Active');

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Team" onBack={() => router.back()} />

      {deletePending && (
        <View style={styles.alertBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#E65100" />
          <Text style={styles.alertBannerText}>Deletion pending admin approval — team is read-only</Text>
        </View>
      )}

      {/* ── Team Info Card ── */}
      <View style={[styles.infoCard, CARD_SHADOW]}>
        <View style={styles.infoStatusRow}>
          <StatusPill status={statusLabel} />
        </View>
        <Divider style={{ marginVertical: SPACING.sm }} />

        {/* Team Name */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Team Name</Text>
          {editingField === 'name' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={teamName}
                onChangeText={setTeamName}
                mode="outlined"
                dense
                style={styles.inlineInput}
                textColor={theme.colors.onSurface}
                activeOutlineColor={theme.colors.primary}
              />
              <TouchableOpacity
                onPress={() => saveField('name', teamName)}
                style={styles.saveBtn}
                disabled={savingField}
              >
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inlineDisplayRow}>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{teamName}</Text>
              {!deletePending && (
                <TouchableOpacity onPress={() => setEditingField('name')}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#AAAAAA" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Jersey Color */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Jersey Color</Text>
          {editingField === 'color' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={jerseyColor}
                onChangeText={setJerseyColor}
                mode="outlined"
                dense
                style={styles.inlineInput}
                textColor={theme.colors.onSurface}
                activeOutlineColor={theme.colors.primary}
              />
              <TouchableOpacity
                onPress={() => saveField('jersey_color', jerseyColor)}
                style={styles.saveBtn}
                disabled={savingField}
              >
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inlineDisplayRow}>
              <View style={[styles.colorPreview, { backgroundColor: jerseyColor || '#CCCCCC' }]} />
              <Text style={[styles.infoValue, { color: theme.colors.onSurface, marginLeft: 6 }]}>
                {jerseyColor || 'Not set'}
              </Text>
              {!deletePending && (
                <TouchableOpacity onPress={() => setEditingField('color')}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#AAAAAA" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Divider style={{ marginVertical: SPACING.sm }} />
        <View style={styles.metaGrid}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Players</Text>
            <Text style={[styles.metaChipValue, { color: theme.colors.onSurface }]}>{roster.length}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Org</Text>
            <Text style={[styles.metaChipValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {team.organizations?.name || '—'}
            </Text>
          </View>
          <View style={[styles.metaChip, { borderRightWidth: 0 }]}>
            <Text style={styles.metaChipLabel}>Created</Text>
            <Text style={[styles.metaChipValue, { color: theme.colors.onSurface }]}>
              {team.created_at ? new Date(team.created_at).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Roster ── */}
      <View style={styles.rosterHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Roster ({roster.length})</Text>
        {!deletePending && (
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addPlayerBtn, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.addPlayerBtnText}>Add Player</Text>
          </TouchableOpacity>
        )}
      </View>

      {roster.length === 0 ? (
        <View style={styles.emptyRoster}>
          <MaterialCommunityIcons name="account-off-outline" size={40} color="#CCCCCC" />
          <Text style={styles.emptyText}>No players on this team</Text>
        </View>
      ) : (
        roster.map((player) => {
          const isRemovePending = removePendingIds.includes(player.id);
          const playerStatus = isRemovePending ? 'Pending'
            : player.status ? player.status.charAt(0).toUpperCase() + player.status.slice(1) : 'Active';

          return (
            <View key={player.id} style={[styles.playerCard, CARD_SHADOW]}>
              <View style={styles.playerLeft}>
                <View style={[styles.jerseyBadge, { backgroundColor: jerseyColor || '#AAAAAA' }]}>
                  <Text style={styles.jerseyNum}>#{player.jersey_number ?? '—'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{player.name}</Text>
                    {player.role && (
                      <View style={[styles.rolePill, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.rolePillText, { color: theme.colors.onPrimaryContainer }]}>
                          {player.role}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.playerMeta}>{player.position || 'Unassigned'}</Text>
                </View>
              </View>
              <View style={styles.playerRight}>
                <StatusPill status={playerStatus} />
                {!deletePending && !isRemovePending && (
                  <TouchableOpacity onPress={() => handleRemovePlayer(player)} style={styles.removeBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
                {isRemovePending && <Text style={styles.pendingLabel}>Removal pending</Text>}
              </View>
            </View>
          );
        })
      )}

      {!deletePending && (
        <Button
          mode="outlined"
          onPress={handleDeleteTeam}
          textColor={theme.colors.error}
          style={[styles.deleteBtn, { borderColor: theme.colors.error }]}
          icon="trash-can-outline"
        >
          Request Team Deletion
        </Button>
      )}

      {/* Add Player Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add Team Player</Text>
              <Text style={styles.modalSub}>Player will be added to the roster immediately</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <TextInput
                label="Full Name"
                value={addForm.name}
                onChangeText={(val) => setAddForm((f) => ({ ...f, name: val }))}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
              />

              <TextInput
                label="Jersey Number"
                value={addForm.jerseyNumber}
                onChangeText={(val) => setAddForm((f) => ({ ...f, jerseyNumber: val.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
              />

              <Text style={styles.pickerLabel}>Position</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setAddForm((f) => ({ ...f, position: pos }))}
                    style={[styles.pill, { backgroundColor: addForm.position === pos ? theme.colors.primary : '#F0F0F0' }]}
                  >
                    <Text style={[styles.pillText, { color: addForm.position === pos ? '#FFFFFF' : '#888888' }]}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setAddForm((f) => ({ ...f, role }))}
                    style={[styles.pill, { backgroundColor: addForm.role === role ? theme.colors.primary : '#F0F0F0' }]}
                  >
                    <Text style={[styles.pillText, { color: addForm.role === role ? '#FFFFFF' : '#888888' }]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleAddPlayer}
                  loading={adding}
                  disabled={adding}
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                  style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Submit Request
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                  textColor={theme.colors.onSurface}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.xl * 2 },
  screen: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: SPACING.md },
  backText: { fontSize: 14, fontWeight: '700' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: SPACING.sm, borderRadius: 10, gap: SPACING.xs, marginBottom: SPACING.md },
  alertBannerText: { fontSize: 12, color: '#E65100', fontWeight: '600', flex: 1 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.lg },
  infoStatusRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  infoRow: { marginVertical: SPACING.xs },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  inlineEditRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  inlineInput: { flex: 1, backgroundColor: '#FFFFFF', height: 40 },
  saveBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 8 },
  inlineDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, height: 32 },
  colorPreview: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#EEEEEE' },
  infoValue: { fontSize: 15, fontWeight: '700', flex: 1 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metaChip: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xs, borderRightWidth: 1, borderRightColor: '#EEEEEE', gap: 2 },
  metaChipLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaChipValue: { fontSize: 13, fontWeight: '700' },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  addPlayerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addPlayerBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  emptyRoster: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.xs },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic' },
  playerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: SPACING.sm, marginBottom: SPACING.xs },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  jerseyBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  playerName: { fontSize: 14, fontWeight: '700' },
  rolePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  playerMeta: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  playerRight: { alignItems: 'flex-end', gap: 4, minWidth: 65 },
  removeBtn: { padding: 4 },
  pendingLabel: { fontSize: 10, fontWeight: '600', color: '#E65100' },
  deleteBtn: { borderRadius: 12, marginTop: SPACING.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { gap: SPACING.xs, marginBottom: SPACING.sm },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
