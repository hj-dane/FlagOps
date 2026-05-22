import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { APP_THEME, SPACING, CARD_SHADOW } from '../../theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: 'flagops://reset-password',
        }
      );

      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
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
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={APP_THEME.colors.onSurface}
          />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>🔑</Text>
          </View>
          <Text style={styles.appName}>FLAG OPS</Text>
          <Text style={styles.tagline}>PASSWORD RECOVERY</Text>
        </View>

        <View style={styles.card}>
          {sent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialCommunityIcons
                  name="email-check-outline"
                  size={40}
                  color={APP_THEME.colors.primary}
                />
              </View>
              <Text style={styles.successTitle}>Check Your Inbox</Text>
              <Text style={styles.successSubtitle}>
                We've sent a password reset link to{' '}
                <Text style={styles.successEmail}>{email.trim()}</Text>. Check
                your email and follow the instructions.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>BACK TO SIGN IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => {
                  setSent(false);
                  setEmail('');
                }}
              >
                <Text style={styles.resendText}>Try a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.cardTitle}>Forgot Password?</Text>
              <Text style={styles.cardSubtitle}>
                Enter your account email and we'll send you a reset link.
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="coach@team.com"
                  placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={APP_THEME.colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>SEND RESET LINK</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.replace('/')}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>SIGN IN INSTEAD</Text>
              </TouchableOpacity>
            </>
          )}
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.onSurface,
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
    lineHeight: 20,
  },
  errorText: {
    color: APP_THEME.colors.error,
    fontSize: 13,
    marginBottom: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
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
  // ── Success State ──
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_THEME.colors.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: APP_THEME.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successEmail: {
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  resendBtn: {
    marginTop: 16,
  },
  resendText: {
    fontSize: 13,
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});