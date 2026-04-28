// app/(organizer)/teams/[id].jsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Button,
  TextInput,
  Divider,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { TEAMS, PLAYERS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];
const ROLES = ['None', 'Captain', 'Vice-Captain'];

export default function OrganizerTeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const team = TEAMS.find((t) => t.id === id);
  const initialRoster = PLAYERS.filter((p) => p.teamId === id);

  // ── Inline editable team fields (direct save, no approval) ──
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [jerseyColor, setJerseyColor] = useState(team?.jerseyColor ?? '');
  const [editingField, setEditingField] = useState(null); // 'name' | 'color' | null

  // ── Roster state ──
  const [roster, setRoster] = useState(initialRoster);
  const [deletePending, setDeletePending] = useState(false);

  // ── Add Player modal state ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    jerseyNumber: '',
    position: POSITIONS[0],
    role: 'None',
  });

  // ── Remove pending tracking ──
  const [removePendingIds, setRemovePendingIds] = useState([]);

  if (!team) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Team not found.</Text>
      </View>
    );
  }

  // ── Inline save handlers ──
  const saveField = (field) => {
    // TODO: PATCH /teams/:id  { [field]: value }  — direct save, no approval
    setEditingField(null);
  };

  // ── Add Player ──
  const handleAddPlayer = () => {
    // Validate jersey number uniqueness within team
    const duplicate = roster.some(
      (p) => String(p.jerseyNumber) === addForm.jerseyNumber.trim()
    );
    if (duplicate) {
      Alert.alert('Duplicate jersey number', 'That number is already taken on this team.');
      return;
    }
    if (!addForm.name.trim()) {
      Alert.alert('Name required');
      return;
    }

    // TODO: POST /players  — status = 'Pending', push to admin
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

  // ── Remove Player ──
  const handleRemovePlayer = (player) => {
    Alert.alert(
      'Remove Player',
      `Remove ${player.name} from the roster? This requires admin approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: () => {
            // TODO: POST /change_requests  { type: 'remove_player', playerId: player.id }
            setRemovePendingIds((prev) => [...prev, player.id]);
          },
        },
      ]
    );
  };

  // ── Delete Team ──
  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      `Delete "${teamName}"? This requires admin approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: () => {
            // TODO: POST /change_requests  { type: 'delete_team', teamId: id }
            setDeletePending(true);
          },
        },
      ]
    );
  };

  const isDeletePending = deletePending;

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
      {isDeletePending && (
        <View style={[styles.alertBanner, { backgroundColor: '#FF444418', borderColor: '#FF444455' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={theme.colors.error} />
          <Text style={[styles.alertBannerText, { color: theme.colors.error }]}>
            Deletion pending admin approval — team is read-only
          </Text>
        </View>
      )}

      {/* ── Team Info Card ── */}
      <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
        {/* Team name — inline editable */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
            Team Name
          </Text>
          {editingField === 'name' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={teamName}
                onChangeText={setTeamName}
                mode="outlined"
                dense
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.inlineInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => saveField('name')}
                style={[styles.inlineSaveBtn, { backgroundColor: theme.colors.primary }]}
              >
                <MaterialCommunityIcons name="check" size={16} color={theme.colors.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setTeamName(team.name); setEditingField(null); }}
                style={[styles.inlineCancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.inlineValueRow}
              onPress={() => !isDeletePending && setEditingField('name')}
              disabled={isDeletePending}
            >
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{teamName}</Text>
              {!isDeletePending && (
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={15}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        <Divider style={{ backgroundColor: theme.colors.outline }} />

        {/* Jersey color — inline editable */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
            Jersey Color
          </Text>
          {editingField === 'color' ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={jerseyColor}
                onChangeText={setJerseyColor}
                mode="outlined"
                dense
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.inlineInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => saveField('color')}
                style={[styles.inlineSaveBtn, { backgroundColor: theme.colors.primary }]}
              >
                <MaterialCommunityIcons name="check" size={16} color={theme.colors.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setJerseyColor(team.jerseyColor); setEditingField(null); }}
                style={[styles.inlineCancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.inlineValueRow}
              onPress={() => !isDeletePending && setEditingField('color')}
              disabled={isDeletePending}
            >
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{jerseyColor}</Text>
              {!isDeletePending && (
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={15}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        <Divider style={{ backgroundColor: theme.colors.outline }} />

        {/* Read-only fields */}
        <View style={styles.metaGrid}>
          <MetaChip label="Players" value={roster.length} theme={theme} />
          <MetaChip label="Org" value={team.orgName} theme={theme} />
          <MetaChip label="Created" value={team.createdAt} theme={theme} />
        </View>

        <View style={styles.statusRow}>
          <StatusPill status={isDeletePending ? 'Pending' : team.status} />
          {isDeletePending && (
            <Text style={[styles.deletePendingLabel, { color: '#FFB300' }]}>
              Deletion pending
            </Text>
          )}
        </View>
      </Surface>

      {/* ── Roster ── */}
      <View style={styles.rosterHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Roster ({roster.length})
        </Text>
        {!isDeletePending && (
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addPlayerBtn, { backgroundColor: theme.colors.primary + '22', borderColor: theme.colors.primary + '55' }]}
          >
            <MaterialCommunityIcons name="plus" size={14} color={theme.colors.primary} />
            <Text style={[styles.addPlayerBtnText, { color: theme.colors.primary }]}>
              Add Player
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {roster.length === 0 ? (
        <View style={styles.emptyRoster}>
          <MaterialCommunityIcons
            name="account-off-outline"
            size={36}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No players on this team
          </Text>
        </View>
      ) : (
        roster.map((player) => {
          const isPending = player.status === 'Pending';
          const isRemovePending = removePendingIds.includes(player.id);

          return (
            <Surface
              key={player.id}
              style={[
                styles.playerRow,
                { backgroundColor: theme.colors.surface },
                isPending && { borderColor: '#FFB30044' },
                isRemovePending && { borderColor: '#FF444444', opacity: 0.7 },
              ]}
              elevation={0}
            >
              {/* Jersey badge */}
              <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary + '18' }]}>
                <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>
                  #{player.jerseyNumber}
                </Text>
              </View>

              {/* Player info */}
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>
                    {player.name}
                  </Text>
                  {player.role && (
                    <View style={[styles.rolePill, { backgroundColor: theme.colors.secondary + '22' }]}>
                      <Text style={[styles.rolePillText, { color: theme.colors.secondary }]}>
                        {player.role}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.playerMeta, { color: theme.colors.onSurfaceVariant }]}>
                  {player.positions.join(' / ')}
                </Text>

                {isPending && !isRemovePending && (
                  <View style={styles.pendingRow}>
                    <MaterialCommunityIcons name="clock-outline" size={11} color="#FFB300" />
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

              {/* Status + remove action */}
              <View style={styles.playerActions}>
                <StatusPill status={isRemovePending ? 'Pending' : player.status} />
                {!isRemovePending && !isDeletePending && (
                  <TouchableOpacity
                    onPress={() => handleRemovePlayer(player)}
                    style={[styles.removeBtn, { backgroundColor: theme.colors.error + '18' }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="account-remove-outline"
                      size={16}
                      color={theme.colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Surface>
          );
        })
      )}

      {/* ── Delete Team button ── */}
      {!isDeletePending && (
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
            <Surface
              style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}
              elevation={4}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Add Player
              </Text>
              <Text style={[styles.modalSub, { color: theme.colors.onSurfaceVariant }]}>
                Submitted for admin approval
              </Text>
              <Divider
                style={{ backgroundColor: theme.colors.outline, marginVertical: SPACING.md }}
              />

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Full name */}
                <TextInput
                  label="Full Name"
                  value={addForm.name}
                  onChangeText={(v) => setAddForm((f) => ({ ...f, name: v }))}
                  mode="outlined"
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  style={styles.formInput}
                  left={<TextInput.Icon icon="account-outline" color={theme.colors.onSurfaceVariant} />}
                />

                {/* Jersey number */}
                <TextInput
                  label="Jersey Number"
                  value={addForm.jerseyNumber}
                  onChangeText={(v) => setAddForm((f) => ({ ...f, jerseyNumber: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  style={styles.formInput}
                  left={<TextInput.Icon icon="pound" color={theme.colors.onSurfaceVariant} />}
                />

                {/* Position picker */}
                <Text style={[styles.pickerLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Position
                </Text>
                <View style={styles.pillRow}>
                  {POSITIONS.map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      onPress={() => setAddForm((f) => ({ ...f, position: pos }))}
                      style={[
                        styles.pill,
                        {
                          backgroundColor:
                            addForm.position === pos
                              ? theme.colors.primary
                              : theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              addForm.position === pos
                                ? theme.colors.onPrimary
                                : theme.colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Role picker */}
                <Text style={[styles.pickerLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Role
                </Text>
                <View style={styles.pillRow}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setAddForm((f) => ({ ...f, role }))}
                      style={[
                        styles.pill,
                        {
                          backgroundColor:
                            addForm.role === role
                              ? theme.colors.secondary
                              : theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              addForm.role === role
                                ? '#001A09'
                                : theme.colors.onSurfaceVariant,
                          },
                        ]}
                      >
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
                  textColor={theme.colors.onPrimary}
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
            </Surface>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function MetaChip({ label, value, theme }) {
  return (
    <View style={styles.metaChip}>
      <Text style={[styles.metaChipLabel, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text style={[styles.metaChipValue, { color: theme.colors.onSurface }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl * 2 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  backText: { fontSize: 14, fontWeight: '700' },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.sm,
  },
  alertBannerText: { fontSize: 13, fontWeight: '600', flex: 1 },

  // Info card
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1C2437',
    marginBottom: SPACING.xs,
  },
  infoRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inlineValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoValue: { fontSize: 16, fontWeight: '700' },
  inlineEditRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  inlineInput: { flex: 1, backgroundColor: 'transparent', height: 40 },
  inlineSaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCancelBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexWrap: 'wrap',
  },
  metaChip: { gap: 2 },
  metaChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaChipValue: { fontSize: 13, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  deletePendingLabel: { fontSize: 12, fontWeight: '600' },

  // Roster header
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  addPlayerBtnText: { fontSize: 12, fontWeight: '700' },

  emptyRoster: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  emptyText: { fontSize: 14, fontStyle: 'italic' },

  // Player rows
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#1C2437',
  },
  jerseyBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: { fontSize: 14, fontWeight: '900' },
  playerInfo: { flex: 1, gap: 3 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  playerName: { fontSize: 14, fontWeight: '700' },
  rolePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  playerMeta: { fontSize: 12 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pendingLabel: { fontSize: 11, fontWeight: '600', color: '#FFB300' },
  playerActions: { alignItems: 'flex-end', gap: SPACING.xs },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Delete button
  deleteBtn: { borderRadius: 12, marginTop: SPACING.md },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSub: { fontSize: 13, marginTop: 2 },
  formInput: { backgroundColor: 'transparent', marginBottom: SPACING.sm },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});