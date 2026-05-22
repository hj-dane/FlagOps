// app/(admin)/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RightSidebar from '../../components/RightSidebar';

// Auth guard removed — handled centrally in app/_layout.jsx AuthGate.
// This layout just owns the admin stack + sidebar overlay.
export default function AdminLayout() {
  return (
    <SafeAreaView style={styles.layoutWrapper} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="home/dashboard" />
        <Stack.Screen name="approvals/index" />
        <Stack.Screen name="organizations/index" />
        <Stack.Screen name="organizations/[id]" />
        <Stack.Screen name="teams/index" />
        <Stack.Screen name="teams/[id]" />
        <Stack.Screen name="players/index" />
        <Stack.Screen name="players/[id]" />
        <Stack.Screen name="leaderboard/index" />
      </Stack>

      <RightSidebar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  layoutWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
});
