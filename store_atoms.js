// store/atoms.js
// All Jotai atoms for FlagOps.
// Pattern: one "data" atom + one derived "loading/error" atom per resource.
// Async atoms fetch from Supabase; write atoms optimistically update local state.

import { atom } from 'jotai';
import { atomWithRefresh } from 'jotai/utils';
import { supabase } from '../lib/supabase';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const sessionAtom = atom(null); // supabase.auth.Session | null

// ─── Approvals ───────────────────────────────────────────────────────────────

export const approvalFilterAtom = atom('All'); // 'All' | 'team' | 'player' | 'tournament'
export const approvalQueryAtom   = atom('');

export const approvalsAtom = atomWithRefresh(async () => {
  const { data, error } = await supabase
    .from('approval_requests')
    .select(`
      id, entity_type, entity_name, change_type, status,
      org_name, organizer_name, created_at,
      proposed_data, current_data
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

// Derived: filtered approvals (pure — no async)
export const filteredApprovalsAtom = atom((get) => {
  const all    = get(approvalsAtom);
  const query  = get(approvalQueryAtom).toLowerCase();
  const filter = get(approvalFilterAtom);

  if (!Array.isArray(all)) return [];

  return all.filter((a) => {
    const matchesQuery =
      a.entity_name?.toLowerCase().includes(query) ||
      a.org_name?.toLowerCase().includes(query) ||
      a.organizer_name?.toLowerCase().includes(query);
    const matchesType = filter === 'All' || a.entity_type === filter;
    return matchesQuery && matchesType;
  });
});

export const pendingCountAtom = atom((get) => {
  const all = get(approvalsAtom);
  if (!Array.isArray(all)) return 0;
  return all.filter((a) => a.status === 'pending').length;
});

// ─── Tournaments ─────────────────────────────────────────────────────────────

export const tournamentQueryAtom        = atom('');
export const tournamentStatusFilterAtom = atom('All');

export const tournamentsAtom = atomWithRefresh(async () => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, type, level, location, start_date, end_date, status, organization_id, organization_name, description')
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const filteredTournamentsAtom = atom((get) => {
  const all    = get(tournamentsAtom);
  const query  = get(tournamentQueryAtom).toLowerCase();
  const status = get(tournamentStatusFilterAtom);

  if (!Array.isArray(all)) return [];

  return all.filter((t) => {
    const matchesQuery =
      t.name?.toLowerCase().includes(query) ||
      t.location?.toLowerCase().includes(query);
    const matchesStatus = status === 'All' || t.status?.toLowerCase() === status.toLowerCase();
    return matchesQuery && matchesStatus;
  });
});

// ─── Teams ───────────────────────────────────────────────────────────────────

export const teamQueryAtom = atom('');

export const teamsAtom = atomWithRefresh(async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, status, jersey_color, organization_id, organization_name, player_count')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const filteredTeamsAtom = atom((get) => {
  const all   = get(teamsAtom);
  const query = get(teamQueryAtom).toLowerCase();

  if (!Array.isArray(all)) return [];

  return all.filter((t) =>
    t.name?.toLowerCase().includes(query) ||
    t.organization_name?.toLowerCase().includes(query)
  );
});

// ─── Players ─────────────────────────────────────────────────────────────────

// Keyed by player id so we can cache individual fetches
const _playerCacheAtom = atom({});  // Record<id, Player>

export const playerAtomFamily = (id) =>
  atom(
    async (get) => {
      const cache = get(_playerCacheAtom);
      if (cache[id]) return cache[id];

      const { data, error } = await supabase
        .from('players')
        .select(`
          id, name, jersey_number, positions, role, status,
          team_id, team_name, organization_id,
          stats:player_stats ( touchdowns, interceptions, flags_pulled, sacks, matches_played )
        `)
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  );

// ─── Helpers / write actions ─────────────────────────────────────────────────

// These are plain async functions (not atoms) used in event handlers.
// They mutate Supabase and the caller should call `refresh(atom)` afterwards.

export async function resolveApproval(id, decision, adminNote) {
  const { error } = await supabase
    .from('approval_requests')
    .update({ status: decision, admin_note: adminNote, resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateTournamentField(id, field, value) {
  const { error } = await supabase
    .from('tournaments')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function submitPlayerEdit(playerId, proposed) {
  const { error } = await supabase
    .from('approval_requests')
    .insert({
      entity_type: 'player',
      entity_id: playerId,
      change_type: 'edit',
      status: 'pending',
      proposed_data: proposed,
      created_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export async function submitNewPlayer(teamId, proposed) {
  const { error } = await supabase
    .from('approval_requests')
    .insert({
      entity_type: 'player',
      entity_id: null,
      change_type: 'create',
      status: 'pending',
      proposed_data: { ...proposed, team_id: teamId },
      created_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}
