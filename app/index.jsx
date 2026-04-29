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
import { mockUsers } from '../data/mockData';

export default function LoginScreen() {
  const router = useRouter();

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

    setTimeout(() => {
      const user = mockUsers.find(
        u => u.email === email && u.password === password
      );

      if (!user) {
        setError('Invalid credentials.');
        setLoading(false);
        return;
      }

      setLoading(false);
      router.replace('/dashboard');
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f0a" />
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
              placeholderTextColor="#4a5a4a"
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
              placeholderTextColor="#4a5a4a"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0a0f0a" />
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

// styles unchanged
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0f0a',
  },
  kav: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#c8f135',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#c8f135',
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
    color: '#ffffff',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c8f135',
    letterSpacing: 3,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#131a13',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1e2d1e',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#5a7a5a',
    marginBottom: 24,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#5a7a5a',
    fontWeight: '600',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e2d1e',
  },
  dividerText: {
    fontSize: 12,
    color: '#3a4a3a',
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2a3d2a',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
});