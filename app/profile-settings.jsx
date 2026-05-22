// app/profile-settings.jsx
// Shared profile & settings screen — accessible from both admin and organizer sidebar
import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text, TextInput, Button, Divider, useTheme, ActivityIndicator, Switch,
} from 'react-native-paper';
import { useAtomValue } from 'jotai';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userProfileAtom } from '../store/globalStore';
import { supabase } from '../utils/supabase';
import { APP_THEME, SPACING, CARD_SHADOW } from '../theme';

const ROLE_COLORS = {
  admin:     { bg: '#FFDAD8', text: '#E8302A' },
  organizer: { bg: '#E3F2FD', text: '#1565C0' },
};

export default function ProfileSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useAtomValue(userProfileAtom);

  // ── Change password state ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ── Notification preferences state ──
  const [notifPrefs, setNotifPrefs] = useState({
    approvalUpdates: true,
    matchReminders: true,
    rejectionAlerts: true,
    leaderboardUpdates: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // ── Change password ──
  const handleChangePassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect.');

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      Alert.alert('Password updated', 'Your password has been changed successfully.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword, profile]);

  // ── Save notification prefs ──
  const handleSaveNotifs = useCallback(async () => {
    setSavingNotifs(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: notifPrefs })
        .eq('id', profile?.id);
      if (error) throw error;
      Alert.alert('Saved', 'Notification preferences updated.');
    } catch (err) {
      Alert.alert('Error', 'Could not save preferences.');
    } finally {
      setSavingNotifs(false);
    }
  }, [notifPrefs, profile]);

  const roleStyle = ROLE_COLORS[profile?.role] || ROLE_COLORS.organizer;

  const NOTIF_OPTIONS = [
    { key: 'approvalUpdates',   label: 'Approval updates',    desc: 'When your requests are approved or rejected' },
    { key: 'matchReminders',    label: 'Match reminders',     desc: 'Reminders before scheduled matches' },
    { key: 'rejectionAlerts',   label: 'Rejection alerts',    desc: 'Immediate alerts for rejected requests' },
    { key: 'leaderboardUpdates',label: 'Leaderboard updates', desc: 'When rankings change in your org' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Fixed back button above scroll */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
        <Text style={[styles.backText, { color: theme.colors.primary }]}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <Text style={[styles.screenTitle, { color: theme.colors.onSurface }]}>Profile & Settings</Text>

      {/* ── Profile card ── */}
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
              {profile?.name || '—'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
                {profile?.role?.toUpperCase() || '—'}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={{ marginVertical: SPACING.md }} />

        {/* Read-only fields */}
        {profile?.organizationName && (
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconWrap}>
              <MaterialCommunityIcons name="office-building-outline" size={18} color="#AAAAAA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Organization</Text>
              <Text style={[styles.fieldValue, { color: theme.colors.onSurface }]}>
                {profile.organizationName}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Security ── */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Security</Text>
      <View style={[styles.card, CARD_SHADOW]}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setShowPasswordModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#FFF3E0' }]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#E65100" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: theme.colors.onSurface }]}>Change Password</Text>
            <Text style={styles.actionDesc}>Update your login password</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#CCCCCC" />
        </TouchableOpacity>
      </View>

      {/* ── Notification preferences ── */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Notifications</Text>
      <View style={[styles.card, CARD_SHADOW]}>
        {NOTIF_OPTIONS.map(({ key, label, desc }, idx) => (
          <View key={key}>
            {idx > 0 && <Divider style={{ marginVertical: 2 }} />}
            <View style={styles.notifRow}>
              <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                <Text style={[styles.notifLabel, { color: theme.colors.onSurface }]}>{label}</Text>
                <Text style={styles.notifDesc}>{desc}</Text>
              </View>
              <Switch
                value={notifPrefs[key]}
                onValueChange={(val) => setNotifPrefs((p) => ({ ...p, [key]: val }))}
                color={theme.colors.primary}
              />
            </View>
          </View>
        ))}

        <Divider style={{ marginVertical: SPACING.sm }} />
        <Button
          mode="contained"
          onPress={handleSaveNotifs}
          loading={savingNotifs}
          disabled={savingNotifs}
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
          style={{ borderRadius: 10 }}
          contentStyle={{ paddingVertical: 4 }}
        >
          Save Preferences
        </Button>
      </View>


      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Change Password</Text>
              <Text style={styles.modalSub}>You'll be re-authenticated before the change is applied</Text>
              <Divider style={{ marginVertical: SPACING.md }} />

              <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
                right={
                  <TextInput.Icon
                    icon={showCurrent ? 'eye-off' : 'eye'}
                    onPress={() => setShowCurrent((v) => !v)}
                    color="#AAAAAA"
                  />
                }
              />

              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
                right={
                  <TextInput.Icon
                    icon={showNew ? 'eye-off' : 'eye'}
                    onPress={() => setShowNew((v) => !v)}
                    color="#AAAAAA"
                  />
                }
              />

              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                mode="outlined"
                outlineColor="#EEEEEE"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                style={styles.formInput}
                right={
                  <TextInput.Icon
                    icon={showConfirm ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirm((v) => !v)}
                    color="#AAAAAA"
                  />
                }
              />

              {/* Strength hint */}
              {newPassword.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1,2,3,4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            newPassword.length >= i * 3
                              ? newPassword.length >= 12 ? '#4CAF50'
                                : newPassword.length >= 8 ? '#FF9800'
                                : '#F44336'
                              : '#EEEEEE'
                        }
                      ]}
                    />
                  ))}
                  <Text style={styles.strengthLabel}>
                    {newPassword.length < 8 ? 'Too short' : newPassword.length < 12 ? 'Fair' : 'Strong'}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleChangePassword}
                  loading={savingPassword}
                  disabled={savingPassword}
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                  style={{ flex: 1 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Update Password
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={{ flex: 1 }}
                  textColor={theme.colors.onSurface}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backText: { fontSize: 14, fontWeight: '700' },
  screenTitle: { fontSize: 26, fontWeight: '900', marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.xs },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 26, fontWeight: '900' },
  profileName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  roleBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6 },
  fieldIconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  readOnlyTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  readOnlyText: { fontSize: 10, color: '#AAAAAA', fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: 4 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionDesc: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  notifLabel: { fontSize: 14, fontWeight: '600' },
  notifDesc: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  formInput: { backgroundColor: '#FFFFFF', marginBottom: SPACING.sm },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', color: '#888888', width: 60 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
