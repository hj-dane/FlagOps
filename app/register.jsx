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
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { supabase } from '../utils/supabase';
import { userProfileAtom } from '../store/globalStore';
import { APP_THEME, SPACING, CARD_SHADOW } from '../theme';

export default function RegisterScreen() {
  const router = useRouter();
  const setUserProfile = useSetAtom(userProfileAtom);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { fullName, email, organizationName, password, confirmPassword } = form;

    if (!fullName || !email || !organizationName || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Sign up user - Trigger will automatically create profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { name: fullName.trim() } // Pass name to user_metadata for trigger
        }
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error('Registration failed to yield valid credentials.');

      const userId = authData.user.id;

      // 2. Locate or create organization
      let targetOrgId = null;
      const cleanedOrgName = organizationName.trim();

      const { data: existingOrg, error: matchError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', cleanedOrgName)
        .maybeSingle();

      if (existingOrg) {
        targetOrgId = existingOrg.id;
      } else {
        const { data: newOrg, error: insertOrgError } = await supabase
          .from('organizations')
          .insert({ name: cleanedOrgName })
          .select()
          .single();

        if (insertOrgError) throw insertOrgError;
        targetOrgId = newOrg.id;
      }

      // 3. UPDATE the existing profile (created by trigger) with organization_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: targetOrgId,
          name: fullName.trim() // Ensure name is set correctly
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 4. Update global state
      setUserProfile({
        id: userId,
        name: fullName.trim(),
        role: 'organizer',
        organization_id: targetOrgId,
        organizationName: cleanedOrgName
      });

      // 5. Show success modal instead of auto-redirect
      setRegisteredEmail(email.trim());
      setShowSuccessModal(true);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToLogin = () => {
    setShowSuccessModal(false);
    router.replace('/');
  };

  const handleStayOnRegister = () => {
    setShowSuccessModal(false);
    // Reset form if desired
    setForm({
      fullName: '',
      email: '',
      organizationName: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_THEME.colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Create Your{'\n'}Organizer Account</Text>
            <Text style={styles.subtitle}>Join as an organizer to manage teams and tournaments</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
                value={form.fullName}
                onChangeText={val => update('fullName', val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="organizer@example.com"
                placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
                value={form.email}
                onChangeText={val => update('email', val)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ORGANIZATION NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Flag Football League"
                placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
                value={form.organizationName}
                onChangeText={val => update('organizationName', val)}
              />
              <Text style={styles.helperText}>
                Your organization will be created if it doesn't exist
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
                secureTextEntry
                value={form.password}
                onChangeText={val => update('password', val)}
              />
              <Text style={styles.helperText}>Must be at least 6 characters</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={APP_THEME.colors.onSurfaceVariant}
                secureTextEntry
                value={form.confirmPassword}
                onChangeText={val => update('confirmPassword', val)}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={APP_THEME.colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>CREATE ORGANIZER ACCOUNT</Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ As an organizer, you'll be able to:
              </Text>
              <Text style={styles.infoBullet}>• Create and manage teams</Text>
              <Text style={styles.infoBullet}>• Organize tournaments</Text>
              <Text style={styles.infoBullet}>• Schedule matches</Text>
              <Text style={styles.infoBullet}>• Manage player rosters</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.modalTitle}>Registration Successful!</Text>
            <Text style={styles.modalMessage}>
              Your account has been created successfully.
            </Text>
            <Text style={styles.modalEmail}>{registeredEmail}</Text>
            <Text style={styles.modalQuestion}>
              Would you like to login now?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.loginButton]}
                onPress={handleRedirectToLogin}
              >
                <Text style={styles.loginButtonText}>Yes, Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.stayButton]}
                onPress={handleStayOnRegister}
              >
                <Text style={styles.stayButtonText}>Stay Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  backButtonContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 24,
    color: APP_THEME.colors.primary,
    marginRight: 8,
    fontWeight: '600',
  },
  backText: {
    fontSize: 16,
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
    lineHeight: 44,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 4,
  },
  card: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.roundness * 2,
    padding: 28,
    ...CARD_SHADOW,
  },
  errorText: {
    color: APP_THEME.colors.error,
    fontSize: 13,
    marginBottom: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
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
  helperText: {
    fontSize: 11,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 4,
    marginLeft: 4,
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
    marginTop: SPACING.md,
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
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: APP_THEME.colors.surfaceVariant,
    borderRadius: APP_THEME.roundness,
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.onSurface,
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 12,
    color: APP_THEME.colors.onSurfaceVariant,
    marginLeft: 8,
    marginBottom: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: APP_THEME.colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: APP_THEME.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.onSurface,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: APP_THEME.colors.primary,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stayButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: APP_THEME.colors.outline,
  },
  stayButtonText: {
    color: APP_THEME.colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 14,
  },
});