// app/(admin)/teams/[id].jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { teamsAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';

export default function AdminTeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const [teams, setTeams] = useAtom(teamsAtom);

  const [team, setTeam] = useState(() => teams.find((t) => t.id === id) || null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(!team);

  const [editing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [jerseyColor, setJerseyColor] = useState(team?.jersey_color ?? '');
  const [saving, setSaving] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*, organizations(name)')
      .eq('id', id)
      .single();
    if (!error && data) {
      setTeam(data);
      setTeamName(data.name);
      setJerseyColor(data.jersey_color || '');
    }

    const { data: players } = await supabase
      .from('players')
      .select('id, name, jersey_number, position, status')
      .eq('team_id', id)
      .order('name');
    setRoster(players || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('teams')
      .update({ name: teamName, jersey_color: jerseyColor || null })
      .eq('id', id);

    if (!error) {
      setTeam((prev) => ({ ...prev, name: teamName, jersey_color: jerseyColor }));
      setTeams((prev) => prev.map((t) => t.id === id ? { ...t, name: teamName, jersey_color: jerseyColor } : t));
      setEditing(false);
      Alert.alert('Saved', `Admin override applied by admin.`);
    } else {
      Alert.alert('Error', 'Failed to save changes.');
    }
    setSaving(false);
  };

  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      `Permanently delete "${team?.name || 'this team'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const { error } = await supabase.from('teams').delete().eq('id', id);
            if (!error) {
              setTeams((prev) => prev.filter((t) => t.id !== id));
              Alert.alert('Deleted', 'Team has been permanently removed.');
              router.back();
            } else {
              Alert.alert('Error', 'Could not delete team.');
            }
          },
        },
      ]
    );
  };

    if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Team not found.</Text>
      </View>
    );
  }

  const statusLabel = team.status
    ? team.status.charAt(0).toUpperCase() + team.status.slice(1)
    : 'Active';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
        <Text style={[styles.backText, { color: theme.colors.primary }]}>All Teams</Text>
      </TouchableOpacity>

      {/* Info card */}
      <View style={[styles.infoCard, CARD_SHADOW]}>
        <View style={styles.infoStatusRow}>
          <StatusPill status={statusLabel} />
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.editBtnText, { color: theme.colors.primary }]}>Admin Override</Text>
            </TouchableOpacity>
          )}
        </View>
        <Divider style={{ marginVertical: SPACING.sm }} />

        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              label="Team Name"
              value={teamName}
              onChangeText={setTeamName}
              mode="outlined"
              outlineColor="#EEEEEE"
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={styles.formInput}
            />
            <TextInput
              label="Jersey Color"
              value={jerseyColor}
              onChangeText={setJerseyColor}
              mode="outlined"
              outlineColor="#EEEEEE"
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={styles.formInput}
              placeholder="#E8302A or Red"
            />
            <View style={styles.editActions}>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                buttonColor={theme.colors.primary}
                textColor="#FFF"
                style={{ flex: 1 }}
              >
                Save Override
              </Button>
              <Button
                mode="outlined"
                onPress={() => { setEditing(false); setTeamName(team.name); setJerseyColor(team.jersey_color || ''); }}
                style={{ flex: 1 }}
                textColor={theme.colors.onSurface}
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.displayFields}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Team Name</Text>
              <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>{teamName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Jersey Color</Text>
              <View style={styles.colorRow}>
                <View style={[styles.colorSwatch, { backgroundColor: jerseyColor || '#CCCCCC' }]} />
                <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>{jerseyColor || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Organization</Text>
              <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>{team.organizations?.name || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Players</Text>
              <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>{roster.length}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Created</Text>
              <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>
                {team.created_at ? new Date(team.created_at).toLocaleDateString() : '—'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Roster */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Roster ({roster.length})</Text>
      {roster.length === 0 ? (
        <Text style={styles.emptyText}>No players on this team</Text>
      ) : (
        roster.map((p) => {
          const pStatus = p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Active';
          return (
            <View key={p.id} style={[styles.playerRow, CARD_SHADOW]}>
              <View style={[styles.jerseyBadge, { backgroundColor: jerseyColor || '#AAAAAA' }]}>
                <Text style={styles.jerseyNum}>#{p.jersey_number ?? '—'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{p.name}</Text>
                <Text style={styles.playerPos}>{p.position || 'Unassigned'}</Text>
              </View>
              <StatusPill status={pStatus} />
            </View>
          );
        })
      )}

      {/* ── Delete Team ── */}
      <Button
        mode="outlined"
        onPress={handleDeleteTeam}
        textColor={theme.colors.error}
        style={[styles.deleteTeamBtn, { borderColor: theme.colors.error }]}
        icon="trash-can-outline"
      >
        Delete Team (Admin Override)
      </Button>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: SPACING.md },
  backText: { fontSize: 14, fontWeight: '700' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.lg },
  infoStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  editForm: { gap: SPACING.sm },
  formInput: { backgroundColor: '#FFFFFF' },
  editActions: { flexDirection: 'row', gap: SPACING.sm },
  displayFields: { gap: SPACING.sm },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  fieldLabel: { fontSize: 12, color: '#AAAAAA', fontWeight: '600' },
  fieldValue: { fontSize: 14, fontWeight: '700' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorSwatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#EEEEEE' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.sm },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: SPACING.sm, gap: SPACING.md, marginBottom: SPACING.xs },
  jerseyBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  playerName: { fontSize: 14, fontWeight: '700' },
  playerPos: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
});
