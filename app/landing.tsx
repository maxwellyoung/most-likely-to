import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";
import { FluidGradient } from "@/components/FluidGradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_WIDTH = 1200;
const isWeb = Platform.OS === "web";

// Animated counter for stats
const AnimatedCounter = ({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <Text style={styles.statNumber}>{count}{suffix}</Text>;
};

// Floating prompt cards
const FloatingCard = ({ text, emoji, delay, x, y }: { text: string; emoji: string; delay: number; x: number; y: number }) => {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    ));
    rotate.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-3, { duration: 4000 }),
        withTiming(3, { duration: 4000 })
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.floatingCard, { left: x, top: y }, style]}>
      <Text style={styles.floatingCardEmoji}>{emoji}</Text>
      <Text style={styles.floatingCardText}>{text}</Text>
    </Animated.View>
  );
};

const FEATURES = [
  {
    emoji: "🎯",
    title: "480+ Curated Prompts",
    description: "Hand-crafted challenges with specific drink amounts and cultural references.",
  },
  {
    emoji: "🎮",
    title: "Mini-Games",
    description: "Waterfall, Categories, Never Have I Ever, Rhyme Time and more built-in.",
  },
  {
    emoji: "⚡",
    title: "10 Chaos Levels",
    description: "From wholesome fun to absolute mayhem. Dial in exactly the vibe you want.",
  },
  {
    emoji: "🏆",
    title: "Scoring System",
    description: "Track points and drinks. Crown a champion and 'Most Hydrated' award.",
  },
  {
    emoji: "⭐",
    title: "Skip & Favorites",
    description: "Skip prompts forever or save your favorites. Your game, your rules.",
  },
  {
    emoji: "✨",
    title: "Zero Ads",
    description: "Pure, uninterrupted fun. No popups, no banners, no bs.",
  },
];

const CATEGORIES = [
  { emoji: "🍻", name: "Drinking", color: "#F59E0B" },
  { emoji: "🎯", name: "Dares", color: "#EF4444" },
  { emoji: "🤫", name: "Confessions", color: "#A855F7" },
  { emoji: "🔥", name: "Hot Takes", color: "#F97316" },
  { emoji: "💪", name: "Physical", color: "#10B981" },
  { emoji: "💬", name: "Social", color: "#3B82F6" },
  { emoji: "🎨", name: "Creative", color: "#EC4899" },
  { emoji: "🌪️", name: "Chaos", color: "#8B5CF6" },
];

const TESTIMONIALS = [
  { text: "Best party game we've ever played. Our game nights are never the same!", name: "Sarah K.", stars: 5 },
  { text: "Finally an app that actually delivers. The prompts are hilarious.", name: "Mike T.", stars: 5 },
  { text: "Spicy mode had us dying. 10/10 would recommend for bachelorette parties.", name: "Jess L.", stars: 5 },
];

const SAMPLE_PROMPTS = [
  { emoji: "🍻", text: "Drink if you've..." },
  { emoji: "🎯", text: "Dare someone to..." },
  { emoji: "🤫", text: "Confess your..." },
];

export default function Landing() {
  const handleAppStore = () => {
    Linking.openURL("https://apps.apple.com/app/id6737107968");
  };

  const handlePlayStore = () => {
    Linking.openURL("https://play.google.com/store/apps/details?id=com.maxwellyoung.socialchaos");
  };

  const handlePlayNow = () => {
    router.push("/");
  };

  return (
    <View style={styles.container}>
      {/* Fluid Gradient Background */}
      <FluidGradient
        colors={["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"]}
        speed={0.8}
        blur={120}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.nav}>
          <Pressable onPress={() => router.push("/")} style={styles.navLogoWrap}>
            <Text style={styles.navLogo}>GAMBIT</Text>
          </Pressable>
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push("/privacy")} style={styles.navLink}>
              <Text style={styles.navLinkText}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/support")} style={styles.navLink}>
              <Text style={styles.navLinkText}>Support</Text>
            </Pressable>
            {isWeb && (
              <Pressable style={styles.navCTA} onPress={handleAppStore}>
                <Text style={styles.navCTAText}>Download</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View entering={ZoomIn.delay(100).springify()}>
            <LinearGradient
              colors={["rgba(139,92,246,0.15)", "rgba(236,72,153,0.15)"]}
              style={styles.heroBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>The #1 Party Game App</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(200).duration(1000)} style={styles.heroTitle}>
            Party Chaos,{"\n"}
            <Text style={styles.heroTitleGradient}>Perfected</Text>
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(350).duration(1000)} style={styles.heroSubtitle}>
            480+ prompts across 8 categories.{"\n"}
            Mini-games, scoring, and unforgettable chaos.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.heroCTAs}>
            {isWeb ? (
              <View style={styles.storeButtons}>
                <Pressable style={styles.storeButton} onPress={handleAppStore}>
                  <View style={styles.storeButtonInner}>
                    <Ionicons name="logo-apple" size={28} color="#FFF" />
                    <View style={styles.storeButtonText}>
                      <Text style={styles.storeButtonSmall}>Download on the</Text>
                      <Text style={styles.storeButtonLarge}>App Store</Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable style={styles.storeButton} onPress={handlePlayStore}>
                  <View style={styles.storeButtonInner}>
                    <Ionicons name="logo-google-playstore" size={24} color="#FFF" />
                    <View style={styles.storeButtonText}>
                      <Text style={styles.storeButtonSmall}>Get it on</Text>
                      <Text style={styles.storeButtonLarge}>Google Play</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.playButton} onPress={handlePlayNow}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={styles.playButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.playButtonText}>Play Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInUp.delay(650).duration(800)} style={styles.statsRow}>
            <View style={styles.stat}>
              <AnimatedCounter end={250} suffix="+" />
              <Text style={styles.statLabel}>Prompts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AnimatedCounter end={8} />
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AnimatedCounter end={10} />
              <Text style={styles.statLabel}>Chaos Levels</Text>
            </View>
          </Animated.View>

          {/* Phone Mockup */}
          <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.mockupContainer}>
            <LinearGradient
              colors={["#8B5CF640", "#EC489940", "#3B82F640"]}
              style={styles.mockupGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.phoneMockup}>
              <View style={styles.phoneNotch} />
              <LinearGradient
                colors={["#111", "#0A0A0A"]}
                style={styles.phoneScreen}
              >
                <View style={styles.phoneHeader}>
                  <Text style={styles.phoneRound}>Round 1</Text>
                  <Text style={styles.phoneCount}>3/10</Text>
                </View>
                <View style={styles.phoneCardContainer}>
                  <LinearGradient
                    colors={["rgba(245,158,11,0.15)", "transparent"]}
                    style={styles.phoneCard}
                  >
                    <View style={styles.phoneCardBadge}>
                      <Text style={styles.phoneCardBadgeText}>🍻</Text>
                    </View>
                    <Text style={styles.phoneCardText}>
                      Everyone who's ever{"\n"}been skinny dipping,{"\n"}drink!
                    </Text>
                    <Text style={styles.phoneHint}>← Swipe →</Text>
                  </LinearGradient>
                </View>
                <View style={styles.phoneFooter}>
                  <LinearGradient
                    colors={["#F59E0B", "#D97706"]}
                    style={styles.phoneButton}
                  >
                    <Text style={styles.phoneButtonText}>Next</Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>

            {/* Floating cards around mockup */}
            {isWeb && (
              <>
                <FloatingCard emoji="🎯" text="Dare" delay={0} x={-80} y={100} />
                <FloatingCard emoji="🤫" text="Confess" delay={500} x={SCREEN_WIDTH > 600 ? 320 : 220} y={150} />
                <FloatingCard emoji="🔥" text="Hot Take" delay={1000} x={-60} y={350} />
              </>
            )}
          </Animated.View>
        </View>

        {/* Social Proof */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.socialProof}>
          <Text style={styles.socialProofText}>
            Trusted by <Text style={styles.socialProofHighlight}>thousands</Text> of party people
          </Text>
          <View style={styles.socialProofStars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={20} color="#F59E0B" />
            ))}
            <Text style={styles.socialProofRating}>5.0</Text>
          </View>
        </Animated.View>

        {/* Features */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp.delay(100)} style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>FEATURES</Text>
            <Text style={styles.sectionTitle}>Everything You Need</Text>
            <Text style={styles.sectionSubtitle}>
              Designed for epic nights with friends. No learning curve, just instant fun.
            </Text>
          </Animated.View>

          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInUp.delay(200 + index * 100)}
                style={styles.featureCard}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.03)", "transparent"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.featureIconWrap}>
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp} style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>CATEGORIES</Text>
            <Text style={styles.sectionTitle}>8 Ways to Play</Text>
            <Text style={styles.sectionSubtitle}>
              Mix and match categories to create your perfect game
            </Text>
          </Animated.View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat, index) => (
              <Animated.View
                key={cat.name}
                entering={ZoomIn.delay(100 + index * 80).springify()}
              >
                <Pressable style={[styles.categoryPill, { borderColor: cat.color + "40", backgroundColor: cat.color + "10" }]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp} style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>REVIEWS</Text>
            <Text style={styles.sectionTitle}>What People Say</Text>
          </Animated.View>

          <View style={styles.testimonialGrid}>
            {TESTIMONIALS.map((testimonial, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(200 + index * 150)}
                style={styles.testimonialCard}
              >
                <View style={styles.testimonialStars}>
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Ionicons key={i} name="star" size={16} color="#F59E0B" />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
                <Text style={styles.testimonialName}>{testimonial.name}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp} style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            <Text style={styles.sectionTitle}>Start in Seconds</Text>
          </Animated.View>

          <View style={styles.stepsGrid}>
            {[
              { num: "1", title: "Add Players", desc: "Enter everyone's names" },
              { num: "2", title: "Pick Categories", desc: "Choose your vibe" },
              { num: "3", title: "Set Chaos Level", desc: "Mild to wild" },
              { num: "4", title: "Let's Go!", desc: "Swipe through prompts" },
            ].map((step, index) => (
              <Animated.View
                key={step.num}
                entering={FadeInUp.delay(150 + index * 100)}
                style={styles.stepCard}
              >
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Final CTA */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.ctaSection}>
          <LinearGradient
            colors={["rgba(139,92,246,0.1)", "rgba(236,72,153,0.05)", "transparent"]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaEmoji}>🎉</Text>
            <Text style={styles.ctaTitle}>Ready to Party?</Text>
            <Text style={styles.ctaSubtitle}>
              Download Gambit and make your next gathering legendary.
            </Text>

            <View style={styles.ctaButtons}>
              {isWeb ? (
                <>
                  <Pressable style={styles.ctaButton} onPress={handleAppStore}>
                    <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.ctaButtonGradient}>
                      <Ionicons name="logo-apple" size={22} color="#FFF" />
                      <Text style={styles.ctaButtonText}>App Store</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable style={styles.ctaButtonSecondary} onPress={handlePlayStore}>
                    <Ionicons name="logo-google-playstore" size={20} color="#FFF" />
                    <Text style={styles.ctaButtonSecondaryText}>Google Play</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.ctaButton} onPress={handlePlayNow}>
                  <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.ctaButtonGradient}>
                    <Text style={styles.ctaButtonText}>Start Playing</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerLogo}>GAMBIT</Text>
              <Text style={styles.footerTagline}>Party chaos, perfected.</Text>
            </View>

            <View style={styles.footerLinksGrid}>
              <View style={styles.footerLinkColumn}>
                <Text style={styles.footerLinkHeader}>Product</Text>
                <Pressable onPress={handleAppStore}>
                  <Text style={styles.footerLinkItem}>App Store</Text>
                </Pressable>
                <Pressable onPress={handlePlayStore}>
                  <Text style={styles.footerLinkItem}>Google Play</Text>
                </Pressable>
              </View>
              <View style={styles.footerLinkColumn}>
                <Text style={styles.footerLinkHeader}>Legal</Text>
                <Pressable onPress={() => router.push("/privacy")}>
                  <Text style={styles.footerLinkItem}>Privacy Policy</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/support")}>
                  <Text style={styles.footerLinkItem}>Terms of Service</Text>
                </Pressable>
              </View>
              <View style={styles.footerLinkColumn}>
                <Text style={styles.footerLinkHeader}>Support</Text>
                <Pressable onPress={() => Linking.openURL("mailto:maxwell@ninetynine.digital")}>
                  <Text style={styles.footerLinkItem}>Contact Us</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/support")}>
                  <Text style={styles.footerLinkItem}>Help Center</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Maxwell Young. Made with ❤️ in New Zealand.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MAX_WIDTH,
    width: "100%",
    alignSelf: "center",
  },

  // Nav
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: isWeb ? 24 : 60,
  },
  navLogoWrap: {
    padding: 4,
  },
  navLogo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 3,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...(isWeb && {
      cursor: "pointer",
    }),
  },
  navLinkText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    ...(isWeb && {
      transition: "color 0.2s ease",
    }),
  },
  navCTA: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 8,
    ...(isWeb && {
      transition: "all 0.2s ease",
      cursor: "pointer",
    }),
  },
  navCTAText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: isWeb ? 80 : 40,
    paddingBottom: 60,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    gap: 10,
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  heroBadgeText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: isWeb ? 80 : 48,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    lineHeight: isWeb ? 88 : 54,
    marginBottom: 24,
    letterSpacing: -1,
  },
  heroTitleGradient: {
    color: "#8B5CF6",
  },
  heroSubtitle: {
    fontSize: isWeb ? 20 : 17,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: isWeb ? 32 : 26,
    maxWidth: 480,
    marginBottom: 40,
  },
  heroCTAs: {
    marginBottom: 48,
  },
  storeButtons: {
    flexDirection: isWeb ? "row" : "column",
    gap: 16,
  },
  storeButton: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    ...(isWeb && {
      transition: "all 0.3s ease",
      cursor: "pointer",
    }),
  },
  storeButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 14,
  },
  storeButtonText: {
    alignItems: "flex-start",
  },
  storeButtonSmall: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  storeButtonLarge: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "700",
  },
  playButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  playButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: 10,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    marginBottom: 60,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFF",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // Phone Mockup
  mockupContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mockupGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.6,
  },
  phoneMockup: {
    width: 300,
    height: 620,
    backgroundColor: "#000",
    borderRadius: 44,
    padding: 10,
    borderWidth: 2,
    borderColor: "#222",
    position: "relative",
  },
  phoneNotch: {
    position: "absolute",
    top: 10,
    left: "50%",
    marginLeft: -60,
    width: 120,
    height: 28,
    backgroundColor: "#000",
    borderRadius: 20,
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 36,
    overflow: "hidden",
  },
  phoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  phoneRound: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  phoneCount: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  phoneCardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  phoneCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  phoneCardBadge: {
    backgroundColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  phoneCardBadgeText: {
    fontSize: 24,
  },
  phoneCardText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 32,
  },
  phoneHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginTop: 24,
    letterSpacing: 2,
  },
  phoneFooter: {
    padding: 16,
    paddingBottom: 24,
  },
  phoneButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  phoneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },

  // Floating cards
  floatingCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  floatingCardEmoji: {
    fontSize: 20,
  },
  floatingCardText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },

  // Social Proof
  socialProof: {
    alignItems: "center",
    paddingVertical: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 24,
  },
  socialProofText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  socialProofHighlight: {
    color: "#FFF",
    fontWeight: "700",
  },
  socialProofStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  socialProofRating: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 8,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: isWeb ? 48 : 36,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    maxWidth: 500,
    lineHeight: 26,
  },

  // Features
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
  },
  featureCard: {
    width: isWeb ? 360 : "100%",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    ...(isWeb && {
      transition: "all 0.3s ease",
    } as any),
  } as any,
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 24,
  },

  // Categories
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    gap: 12,
    borderWidth: 1,
    ...(isWeb && {
      transition: "all 0.2s ease",
      cursor: "pointer",
    }),
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Testimonials
  testimonialGrid: {
    flexDirection: isWeb ? "row" : "column",
    gap: 20,
    justifyContent: "center",
  },
  testimonialCard: {
    flex: isWeb ? 1 : undefined,
    maxWidth: isWeb ? 360 : undefined,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    ...(isWeb && {
      transition: "all 0.3s ease",
    }),
  },
  testimonialStars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 16,
  },
  testimonialText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 26,
    marginBottom: 16,
    fontStyle: "italic",
  },
  testimonialName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  // Steps
  stepsGrid: {
    flexDirection: isWeb ? "row" : "column",
    gap: 20,
    justifyContent: "center",
  },
  stepCard: {
    flex: isWeb ? 1 : undefined,
    alignItems: "center",
    padding: 24,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  ctaGradient: {
    borderRadius: 32,
    padding: isWeb ? 64 : 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  ctaEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  ctaTitle: {
    fontSize: isWeb ? 42 : 32,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 16,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 36,
    maxWidth: 400,
    lineHeight: 28,
  },
  ctaButtons: {
    flexDirection: isWeb ? "row" : "column",
    gap: 16,
    alignItems: "center",
  },
  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 36,
    gap: 12,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },
  ctaButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 36,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  ctaButtonSecondaryText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFF",
  },

  // Footer
  footer: {
    paddingTop: 64,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerTop: {
    flexDirection: isWeb ? "row" : "column",
    justifyContent: "space-between",
    gap: 48,
    marginBottom: 48,
  },
  footerBrand: {
    maxWidth: 300,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 3,
    marginBottom: 12,
  },
  footerTagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 24,
  },
  footerLinksGrid: {
    flexDirection: "row",
    gap: isWeb ? 80 : 40,
    flexWrap: "wrap",
  },
  footerLinkColumn: {
    gap: 12,
  },
  footerLinkHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  footerLinkItem: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
  },
  footerBottom: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  footerCopy: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
});
