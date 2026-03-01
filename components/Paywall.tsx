"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PurchasesPackage, PurchasesOffering } from "react-native-purchases";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  ENTITLEMENT_ID,
} from "../lib/purchases";
import { Ionicons } from "@expo/vector-icons";

interface PaywallProps {
  onClose: () => void;
  onPurchaseSuccess: (entitlements: string[]) => void;
}

// Package display configuration
const PACKAGE_CONFIG: Record<
  string,
  {
    name: string;
    badge?: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  "$rc_monthly": {
    name: "Monthly",
    icon: "calendar-outline",
    color: "#818CF8",
  },
  "$rc_annual": {
    name: "Yearly",
    badge: "BEST VALUE",
    icon: "star",
    color: "#F1C40F",
  },
  "$rc_lifetime": {
    name: "Lifetime",
    badge: "ONE TIME",
    icon: "diamond",
    color: "#9B59B6",
  },
  // Custom package identifiers (fallbacks)
  monthly: {
    name: "Monthly",
    icon: "calendar-outline",
    color: "#818CF8",
  },
  yearly: {
    name: "Yearly",
    badge: "BEST VALUE",
    icon: "star",
    color: "#F1C40F",
  },
  lifetime: {
    name: "Lifetime",
    badge: "ONE TIME",
    icon: "diamond",
    color: "#9B59B6",
  },
};

const FEATURES = [
  { icon: "infinite" as const, text: "Unlimited prompts", color: "#FF6B6B" },
  { icon: "flame" as const, text: "All spicy & chaos content", color: "#FF8C42" },
  { icon: "sparkles" as const, text: "New packs added weekly", color: "#9B59B6" },
  { icon: "people" as const, text: "Unlimited players", color: "#00D9FF" },
];

export function Paywall({ onClose, onPurchaseSuccess }: PaywallProps) {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    setError(null);
    const offering = await getOfferings();
    if (offering) {
      setOfferings(offering);
    } else {
      setError("Unable to load store. Please try again.");
    }
    setLoading(false);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    setError(null);

    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        const activeEntitlements = Object.keys(
          customerInfo.entitlements.active
        );
        onPurchaseSuccess(activeEntitlements);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setPurchasing("restore");
    setError(null);

    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        const activeEntitlements = Object.keys(
          customerInfo.entitlements.active
        );
        if (activeEntitlements.length > 0) {
          onPurchaseSuccess(activeEntitlements);
          onClose();
        } else {
          setError("No previous purchases found.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Restore failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const renderPackage = (pkg: PurchasesPackage, index: number) => {
    const config = PACKAGE_CONFIG[pkg.identifier] || PACKAGE_CONFIG[pkg.packageType] || {
      name: pkg.product.title,
      icon: "gift" as const,
      color: "#818CF8",
    };

    const isLoading = purchasing === pkg.identifier;
    const isYearly = pkg.identifier.includes("annual") || pkg.identifier.includes("yearly");

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[
          styles.packageCard,
          isYearly && styles.packageCardHighlighted,
        ]}
        onPress={() => handlePurchase(pkg)}
        disabled={purchasing !== null}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${config.name} - ${pkg.product.priceString}`}
      >
        {config.badge && (
          <View style={[styles.badge, { backgroundColor: config.color }]}>
            <Text style={styles.badgeText}>{config.badge}</Text>
          </View>
        )}

        <View style={styles.packageContent}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + "20" }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
          </View>

          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>{config.name}</Text>
            <Text style={styles.packageDescription}>
              {pkg.product.description || `Unlock Gambit Pro`}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.priceText}>{pkg.product.priceString}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f0f1a"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.proIconContainer}>
          <Ionicons name="diamond" size={48} color="#818CF8" />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Unlock Gambit Pro
        </Text>
        <Text style={styles.subtitle}>
          Get the ultimate party game experience
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: feature.color + "20" }]}>
              <Ionicons name={feature.icon} size={20} color={feature.color} />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#818CF8" />
          <Text style={styles.loadingText}>Loading options...</Text>
        </View>
      ) : error && !offerings ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOfferings}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.packagesContainer}
          contentContainerStyle={styles.packagesContent}
          showsVerticalScrollIndicator={false}
        >
          {offerings?.availablePackages.map(renderPackage)}

          {error && (
            <Text style={styles.inlineError}>{error}</Text>
          )}

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing !== null}
          >
            {purchasing === "restore" ? (
              <ActivityIndicator color="#888" size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <Text style={styles.legalText}>
            Payment will be charged to your{" "}
            {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account.
            Subscriptions automatically renew unless cancelled at least 24
            hours before the end of the current period.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  proIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: "#818CF820",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
  },
  featuresContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#FFF",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#888",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    color: "#FF6B6B",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#818CF8",
    borderRadius: 24,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  packagesContainer: {
    flex: 1,
  },
  packagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  packageCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  packageCardHighlighted: {
    borderColor: "#F1C40F",
    borderWidth: 2,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  packageContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  packageInfo: {
    flex: 1,
    marginLeft: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  packageDescription: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  priceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#818CF8",
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  priceText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inlineError: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 16,
  },
  restoreButton: {
    padding: 16,
    alignItems: "center",
  },
  restoreText: {
    color: "#888",
    fontSize: 14,
  },
  legalText: {
    color: "#555",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
