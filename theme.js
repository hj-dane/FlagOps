
import { MD3DarkTheme } from 'react-native-paper';

export const APP_THEME = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00E676',           // Electric green – accent
    primaryContainer: '#00C853',
    onPrimary: '#001A09',
    secondary: '#1DE9B6',         // Teal – secondary accent
    background: '#0A0E1A',        // Deep navy-black
    surface: '#111827',           // Card surface
    surfaceVariant: '#1C2437',    // Slightly lighter surface
    onSurface: '#E8EAF0',
    onSurfaceVariant: '#8B95A8',
    outline: '#2A3348',
    error: '#FF4444',
    onError: '#1A0000',
    tertiary: '#FFB300',          // Amber – pending states
    onTertiary: '#1A1000',
  },
  roundness: 8,
};

// Status pill colors (background, text)
export const STATUS_COLORS = {
  Active:    { bg: '#00E67622', text: '#00E676' },
  Pending:   { bg: '#FFB30022', text: '#FFB300' },
  Inactive:  { bg: '#8B95A822', text: '#8B95A8' },
  Completed: { bg: '#1DE9B622', text: '#1DE9B6' },
  Canceled:  { bg: '#FF444422', text: '#FF4444' },
  Live:      { bg: '#00E67633', text: '#00E676' },
  Upcoming:  { bg: '#1DE9B622', text: '#1DE9B6' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};