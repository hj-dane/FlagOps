import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSetAtom } from 'jotai';
import { isSidebarOpenAtom } from '../store/globalStore';
import { APP_THEME, SPACING } from '../theme';

export default function ScreenHeader({ title, onBack }) {
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);

  return (
    <View style={styles.row}>
      {/* Left:*/}
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={APP_THEME.colors.secondary} />
          <Text style={styles.backText}>{title}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}

      {/* Right:*/}
      <TouchableOpacity
        onPress={() => setIsSidebarOpen(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.menuBtn}
      >
        <MaterialCommunityIcons name="menu" size={26} color={APP_THEME.colors.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: APP_THEME.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: APP_THEME.colors.secondary,
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.secondary,
  },
  menuBtn: {
    padding: 4,
  },
});
