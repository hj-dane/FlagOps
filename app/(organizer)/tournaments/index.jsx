import { View, Text, StyleSheet } from 'react-native';
import { APP_THEME } from '../../../theme';

export default function TournamentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tournaments</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.background,
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