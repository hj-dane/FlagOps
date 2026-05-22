// app/(organizer)/teams/index.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { Text, useTheme, Searchbar, Button, TextInput, Divider, FAB, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtomValue, useAtom } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom, teamsAtom } from '../../../store/globalStore';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW, APP_THEME } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

export default function TeamsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);
  const [teams, setTeams] = useAtom(teamsAtom);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', jerseyColor: '' });
  const [creating, setCreating] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!profile?.organization_id) return;
    try {
      // Fetch teams linked to this org via junction table
      const { data, error } = await supabase
        .from('team_organizations')
        .select('team_id, teams(id, name, jersey_color, status, organization_id)')
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      const teamList = (data || [])
        .map((row) => row.teams)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      setTeams(teamList);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = useMemo(() =>
    teams.filter((t) =>
      t.name?.toLowerCase().includes(query.toLowerCase())
    ), [teams, query]
  );

  const handleCreateTeam = async () => {
    if (!createForm.name.trim()) {
      Alert.alert('Name required', 'Please enter a team name.');
      return;
    }
    setCreating(true);
    try {
      const teamName = createForm.name.trim();

      // Step 1: Check if team already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id, name, jersey_color, status')
        .ilike('name', teamName)
        .maybeSingle();

      let team = existingTeam;

      if (existingTeam) {
        // Team exists — just link it to this org
        const { error: linkErr } = await supabase
          .from('team_organizations')
          .insert({ team_id: existingTeam.id, organization_id: profile.organization_id });

        if (linkErr) {
          if (linkErr.code === '23505') {
            // Already linked
            Alert.alert('Already added', `"${teamName}" is already in your organization.`);
            return;
          }
          throw linkErr;
        }
        Alert.alert('Team added', `"${teamName}" already exists and has been added to your organization.`);
      } else {
        // Team does not exist — create it and link
        const { data: newTeam, error: createErr } = await supabase
          .from('teams')
          .insert({
            name: teamName,
            jersey_color: createForm.jerseyColor.trim() || null,
            organization_id: profile.organization_id,
            status: 'active',
          })
          .select()
          .single();

        if (createErr) throw createErr;
        team = newTeam;

        const { error: linkErr } = await supabase
          .from('team_organizations')
          .insert({ team_id: newTeam.id, organization_id: profile.organization_id });

        if (linkErr) throw linkErr;
        Alert.alert('Team created', `"${teamName}" has been created and added to your organization.`);
      }

      setTeams((prev) => {
        const exists = prev.find((t) => t.id === team.id);
        return exists ? prev : [team, ...prev];
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', jerseyColor: '' });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const renderTeam = ({ item }) => {
    const statusLabel = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
      : 'Active';

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(organizer)/teams/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.card, CARD_SHADOW]}>
          <View style={[styles.colorSwatch, { backgroundColor: item.jersey_color || '#CCCCCC' }]} />
          <View style={styles.cardBody}>
            <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>{item.name}</Text>
          </View>
          <View style={styles.cardRight}>
            <StatusPill status={statusLabel} />
            <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" style={{ marginTop: 6 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Teams" />

      <Searchbar
        placeholder="Search teams..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface }}
        elevation={0}
      />

      <FlatList
        data={filteredTeams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>{query ? 'No teams match your search' : 'No teams yet'}</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => setShowCreateModal(true)}
      />

      {/* Create Team Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add Team</Text>
              <Text style={styles.modalSub}>If the team already exists it will be linked to your org. Otherwise a new team is created.</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <TextInput
                label="Team Name"
                value={createForm.name}
                onChangeText={(val) => setCreateForm((f) => ({ ...f, name: val }))}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
                left={<TextInput.Icon icon="account-group-outline" color="#AAAAAA" />}
              />

              <TextInput
                label="Jersey Color (optional)"
                value={createForm.jerseyColor}
                onChangeText={(val) => setCreateForm((f) => ({ ...f, jerseyColor: val }))}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
                placeholder="#E8302A or Red"
                left={<TextInput.Icon icon="palette-outline" color="#AAAAAA" />}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleCreateTeam}
                  loading={creating}
                  disabled={creating}
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                  style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Add / Create Team
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => { setShowCreateModal(false); setCreateForm({ name: '', jerseyColor: '' }); }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchbar: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  list: { paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  colorSwatch: { width: 6, height: 48, borderRadius: 3 },
  cardBody: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: '700' },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 14, color: '#AAAAAA', fontStyle: 'italic' },
  fab: { position: 'absolute', right: SPACING.md, bottom: SPACING.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
