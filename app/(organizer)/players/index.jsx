// app/(organizer)/players/index.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { Text, ActivityIndicator, useTheme, Searchbar, Button, TextInput, Divider, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { playersAtom, teamsAtom, userProfileAtom } from '../../../store/globalStore';
import { APP_THEME, SPACING, CARD_SHADOW } from '../../../theme';
import StatusPill from '../../../components/StatusPill';
import ScreenHeader from '../../../components/ScreenHeader';

const POSITIONS = ['QB', 'WR', 'C', 'Rusher', 'DB'];
const ROLES = ['None', 'Captain', 'Vice-Captain'];

export default function PlayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);
  const [teams] = useAtom(teamsAtom);
  const [localTeams, setLocalTeams] = useState([]);
  const [players, setPlayers] = useAtom(playersAtom);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add player modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', jerseyNumber: '', position: POSITIONS[0],
    role: 'None', teamId: '',
  });

  const fetchPlayers = useCallback(async () => {
    if (!profile?.organization_id) return;
    try {
      const [playerOrgRes, teamOrgRes] = await Promise.all([
        // Fetch players linked to this org via junction table
        supabase
          .from('player_organizations')
          .select('player_id, players(id, name, jersey_number, position, status, team_id, teams(name))')
          .eq('organization_id', profile.organization_id),
        // Fetch teams linked to this org via junction table
        supabase
          .from('team_organizations')
          .select('team_id, teams(id, name, status, organization_id)')
          .eq('organization_id', profile.organization_id),
      ]);

      const playerList = (playerOrgRes.data || [])
        .map((r) => r.players)
        .filter(Boolean)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setPlayers(playerList);

      const teamList = (teamOrgRes.data || [])
        .map((r) => r.teams)
        .filter(Boolean)
        .filter((t) => t.status === 'active' || t.status === 'Active');
      setLocalTeams(teamList);
    } catch (err) {
      console.error('fetchPlayers error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const filteredPlayers = useMemo(() =>
    players.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.position?.toLowerCase().includes(q) ||
        p.teams?.name?.toLowerCase().includes(q) ||
        String(p.jersey_number || '').includes(q)
      );
    }), [players, searchQuery]
  );

  const handleAddPlayer = async () => {
    if (!addForm.name.trim()) { Alert.alert('Name required'); return; }
    if (!addForm.teamId) { Alert.alert('Team required', 'Please select a team.'); return; }
    if (!addForm.jerseyNumber.trim()) { Alert.alert('Jersey number required'); return; }

    setAdding(true);
    try {
      const playerName = addForm.name.trim();

      // Step 1: Check if player already exists on this team
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id, name, jersey_number, position, status, team_id, teams(name)')
        .eq('team_id', addForm.teamId)
        .ilike('name', playerName)
        .maybeSingle();

      let player = existingPlayer;

      if (existingPlayer) {
        // Player exists — just link to this org
        const { error: linkErr } = await supabase
          .from('player_organizations')
          .insert({ player_id: existingPlayer.id, organization_id: profile.organization_id });

        if (linkErr) {
          if (linkErr.code === '23505') {
            Alert.alert('Already added', `"${playerName}" is already in your organization.`);
            return;
          }
          throw linkErr;
        }
        Alert.alert('Player added', `"${playerName}" already exists and has been added to your organization.`);
      } else {
        // Check jersey duplicate within team
        const duplicate = players.some(
          (p) => p.team_id === addForm.teamId && String(p.jersey_number) === addForm.jerseyNumber.trim()
        );
        if (duplicate) {
          Alert.alert('Duplicate jersey', 'That number is already taken on this team.');
          setAdding(false);
          return;
        }

        // Player does not exist — create and link
        const { data: newPlayer, error: createErr } = await supabase
          .from('players')
          .insert({
            name: playerName,
            jersey_number: parseInt(addForm.jerseyNumber) || null,
            position: addForm.position,
            role: addForm.role === 'None' ? null : addForm.role,
            team_id: addForm.teamId,
            organization_id: profile.organization_id,
            status: 'active',
          })
          .select('id, name, jersey_number, position, status, team_id, teams(name)')
          .single();

        if (createErr) throw createErr;
        player = newPlayer;

        await supabase
          .from('player_organizations')
          .insert({ player_id: newPlayer.id, organization_id: profile.organization_id });

        Alert.alert('Player added', `"${playerName}" has been added to the roster.`);
      }

      setPlayers((prev) => {
        const exists = prev.find((p) => p.id === player.id);
        return exists ? prev : [...prev, player];
      });
      setShowAddModal(false);
      setAddForm({ name: '', jerseyNumber: '', position: POSITIONS[0], role: 'None', teamId: '' });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add player.');
    } finally {
      setAdding(false);
    }
  };

  // Active teams in the same org
  const orgActiveTeams = localTeams;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: APP_THEME.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: APP_THEME.colors.background }]}>
      <ScreenHeader title="Players" />

      <Searchbar
        placeholder="Search name, jersey #, position, team…"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
        iconColor="#AAAAAA"
        elevation={0}
      />

      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchPlayers(); }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching players' : 'No players yet. Add one below.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pillStatus = item.status
            ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
            : 'Active';
          return (
            <TouchableOpacity
              style={[styles.playerCard, CARD_SHADOW]}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(organizer)/players/[id]', params: { id: item.id } })}
            >
              <View style={[styles.playerNumberBox, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.playerNumberText}>#{item.jersey_number || '00'}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>{item.name}</Text>
                <Text style={styles.playerSubtitle}>
                  {item.position || 'Unassigned'} • {item.teams?.name || 'No Team'}
                </Text>
              </View>
              <StatusPill status={pillStatus} />
              <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          );
        }}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFF"
        onPress={() => setShowAddModal(true)}
      />

      {/* Add Player Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add Player</Text>
              <Text style={styles.modalSub}>If player exists on this team they'll be linked to your org. Otherwise a new player is created.</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <TextInput
                label="Full Name *"
                value={addForm.name}
                onChangeText={(v) => setAddForm((f) => ({ ...f, name: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput}
              />
              <TextInput
                label="Jersey Number *"
                value={addForm.jerseyNumber}
                onChangeText={(v) => setAddForm((f) => ({ ...f, jerseyNumber: v.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput}
              />

              <Text style={styles.pickerLabel}>Team *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {orgActiveTeams.length === 0 ? (
                  <Text style={styles.noTeamsText}>No active teams — create a team first</Text>
                ) : (
                  orgActiveTeams.map((t) => (
                    <TouchableOpacity key={t.id}
                      onPress={() => setAddForm((f) => ({ ...f, teamId: t.id }))}
                      style={[styles.pill, { backgroundColor: addForm.teamId === t.id ? theme.colors.primary : '#F0F0F0' }]}>
                      <Text style={[styles.pillText, { color: addForm.teamId === t.id ? '#FFF' : '#888' }]}>{t.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Text style={styles.pickerLabel}>Position</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity key={pos}
                    onPress={() => setAddForm((f) => ({ ...f, position: pos }))}
                    style={[styles.pill, { backgroundColor: addForm.position === pos ? theme.colors.primary : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: addForm.position === pos ? '#FFF' : '#888' }]}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {ROLES.map((role) => (
                  <TouchableOpacity key={role}
                    onPress={() => setAddForm((f) => ({ ...f, role }))}
                    style={[styles.pill, { backgroundColor: addForm.role === role ? theme.colors.primary : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: addForm.role === role ? '#FFF' : '#888' }]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleAddPlayer} loading={adding} disabled={adding}
                  buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}>Add / Link Player</Button>
                <Button mode="outlined" onPress={() => { setShowAddModal(false); setAddForm({ name: '', jerseyNumber: '', position: POSITIONS[0], role: 'None', teamId: '' }); }}
                  style={{ flex: 1 }} textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchbar: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  listContent: { paddingBottom: 100, gap: SPACING.sm },
  playerCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  playerNumberBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  playerNumberText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerSubtitle: { color: APP_THEME.colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: SPACING.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFF', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { gap: SPACING.xs, marginBottom: SPACING.sm },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  noTeamsText: { fontSize: 12, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: 6 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
