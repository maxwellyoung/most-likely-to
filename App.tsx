import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { PersonalizedPartyGame } from "./components/PersonalizedPartyGame";
import * as SplashScreen from "expo-splash-screen";

// Import CSS for web
if (Platform.OS === "web") {
  require("./styles/global.css");
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts for both web and native
        await Font.loadAsync({
          "authentic-sans": require("./assets/fonts/authentic-sans-60.otf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  };

  if (!appIsReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <PersonalizedPartyGame />
    </SafeAreaProvider>
  );
}
