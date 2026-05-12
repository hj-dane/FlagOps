import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_THEME } from '../theme';

export default function SafeScreenWrapper({ children, scroll = false }) {
  const insets = useSafeAreaInsets();
  
  const ScrollView = require('react-native').ScrollView;
  
  if (scroll) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: APP_THEME.colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: APP_THEME.colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
});