import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyPolicy() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0A", "#111111", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={20}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.paragraph}>
          Gambit ("we", "our", or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and safeguard your
          information when you use our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Player Names:</Text> We collect the names
          you enter for players in the game. These names are stored locally on
          your device and are not transmitted to our servers.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Game Preferences:</Text> Your game settings
          (chaos level, game mode) are stored locally on your device.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Anonymous Analytics:</Text> We may collect
          anonymous usage statistics to improve the app experience. This data
          does not identify you personally.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          - To personalize game prompts with player names{"\n"}- To remember
          your game preferences{"\n"}- To improve the app experience through
          anonymous analytics
        </Text>

        <Text style={styles.sectionTitle}>Data Storage</Text>
        <Text style={styles.paragraph}>
          All personal data (player names, preferences) is stored locally on
          your device. We do not upload or store your personal information on
          external servers.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our app may use third-party services for analytics and crash
          reporting. These services collect anonymous data and are governed by
          their own privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Gambit is intended for users aged 18 and older. We do not knowingly
          collect personal information from children under 18.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.paragraph}>
          You can delete all locally stored data by uninstalling the app. You
          can also clear app data through your device settings.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy in the app.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us
          at:{"\n\n"}
          <Text style={styles.link}>maxwell@ninetynine.digital</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  lastUpdated: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 24,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  bold: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
  link: {
    color: "#818CF8",
  },
});
