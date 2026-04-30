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
} from 'react-native';
import { useRouter } from 'expo-router';
import { APP_THEME, SPACING } from '../theme';
import { addUser, mockOrganizations } from '../data/mockData';

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    setTimeout(() => {
      // Check if organization exists or create new one
      let organizationId = null;
      let existingOrg = mockOrganizations.find(org => org.name === organizationName);
      
      if (existingOrg) {
        organizationId = existingOrg.id;
      } else {
        // Create new organization ID (in real app, backend would handle this)
        organizationId = `org_${Date.now()}`;
      }

      // Create new user with organizer role
      const newUser = {
        id: `org_${Date.now()}`,
        email: email,
        password: password,
        name: fullName,
        role: 'organizer',
        organizationId: organizationId,
        organizationName: organizationName,
      };

      // Add user to mock data
      addUser(newUser);
      
      console.log('New organizer registered:', newUser);

      setLoading(false);
      
      // Redirect to organizer home after successful registration
      router.replace('/(organizer)/home/index');
    }, 1000);
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
          {/* Back button - below status bar */}
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
    ...APP_THEME.shadow,
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
});