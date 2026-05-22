
import { MD3LightTheme } from 'react-native-paper';

export const APP_THEME = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E8302A',           
    primaryContainer: '#FFDAD8',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#410002',
    secondary: '#1A1A1A',         
    onSecondary: '#FFFFFF',
    background: '#F5F5F5',        
    surface: '#FFFFFF',           
    surfaceVariant: '#F0F0F0',    
    onSurface: '#1A1A1A',         
    onSurfaceVariant: '#888888',  
    outline: '#E0E0E0',           
    outlineVariant: '#EEEEEE',
    error: '#E8302A',
    onError: '#FFFFFF',
    tertiary: '#FF6B00',          
    onTertiary: '#FFFFFF',
    inverseSurface: '#1A1A1A',    
    inverseOnSurface: '#FFFFFF',
    shadow: '#00000014',
  },
  roundness: 12,
};

// Status pill colors 
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

export const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};