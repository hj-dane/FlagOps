// theme.js — React Native Paper theme matching Sportware design language
// Light background · Bold red accent · White cards · Black score surfaces

import { MD3LightTheme } from 'react-native-paper';

export const APP_THEME = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E8302A',           // Bold red — buttons, active states, pills
    primaryContainer: '#FFDAD8',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#410002',
    secondary: '#1A1A1A',         // Near-black — headings
    onSecondary: '#FFFFFF',
    background: '#F5F5F5',        // Light grey page background
    surface: '#FFFFFF',           // White card surface
    surfaceVariant: '#F0F0F0',    // Slightly off-white — input backgrounds, rows
    onSurface: '#1A1A1A',         // Near-black text
    onSurfaceVariant: '#888888',  // Grey secondary text
    outline: '#E0E0E0',           // Subtle dividers and borders
    outlineVariant: '#EEEEEE',
    error: '#E8302A',
    onError: '#FFFFFF',
    tertiary: '#FF6B00',          // Orange — pending/warning states
    onTertiary: '#FFFFFF',
    inverseSurface: '#1A1A1A',    // Score card dark surface
    inverseOnSurface: '#FFFFFF',
    shadow: '#00000014',
  },
  roundness: 12,
};

// Status pill colors — light theme
export const STATUS_COLORS = {
  Active:    { bg: '#E8F5E9', text: '#2E7D32' },
  Pending:   { bg: '#FFF3E0', text: '#E65100' },
  Inactive:  { bg: '#F5F5F5', text: '#757575' },
  Completed: { bg: '#E3F2FD', text: '#1565C0' },
  Canceled:  { bg: '#FFEBEE', text: '#C62828' },
  Live:      { bg: '#FFEBEE', text: '#E8302A' },
  Upcoming:  { bg: '#E3F2FD', text: '#1565C0' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Card shadow preset — replaces dark border approach from old theme
export const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};