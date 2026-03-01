import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useRouter } from "expo-router";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import { Ionicons } from "@expo/vector-icons";

export default function PaywallScreen() {
  const router = useRouter();
  const { isReady, checkProStatus } = useRevenueCat();

  const handlePaywallResult = useCallback(
    async (result: PAYWALL_RESULT) => {
      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Refresh pro status and go back
          await checkProStatus();
          router.back();
          break;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.NOT_PRESENTED:
        default:
          // User cancelled or error, just go back
          router.back();
          break;
      }
    },
    [checkProStatus, router]
  );

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
      {/* Close button overlay */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* RevenueCat Paywall UI */}
      <RevenueCatUI.PaywallFooterContainerView
        style={styles.paywallContainer}
        options={{
          // Uses the default offering configured in RevenueCat dashboard
          // To use a specific offering: offeringIdentifier: "your_offering_id"
        }}
        onPurchaseCompleted={() => handlePaywallResult(PAYWALL_RESULT.PURCHASED)}
        onRestoreCompleted={() => handlePaywallResult(PAYWALL_RESULT.RESTORED)}
        onDismiss={() => handlePaywallResult(PAYWALL_RESULT.CANCELLED)}
      >
        {/* Custom header content */}
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={48} color="#818CF8" />
          </View>
          <Text style={styles.title}>Unlock Gambit Pro</Text>
          <Text style={styles.subtitle}>
            Get the ultimate party game experience
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureRow
              icon="infinite"
              text="Unlimited prompts"
              color="#FF6B6B"
            />
            <FeatureRow
              icon="flame"
              text="All spicy & chaos content"
              color="#FF8C42"
            />
            <FeatureRow
              icon="sparkles"
              text="New packs added weekly"
              color="#9B59B6"
            />
            <FeatureRow
              icon="people"
              text="Unlimited players"
              color="#00D9FF"
            />
          </View>
        </View>
      </RevenueCatUI.PaywallFooterContainerView>
    </View>
  );
}

function FeatureRow({
  icon,
  text,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
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
  paywallContainer: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#818CF820",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
    marginBottom: 32,
  },
  featuresContainer: {
    width: "100%",
    maxWidth: 320,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: "#FFF",
    flex: 1,
  },
});
