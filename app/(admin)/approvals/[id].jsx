// app/(admin)/approvals/[id].jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const CHANGE_COLORS = { create: '#4CAF50', edit: '#FF9800', delete: '#F44336' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequest = useCallback(async () => {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*, profiles(name, email), organizations(name)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setRequest(data);
      if (data.status !== 'pending') setAlreadyReviewed(true);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  const handleApprove = async () => {
    setActioning(true);
    try {
      const { change_type, entity_type, entity_id, proposed_data } = request;

      // ── Execute the actual data change ──
      if (change_type === 'delete') {
        if (entity_type === 'team') {
          const { error } = await supabase.from('teams').delete().eq('id', entity_id);
          if (error) throw error;
        } else if (entity_type === 'player') {
          const { error } = await supabase.from('players').delete().eq('id', entity_id);
          if (error) throw error;
        } else if (entity_type === 'tournament') {
          const { error } = await supabase.from('tournaments').update({ status: 'canceled' }).eq('id', entity_id);
          if (error) throw error;
        } else if (entity_type === 'match') {
          const { error } = await supabase.from('matches').update({ status: 'canceled' }).eq('id', entity_id);
          if (error) throw error;
        }
      } else if (change_type === 'edit' && proposed_data) {
        // Apply proposed changes to the entity
        const table = entity_type === 'tournament' ? 'tournaments'
          : entity_type === 'team' ? 'teams'
          : entity_type === 'player' ? 'players'
          : entity_type === 'match' ? 'matches'
          : null;

        if (table) {
          const { error } = await supabase.from(table).update(proposed_data).eq('id', entity_id);
          if (error) throw error;
        }
      } else if (change_type === 'create') {
        // For creates: just activate the entity
        const table = entity_type === 'tournament' ? 'tournaments'
          : entity_type === 'team' ? 'teams'
          : entity_type === 'player' ? 'players'
          : null;

        if (table) {
          const { error } = await supabase.from(table).update({ status: 'active' }).eq('id', entity_id);
          if (error) throw error;
        }
      }

      // ── Mark request as approved ──
      const { error: approveErr } = await supabase
        .from('approval_requests')
        .update({ status: 'approved' })
        .eq('id', id);

      if (approveErr) throw approveErr;

      Alert.alert('Approved', 'The request has been approved and applied.');
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not approve request.');
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason required', 'Please provide a reason for rejection.');
      return;
    }
    setActioning(true);
    const { error } = await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectReason.trim(),
      })
      .eq('id', id);

    if (!error) {
      setShowRejectSheet(false);
      Alert.alert('Rejected', 'The request has been rejected and the organizer notified.');
      router.back();
    } else {
      Alert.alert('Error', 'Could not reject request.');
    }
    setActioning(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Request not found.</Text>
      </View>
    );
  }

  const changeColor = CHANGE_COLORS[request.change_type] || '#888';
  const current = request.current_data || {};
  const proposed = request.proposed_data || {};

  // Build diff rows: union of all keys from both sides
  const allKeys = Array.from(new Set([...Object.keys(current), ...Object.keys(proposed)]));
  const changedKeys = allKeys.filter((k) => String(current[k] ?? '') !== String(proposed[k] ?? ''));

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Approvals" onBack={() => router.back()} />

      {alreadyReviewed && (
        <View style={styles.alreadyBanner}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#1565C0" />
          <Text style={styles.alreadyText}>Already reviewed — this request is no longer pending</Text>
        </View>
      )}

      {/* Header card */}
      <View style={[styles.headerCard, CARD_SHADOW]}>
        <View style={styles.headerTopRow}>
          <View style={[styles.changeTypeBadge, { backgroundColor: changeColor + '22' }]}>
            <Text style={[styles.changeTypeText, { color: changeColor }]}>
              {request.change_type?.toUpperCase()} {request.entity_type?.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.entityName, { color: theme.colors.onSurface }]}>
          {request.entity_name || request.entity_type}
        </Text>
        <Divider style={{ marginVertical: SPACING.sm }} />
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Organization</Text>
            <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{request.organizations?.name || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Requested by</Text>
            <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{request.profiles?.name || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Submitted</Text>
            <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{timeAgo(request.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Diff view */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {request.change_type === 'create' ? 'New Record' :
         request.change_type === 'delete' ? 'Record to Delete' : 'Changes'}
      </Text>

      {request.change_type === 'edit' ? (
        <View style={[styles.diffTable, CARD_SHADOW]}>
          {/* Header row */}
          <View style={[styles.diffHeaderRow, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text style={[styles.diffHeaderCell, { flex: 1.2 }]}>Field</Text>
            <Text style={styles.diffHeaderCell}>Current</Text>
            <Text style={styles.diffHeaderCell}>Proposed</Text>
          </View>
          {allKeys.map((key) => {
            const isChanged = changedKeys.includes(key);
            return (
              <View
                key={key}
                style={[styles.diffRow, isChanged && { backgroundColor: '#FFF8E1' }]}
              >
                <Text style={[styles.diffKey, { flex: 1.2 }]}>{key}</Text>
                <Text style={[styles.diffCell, { color: isChanged ? '#999' : theme.colors.onSurface }]}>
                  {String(current[key] ?? '—')}
                </Text>
                <Text style={[styles.diffCell, { color: isChanged ? '#E65100' : theme.colors.onSurface, fontWeight: isChanged ? '700' : '400' }]}>
                  {String(proposed[key] ?? '—')}
                </Text>
              </View>
            );
          })}
        </View>
      ) : request.change_type === 'create' ? (
        <View style={[styles.diffTable, CARD_SHADOW]}>
          {Object.entries(proposed).map(([key, val]) => (
            <View key={key} style={styles.diffRow}>
              <Text style={[styles.diffKey, { flex: 1 }]}>{key}</Text>
              <Text style={[styles.diffCell, { color: '#4CAF50', fontWeight: '700', flex: 2 }]}>{String(val ?? '—')}</Text>
            </View>
          ))}
        </View>
      ) : (
        // Delete — show all current fields with red tint
        <View style={[styles.diffTable, CARD_SHADOW, { borderColor: '#FFCDD2', borderWidth: 1 }]}>
          {Object.entries(current).map(([key, val]) => (
            <View key={key} style={[styles.diffRow, { backgroundColor: '#FFF5F5' }]}>
              <Text style={[styles.diffKey, { flex: 1 }]}>{key}</Text>
              <Text style={[styles.diffCell, { color: '#C62828', textDecorationLine: 'line-through', flex: 2 }]}>
                {String(val ?? '—')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      {!alreadyReviewed && (
        <View style={styles.actionRow}>
          <Button
            mode="contained"
            onPress={handleApprove}
            loading={actioning}
            disabled={actioning}
            buttonColor="#4CAF50"
            textColor="#FFF"
            style={styles.actionBtn}
            contentStyle={{ paddingVertical: 6 }}
            icon="check"
          >
            Approve
          </Button>
          <Button
            mode="contained"
            onPress={() => setShowRejectSheet(true)}
            disabled={actioning}
            buttonColor="#F44336"
            textColor="#FFF"
            style={styles.actionBtn}
            contentStyle={{ paddingVertical: 6 }}
            icon="close"
          >
            Reject
          </Button>
        </View>
      )}

      {/* Reject bottom sheet */}
      <Modal visible={showRejectSheet} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Reason for Rejection</Text>
              <Text style={styles.modalSub}>This will be sent to the organizer</Text>
              <Divider style={{ marginVertical: SPACING.md }} />
              <TextInput
                label="Rejection reason"
                value={rejectReason}
                onChangeText={setRejectReason}
                mode="outlined"
                multiline
                numberOfLines={3}
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.error}
                textColor={theme.colors.onSurface}
                style={styles.rejectInput}
                placeholder="e.g. Duplicate team name, missing required fields..."
              />
              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleReject}
                  loading={actioning}
                  disabled={actioning || !rejectReason.trim()}
                  buttonColor="#F44336"
                  textColor="#FFF"
                  style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Confirm Rejection
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => { setShowRejectSheet(false); setRejectReason(''); }}
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
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: SPACING.md },
  backText: { fontSize: 14, fontWeight: '700' },
  alreadyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: SPACING.sm, borderRadius: 10, gap: SPACING.xs, marginBottom: SPACING.md },
  alreadyText: { fontSize: 12, color: '#1565C0', fontWeight: '600', flex: 1 },
  headerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md },
  headerTopRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SPACING.sm },
  changeTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  changeTypeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  entityName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  metaGrid: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  metaItem: { minWidth: 90 },
  metaLabel: { fontSize: 10, color: '#AAAAAA', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: SPACING.sm },
  diffTable: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', marginBottom: SPACING.lg },
  diffHeaderRow: { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.xs },
  diffHeaderCell: { flex: 1, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: '#555' },
  diffRow: { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.xs, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  diffKey: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.3 },
  diffCell: { flex: 1, fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { flex: 1, borderRadius: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  rejectInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
