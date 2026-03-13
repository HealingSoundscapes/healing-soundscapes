import { Stack } from 'expo-router';

export default function AmbientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
