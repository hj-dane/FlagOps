import { atom } from 'jotai';

// UI State
export const isSidebarOpenAtom = atom<boolean>(false);

// Auth & Profile State
export const userSessionAtom = atom<any>(null);
export const userProfileAtom = atom<{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer' | 'player';
  organization_id: string | null;
} | null>(null);

// Core Data Collections (Cached from Supabase)
export const teamsAtom = atom<any[]>([]);
export const matchesAtom = atom<any[]>([]);
export const tournamentsAtom = atom<any[]>([]);
export const approvalRequestsAtom = atom<any[]>([]);

// Loading & Global Refresh Indicators
export const isDataLoadingAtom = atom<boolean>(false);