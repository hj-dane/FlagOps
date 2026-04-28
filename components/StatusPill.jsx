// components/StatusPill.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../theme';

export default function StatusPill({ status }) {
  const colors = STATUS_COLORS[status] ?? { bg: '#F5F5F5', text: '#757575' };
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      {status === 'Live' && <View style={styles.liveDot} />}
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8302A',
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});