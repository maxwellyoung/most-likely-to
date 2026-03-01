import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { useRouter } from "expo-router";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import { Ionicons } from "@expo/vector-icons";

export default function CustomerCenterScreen() {
  const router = useRouter();
  const { isReady, checkProStatus } = useRevenueCat();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#818CF8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* RevenueCat Customer Center */}
      <RevenueCatUI.CustomerCenterView
        style={styles.customerCenter}
        onManagementOptionSelected={(event) => {
          console.log("[CustomerCenter] Management option selected:", event);
          checkProStatus();
        }}
        onDismiss={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#888",
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 16,
    padding: 8,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  customerCenter: {
    flex: 1,
    marginTop: 40,
  },
});
