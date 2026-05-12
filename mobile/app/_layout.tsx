import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="review"
          options={{
            title: 'Review Receipt',
            headerBackTitle: 'Back',
            headerTintColor: '#16A34A',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: true,
          }}
        />
        <Stack.Screen
          name="manual"
          options={{
            title: 'Add Items Manually',
            headerBackTitle: 'Back',
            headerTintColor: '#16A34A',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: true,
          }}
        />
      </Stack>
    </>
  );
}
