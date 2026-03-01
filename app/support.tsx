import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Support() {
  const insets = useSafeAreaInsets();

  const handleEmail = () => {
    Linking.openURL("mailto:maxwell@ninetynine.digital?subject=Gambit%20Support");
  };

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
        <Text style={styles.headerTitle}>Support & Terms</Text>
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
        {/* Contact Section */}
        <View style={styles.contactCard}>
          <LinearGradient
            colors={["rgba(129,140,248,0.1)", "rgba(99,102,241,0.05)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons
            name="mail-outline"
            size={32}
            color="#818CF8"
            style={styles.contactIcon}
          />
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactDescription}>
            Have questions, feedback, or found a bug? We'd love to hear from
            you!
          </Text>
          <Pressable style={styles.emailButton} onPress={handleEmail}>
            <Text style={styles.emailButtonText}>maxwell@ninetynine.digital</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Terms of Service */}
        <Text style={styles.sectionTitle}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <Text style={styles.subTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By downloading or using Gambit, you agree to be bound by these Terms
          of Service. If you do not agree to these terms, please do not use the
          app.
        </Text>

        <Text style={styles.subTitle}>2. Age Requirement</Text>
        <Text style={styles.paragraph}>
          Gambit is intended for users aged 18 years and older. The app contains
          content related to drinking games and adult social activities. By
          using this app, you confirm that you are of legal drinking age in your
          jurisdiction.
        </Text>

        <Text style={styles.subTitle}>3. Responsible Use</Text>
        <Text style={styles.paragraph}>
          - Always drink responsibly and in moderation{"\n"}- Never drink and
          drive{"\n"}- Respect all participants' boundaries{"\n"}- Know your
          limits and those of others{"\n"}- The app is for entertainment
          purposes only
        </Text>

        <Text style={styles.subTitle}>4. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree to use the app in a manner consistent with applicable laws
          and regulations. You are responsible for ensuring that all players
          consent to participating in the game.
        </Text>

        <Text style={styles.subTitle}>5. Content</Text>
        <Text style={styles.paragraph}>
          The prompts and challenges in Gambit are meant for entertainment among
          consenting adults. We are not responsible for any actions taken based
          on game prompts.
        </Text>

        <Text style={styles.subTitle}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, design, and functionality of Gambit are the exclusive
          property of the developer and are protected by copyright and other
          intellectual property laws.
        </Text>

        <Text style={styles.subTitle}>7. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          Gambit is provided "as is" without warranties of any kind. We do not
          guarantee that the app will be error-free or uninterrupted.
        </Text>

        <Text style={styles.subTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, we shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages
          arising from your use of the app.
        </Text>

        <Text style={styles.subTitle}>9. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Continued use
          of the app after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.subTitle}>10. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms, contact us at{" "}
          <Text style={styles.link} onPress={handleEmail}>
            maxwell@ninetynine.digital
          </Text>
        </Text>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Gambit v1.0.5</Text>
          <Text style={styles.appInfoText}>Made with love in New Zealand</Text>
        </View>
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
  contactCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.2)",
    overflow: "hidden",
    marginBottom: 32,
  },
  contactIcon: {
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
  },
  contactDescription: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(129,140,248,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "Inter-Bold",
      android: "Inter-Bold",
      default: "Inter-Bold, system-ui, sans-serif",
    }),
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
  subTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "Inter-SemiBold",
      android: "Inter-SemiBold",
      default: "Inter-SemiBold, system-ui, sans-serif",
    }),
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,255,255,0.75)",
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
  link: {
    color: "#818CF8",
  },
  appInfo: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    gap: 4,
  },
  appInfoText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontFamily: Platform.select({
      ios: "Inter-Regular",
      android: "Inter-Regular",
      default: "Inter-Regular, system-ui, sans-serif",
    }),
  },
});
