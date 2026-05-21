// app/(admin)/approvals/[id].jsx
import React, { Suspense, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Surface, useTheme, Button, Divider, TextInput, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import { approvalsAtom, resolveApproval } from '../../../store/atoms';
import { SPACING } from '../../../theme';

const ENTITY_ICONS = {
  team: 'shield-outline',
  player: 'account-outline',
  tournament: 'trophy-outline',
};

// ── Detail content (inside Suspense) ─────────────────────────────────────────
function ApprovalDetailContent() {
  const { id } = useLocalSearchParams();
  const theme  = useTheme();
  const router = useRouter();

  const approvals = useAtomValue(approvalsAtom);
  const approval  = approvals?.find((a) => a.id === id);

  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [resolved, setResolved] = useState(null); // 'approved' | 'rejected' | null

  // Re-fetch approvals list after resolving
  const refreshApprovals = useAtomCallback(
    React.useCallback((get, set) => { set(approvalsAtom); }, [])
  );

  if (!approval) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Approval request not found.</Text>
      </View>
    );
  }

  const changeLabel  = approval.change_type === 'create' ? 'New' : 'Edit';
  const entityLabel  = approval.entity_type?.charAt(0).toUpperCase() + approval.entity_type?.slice(1);

  const handleResolve = (decision) => {
    const verb = decision === 'approved' ? 'Approve' : 'Reject';
    Alert.alert(
      `${verb} "${approval.entity_name}"?`,
      decision === 'rejected' ? 'The organizer will be notified.' : undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: verb,
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setSaving(true);
            try {
              await resolveApproval(id, decision, note);
              await refreshApprovals();
              setResolved(decision);
              router.back();
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const currentStatus = resolved
    ? (resolved === 'approved' ? 'Active' : 'Inactive')
    : approval.status?.charAt(0).toUpperCase() + approval.status?.slice(1);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Button
        icon="arrow-left"
        mode="text"
        onPress={() => router.back()}
        textColor={theme.colors.primary}
        style={styles.backBtn}
        compact
      >
        Approvals
      </Button>

      {/* Header card */}
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.heroRow}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={ENTITY_ICONS[approval.entity_type] ?? 'file-outline'}
              size={26}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.entityName, { color: theme.colors.onSurface }]}>
              {approval.entity_name}
            </Text>
            <Text style={[styles.changeLabel, { color: theme.colors.onSurfaceVariant }]}>
              {changeLabel} {entityLabel}
            </Text>
          </View>
          <StatusPill status={currentStatus} />
        </View>

        <Divider style={{ marginVertical: SPACING.sm, backgroundColor: theme.colors.outline }} />

        <View style={styles.metaGrid}>
          {[
            ['Organization', approval.org_name],
            ['Submitted by', approval.organizer_name],
            ['Date', new Date(approval.created_at).toLocaleDateString()],
            ['Change type', `${changeLabel} ${entityLabel}`],
          ].map(([label, value]) => (
            <View key={label} style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
              <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{value}</Text>
            </View>
          ))}
        </View>
      </Surface>

      {/* Proposed changes */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Proposed Changes</Text>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        {approval.current_data && (
          <>
            <Text style={[styles.diffHeader, { color: theme.colors.onSurfaceVariant }]}>
              Current → Proposed
            </Text>
            <Divider style={{ marginBottom: SPACING.sm, backgroundColor: theme.colors.outline }} />
          </>
        )}
        {Object.entries(approval.proposed_data ?? {}).map(([key, value]) => (
          <View key={key} style={styles.diffRow}>
            <Text style={[styles.diffKey, { color: theme.colors.onSurfaceVariant }]}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
            </Text>
            <View style={styles.diffValues}>
              {approval.current_data?.[key] !== undefined && (
                <Text style={[styles.oldValue, { color: theme.colors.onSurfaceVariant }]}>
                  {String(approval.current_data[key])}
                </Text>
              )}
              <Text style={[styles.newValue, { color: theme.colors.onSurface }]}>
                {String(value)}
              </Text>
            </View>
          </View>
        ))}
      </Surface>

      {/* Admin note */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Admin Note (optional)</Text>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <TextInput
          value={note}
          onChangeText={setNote}
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="Add a note for the organizer…"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          style={styles.noteInput}
        />
      </Surface>

      {/* Actions */}
      {!resolved && (
        <View style={styles.actionRow}>
          <Button
            mode="contained"
            onPress={() => handleResolve('approved')}
            style={{ flex: 1 }}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            icon="check"
            loading={saving}
            disabled={saving}
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleResolve('rejected')}
            style={{ flex: 1, borderColor: theme.colors.error }}
            textColor={theme.colors.error}
            icon="close"
            disabled={saving}
          >
            Reject
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ApprovalDetailScreen() {
  const theme = useTheme();
  return (
    <Suspense
      fallback={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      }
    >
      <ApprovalDetailContent />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', marginLeft: -SPACING.sm, marginBottom: SPACING.xs },
  card: { borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: '#E0E0E0' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  entityName: { fontSize: 20, fontWeight: '800' },
  changeLabel: { fontSize: 13, marginTop: 2 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  metaItem: { minWidth: 140 },
  metaLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: SPACING.sm },
  diffHeader: { fontSize: 12, fontWeight: '600', marginBottom: SPACING.sm },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  diffKey: { fontSize: 13, flex: 1 },
  diffValues: { alignItems: 'flex-end', gap: 2 },
  oldValue: { fontSize: 12, textDecorationLine: 'line-through' },
  newValue: { fontSize: 13, fontWeight: '700' },
  noteInput: { backgroundColor: 'transparent', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
});
