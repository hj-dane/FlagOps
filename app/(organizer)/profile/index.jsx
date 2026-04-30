import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { APP_THEME } from '../../../theme';

export default function ProfileScreen() {
  const router = useRouter();
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => router.replace('/'),  // This goes to root app/index.jsx
          style: 'destructive'
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>User profile coming soon...</Text>
      
      <View style={styles.logoutButton}>
        <Button title="Sign Out" onPress={handleLogout} color={APP_THEME.colors.error} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 30,
  },
  logoutButton: {
    marginTop: 20,
    width: '80%',
  },
});