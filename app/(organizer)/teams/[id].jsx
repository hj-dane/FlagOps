// app/(organizer)/teams/[id].jsx
import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, useTheme, Button, TextInput, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { TEAMS, PLAYERS } from '../../../data/mockData';
import { SPACING, CARD_SHADOW } from '../../../theme';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];
const ROLES = ['None', 'Captain', 'Vice-Captain'];

export default function OrganizerTeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const team = TEAMS.find((t) => t.id === id);
  const initialRoster = PLAYERS.filter((p) => p.teamId === id);

  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [jerseyColor, setJerseyColor] = useState(team?.jerseyColor ?? '');
  const [editingField, setEditingField] = useState(null); // 'name' | 'color' | null
  const [roster, setRoster] = useState(initialRoster);
  const [deletePending, setDeletePending] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', jerseyNumber: '', position: POSITIONS[0], role: 'None' });
  const [removePendingIds, setRemovePendingIds] = useState([]);

  if (!team) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Team not found.</Text>
      </View>
    );
  }

  const saveField = () => {
    // TODO: PATCH /teams/:id — direct save, no approval needed
    setEditingField(null);
  };

  const handleAddPlayer = () => {
    const duplicate = roster.some((p) => String(p.jerseyNumber) === addForm.jerseyNumber.trim());
    if (duplicate) { Alert.alert('Duplicate jersey number', 'That number is already taken on this team.'); return; }
    if (!addForm.name.trim()) { Alert.alert('Name required'); return; }
    // TODO: POST /players — status = 'Pending', push to admin
    const newPlayer = {
      id: `player-new-${Date.now()}`,
      teamId: id,
      teamName: teamName,
      orgName: team.orgName,
      name: addForm.name.trim(),
      jerseyNumber: Number(addForm.jerseyNumber),
      positions: [addForm.position],
      role: addForm.role === 'None' ? null : addForm.role,
      status: 'Pending',
      stats: { tds: 0, ints: 0, flagsPulled: 0, sacks: 0, matchesPlayed: 0 },
    };
    setRoster((prev) => [...prev, newPlayer]);
    setShowAddModal(false);
    setAddForm({ name: '', jerseyNumber: '', position: POSITIONS[0], role: 'None' });
  };

  const handleRemovePlayer = (player) => {
    Alert.alert('Remove Player', `Remove ${player.name}? This requires admin approval.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit Request', style: 'destructive', onPress: () => {
        // TODO: POST /change_requests { type: 'remove_player', playerId: player.id }
        setRemovePendingIds((prev) => [...prev, player.id]);
      }},
    ]);
  };

  const handleDeleteTeam = () => {
    Alert.alert('Delete Team', `Delete "${teamName}"? This requires admin approval.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit Request', style: 'destructive', onPress: () => {
        // TODO: POST /change_requests { type: 'delete_team', teamId: id }
        setDeletePending(true);
      }},
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
        <Text style={[styles.backText, { color: theme.colors.primary }]}>Teams</Text>
      </TouchableOpacity>

      {/* Deletion pending banner */}
      {deletePending && (
        <View style={styles.alertBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#E65100" />
          <Text style={styles.alertBannerText}>
            Deletion pending admin approval — team is read-only
          </Text>
        </View>
      )}

      {/* ── Team Info Card ── */}
      <View style={[styles.infoCard, CARD_SHADOW]}>
        {/* Status row */}
        <View style={styles.infoStatusRow}>
          <StatusPill status={deletePending ? 'Pending' : team.status} />
          {deletePending && (
            <Text style={styles.deletePendingLabel}>Deletion pending</Text>
          )}
        </View>

        <Divider style={{ marginVertical: SPACING.sm }} />

        {/* Team Name — inline editable */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Team Name</Text>
          {editingField === 'name' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={teamName}
                onChangeText={setTeamName}
                mode="outlined"
                dense
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.inlineInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={saveField}
                style={[styles.inlineActionBtn, { backgroundColor: theme.colors.primary }]}
              >
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setTeamName(team.name); setEditingField(null); }}
                style={[styles.inlineActionBtn, { backgroundColor: '#F0F0F0' }]}
              >
                <MaterialCommunityIcons name="close" size={16} color="#888888" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.inlineValueRow}
              onPress={() => !deletePending && setEditingField('name')}
              disabled={deletePending}
            >
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{teamName}</Text>
              {!deletePending && (
                <MaterialCommunityIcons name="pencil-outline" size={15} color="#CCCCCC" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        {/* Jersey Color — inline editable */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Jersey Color</Text>
          {editingField === 'color' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={jerseyColor}
                onChangeText={setJerseyColor}
                mode="outlined"
                dense
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.inlineInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={saveField}
                style={[styles.inlineActionBtn, { backgroundColor: theme.colors.primary }]}
              >
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setJerseyColor(team.jerseyColor); setEditingField(null); }}
                style={[styles.inlineActionBtn, { backgroundColor: '#F0F0F0' }]}
              >
                <MaterialCommunityIcons name="close" size={16} color="#888888" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.inlineValueRow}
              onPress={() => !deletePending && setEditingField('color')}
              disabled={deletePending}
            >
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{jerseyColor}</Text>
              {!deletePending && (
                <MaterialCommunityIcons name="pencil-outline" size={15} color="#CCCCCC" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        {/* Read-only meta */}
        <View style={styles.metaGrid}>
          <MetaChip label="Players" value={roster.length} />
          <MetaChip label="Org" value={team.orgName} />
          <MetaChip label="Created" value={team.createdAt} />
        </View>
      </View>

      {/* ── Roster Header ── */}
      <View style={styles.rosterHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Roster ({roster.length})
        </Text>
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

      {/* ── Roster List ── */}
      {roster.length === 0 ? (
        <View style={styles.emptyRoster}>
          <MaterialCommunityIcons name="account-off-outline" size={40} color="#CCCCCC" />
          <Text style={styles.emptyText}>No players on this team</Text>
        </View>
      ) : (
        roster.map((player) => {
          const isPending = player.status === 'Pending';
          const isRemovePending = removePendingIds.includes(player.id);

          return (
            <View
              key={player.id}
              style={[
                styles.playerRow,
                CARD_SHADOW,
                isRemovePending && { opacity: 0.6 },
              ]}
            >
              {/* Red left accent for captain */}
              {player.role && (
                <View style={[styles.roleAccent, { backgroundColor: theme.colors.primary }]} />
              )}

              {/* Jersey badge */}
              <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.jerseyNum}>#{player.jerseyNumber}</Text>
              </View>

              {/* Player info */}
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>
                    {player.name}
                  </Text>
                  {player.role && (
                    <View style={[styles.rolePill, { backgroundColor: '#FFEBEE' }]}>
                      <Text style={[styles.rolePillText, { color: theme.colors.primary }]}>
                        {player.role}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.playerMeta}>{player.positions.join(' / ')}</Text>

                {isPending && !isRemovePending && (
                  <View style={styles.pendingRow}>
                    <MaterialCommunityIcons name="clock-outline" size={11} color="#E65100" />
                    <Text style={styles.pendingLabel}>Awaiting admin approval</Text>
                  </View>
                )}
                {isRemovePending && (
                  <View style={styles.pendingRow}>
                    <MaterialCommunityIcons name="clock-outline" size={11} color={theme.colors.error} />
                    <Text style={[styles.pendingLabel, { color: theme.colors.error }]}>
                      Removal pending approval
                    </Text>
                  </View>
                )}
              </View>

              {/* Right side */}
              <View style={styles.playerRight}>
                <StatusPill status={isRemovePending ? 'Pending' : player.status} />
                {!isRemovePending && !deletePending && (
                  <TouchableOpacity
                    onPress={() => handleRemovePlayer(player)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="account-remove-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* ── Delete Team ── */}
      {!deletePending && (
        <Button
          mode="outlined"
          onPress={handleDeleteTeam}
          textColor={theme.colors.error}
          style={[styles.deleteBtn, { borderColor: theme.colors.error }]}
          icon="delete-outline"
          contentStyle={{ paddingVertical: 4 }}
        >
          Delete Team
        </Button>
      )}

      {/* ── Add Player Modal ── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add Player</Text>
              <Text style={styles.modalSub}>Submitted for admin approval</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  label="Full Name"
                  value={addForm.name}
                  onChangeText={(v) => setAddForm((f) => ({ ...f, name: v }))}
                  mode="outlined"
                  outlineColor="#EEEEEE"
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  style={styles.formInput}
                  left={<TextInput.Icon icon="account-outline" color="#AAAAAA" />}
                />

                <TextInput
                  label="Jersey Number"
                  value={addForm.jerseyNumber}
                  onChangeText={(v) => setAddForm((f) => ({ ...f, jerseyNumber: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor="#EEEEEE"
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  style={styles.formInput}
                  left={<TextInput.Icon icon="pound" color="#AAAAAA" />}
                />

                <Text style={styles.pickerLabel}>Position</Text>
                <View style={styles.pillRow}>
                  {POSITIONS.map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      onPress={() => setAddForm((f) => ({ ...f, position: pos }))}
                      style={[
                        styles.pill,
                        addForm.position === pos
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: '#F0F0F0' },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: addForm.position === pos ? '#FFFFFF' : '#888888' }]}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.pickerLabel}>Role</Text>
                <View style={styles.pillRow}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setAddForm((f) => ({ ...f, role }))}
                      style={[
                        styles.pill,
                        addForm.role === role
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: '#F0F0F0' },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: addForm.role === role ? '#FFFFFF' : '#888888' }]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleAddPlayer}
                  disabled={!addForm.name.trim() || !addForm.jerseyNumber.trim()}
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                  style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Add Player
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

function MetaChip({ label, value }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipLabel}>{label}</Text>
      <Text style={styles.metaChipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl * 2 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, alignSelf: 'flex-start', marginBottom: SPACING.xs },
  backText: { fontSize: 14, fontWeight: '700' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: '#FFF3E0', borderRadius: 10, padding: SPACING.sm,
  },
  alertBannerText: { fontSize: 13, fontWeight: '600', color: '#E65100', flex: 1 },

  // Info card
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.xs },
  infoStatusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  deletePendingLabel: { fontSize: 12, fontWeight: '600', color: '#E65100' },

  infoRow: { paddingVertical: SPACING.sm, gap: SPACING.xs },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.6 },
  inlineValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoValue: { fontSize: 16, fontWeight: '700' },
  inlineEditRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  inlineInput: { flex: 1, backgroundColor: '#FFFFFF', height: 40 },
  inlineActionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.lg, paddingTop: SPACING.sm },
  metaChip: { gap: 2 },
  metaChipLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaChipValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  // Roster
  rosterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  addPlayerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addPlayerBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  emptyRoster: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xl },
  emptyText: { fontSize: 14, color: '#AAAAAA', fontStyle: 'italic' },

  // Player rows
  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: SPACING.md, gap: SPACING.md, overflow: 'hidden',
  },
  roleAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  jerseyBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  playerInfo: { flex: 1, gap: 3 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  playerName: { fontSize: 14, fontWeight: '700' },
  rolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  playerMeta: { fontSize: 12, color: '#AAAAAA' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingLabel: { fontSize: 11, fontWeight: '600', color: '#E65100' },
  playerRight: { alignItems: 'flex-end', gap: SPACING.xs },
  removeBtn: { padding: 4 },

  deleteBtn: { borderRadius: 12, marginTop: SPACING.md },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSub: { fontSize: 13, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});