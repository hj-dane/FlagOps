// app/(organizer)/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import RightSidebar from '../../components/RightSidebar';

export default function OrganizerLayout() {
  return (
    <View style={styles.layoutWrapper}>
      {/* Stack mounts screens dynamically without introducing any bottom tab nav elements */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="home/dashboard" />
        <Stack.Screen name="leaderboard/index" />
        <Stack.Screen name="players/index" />
        <Stack.Screen name="stats/index" />
        <Stack.Screen name="profile/index" />
      </Stack>

      {/* Global absolute layer that handles sliding overlays on top of current view stacks */}
      <RightSidebar />
    </View>
  );
}

const styles = StyleSheet.create({
  layoutWrapper: {
    flex: 1,
  },
});