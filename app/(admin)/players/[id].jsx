// app/(admin)/players/[id].jsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  TextInput,
  Button,
  Divider,
} from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { PLAYERS, TEAMS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

const STAT_LABELS = [
  { key: 'tds', label: 'Touchdowns' },
  { key: 'ints', label: 'Interceptions' },
  { key: 'flagsPulled', label: 'Flags Pulled' },
  { key: 'sacks', label: 'Sacks' },
  { key: 'matchesPlayed', label: 'Matches Played' },
];

export default function AdminPlayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();

  const player = PLAYERS.find((p) => p.id === id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player?.name ?? '');
  const [jerseyNumber, setJerseyNumber] = useState(String(player?.jerseyNumber ?? ''));
  const [teamAssignment, setTeamAssignment] = useState(player?.teamName ?? '');
  const [savedAt, setSavedAt] = useState(null);

  if (!player) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Player not found.</Text>
      </View>
    );
  }

  const handleSave = () => {
    // TODO: PATCH /players/:id with admin override flag
    const now = new Date().toLocaleString();
    setSavedAt(now);
    setEditing(false);
    Alert.alert('Override Saved', `Edited by Admin on ${now}`);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Hero */}
      <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.heroTop}>
          <View style={styles.jerseyCircle}>
            <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>
              #{player.jerseyNumber}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {editing ? (
              <TextInput
                value={name}
                onChangeText={setName}
                mode="outlined"
                label="Full Name"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.editInput}
              />
            ) : (
              <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{name}</Text>
            )}
            <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
              {player.positions.join(' / ')}
              {player.role ? ` · ${player.role}` : ''}
            </Text>
          </View>
          <StatusPill status={player.status} />
        </View>

        <Divider style={{ marginVertical: SPACING.sm, backgroundColor: theme.colors.outline }} />

        <View style={styles.metaGrid}>
          <MetaField
            label="Jersey #"
            value={jerseyNumber}
            editing={editing}
            onEdit={setJerseyNumber}
            keyboardType="numeric"
            theme={theme}
          />
          <MetaField
            label="Team"
            value={teamAssignment}
            editing={editing}
            onEdit={setTeamAssignment}
            theme={theme}
          />
          <MetaField
            label="Org"
            value={player.orgName}
            editing={false}
            theme={theme}
          />
        </View>

        {savedAt && (
          <Text style={[styles.auditLabel, { color: theme.colors.onSurfaceVariant }]}>
            ✓ Edited by Admin on {savedAt}
          </Text>
        )}

        <View style={styles.actionRow}>
          {editing ? (
            <>
              <Button
                mode="contained"
                onPress={handleSave}
                style={{ flex: 1 }}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
              >
                Save Override
              </Button>
              <Button
                mode="outlined"
                onPress={() => setEditing(false)}
                style={{ flex: 1 }}
                textColor={theme.colors.onSurface}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setEditing(true)}
              icon="pencil"
              textColor={theme.colors.primary}
              style={{ borderColor: theme.colors.primary }}
            >
              Admin Override Edit
            </Button>
          )}
        </View>
      </Surface>

      {/* Stats Summary */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Career Stats</Text>
      <View style={styles.statsGrid}>
        {STAT_LABELS.map(({ key, label }) => (
          <Surface
            key={key}
            style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
            elevation={0}
          >
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {player.stats[key]}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
}

function MetaField({ label, value, editing, onEdit, keyboardType, theme }) {
  return (
    <View style={styles.metaItem}>
      <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      {editing && onEdit ? (
        <TextInput
          value={value}
          onChangeText={onEdit}
          dense
          mode="outlined"
          keyboardType={keyboardType ?? 'default'}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          style={{ height: 36, fontSize: 13, marginTop: 2, minWidth: 100 }}
        />
      ) : (
        <Text style={[styles.metaValue, { color: theme.colors.onSurface }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.sm },
  heroCard: {
    borderRadius: 16,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#1C2437',
    marginBottom: SPACING.sm,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  jerseyCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00E67618',
    borderWidth: 2,
    borderColor: '#00E67655',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: { fontSize: 16, fontWeight: '900' },
  heroName: { fontSize: 20, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  editInput: { backgroundColor: 'transparent', marginBottom: SPACING.xs },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  metaItem: { minWidth: 100 },
  metaLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  auditLabel: { fontSize: 11, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: '28%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#1C2437',
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
});