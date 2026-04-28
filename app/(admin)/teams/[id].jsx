// app/(admin)/teams/[id].jsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  TextInput,
  Button,
  Divider,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StatusPill from '../../../components/StatusPill';
import { TEAMS, PLAYERS } from '../../../data/mockData';
import { SPACING } from '../../../theme';

export default function AdminTeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const team = TEAMS.find((t) => t.id === id);
  const roster = PLAYERS.filter((p) => p.teamId === id);

  const [editing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState(team?.name ?? '');
  const [jerseyColor, setJerseyColor] = useState(team?.jerseyColor ?? '');
  const [savedAt, setSavedAt] = useState(null);

  if (!team) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Team not found.</Text>
      </View>
    );
  }

  const handleSave = () => {
    // TODO: PATCH /teams/:id with admin override flag
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
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            {editing ? (
              <TextInput
                value={teamName}
                onChangeText={setTeamName}
                style={styles.editInput}
                mode="outlined"
                label="Team Name"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />
            ) : (
              <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>{teamName}</Text>
            )}
            <Text style={[styles.heroSub, { color: theme.colors.onSurfaceVariant }]}>
              {team.orgName}
            </Text>
          </View>
          <StatusPill status={team.status} />
        </View>

        <Divider style={{ marginVertical: SPACING.sm, backgroundColor: theme.colors.outline }} />

        <View style={styles.metaGrid}>
          <MetaItem label="Players" value={team.playerCount} theme={theme} />
          <MetaItem label="Jersey Color" value={jerseyColor} theme={theme} editable={editing}
            onEdit={setJerseyColor} />
          <MetaItem label="Created" value={team.createdAt} theme={theme} />
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

      {/* Roster */}
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Roster ({roster.length})
      </Text>

      {roster.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No players on this team
        </Text>
      ) : (
        roster.map((player) => (
          <TouchableOpacity
            key={player.id}
            onPress={() =>
              router.push({ pathname: '/(admin)/players/[id]', params: { id: player.id } })
            }
            activeOpacity={0.75}
          >
            <Surface
              style={[styles.playerRow, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <View style={styles.jerseyBadge}>
                <Text style={[styles.jerseyNum, { color: theme.colors.primary }]}>
                  #{player.jerseyNumber}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>
                  {player.name}
                  {player.role ? (
                    <Text style={{ color: theme.colors.secondary }}> · {player.role}</Text>
                  ) : null}
                </Text>
                <Text style={[styles.playerPos, { color: theme.colors.onSurfaceVariant }]}>
                  {player.positions.join(' / ')}
                </Text>
              </View>
              <StatusPill status={player.status} />
            </Surface>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function MetaItem({ label, value, theme, editable, onEdit }) {
  return (
    <View style={styles.metaItem}>
      <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onEdit}
          dense
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          style={{ height: 36, fontSize: 13, marginTop: 2 }}
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
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  heroName: { fontSize: 22, fontWeight: '800' },
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
    marginBottom: SPACING.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: '#2A3348',
  },
  jerseyBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#00E67614',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: { fontSize: 13, fontWeight: '800' },
  playerName: { fontSize: 14, fontWeight: '700' },
  playerPos: { fontSize: 12, marginTop: 2 },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
});