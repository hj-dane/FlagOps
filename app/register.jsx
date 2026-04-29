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

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    teamName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { fullName, email, teamName, password, confirmPassword } = form;

    if (!fullName || !email || !teamName || !password || !confirmPassword) {
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

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.replace('/dashboard');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f0a" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView contentContainerStyle={styles.scroll}>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Your{'\n'}Player</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={form.fullName}
              onChangeText={val => update('fullName', val)}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              onChangeText={val => update('email', val)}
            />

            <TextInput
              style={styles.input}
              placeholder="Team Name"
              value={form.teamName}
              onChangeText={val => update('teamName', val)}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={form.password}
              onChangeText={val => update('password', val)}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={val => update('confirmPassword', val)}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
            >
              <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// styles unchanged
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0f0a',
  },
  kav: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 28,
  },
  backArrow: {
    fontSize: 20,
    color: '#c8f135',
    marginRight: 8,
  },
  backText: {
    fontSize: 14,
    color: '#5a7a5a',
    fontWeight: '600',
  },
  header: {
    marginBottom: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: '#c8f13520',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#c8f13540',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c8f135',
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 44,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#5a7a5a',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#131a13',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1e2d1e',
  },
  errorText: {
    color: '#ff5a5a',
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
    color: '#c8f135',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0d130d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2d1e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ffffff',

  },
  termsRow: {
    marginTop: 4,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#4a5a4a',
    lineHeight: 18,
  },
  termsLink: {
    color: '#c8f135',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#c8f135',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#c8f135',
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
    color: '#0a0f0a',
    letterSpacing: 2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginPrompt: {
    fontSize: 14,
    color: '#4a5a4a',
  },
  loginLink: {
    fontSize: 14,
    color: '#c8f135',
    fontWeight: '800',
  },
});