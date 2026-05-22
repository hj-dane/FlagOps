// app/(organizer)/tournaments/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { Text, useTheme, Searchbar, Button, TextInput, Divider, FAB, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { tournamentsAtom, userProfileAtom } from '../../../store/globalStore';
import StatusPill from '../../../components/StatusPill';
import { SPACING, CARD_SHADOW } from '../../../theme';
import ScreenHeader from '../../../components/ScreenHeader';

const FILTER_TABS = ['All', 'Upcoming', 'Active', 'Completed'];
const LEVELS = ['National', 'Local', 'Intercollegiate', 'Intramurals'];
const TYPES = ['Single Elimination', 'Double Elimination', 'Round Robin', 'League'];

export default function TournamentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);
  const [tournaments, setTournaments] = useAtom(tournamentsAtom);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', startDate: '', endDate: '', location: '',
    description: '', type: TYPES[0], level: LEVELS[0],
  });

  const fetchTournaments = useCallback(async () => {
    if (!profile?.organization_id) return;
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date, location, status, level, type')
        .eq('organization_id', profile.organization_id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      setTournaments(data || []);
    } catch (err) {
      console.error('fetchTournaments error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const filtered = useMemo(() => {
    if (filter === 'All') return tournaments;
    return tournaments.filter((t) => t.status?.toLowerCase() === filter.toLowerCase());
  }, [tournaments, filter]);

  const handleCreate = async () => {
    if (!form.name.trim()) { Alert.alert('Name required'); return; }
    if (!form.startDate.trim()) { Alert.alert('Start date required'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: form.name.trim(),
          start_date: form.startDate.trim(),
          end_date: form.endDate.trim() || null,
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          type: form.type,
          level: form.level,
          organization_id: profile.organization_id,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      setTournaments((prev) => [data, ...prev]);
      setShowCreateModal(false);
      setForm({ name: '', startDate: '', endDate: '', location: '', description: '', type: TYPES[0], level: LEVELS[0] });
      Alert.alert('Tournament created', 'Your tournament is now active.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create tournament.');
    } finally {
      setCreating(false);
    }
  };

  const renderTournament = ({ item }) => {
    const label = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active';
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(organizer)/tournaments/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.card, CARD_SHADOW]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="trophy-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.tournamentName, { color: theme.colors.onSurface }]} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.start_date || '—'}
              {item.end_date ? ` → ${item.end_date}` : ''}
              {item.location ? ` · ${item.location}` : ''}
            </Text>
            <Text style={styles.levelBadge}>{item.level} · {item.type}</Text>
          </View>
          <View style={styles.cardRight}>
            <StatusPill status={label} />
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
      <ScreenHeader title="Tournaments" />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && { backgroundColor: theme.colors.primary }]}
            textStyle={[styles.chipText, filter === f && { color: '#FFF' }]}
            compact
          >
            {f}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTournament}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchTournaments(); }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="trophy-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>{filter === 'All' ? 'No tournaments yet' : `No ${filter.toLowerCase()} tournaments`}</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFF"
        onPress={() => setShowCreateModal(true)}
      />

      {/* Create Tournament Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Create Tournament</Text>
              <Text style={styles.modalSub}>Your tournament will be created immediately</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <TextInput label="Tournament Name *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />
              <TextInput label="Start Date (YYYY-MM-DD) *" value={form.startDate} onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />
              <TextInput label="End Date (YYYY-MM-DD)" value={form.endDate} onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />
              <TextInput label="Location" value={form.location} onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} />
              <TextInput label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                mode="outlined" outlineColor="#EEEEEE" activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface} style={styles.formInput} multiline numberOfLines={2} />

              <Text style={styles.pickerLabel}>Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity key={l} onPress={() => setForm((f) => ({ ...f, level: l }))}
                    style={[styles.pill, { backgroundColor: form.level === l ? theme.colors.primary : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: form.level === l ? '#FFF' : '#888' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity key={t} onPress={() => setForm((f) => ({ ...f, type: t }))}
                    style={[styles.pill, { backgroundColor: form.type === t ? theme.colors.primary : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: form.type === t ? '#FFF' : '#888' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button mode="contained" onPress={handleCreate} loading={creating} disabled={creating}
                  buttonColor={theme.colors.primary} textColor="#FFF" style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}>Create Tournament</Button>
                <Button mode="outlined" onPress={() => setShowCreateModal(false)} style={{ flex: 1 }}
                  textColor={theme.colors.onSurface} contentStyle={{ paddingVertical: 4 }}>Cancel</Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md, flexWrap: 'wrap' },
  chip: { borderRadius: 20, backgroundColor: '#F0F0F0' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#888' },
  list: { paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.md, gap: SPACING.md },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  tournamentName: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  levelBadge: { fontSize: 10, color: '#AAAAAA', marginTop: 1, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl * 2 },
  emptyText: { fontSize: 14, color: '#AAAAAA', fontStyle: 'italic' },
  fab: { position: 'absolute', right: SPACING.md, bottom: SPACING.lg },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFF', marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  pillRow: { gap: SPACING.xs, marginBottom: SPACING.sm },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
