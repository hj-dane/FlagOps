import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider as JotaiProvider, useAtom } from 'jotai';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { APP_THEME } from '../theme';
import { supabase } from '../utils/supabase';
import { userProfileAtom } from '../store/globalStore';

function AuthGate() {
  const [userProfile, setUserProfile] = useAtom(userProfileAtom);
  const router = useRouter();
  const segments = useSegments();
  const [sessionReady, setSessionReady] = useState(false);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    if (segments.length > 0 && !navReady) setNavReady(true);
  }, [segments]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, name, role, organization_id, organizations(name)')
            .eq('id', session.user.id)
            .single();
          if (!error && profile) {
            setUserProfile({
              id: profile.id,
              name: profile.name,
              email: session.user.email,
              role: profile.role,
              organization_id: profile.organization_id,
              organizationName: profile.organizations?.name || '',
            });
          }
        }
      } catch (e) {
        // for errors
      } finally {
        setSessionReady(true);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) setUserProfile(null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionReady || !navReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userProfile && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (userProfile && inAuthGroup) {
      if (userProfile.role === 'admin') {
        router.replace('/(admin)/home/dashboard');
      } else {
        router.replace('/(organizer)/home/dashboard');
      }
    }
  }, [userProfile, sessionReady, navReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(organizer)" />
      <Stack.Screen name="profile-settings" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <JotaiProvider>
        <PaperProvider theme={APP_THEME}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={APP_THEME.colors.background}
            translucent={false}
          />
          <View style={styles.appContainer}>
            <AuthGate />
          </View>
        </PaperProvider>
      </JotaiProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1 },
});
