import { View, Text, StyleSheet, FlatList } from 'react-native';
import { APP_THEME } from '../../../theme';
import { mockPlayers } from '../../../data/mockData';

const PLAYERS = mockPlayers.map(p => ({
  ...p,
  stats: {
    tds: p.stats?.touchdowns || p.stats?.tds || 0,
    ints: p.stats?.interceptions || p.stats?.ints || 0,
    flagsPulled: p.stats?.flagsPulled || 0,
    sacks: p.stats?.sacks || 0,
    matchesPlayed: p.stats?.matchesPlayed || 0,
  }
}));

export default function PlayersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players</Text>
      <Text style={styles.subtitle}>Player list coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_THEME.colors.secondary,
  },
  subtitle: {
    fontSize: 16,
    color: APP_THEME.colors.onSurfaceVariant,
    marginTop: 10,
  },
});