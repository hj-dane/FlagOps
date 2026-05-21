// app/(organizer)/tournaments/[id].jsx
import React, { Suspense, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, useTheme, Button, Divider, TextInput, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusPill from '../../../components/StatusPill';
import {
  tournamentsAtom,
  teamsAtom,
  updateTournamentField,
} from '../../../store/atoms';
import { SPACING, CARD_SHADOW } from '../../../theme';

// ── Detail content (inside Suspense) ─────────────────────────────────────────
function TournamentDetailContent() {
  const { id } = useLocalSearchParams();
  const theme  = useTheme();
  const router = useRouter();

  const tournaments = useAtomValue(tournamentsAtom);
  const allTeams    = useAtomValue(teamsAtom);
  const tournament  = tournaments?.find((t) => t.id === id);

  // Teams registered to this tournament's org (filter by org or tournament_id if available)
  const registeredTeams = allTeams?.filter((t) => t.organization_id === tournament?.organization_id) ?? [];

  // Local editable state
  const [editingField, setEditingField] = useState(null);
  const [name,        setName]          = useState(tournament?.name ?? '');
  const [location,    setLocation]      = useState(tournament?.location ?? '');
  const [description, setDescription]  = useState(tournament?.description ?? '');
  const [saving,      setSaving]        = useState(false);

  // Re-fetch tournaments after save
  const refreshTournaments = useAtomCallback(
    React.useCallback((get, set) => { set(tournamentsAtom); }, [])
  );

  if (!tournament) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Tournament not found.</Text>
      </View>
    );
  }

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      await updateTournamentField(id, field, value);
      await refreshTournaments();
      setEditingField(null);
    } catch (err) {
      Alert.alert('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

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
        Tournaments
      </Button>

      {/* Hero card */}
      <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            {editingField === 'name' ? (
              <View style={styles.inlineRow}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  dense
                  mode="outlined"
                  style={styles.inlineInput}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                />
                <TouchableOpacity
                  onPress={() => saveField('name', name)}
                  style={[styles.inlineSave, { backgroundColor: theme.colors.primary }]}
                  disabled={saving}
                >
                  <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setName(tournament.name); setEditingField(null); }}
                  style={[styles.inlineCancel, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <MaterialCommunityIcons name="close" size={18} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingField('name')} activeOpacity={0.7}>
                <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{name}</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
              {tournament.type} · {tournament.level}
            </Text>
          </View>
          <StatusPill status={tournament.status?.charAt(0).toUpperCase() + tournament.status?.slice(1)} />
        </View>

        <Divider style={{ marginVertical: SPACING.sm, backgroundColor: theme.colors.outline }} />

        <View style={styles.metaGrid}>
          {[
            ['Start',        new Date(tournament.start_date).toLocaleDateString()],
            ['End',          new Date(tournament.end_date).toLocaleDateString()],
            ['Organization', tournament.organization_name],
          ].map(([label, value]) => (
            <View key={label} style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
              <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Inline-editable location */}
        <View style={[styles.locationRow, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.primary} />
          {editingField === 'location' ? (
            <View style={[styles.inlineRow, { flex: 1 }]}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                dense
                mode="outlined"
                style={[styles.inlineInput, { flex: 1 }]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />
              <TouchableOpacity
                onPress={() => saveField('location', location)}
                style={[styles.inlineSave, { backgroundColor: theme.colors.primary }]}
                disabled={saving}
              >
                <MaterialCommunityIcons name="check" size={16} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setLocation(tournament.location); setEditingField(null); }}
                style={[styles.inlineCancel, { backgroundColor: theme.colors.outline }]}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingField('location')} style={{ flex: 1 }} activeOpacity={0.7}>
              <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>{location}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline-editable description */}
        <View style={styles.descRow}>
          <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>Description</Text>
          {editingField === 'description' ? (
            <>
              <TextInput
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ backgroundColor: 'transparent', marginTop: SPACING.xs }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />
              <View style={[styles.inlineRow, { marginTop: SPACING.xs }]}>
                <Button
                  mode="contained"
                  compact
                  onPress={() => saveField('description', description)}
                  buttonColor={theme.colors.primary}
                  textColor="#FFF"
                  loading={saving}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => { setDescription(tournament.description ?? ''); setEditingField(null); }}
                  textColor={theme.colors.onSurface}
                >
                  Cancel
                </Button>
              </View>
            </>
          ) : (
            <TouchableOpacity onPress={() => setEditingField('description')} activeOpacity={0.7}>
              <Text style={[styles.descText, { color: description ? theme.colors.onSurface : theme.colors.onSurfaceVariant }]}>
                {description || 'Tap to add a description…'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          mode="outlined"
          icon="plus"
          onPress={() => router.push({ pathname: '/(organizer)/matches/index' })}
          textColor={theme.colors.primary}
          style={[styles.addMatchBtn, { borderColor: theme.colors.primary }]}
        >
          Add Match
        </Button>
      </Surface>

      {/* Registered teams */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Registered Teams ({registeredTeams.length})
      </Text>

      {registeredTeams.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No teams registered yet
        </Text>
      ) : (
        registeredTeams.map((team) => (
          <TouchableOpacity
            key={team.id}
            onPress={() =>
              router.push({ pathname: '/(organizer)/teams/[id]', params: { id: team.id } })
            }
            activeOpacity={0.7}
          >
            <Surface
              style={[styles.teamRow, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <View style={[styles.colorSwatch, { backgroundColor: team.jersey_color ?? '#CCCCCC' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>{team.name}</Text>
                <Text style={[styles.teamMeta, { color: theme.colors.onSurfaceVariant }]}>
                  {team.player_count} players
                </Text>
              </View>
              <StatusPill status={team.status?.charAt(0).toUpperCase() + team.status?.slice(1)} />
              <MaterialCommunityIcons name="chevron-right" size={18} color="#CCCCCC" />
            </Surface>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TournamentDetailScreen() {
  const theme = useTheme();
  return (
    <Suspense
      fallback={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      }
    >
      <TournamentDetailContent />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', marginLeft: -SPACING.sm, marginBottom: SPACING.xs },
  heroCard: { borderRadius: 16, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: '#E0E0E0' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  heroName: { fontSize: 22, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  inlineInput: { flex: 1, backgroundColor: 'transparent', height: 40 },
  inlineSave: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  inlineCancel: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  metaItem: { minWidth: 100 },
  metaLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, borderRadius: 10, padding: SPACING.sm },
  locationText: { fontSize: 14, fontWeight: '600' },
  descRow: { gap: 4 },
  descText: { fontSize: 14, lineHeight: 20 },
  addMatchBtn: { marginTop: SPACING.xs },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: SPACING.md },
  teamRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: SPACING.md, gap: SPACING.md, marginBottom: SPACING.xs },
  colorSwatch: { width: 6, height: 44, borderRadius: 3 },
  teamName: { fontSize: 14, fontWeight: '700' },
  teamMeta: { fontSize: 12, marginTop: 2 },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
});
