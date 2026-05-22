// app/(admin)/organizations/[id].jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, Surface, useTheme, Divider, ActivityIndicator, Searchbar, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { organizationsAtom } from '../../../store/globalStore';
import { supabase } from '../../../utils/supabase';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';

export default function OrgDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const orgs = useAtomValue(organizationsAtom);
  const org = orgs.find((o) => o.id === id);

  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [query, setQuery] = useState('');

  // Assign organizer modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchOrgData = useCallback(async () => {
    setLoading(true);
    const [teamRes, playerRes, organiRes] = await Promise.all([
      supabase
        .from('team_organizations')
        .select('team_id, teams(id, name, jersey_color, status, player_count)')
        .eq('organization_id', id),
      supabase
        .from('player_organizations')
        .select('player_id, players(id, name, jersey_number, position, status, teams(name))')
        .eq('organization_id', id),
      supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('organization_id', id)
        .eq('role', 'organizer'),
    ]);
    const teamList = (teamRes.data || []).map((r) => r.teams).filter(Boolean);
    setTeams(teamList);
    const playerList = (playerRes.data || []).map((r) => r.players).filter(Boolean);
    setPlayers(playerList);
    setOrganizers(organiRes.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchOrgData(); }, [fetchOrgData]);

  // Assign organizer by email — find user in profiles and link to this org
  const handleAssignOrganizer = async () => {
    if (!assignEmail.trim()) { Alert.alert('Email required'); return; }
    setAssigning(true);
    try {
      // Look up profile by email
      const { data: profileData, error: lookupErr } = await supabase
        .from('profiles')
        .select('id, name, email, role, organization_id')
        .eq('email', assignEmail.trim().toLowerCase())
        .maybeSingle();

      if (lookupErr) throw lookupErr;
      if (!profileData) {
        Alert.alert('Not found', 'No user found with that email address.');
        return;
      }
      if (profileData.organization_id === id) {
        Alert.alert('Already assigned', 'This user is already an organizer for this org.');
        return;
      }

      // Update profile to link to this org and set role
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ organization_id: id, role: 'organizer' })
        .eq('id', profileData.id);

      if (updateErr) throw updateErr;

      setOrganizers((prev) => [...prev, { ...profileData, organization_id: id, role: 'organizer' }]);
      setAssignEmail('');
      setShowAssignModal(false);
      Alert.alert('Assigned', `${profileData.name || profileData.email} is now an organizer for this org.`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not assign organizer.');
    } finally {
      setAssigning(false);
    }
  };

  // Remove organizer — unlink from org
  const handleRemoveOrganizer = (orgUser) => {
    Alert.alert('Remove Organizer', `Remove ${orgUser.name || orgUser.email} from this organization?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setRemovingId(orgUser.id);
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ organization_id: null })
              .eq('id', orgUser.id);
            if (error) throw error;
            setOrganizers((prev) => prev.filter((o) => o.id !== orgUser.id));
          } catch (err) {
            Alert.alert('Error', 'Could not remove organizer.');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const filteredTeams = teams.filter((t) => t.name?.toLowerCase().includes(query.toLowerCase()));
  const filteredPlayers = players.filter((p) =>
    p.name?.toLowerCase().includes(query.toLowerCase()) || String(p.jersey_number || '').includes(query)
  );

  if (!org) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Organization not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
        <Text style={[styles.backText, { color: theme.colors.primary }]}>Organizations</Text>
      </TouchableOpacity>

      {/* Hero */}
      <Surface style={[styles.heroCard, CARD_SHADOW]} elevation={0}>
        <View style={[styles.heroIcon, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.heroInitial, { color: theme.colors.primary }]}>{org.name[0]}</Text>
        </View>
        <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{org.name}</Text>
        <StatusPill status={org.status || 'Active'} />
        <Divider style={{ width: '100%', marginTop: SPACING.md }} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{teams.length}</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{players.length}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{organizers.length}</Text>
            <Text style={styles.statLabel}>Organizers</Text>
          </View>
        </View>
      </Surface>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['teams', 'players', 'organizers'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setActiveTab(tab); setQuery(''); }}
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.colors.primary : '#AAAAAA' }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab !== 'organizers' && (
        <Searchbar
          placeholder={`Search ${activeTab}...`}
          value={query}
          onChangeText={setQuery}
          style={styles.searchbar}
          inputStyle={{ color: theme.colors.onSurface, fontSize: 14 }}
          elevation={0}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'teams' ? (
        <>
          {filteredTeams.length === 0 ? (
            <Text style={styles.emptyText}>{query ? 'No teams match' : 'No teams in this org'}</Text>
          ) : (
            filteredTeams.map((t) => {
              const s = t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Active';
              return (
                <TouchableOpacity key={t.id}
                  onPress={() => router.push({ pathname: '/(admin)/teams/[id]', params: { id: t.id } })}
                  activeOpacity={0.7}>
                  <View style={[styles.listCard, CARD_SHADOW]}>
                    <View style={[styles.colorSwatch, { backgroundColor: t.jersey_color || '#CCCCCC' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{t.name}</Text>
                      <Text style={styles.cardSub}>{t.player_count ?? 0} players</Text>
                    </View>
                    <StatusPill status={s} />
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      ) : activeTab === 'players' ? (
        <>
          {filteredPlayers.length === 0 ? (
            <Text style={styles.emptyText}>{query ? 'No players match' : 'No players in this org'}</Text>
          ) : (
            filteredPlayers.map((p) => {
              const s = p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Active';
              return (
                <TouchableOpacity key={p.id}
                  onPress={() => router.push({ pathname: '/(admin)/players/[id]', params: { id: p.id } })}
                  activeOpacity={0.7}>
                  <View style={[styles.listCard, CARD_SHADOW]}>
                    <View style={[styles.jerseyBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.jerseyNum}>#{p.jersey_number || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{p.name}</Text>
                      <Text style={styles.cardSub}>{p.position || 'Unassigned'} · {p.teams?.name}</Text>
                    </View>
                    <StatusPill status={s} />
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      ) : (
        /* Organizers tab */
        <>
          <Button
            mode="contained"
            onPress={() => setShowAssignModal(true)}
            buttonColor={theme.colors.primary}
            textColor="#FFF"
            icon="account-plus-outline"
            style={styles.assignBtn}
          >
            Assign Organizer
          </Button>

          {organizers.length === 0 ? (
            <Text style={styles.emptyText}>No organizers assigned to this org</Text>
          ) : (
            organizers.map((o) => (
              <View key={o.id} style={[styles.listCard, CARD_SHADOW]}>
                <View style={[styles.orgAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{o.name || 'Unnamed'}</Text>
                  <Text style={styles.cardSub}>{o.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveOrganizer(o)}
                  disabled={removingId === o.id}
                  style={styles.removeOrgBtn}
                >
                  {removingId === o.id
                    ? <ActivityIndicator size={16} color={theme.colors.error} />
                    : <MaterialCommunityIcons name="account-minus-outline" size={20} color={theme.colors.error} />
                  }
                </TouchableOpacity>
              </View>
            ))
          )}
        </>
      )}

      {/* Assign Organizer Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Assign Organizer</Text>
              <Text style={styles.modalSub}>Enter the email of an existing user to make them an organizer for this org</Text>
              <Divider style={{ marginVertical: SPACING.md }} />
              <TextInput
                label="User Email"
                value={assignEmail}
                onChangeText={setAssignEmail}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email-outline" color="#AAAAAA" />}
              />
              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleAssignOrganizer} loading={assigning} disabled={assigning}
                  buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}>Assign</Button>
                <Button mode="outlined" onPress={() => { setShowAssignModal(false); setAssignEmail(''); }}
                  style={{ flex: 1 }} textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
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
  heroCard: { borderRadius: 16, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md, backgroundColor: '#FFF', gap: SPACING.sm },
  heroIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontSize: 30, fontWeight: '900' },
  heroName: { fontSize: 22, fontWeight: '800' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingTop: SPACING.md },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#AAAAAA', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  searchbar: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#EEEEEE' },
  emptyText: { fontSize: 13, color: '#AAAAAA', fontStyle: 'italic', paddingVertical: SPACING.md },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: SPACING.md, gap: SPACING.md, marginBottom: SPACING.xs },
  colorSwatch: { width: 6, height: 40, borderRadius: 3 },
  jerseyBadge: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  orgAvatar: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardSub: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  assignBtn: { borderRadius: 10, marginBottom: SPACING.md },
  removeOrgBtn: { padding: 8 },
  formInput: { backgroundColor: '#FFF', marginBottom: SPACING.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
