// app/(organizer)/players/[id].jsx
//
// Dual-mode screen:
//   • View  — player hero card + career stats (fetched from Supabase via Jotai)
//   • Edit  — bottom-sheet modal; submits an approval_request row on save
//
import React, { Suspense, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { playerAtomFamily, submitPlayerEdit } from '../../../store/atoms';
import { SPACING } from '../../../theme';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];
const ROLES     = ['None', 'Captain', 'Vice-Captain'];

const STAT_LABELS = [
  { key: 'touchdowns',    label: 'TDs' },
  { key: 'interceptions', label: 'INTs' },
  { key: 'flags_pulled',  label: 'Flags' },
  { key: 'sacks',         label: 'Sacks' },
  { key: 'matches_played',label: 'Matches' },
];

// ── Player content (inside Suspense) ─────────────────────────────────────────
function PlayerDetailContent() {
  const { id } = useLocalSearchParams();
  const theme  = useTheme();
  const router = useRouter();

  // Each player is fetched individually and cached in the atom family
  const player = useAtomValue(playerAtomFamily(id));

  // Edit modal state — seeded from player data when opened
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName,     setEditName]       = useState('');
  const [editJersey,   setEditJersey]     = useState('');
  const [editPosition, setEditPosition]   = useState(POSITIONS[0]);
  const [editRole,     setEditRole]       = useState('None');
  const [saving,       setSaving]         = useState(false);

  if (!player) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Player not found.</Text>
      </View>
    );
  }

  // Player stats may be a nested object or array (Supabase join)
  const stats = Array.isArray(player.stats) ? player.stats[0] : player.stats ?? {};

  const openEdit = () => {
    setEditName(player.name ?? '');
    setEditJersey(String(player.jersey_number ?? ''));
    setEditPosition(player.positions?.[0] ?? POSITIONS[0]);
    setEditRole(player.role ?? 'None');
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!editName.trim()) { Alert.alert('Name required'); return; }
    if (!editJersey.trim() || isNaN(Number(editJersey))) {
      Alert.alert('Valid jersey number required');
      return;
    }

    setSaving(true);
    try {
      await submitPlayerEdit(id, {
        name:          editName.trim(),
        jersey_number: Number(editJersey),
        positions:     [editPosition],
        role:          editRole === 'None' ? null : editRole,
      });
      setShowEditModal(false);
      Alert.alert('Edit Submitted', 'Your changes are pending admin approval.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={() => router.back()}
          textColor={theme.colors.primary}
          style={styles.backBtn}
          compact
        >
          Team
        </Button>

        {/* Hero card */}
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.heroTop}>
            <View style={[
              styles.jerseyCircle,
              { borderColor: theme.colors.primary + '55', backgroundColor: theme.colors.primary + '18' }
            ]}>
              <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>
                #{player.jersey_number}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{player.name}</Text>
              <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
                {player.positions?.join(' / ')}
                {player.role ? ` · ${player.role}` : ''}
              </Text>
            </View>
            <StatusPill status={player.status?.charAt(0).toUpperCase() + player.status?.slice(1)} />
          </View>

          <Divider style={{ marginVertical: SPACING.sm, backgroundColor: theme.colors.outline }} />

          <View style={styles.metaGrid}>
            {[
              ['Team',         player.team_name],
              ['Organization', player.organization_id],
            ].map(([label, value]) => (
              <View key={label} style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
                <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{value}</Text>
              </View>
            ))}
          </View>

          {player.status === 'pending' && (
            <View style={[
              styles.pendingBanner,
              { backgroundColor: theme.colors.tertiary + '20', borderColor: theme.colors.tertiary }
            ]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.tertiary} />
              <Text style={[styles.pendingBannerText, { color: theme.colors.tertiary }]}>
                Pending admin approval
              </Text>
            </View>
          )}

          <Button
            mode="outlined"
            icon="pencil"
            onPress={openEdit}
            textColor={theme.colors.primary}
            style={[styles.editBtn, { borderColor: theme.colors.primary }]}
          >
            Edit Player
          </Button>
        </Surface>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Career Stats</Text>
        <View style={styles.statsGrid}>
          {STAT_LABELS.map(({ key, label }) => (
            <Surface
              key={key}
              style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
              elevation={0}
            >
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats[key] ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
            </Surface>
          ))}
        </View>
      </ScrollView>

      {/* ── Edit modal ── */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle,  { color: theme.colors.onSurface }]}>Edit Player</Text>
            <Text style={[styles.modalSub, { color: theme.colors.onSurfaceVariant }]}>
              Changes will be submitted for admin approval
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: SPACING.md }}>
              <TextInput
                label="Full Name"
                value={editName}
                onChangeText={setEditName}
                mode="outlined"
                style={styles.formInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />

              <TextInput
                label="Jersey Number"
                value={editJersey}
                onChangeText={setEditJersey}
                mode="outlined"
                keyboardType="numeric"
                style={styles.formInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />

              <Text style={[styles.pickerLabel, { color: theme.colors.onSurfaceVariant }]}>Position</Text>
              <View style={styles.pillRow}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setEditPosition(pos)}
                    style={[
                      styles.pill,
                      editPosition === pos
                        ? { backgroundColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.outline },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: editPosition === pos ? '#FFF' : theme.colors.onSurface }]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.pickerLabel, { color: theme.colors.onSurfaceVariant }]}>Role</Text>
              <View style={styles.pillRow}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setEditRole(role)}
                    style={[
                      styles.pill,
                      editRole === role
                        ? { backgroundColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.outline },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: editRole === role ? '#FFF' : theme.colors.onSurface }]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[
                styles.approvalNote,
                { backgroundColor: theme.colors.tertiary + '18', borderColor: theme.colors.tertiary + '44' }
              ]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.tertiary} />
                <Text style={[styles.approvalNoteText, { color: theme.colors.tertiary }]}>
                  Edits go to admin for approval before taking effect.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleSubmitEdit}
                  style={{ flex: 1 }}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  loading={saving}
                  disabled={saving}
                >
                  Submit Edit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowEditModal(false)}
                  style={{ flex: 1 }}
                  textColor={theme.colors.onSurface}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OrganizerPlayerDetailScreen() {
  const theme = useTheme();
  return (
    <Suspense
      fallback={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      }
    >
      <PlayerDetailContent />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', marginLeft: -SPACING.sm, marginBottom: SPACING.xs },
  heroCard: { borderRadius: 16, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: '#E0E0E0' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  jerseyCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jerseyNum: { fontSize: 16, fontWeight: '900' },
  heroName: { fontSize: 20, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  metaItem: { minWidth: 100 },
  metaLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, borderRadius: 10, borderWidth: 1, padding: SPACING.sm },
  pendingBannerText: { fontSize: 13, fontWeight: '600' },
  editBtn: { marginTop: SPACING.xs },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: SPACING.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { borderRadius: 12, padding: SPACING.md, alignItems: 'center', minWidth: '28%', flex: 1, borderWidth: 1, borderColor: '#E0E0E0' },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSub: { fontSize: 13, marginTop: 2 },
  formInput: { backgroundColor: 'transparent', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '700' },
  approvalNote: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, borderRadius: 10, borderWidth: 1, padding: SPACING.sm, marginBottom: SPACING.md },
  approvalNoteText: { fontSize: 12, fontWeight: '600', flex: 1 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
});
