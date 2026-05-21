import { Stack } from "expo-router";
import { Provider as JotaiProvider } from 'jotai';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { APP_THEME } from '../theme';

export default function RootLayout() {
  return (
    <JotaiProvider>
      <PaperProvider theme={APP_THEME}>
        <View style={styles.appContainer}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />

            {/* Group routes */}
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(organizer)" />
          </Stack>
        </View>
      </PaperProvider>
    </JotaiProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});