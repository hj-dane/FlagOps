import React from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback } from 'react-native';
import { Text, Button, Divider, IconButton } from 'react-native-paper';
import { useAtom } from 'jotai';
import { isSidebarOpenAtom, userProfileAtom } from '../store/globalStore';
import { APP_THEME, SPACING } from '../theme';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.60;

export default function RightSidebar() {
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const [profile, setProfile] = useAtom(userProfileAtom);
  const router = useRouter();
  
  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsOpen(false);
    router.replace('/(auth)');
  };

  const navigateTo = (path) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.profileName}>
            {profile?.name || 'User Profile'}
          </Text>
          <Text variant="bodySmall" style={{ color: APP_THEME.colors.onSurfaceVariant, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>
            {profile?.role || 'Guest'}
          </Text>
          <IconButton 
            icon="close" 
            iconColor={APP_THEME.colors.secondary} 
            size={24} 
            onPress={() => setIsOpen(false)} 
            style={styles.closeBtn}
          />
        </View>
        <Divider />

        <View style={styles.menuItems}>
          {/* Admin Navigation */}
          {profile?.role === 'admin' && (
            <>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="home" onPress={() => navigateTo('/(admin)/home/dashboard')}>Home</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="shield-check" onPress={() => navigateTo('/(admin)/approvals')}>Approvals</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="office-building" onPress={() => navigateTo('/(admin)/organizations')}>Organizations</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="account-group" onPress={() => navigateTo('/(admin)/teams')}>Teams</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="account" onPress={() => navigateTo('/(admin)/players')}>Players</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="podium" onPress={() => navigateTo('/(admin)/leaderboard')}>Leaderboards</Button>
            </>
          )}

          {/* Organizer Navigation */}
          {profile?.role === 'organizer' && (
            <>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="home" onPress={() => navigateTo('/(organizer)/home/dashboard')}>Home</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="trophy" onPress={() => navigateTo('/(organizer)/tournaments')}>Tournaments</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="podium" onPress={() => navigateTo('/(organizer)/leaderboard')}>Leaderboard</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="chart-bar" onPress={() => navigateTo('/(organizer)/stats')}>Stats</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="account-group" onPress={() => navigateTo('/(organizer)/teams')}>Teams</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="account" onPress={() => navigateTo('/(organizer)/players')}>Players</Button>
              <Button mode="text" contentStyle={styles.menuBtnContent} labelStyle={styles.menuLabel} icon="football" onPress={() => navigateTo('/(organizer)/matches')}>Matches</Button>
            </>
          )}

          <Divider style={{ marginVertical: SPACING.sm }} />
          
          {/* Shared Profile Settings - Appears for both roles */}
          <Button 
            mode="text" 
            contentStyle={styles.menuBtnContent} 
            labelStyle={styles.menuLabel} 
            icon="cog" 
            onPress={() => { setIsOpen(false); router.navigate('/profile-settings'); }}
          >
            Profile Settings
          </Button>
        </View>

        <View style={styles.footer}>
          <Button mode="contained" buttonColor={APP_THEME.colors.primary} textColor={APP_THEME.colors.onPrimary} icon="logout" onPress={handleLogout}>
            Sign Out
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: APP_THEME.colors.surface,
    position: 'absolute',
    right: 0,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  profileName: {
    fontWeight: '700',
    color: APP_THEME.colors.secondary,
  },
  closeBtn: {
    position: 'absolute',
    right: -10,
    top: 0,
  },
  menuItems: {
    flex: 1,
    marginTop: SPACING.lg,
  },
  menuBtnContent: {
    justifyContent: 'flex-start',
    height: 48,
  },
  menuLabel: {
    fontSize: 16,
    color: APP_THEME.colors.onSurface,
  },
  footer: {
    marginBottom: SPACING.xl,
  },
});