// app/(organizer)/profile/index.jsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Text, Avatar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { userProfileAtom } from '../../../store/globalStore';
import { APP_THEME, SPACING } from '../../../theme';

function ProfileInfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={22} color={APP_THEME.colors.primary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not Configured'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              
              // Evict auth context state and reset route safely back to login root
              router.replace('/');
            } catch (err) {
              console.error('Error signing out:', err);
              Alert.alert('Sign Out Failed', 'An unexpected error occurred while logging out.');
            }
          }
        },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  // Generate clean avatar initials from the profile context name
  const avatarInitials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'OP';

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>My Profile</Text>

      {/* Header Profile Badge Card */}
      <View style={styles.profileHeaderCard}>
        <Avatar.Text 
          size={72} 
          label={avatarInitials} 
          style={{ backgroundColor: theme.colors.primaryContainer }}
          labelStyle={{ color: theme.colors.primary, fontWeight: '800' }}
        />
        <Text style={styles.profileName}>{profile.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {profile.role ? profile.role.toUpperCase() : 'ORGANIZER'}
          </Text>
        </View>
      </View>

      {/* Account Details Card List Group */}
      <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
      <View style={styles.infoCard}>
        <ProfileInfoRow 
          icon="account" 
          label="Full Name" 
          value={profile.name} 
        />
        <View style={styles.divider} />
        <ProfileInfoRow 
          icon="email" 
          label="Email Address" 
          value={profile.email} 
        />
        <View style={styles.divider} />
        <ProfileInfoRow 
          icon="shield-home" 
          label="Assigned League Organization" 
          value={profile.organization_name || 'Flag Football Administrator'} 
        />
      </View>

      {/* Primary Destructive Sign Out Button Layout */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.background,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.roundness,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
    marginBottom: 24,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 11,
    color: APP_THEME.colors.primary,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.roundness,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIcon: {
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 14,
    color: APP_THEME.colors.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.outlineVariant,
  },
  logoutButton: {
    backgroundColor: APP_THEME.colors.error,
    borderRadius: APP_THEME.roundness,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: APP_THEME.colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 40,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});