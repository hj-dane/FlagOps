import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { APP_THEME } from '../../../theme';

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tournament Details</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
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