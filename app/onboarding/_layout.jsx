import { Colors } from '@/config/theme';
import { Stack } from 'expo-router';
export default function OnboardingLayout() {
    return (<Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
        }}>
      <Stack.Screen name="onboardingOwnerScreen"/>
      <Stack.Screen name="onboardingVehicleScreen"/>
      <Stack.Screen name="onboardingDriverScreen"/>
    </Stack>);
}
