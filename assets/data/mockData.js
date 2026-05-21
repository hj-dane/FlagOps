export const mockUsers = [
  {
    id: 'admin1',
    email: 'admin@flagfootball.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: 'org1',
    email: 'organizer@example.com',
    password: 'org123',
    name: 'John Organizer',
    role: 'organizer',
    organizationId: 'org_1',
    organizationName: 'Flag Football League',
  },
];

export const addUser = (user) => {
  mockUsers.push(user);
  return user;
};

export const mockOrganizations = [
  {
    id: 'org_1',
    name: 'Flag Football League',
    activeTeams: 12,
    activePlayers: 156,
    organizerCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'org_2',
    name: 'Youth Flag Football',
    activeTeams: 8,
    activePlayers: 89,
    organizerCount: 2,
    createdAt: '2024-02-15T00:00:00Z',
  },
];

export const mockTeams = [
  {
    id: 'team_1',
    name: 'Eagles',
    organizationId: 'org_1',
    organizationName: 'Flag Football League',
    playerCount: 12,
    status: 'active',
    jerseyColor: '#1a73e8',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'team_2',
    name: 'Tigers',
    organizationId: 'org_1',
    organizationName: 'Flag Football League',
    playerCount: 11,
    status: 'pending',
    jerseyColor: '#e8a01a',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'team_3',
    name: 'Dragons',
    organizationId: 'org_2',
    organizationName: 'Youth Flag Football',
    playerCount: 10,
    status: 'active',
    jerseyColor: '#e81a6e',
    createdAt: '2024-02-10T00:00:00Z',
  },
];

export const mockPlayers = [
  {
    id: 'player_1',
    name: 'Tom Brady',
    jerseyNumber: 12,
    positions: ['QB'],
    teamId: 'team_1',
    teamName: 'Eagles',
    organizationId: 'org_1',
    status: 'active',
    stats: {
      touchdowns: 25,
      interceptions: 5,
      flagsPulled: 12,
      sacks: 3,
      matchesPlayed: 8,
    },
  },
  {
    id: 'player_2',
    name: 'Patrick Mahomes',
    jerseyNumber: 15,
    positions: ['QB'],
    teamId: 'team_1',
    teamName: 'Eagles',
    organizationId: 'org_1',
    status: 'active',
    stats: {
      touchdowns: 28,
      interceptions: 4,
      flagsPulled: 8,
      sacks: 2,
      matchesPlayed: 8,
    },
  },
];

export const mockTournaments = [
  {
    id: 'tourney_1',
    name: 'Spring Championship',
    organizationId: 'org_1',
    organizationName: 'Flag Football League',
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2024-03-15T00:00:00Z',
    location: 'Central Park Field 1',
    description: 'Annual spring championship tournament',
    type: 'Championship',
    level: 'National',
    status: 'active',
  },
  {
    id: 'tourney_2',
    name: 'Summer League',
    organizationId: 'org_1',
    organizationName: 'Flag Football League',
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-08-15T00:00:00Z',
    location: 'Multiple Fields',
    description: 'Summer recreational league',
    type: 'League',
    level: 'Local',
    status: 'pending',
  },
];

export const mockMatches = [
  {
    id: 'match_1',
    tournamentId: 'tourney_1',
    tournamentName: 'Spring Championship',
    homeTeamId: 'team_1',
    homeTeamName: 'Eagles',
    awayTeamId: 'team_2',
    awayTeamName: 'Tigers',
    homeScore: 21,
    awayScore: 14,
    dateTime: '2024-03-02T15:00:00Z',
    location: 'Central Park Field 1',
    status: 'completed',
    timerState: { minutes: 0, seconds: 0, isRunning: false },
  },
  {
    id: 'match_2',
    tournamentId: 'tourney_1',
    tournamentName: 'Spring Championship',
    homeTeamId: 'team_1',
    homeTeamName: 'Eagles',
    awayTeamId: 'team_3',
    awayTeamName: 'Dragons',
    homeScore: 0,
    awayScore: 0,
    dateTime: new Date().toISOString(),
    location: 'Central Park Field 2',
    status: 'upcoming',
    timerState: { minutes: 20, seconds: 0, isRunning: false },
  },
];

export const mockApprovalRequests = [
  {
    id: 'approval_1',
    entityType: 'team',
    entityId: 'team_2',
    entityName: 'Tigers',
    changeType: 'create',
    proposedData: {
      name: 'Tigers',
      organizationId: 'org_1',
      jerseyColor: '#e8a01a',
    },
    currentData: null,
    orgName: 'Flag Football League',
    organizerName: 'John Organizer',
    createdAt: '2024-02-01T10:00:00Z',
    status: 'pending',
  },
];

export const mockPendingRequests = [
  {
    id: 'pending_1',
    entityType: 'team',
    entityName: 'Tigers',
    changeType: 'create',
    status: 'pending',
    submittedAt: '2024-02-01T10:00:00Z',
  },
];