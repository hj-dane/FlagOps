import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { supabase } from '../../utils/supabase'; // Reference to your root Supabase configuration
import { userProfileAtom } from '../../store/globalStore';
import { APP_THEME, SPACING, CARD_SHADOW } from '../../theme';

export default function LoginScreen() {
  const router = useRouter();
  const setUserProfile = useSetAtom(userProfileAtom);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth Engine
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Fetch the corresponding custom profile metadata row
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            role,
            organization_id,
            organizations ( name )
          `)
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        // Flatten database relational structure into standard atom layout
        const continuousProfile = {
          id: profile.id,
          name: profile.name,
          role: profile.role,
          organization_id: profile.organization_id,
          organizationName: profile.organizations?.name || '',
        };

        // 3. Hydrate state globally 
        setUserProfile(continuousProfile);

        // 4. Group Route Redirects (Strictly without parent sidebar side effects)
        if (continuousProfile.role === 'admin') {
           router.replace('/(admin)/home/dashboard');
        } else {
          router.replace('/(organizer)/home/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_THEME.colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>🏈</Text>
          </View>
          <Text style={styles.appName}>FLAG OPS</Text>
          <Text style={styles.tagline}>FLAG FOOTBALL MANAGER</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to manage your team</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="coach@team.com"
              placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={APP_THEME.colors.onPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  kav: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: APP_THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  card: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.roundness * 2,
    padding: 28,
    ...CARD_SHADOW,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: APP_THEME.colors.onSurface,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: APP_THEME.colors.onSurfaceVariant,
    marginBottom: 24,
  },
  errorText: {
    color: APP_THEME.colors.error,
    fontSize: 13,
    marginBottom: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_THEME.colors.surfaceVariant,
    borderRadius: APP_THEME.roundness,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: APP_THEME.colors.onSurface,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: APP_THEME.colors.primary,
    borderRadius: APP_THEME.roundness,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: APP_THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: APP_THEME.colors.onPrimary,
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: APP_THEME.colors.outline,
  },
  dividerText: {
    fontSize: 12,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  secondaryBtn: {
    borderRadius: APP_THEME.roundness,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.outline,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_THEME.colors.onSurface,
    letterSpacing: 2,
  },
});