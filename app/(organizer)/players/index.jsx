import { View, Text, StyleSheet, FlatList } from 'react-native';
import { APP_THEME } from '../../../theme';
import { mockPlayers } from '../../../data/mockData';

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