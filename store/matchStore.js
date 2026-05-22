import { atom } from 'jotai';

export const activeMatchAtom = atom({
  homeScore: 0,
  awayScore: 0,
  statsLog: [],
  matchPhase: 'Not Started'
});