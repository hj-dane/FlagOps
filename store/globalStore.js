import { atom } from 'jotai';

export const isSidebarOpenAtom = atom(false);

export const userSessionAtom = atom(null);
export const userProfileAtom = atom(null); 

export const teamsAtom = atom([]);
export const playersAtom = atom([]);
export const matchesAtom = atom([]);
export const tournamentsAtom = atom([]);
export const approvalRequestsAtom = atom([]);
export const leaderboardAtom = atom([]);
export const organizationsAtom = atom([]);

export const isDataLoadingAtom = atom(false);

export const isAppReadyAtom = atom((get) => {
  const teams = get(teamsAtom);
  const matches = get(matchesAtom);
  const tournaments = get(tournamentsAtom);
  const leaderboard = get(leaderboardAtom);
  const organizations = get(organizationsAtom);
  const players = get(playersAtom);
  return teams.length > 0 || matches.length > 0 || tournaments.length > 0 || leaderboard.length > 0 || organizations.length > 0 || players.length > 0;
});

export const adminStatsAtom = atom({
  pendingApprovals: 0,
  totalOrganizations: 0,
  totalPlayers: 0,
  totalTeams: 0,
});