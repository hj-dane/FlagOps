import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RightSidebar from '../../components/RightSidebar';

export default function OrganizerLayout() {
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
        <Stack.Screen name="tournaments/index" />
        <Stack.Screen name="tournaments/[id]" />
        <Stack.Screen name="matches/index" />
        <Stack.Screen name="matches/[id]" />
        <Stack.Screen name="matches/live/[id]" />
        <Stack.Screen name="teams/index" />
        <Stack.Screen name="teams/[id]" />
        <Stack.Screen name="players/index" />
        <Stack.Screen name="players/[id]" />
        <Stack.Screen name="leaderboard/index" />
        <Stack.Screen name="stats/index" />
      </Stack>

      <RightSidebar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  layoutWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
});
