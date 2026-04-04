import { Colors } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="owner" />
      <Stack.Screen name="vehicle" />
      <Stack.Screen name="driver" />
    </Stack>
  );
}
