import { Stack } from "expo-router";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";

export default function RootLayout() {
  return (
    <RevenueCatProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="support" />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="customer-center"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </RevenueCatProvider>
  );
}
