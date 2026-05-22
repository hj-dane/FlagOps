// app/index.jsx
// Entry point — immediately redirects to auth.
// AuthGate in _layout.jsx handles session restore and role-based routing from there.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)" />;
}
