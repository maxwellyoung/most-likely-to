import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Text,
  Platform,
  ScrollView,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlideDownPanel } from "./SlideDownPanel";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  useSharedValue,
  runOnJS,
  Extrapolate,
  Easing,
  cancelAnimation,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  BounceIn,
  FadeInUp,
  FadeInDown,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { FluidGradient } from "./FluidGradient";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { playTap, playSwipe, playSuccess, playPop, playTick, playWhoosh } from "../utils/sounds";
import promptData from "../assets/prompts/prompts.json";
import { Paywall } from "./Paywall";
import { initializePurchases, getActiveEntitlements } from "../lib/purchases";
import { WebUpgradePrompt } from "./WebUpgradePrompt";
import { getUnlockedPremiumPrompts, Prompt as PremiumPrompt } from "../lib/premiumContent";
import { useReducedMotionWeb } from "../hooks/useReducedMotion";

// Storage keys
const STORAGE_KEYS = {
  SKIPPED_PROMPTS: "gambit_skipped_prompts",
  FAVORITE_PROMPTS: "gambit_favorite_prompts",
  CUSTOM_PROMPTS: "gambit_custom_prompts",
  ADULT_MODE: "gambit_adult_mode",
};

// Types
type Player = {
  name: string;
  avatar: string;
  score: number;
  drinks: number;
  isHotSeat?: boolean;
};

type GameScreen = "setup" | "categories" | "playing" | "results" | "roundEnd" | "hotSeat" | "truthOrDare";
type CategoryKey = "drinking" | "dares" | "confessions" | "hot_takes" | "physical" | "social" | "creative" | "chaos";
type GameMode = "classic" | "hotSeat" | "couples" | "truthOrDare";

interface Prompt {
  text: string;
  category: string;
  chaos: number;
  type: string;
  timer?: number;
}

interface GameState {
  screen: GameScreen;
  round: number;
  totalRounds: number;
  promptsPerRound: number;
  currentPromptIndex: number;
  isSexyMode: boolean;
  chaosLevel: number;
  selectedCategories: CategoryKey[];
  timerActive: boolean;
  timerSeconds: number;
  gameMode: GameMode;
  hotSeatPlayer: Player | null;
  hotSeatQuestionCount: number;
  truthOrDareChoice: "truth" | "dare" | null;
  showScoring: boolean;
}

interface CardItem {
  id: number;
  text: string;
  data: Prompt;
}

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const MAX_WIDTH = 500;

const CATEGORIES: Record<CategoryKey, { name: string; emoji: string; color: string; gradient: [string, string] }> = {
  confessions: { name: "Confessions", emoji: "🤫", color: "#A855F7", gradient: ["#A855F7", "#9333EA"] },
  hot_takes: { name: "Hot Takes", emoji: "🔥", color: "#F97316", gradient: ["#F97316", "#EA580C"] },
  dares: { name: "Dares", emoji: "🎯", color: "#EF4444", gradient: ["#EF4444", "#DC2626"] },
  social: { name: "Social", emoji: "💬", color: "#3B82F6", gradient: ["#3B82F6", "#2563EB"] },
  physical: { name: "Physical", emoji: "💪", color: "#10B981", gradient: ["#10B981", "#059669"] },
  creative: { name: "Creative", emoji: "🎨", color: "#EC4899", gradient: ["#EC4899", "#DB2777"] },
  chaos: { name: "Chaos", emoji: "🌪️", color: "#F97316", gradient: ["#F97316", "#EA580C"] },
  drinking: { name: "Forfeits", emoji: "🎲", color: "#F59E0B", gradient: ["#F59E0B", "#D97706"] },
};

// Haptic helper
const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "error") => {
  // Play sound on web (and optionally native for consistency)
  if (Platform.OS === "web") {
    switch (type) {
      case "light": playTap(); break;
      case "medium": playPop(); break;
      case "heavy": playPop(); break;
      case "success": playSuccess(); break;
      case "error": break; // Skip error sound
    }
    return;
  }
  // Native haptics
  switch (type) {
    case "light": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case "medium": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case "heavy": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    case "success": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case "error": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
  }
};

// Confetti Particle
const Particle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    translateY.value = withDelay(delay, withTiming(500, { duration: 2500, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming(startX + (Math.random() - 0.5) * 300, { duration: 2500 }));
    rotate.value = withDelay(delay, withTiming(Math.random() * 720 - 360, { duration: 2500 }));
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF69B4"];
  return <Animated.Text style={[style, { fontSize: 20, color: colors[Math.floor(Math.random() * colors.length)] }]}>✦</Animated.Text>;
};

const Confetti = ({ count = 40, reduceMotion = false }: { count?: number; reduceMotion?: boolean }) => {
  // Skip rendering confetti entirely when reduce motion is enabled
  if (reduceMotion) {
    return null;
  }

  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, delay: Math.random() * 400, startX: Math.random() * SCREEN_WIDTH,
  })), [count]);
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      {particles.map((p) => <Particle key={p.id} delay={p.delay} startX={p.startX} />)}
    </View>
  );
};

// Swipeable Card Component
const SwipeableCard = ({
  card,
  isTop,
  onSwipe,
  category,
  onSkip,
  onFavorite,
  isFavorite,
}: {
  card: CardItem;
  isTop: boolean;
  onSwipe: () => void;
  category: CategoryKey;
  onSkip?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(isTop ? 1 : 0.92);
  const opacity = useSharedValue(isTop ? 1 : 0.7);

  const cat = CATEGORIES[category] || CATEGORIES.chaos;

  useEffect(() => {
    if (isTop) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(0.92, { damping: 15 });
      opacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [isTop]);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onStart(() => {
      if (Platform.OS !== "web") runOnJS(Haptics.selectionAsync)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
      rotation.value = (e.translationX / SCREEN_WIDTH) * 20;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        if (Platform.OS === "web") runOnJS(playSwipe)(dir > 0 ? "right" : "left");
        translateX.value = withTiming(dir * SCREEN_WIDTH * 1.5, { duration: 300 });
        rotation.value = withTiming(dir * 30, { duration: 300 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onSwipe)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isTop ? 2 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.promptCard, cardStyle]}>
        <LinearGradient
          colors={[cat.gradient[0] + "25", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardTopRow}>
          <View style={[styles.promptCatBadge, { backgroundColor: cat.color + "30" }]}>
            <Text style={styles.promptCatText}>{cat.emoji}</Text>
          </View>
          {isTop && (
            <View style={styles.cardActions}>
              {onFavorite && (
                <TouchableOpacity
                  onPress={onFavorite}
                  style={styles.cardActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  accessibilityHint={isFavorite ? "Double tap to remove this prompt from your favorites" : "Double tap to save this prompt to your favorites"}
                >
                  <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#EC4899" : "rgba(255,255,255,0.5)"} />
                </TouchableOpacity>
              )}
              {onSkip && (
                <TouchableOpacity
                  onPress={onSkip}
                  style={styles.cardActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this prompt forever"
                  accessibilityHint="Double tap to permanently hide this prompt from future games"
                >
                  <Ionicons name="close-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <Text
          style={styles.promptText}
          accessibilityRole="text"
          accessibilityLabel={`Game prompt: ${card.text}`}
        >
          {card.text}
        </Text>
        <Text
          style={styles.swipeHint}
          accessibilityLabel="Swipe left or right to go to next prompt"
        >
          Swipe
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};

export function PersonalizedPartyGame() {
  // Accessibility - check if user prefers reduced motion
  const reduceMotion = useReducedMotionWeb();

  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Skip/Favorites system
  const [skippedPrompts, setSkippedPrompts] = useState<Set<string>>(new Set());
  const [favoritePrompts, setFavoritePrompts] = useState<Set<string>>(new Set());
  const [customPrompts, setCustomPrompts] = useState<Prompt[]>([]);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [newCustomPrompt, setNewCustomPrompt] = useState("");
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<CategoryKey>("social");

  // 21+ Adult Mode - unlocks Forfeits category (hidden, tap logo 5x to unlock)
  const [isAdultMode, setIsAdultMode] = useState(false);
  const secretTapCount = useRef(0);
  const secretTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // IAP / Paywall state
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchasedEntitlements, setPurchasedEntitlements] = useState<string[]>([]);
  const [premiumPrompts, setPremiumPrompts] = useState<Prompt[]>([]);
  // Web-only post-game upgrade prompt (shown once per session after first completed game)
  const [showWebUpgrade, setShowWebUpgrade] = useState(false);
  const hasShownWebUpgrade = React.useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    screen: "setup",
    round: 1,
    totalRounds: 3,
    promptsPerRound: 10,
    currentPromptIndex: 0,
    isSexyMode: false,
    chaosLevel: 5,
    selectedCategories: ["confessions", "hot_takes", "social"],
    timerActive: false,
    timerSeconds: 0,
    gameMode: "classic",
    hotSeatPlayer: null,
    hotSeatQuestionCount: 0,
    truthOrDareChoice: null,
    showScoring: true,
  });

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [skipped, favorites, custom, adultMode] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SKIPPED_PROMPTS),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_PROMPTS),
          AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPTS),
          AsyncStorage.getItem(STORAGE_KEYS.ADULT_MODE),
        ]);
        if (skipped) setSkippedPrompts(new Set(JSON.parse(skipped)));
        if (favorites) setFavoritePrompts(new Set(JSON.parse(favorites)));
        if (custom) setCustomPrompts(JSON.parse(custom));
        if (adultMode) setIsAdultMode(JSON.parse(adultMode));
      } catch (e) {
        console.log("Error loading saved data:", e);
      }
    };
    loadSavedData();
  }, []);

  // Initialize RevenueCat purchases and load premium content
  // On web: skip IAP entirely — everything is free and unlocked
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web is always fully unlocked — no IAP, load premium packs directly
      setPurchasedEntitlements(['gambit_pro']);
      // Import premium packs directly to avoid RevenueCat on web
      Promise.all([
        import('../assets/prompts/premium-party.json'),
        import('../assets/prompts/premium-spicy.json'),
        import('../assets/prompts/premium-chaos.json'),
      ]).then(([party, spicy, chaos]) => {
        const all = [
          ...(party.default?.prompts ?? []),
          ...(spicy.default?.prompts ?? []),
          ...(chaos.default?.prompts ?? []),
        ].map((p: any) => ({ ...p, isPremium: true }));
        setPremiumPrompts(all as Prompt[]);
      }).catch(() => {});
      return;
    }
    const initPurchases = async () => {
      await initializePurchases();
      const entitlements = await getActiveEntitlements();
      setPurchasedEntitlements(entitlements);

      // Load premium prompts if user has any entitlements
      if (entitlements.length > 0) {
        const unlocked = await getUnlockedPremiumPrompts();
        setPremiumPrompts(unlocked as Prompt[]);
      }
    };
    initPurchases();
  }, []);

  // Save functions
  const skipForever = useCallback(async (promptText: string) => {
    triggerHaptic("light");
    const newSkipped = new Set(skippedPrompts).add(promptText);
    setSkippedPrompts(newSkipped);
    await AsyncStorage.setItem(STORAGE_KEYS.SKIPPED_PROMPTS, JSON.stringify([...newSkipped]));
    // Move to next card
    handleSwipe();
  }, [skippedPrompts]);

  const toggleFavorite = useCallback(async (promptText: string) => {
    triggerHaptic("light");
    const newFavorites = new Set(favoritePrompts);
    if (newFavorites.has(promptText)) {
      newFavorites.delete(promptText);
    } else {
      newFavorites.add(promptText);
    }
    setFavoritePrompts(newFavorites);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_PROMPTS, JSON.stringify([...newFavorites]));
  }, [favoritePrompts]);

  const handleSecretTap = useCallback(() => {
    // Clear existing timer
    if (secretTapTimer.current) {
      clearTimeout(secretTapTimer.current);
    }

    secretTapCount.current += 1;

    if (secretTapCount.current >= 5) {
      // Unlock/toggle adult mode
      triggerHaptic("success");
      const newValue = !isAdultMode;
      setIsAdultMode(newValue);
      AsyncStorage.setItem(STORAGE_KEYS.ADULT_MODE, JSON.stringify(newValue));
      secretTapCount.current = 0;

      // Remove drinking from selected categories if turning off
      if (!newValue) {
        setGameState(prev => ({
          ...prev,
          selectedCategories: prev.selectedCategories.filter(c => c !== "drinking"),
        }));
      }
    } else {
      // Small haptic for each tap
      triggerHaptic("light");
    }

    // Reset counter after 2 seconds of no taps
    secretTapTimer.current = setTimeout(() => {
      secretTapCount.current = 0;
    }, 2000);
  }, [isAdultMode]);

  const addCustomPrompt = useCallback(async () => {
    if (!newCustomPrompt.trim()) return;
    triggerHaptic("success");
    const prompt: Prompt = {
      text: newCustomPrompt.trim(),
      category: selectedCustomCategory,
      chaos: gameState.chaosLevel,
      type: "simple",
    };
    const newCustom = [...customPrompts, prompt];
    setCustomPrompts(newCustom);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPTS, JSON.stringify(newCustom));
    setNewCustomPrompt("");
    setShowCustomPromptModal(false);
  }, [newCustomPrompt, selectedCustomCategory, customPrompts, gameState.chaosLevel]);

  // Award/deduct points
  const awardPoints = useCallback((playerIndex: number, points: number) => {
    triggerHaptic("success");
    setPlayers(prev => prev.map((p, i) =>
      i === playerIndex ? { ...p, score: p.score + points } : p
    ));
  }, []);

  const addDrink = useCallback((playerIndex: number, drinks: number = 1) => {
    setPlayers(prev => prev.map((p, i) =>
      i === playerIndex ? { ...p, drinks: p.drinks + drinks } : p
    ));
  }, []);

  const [cardStack, setCardStack] = useState<CardItem[]>([]);
  const cardIdRef = useRef(0);
  const shuffledPromptsRef = useRef<Prompt[]>([]);
  const promptIndexRef = useRef(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerProgress = useSharedValue(1);
  const timerPulse = useSharedValue(1);
  const errorShakeX = useSharedValue(0);

  // Timer warning pulse
  useEffect(() => {
    if (gameState.timerActive && gameState.timerSeconds <= 5 && gameState.timerSeconds > 0) {
      timerPulse.value = withRepeat(withSequence(withTiming(1.3, { duration: 150 }), withTiming(1, { duration: 150 })), -1, true);
    } else {
      cancelAnimation(timerPulse);
      timerPulse.value = 1;
    }
  }, [gameState.timerActive, gameState.timerSeconds]);

  const getFilteredPrompts = useCallback((): Prompt[] => {
    const basePrompts = gameState.isSexyMode ? [...promptData.prompts, ...promptData.sexy] : promptData.prompts;
    // Include premium prompts if user has purchased them
    const allPrompts = [...basePrompts, ...customPrompts, ...premiumPrompts];
    const chaosMin = Math.max(1, gameState.chaosLevel - 3);
    const chaosMax = Math.min(10, gameState.chaosLevel + 3);
    return allPrompts.filter((p: Prompt) =>
      p.chaos >= chaosMin &&
      p.chaos <= chaosMax &&
      gameState.selectedCategories.includes(p.category as CategoryKey) &&
      !skippedPrompts.has(p.text)
    );
  }, [gameState.isSexyMode, gameState.chaosLevel, gameState.selectedCategories, customPrompts, skippedPrompts, premiumPrompts]);

  const replacePlaceholders = useCallback((text: string): string => {
    if (players.length === 0) return text;
    let result = text;
    const p1 = players[Math.floor(Math.random() * players.length)];
    result = result.replace(/\{player1\}/g, p1.name);
    if (result.includes("{player2}") && players.length > 1) {
      let p2;
      do { p2 = players[Math.floor(Math.random() * players.length)]; } while (p2.name === p1.name);
      result = result.replace(/\{player2\}/g, p2.name);
    }
    return result;
  }, [players]);

  const getNextCard = useCallback((): CardItem | null => {
    if (shuffledPromptsRef.current.length === 0) return null;
    if (promptIndexRef.current >= shuffledPromptsRef.current.length) {
      promptIndexRef.current = 0;
      shuffledPromptsRef.current = [...shuffledPromptsRef.current].sort(() => Math.random() - 0.5);
    }
    const prompt = shuffledPromptsRef.current[promptIndexRef.current];
    promptIndexRef.current++;
    cardIdRef.current++;
    return {
      id: cardIdRef.current,
      text: replacePlaceholders(prompt.text),
      data: prompt,
    };
  }, [replacePlaceholders]);

  const initializeGame = useCallback(() => {
    const filtered = getFilteredPrompts();
    shuffledPromptsRef.current = [...filtered].sort(() => Math.random() - 0.5);
    promptIndexRef.current = 0;
    cardIdRef.current = 0;

    const cards: CardItem[] = [];
    for (let i = 0; i < 2; i++) {
      const card = getNextCard();
      if (card) cards.push(card);
    }
    setCardStack(cards);
  }, [getFilteredPrompts, getNextCard]);

  const startTimer = useCallback((seconds: number) => {
    setGameState(prev => ({ ...prev, timerActive: true, timerSeconds: seconds }));
    timerProgress.value = 1;
    timerProgress.value = withTiming(0, { duration: seconds * 1000, easing: Easing.linear });
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timerSeconds <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerHaptic("error");
          return { ...prev, timerActive: false, timerSeconds: 0 };
        }
        if (prev.timerSeconds <= 5) triggerHaptic("light");
        return { ...prev, timerSeconds: prev.timerSeconds - 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    cancelAnimation(timerProgress);
    setGameState(prev => ({ ...prev, timerActive: false, timerSeconds: 0 }));
  }, []);

  const handleSwipe = useCallback(() => {
    triggerHaptic("medium");
    stopTimer();

    const total = gameState.totalRounds * gameState.promptsPerRound;
    const current = (gameState.round - 1) * gameState.promptsPerRound + gameState.currentPromptIndex;

    if (current + 1 >= total) {
      setShowConfetti(true);
      triggerHaptic("success");
      setGameState(prev => ({ ...prev, screen: "results" }));
      // Web: show upgrade prompt once per session after first completed game
      if (Platform.OS === 'web' && !hasShownWebUpgrade.current && !purchasedEntitlements.includes('Gambit Pro')) {
        hasShownWebUpgrade.current = true;
        setTimeout(() => setShowWebUpgrade(true), 2500);
      }
      return;
    }

    if (gameState.currentPromptIndex + 1 >= gameState.promptsPerRound) {
      setShowConfetti(true);
      triggerHaptic("success");
      setTimeout(() => setShowConfetti(false), 3000);
      setGameState(prev => ({ ...prev, screen: "roundEnd" }));
      return;
    }

    // Remove top card, add new one to bottom
    setCardStack(prev => {
      const newStack = prev.slice(1);
      const newCard = getNextCard();
      if (newCard) newStack.push(newCard);
      return newStack;
    });

    setGameState(prev => ({ ...prev, currentPromptIndex: prev.currentPromptIndex + 1 }));

    // Start timer if next card has one
    const nextCard = cardStack[1];
    if (nextCard?.data.timer) {
      setTimeout(() => startTimer(nextCard.data.timer!), 300);
    }
  }, [gameState, cardStack, getNextCard, startTimer, stopTimer]);

  const handleNextButton = useCallback(() => {
    handleSwipe();
  }, [handleSwipe]);

  const continueToNextRound = useCallback(() => {
    setShowConfetti(false);
    const cards: CardItem[] = [];
    for (let i = 0; i < 2; i++) {
      const card = getNextCard();
      if (card) cards.push(card);
    }
    setCardStack(cards);
    setGameState(prev => ({ ...prev, screen: "playing", round: prev.round + 1, currentPromptIndex: 0 }));
  }, [getNextCard]);

  const startGame = useCallback(() => {
    if (players.length < 2) {
      errorShakeX.value = withSequence(
        withSpring(-15, { stiffness: 800, damping: 8 }),
        withSpring(15, { stiffness: 800, damping: 8 }),
        withSpring(-15, { stiffness: 800, damping: 8 }),
        withSpring(0, { stiffness: 800, damping: 8 })
      );
      triggerHaptic("error");
      Alert.alert("Need Players", "Add at least 2 players!", [{ text: "Add", onPress: () => setIsAddPlayerVisible(true) }]);
      return;
    }
    if (gameState.selectedCategories.length === 0) {
      Alert.alert("No Categories", "Pick at least one!");
      return;
    }
    initializeGame();
    triggerHaptic("success");
    setGameState(prev => ({ ...prev, screen: "playing", round: 1, currentPromptIndex: 0 }));
  }, [players, gameState.selectedCategories, initializeGame]);

  const resetGame = useCallback(() => {
    stopTimer();
    setShowConfetti(false);
    setCardStack([]);
    setGameState(prev => ({ ...prev, screen: "setup", round: 1, currentPromptIndex: 0 }));
  }, [stopTimer]);

  const shareResults = useCallback(async () => {
    triggerHaptic("success");
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const drunkest = [...players].sort((a, b) => b.drinks - a.drinks)[0];

    let message = `🎮 GAMBIT RESULTS 🎮\n\n`;

    if (winner && winner.score > 0) {
      message += `👑 Champion: ${winner.name} (${winner.score} pts)\n`;
    }

    if (drunkest && drunkest.drinks > 0) {
      message += `🎭 Most Penalized: ${drunkest.name} (${drunkest.drinks} penalties)\n`;
    }

    message += `\n📊 Final Standings:\n`;
    sortedPlayers.forEach((p, i) => {
      message += `${i + 1}. ${p.avatar} ${p.name}: ${p.score}pts`;
      if (p.drinks > 0) message += ` (🎭${p.drinks})`;
      message += `\n`;
    });

    message += `\n🔥 Play Gambit: ${Platform.OS === 'web' ? 'https://mostlikelyto.ninetynine.digital' : 'https://apps.apple.com/app/id6737107968'}`;

    try {
      await Share.share({ message });
    } catch (e) {}
  }, [players]);

  const addPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
      triggerHaptic("light");
      const avatars = ["😎", "🤪", "😈", "🥳", "🤠", "👻", "🦊", "🐸", "🦄", "🔥", "⚡", "💀", "🎃", "🤖", "👽", "🦁", "🐼", "🦋", "🎭", "🌟"];
      setPlayers(prev => [...prev, {
        name: newPlayerName.trim(),
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        score: 0,
        drinks: 0,
      }]);
      setNewPlayerName("");
    }
  }, [newPlayerName]);

  const removePlayer = useCallback((index: number) => {
    triggerHaptic("light");
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleCategory = useCallback((cat: CategoryKey) => {
    triggerHaptic("light");
    setGameState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  }, []);

  const sharePrompt = useCallback(async () => {
    triggerHaptic("success");
    const topCard = cardStack[0];
    if (!topCard) return;
    try {
      await Share.share({
        message: `🎮 GAMBIT\n\n"${topCard.text}"\n\nDownload Gambit and play with your friends!`,
      });
    } catch (e) {}
  }, [cardStack]);

  const errorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: errorShakeX.value }] }));
  const timerBarStyle = useAnimatedStyle(() => ({ width: `${timerProgress.value * 100}%` }));
  const timerTextStyle = useAnimatedStyle(() => ({ transform: [{ scale: timerPulse.value }] }));

  // Current category for styling
  const currentCategory = cardStack[0]?.data.category as CategoryKey || "chaos";
  const catColor = CATEGORIES[currentCategory]?.color || "#F97316";
  const catGradient = CATEGORIES[currentCategory]?.gradient || ["#F97316", "#EA580C"];

  // Render Setup
  const renderSetup = () => (
    <View style={styles.screen}>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.setupContent, Platform.OS === "web" && { flexGrow: 1, paddingBottom: 80 }]}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <TouchableOpacity onPress={handleSecretTap} activeOpacity={1} style={styles.logoContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.appIcon}
            />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>MOST LIKELY TO</Text>
          <Text style={styles.heroSub}>Vote on your friends</Text>
        </Animated.View>

        
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.card}>
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={() => setIsAddPlayerVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${players.length} player${players.length !== 1 ? "s" : ""} added. Tap to manage players`}
            accessibilityHint="Double tap to open player management panel"
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardEmoji} accessibilityElementsHidden={true}>👥</Text>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{players.length} Player{players.length !== 1 ? "s" : ""}</Text>
                <Text style={styles.cardSubtitle}>Tap to add more</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.4)" accessibilityElementsHidden={true} />
            </View>
            {players.length > 0 && (
              <View style={styles.playerChips}>
                {players.slice(0, 5).map((p, i) => (
                  <View key={i} style={styles.playerChip}><Text style={styles.playerChipText}>{p.avatar} {p.name}</Text></View>
                ))}
                {players.length > 5 && <Text style={styles.moreChip}>+{players.length - 5}</Text>}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <TouchableOpacity
            style={[styles.modeCard, gameState.isSexyMode && styles.modeCardActive]}
            onPress={() => { triggerHaptic("light"); setGameState(prev => ({ ...prev, isSexyMode: !prev.isSexyMode })); }}
            activeOpacity={0.8}
            accessibilityRole="switch"
            accessibilityState={{ checked: gameState.isSexyMode }}
            accessibilityLabel={gameState.isSexyMode ? "Spicy Mode enabled" : "Party Mode enabled"}
            accessibilityHint="Double tap to toggle between Party Mode and Spicy Mode"
          >
            <Text style={styles.modeEmoji} accessibilityElementsHidden={true}>{gameState.isSexyMode ? "🌶️" : "🎉"}</Text>
            <Text style={styles.modeText}>{gameState.isSexyMode ? "Spicy Mode" : "Party Mode"}</Text>
            <View style={[styles.modeIndicator, gameState.isSexyMode && styles.modeIndicatorActive]} accessibilityElementsHidden={true} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel} accessibilityRole="header">Chaos Level</Text>
            <View style={styles.chaosValueBadge} accessibilityElementsHidden={true}><Text style={styles.chaosValue}>{gameState.chaosLevel}</Text></View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={gameState.chaosLevel}
            onValueChange={(v) => { playTick(); setGameState(prev => ({ ...prev, chaosLevel: v })); }}
            minimumTrackTintColor="#F97316"
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor="#FFF"
            accessibilityRole="adjustable"
            accessibilityLabel={`Chaos level ${gameState.chaosLevel} of 10`}
            accessibilityHint="Swipe up or down to adjust the intensity of game prompts"
          />
          <View style={styles.sliderLabels} accessibilityElementsHidden={true}>
            <Text style={styles.sliderLabelText}>Chill</Text>
            <Text style={styles.sliderLabelText}>Unhinged</Text>
          </View>
        </Animated.View>

        <Animated.View style={errorStyle} entering={FadeInUp.delay(350).duration(500)}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => { playWhoosh(); players.length >= 2 ? setGameState(prev => ({ ...prev, screen: "categories" })) : startGame(); }}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={players.length === 0 ? "Add players to continue" : players.length < 2 ? `Add ${2 - players.length} more player to continue` : "Choose Categories"}
            accessibilityHint={players.length < 2 ? "You need at least 2 players to start the game" : "Double tap to select game categories"}
          >
            <LinearGradient colors={["#F97316", "#EA580C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButtonGradient}>
              <Text style={styles.startButtonText}>{players.length === 0 ? "Add Players" : players.length < 2 ? `Add ${2 - players.length} More` : "Choose Categories"}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} accessibilityElementsHidden={true} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Get More Prompts Button — native only, web is fully unlocked */}
        {Platform.OS !== 'web' && (
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.getMoreContainer}>
          <TouchableOpacity
            style={styles.getMoreButton}
            onPress={() => { triggerHaptic("light"); setShowPaywall(true); }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get More Prompts"
            accessibilityHint="Double tap to view premium prompt packs available for purchase"
          >
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getMoreGradient}
            >
              <Ionicons name="sparkles" size={18} color="#FFF" accessibilityElementsHidden={true} />
              <Text style={styles.getMoreText}>Get More Prompts</Text>
            </LinearGradient>
          </TouchableOpacity>
          {purchasedEntitlements.length > 0 && (
            <Text style={styles.premiumBadge} accessibilityLabel="Premium subscription is active">Premium Active</Text>
          )}
        </Animated.View>
        )}

        <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/privacy")} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>•</Text>
          <TouchableOpacity onPress={() => router.push("/support")} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Terms & Support</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  // Render Categories
  const renderCategories = () => (
    <View style={styles.screen}>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.catHeader}>
          <TouchableOpacity
            onPress={() => setGameState(prev => ({ ...prev, screen: "setup" }))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to setup"
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.catCount} accessibilityLabel={`${gameState.selectedCategories.length} categories selected`}>{gameState.selectedCategories.length} selected</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.catTitle} accessibilityRole="header">Choose Your Vibe</Text>
        </Animated.View>

        <View style={styles.catGrid} accessibilityRole="radiogroup" accessibilityLabel="Category selection">
          {(Object.keys(CATEGORIES) as CategoryKey[])
            .filter(key => key !== "drinking" || isAdultMode)
            .map((key, i) => {
            const cat = CATEGORIES[key];
            const selected = gameState.selectedCategories.includes(key);
            return (
              <Animated.View key={key} entering={ZoomIn.delay(80 + i * 30).duration(250)}>
                <TouchableOpacity
                  style={[styles.catCard, selected && { borderColor: cat.color }]}
                  onPress={() => toggleCategory(key)}
                  activeOpacity={0.85}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${cat.name} category`}
                  accessibilityHint={selected ? "Double tap to deselect" : "Double tap to select"}
                >
                  {selected && <LinearGradient colors={[cat.gradient[0] + "30", cat.gradient[1] + "10"]} style={StyleSheet.absoluteFill} />}
                  <Text style={styles.catEmoji} accessibilityElementsHidden={true}>{cat.emoji}</Text>
                  <Text style={[styles.catName, selected && { color: cat.color }]}>{cat.name}</Text>
                  {selected && <View style={[styles.catCheck, { backgroundColor: cat.color }]} accessibilityElementsHidden={true}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.catStartWrap}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={startGame}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Start the game"
            accessibilityHint="Double tap to begin playing with selected categories"
          >
            <LinearGradient colors={["#F97316", "#EA580C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButtonGradient}>
              <Text style={styles.startButtonText}>Let's Go</Text>
              <Ionicons name="flash" size={20} color="#FFF" style={{ marginLeft: 8 }} accessibilityElementsHidden={true} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  // Render Playing
  const renderPlaying = () => {
    const total = gameState.totalRounds * gameState.promptsPerRound;
    const current = (gameState.round - 1) * gameState.promptsPerRound + gameState.currentPromptIndex;
    const progress = (current + 1) / total;
    const timerColor = gameState.timerSeconds <= 5 ? "#EF4444" : "#10B981";

    return (
      <GestureHandlerRootView style={styles.screen}>
        <LinearGradient colors={[catColor + "15", "#000"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

        <View style={styles.playHeader}>
          <TouchableOpacity
            onPress={resetGame}
            style={styles.playBackBtn}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            accessibilityHint="Double tap to return to the main menu"
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.playRoundBadge} accessibilityLabel={`Round ${gameState.round}`}><Text style={styles.playRoundText}>Round {gameState.round}</Text></View>
          <TouchableOpacity
            onPress={sharePrompt}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel="Share prompt"
            accessibilityHint="Double tap to share the current prompt"
          >
            <Ionicons name="share-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap} accessibilityLabel={`Progress: prompt ${current + 1} of ${total}`}>
          <View style={styles.progressTrack} accessibilityElementsHidden={true}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: catColor }]} />
          </View>
          <Text style={styles.playCount} accessibilityElementsHidden={true}>{current + 1}/{total}</Text>
        </View>

        <View style={styles.cardsArea}>
          {cardStack.slice(0, 2).reverse().map((card, index) => {
            const isTopCard = index === cardStack.length - 1 - (cardStack.length > 1 ? 0 : -1);
            return (
              <SwipeableCard
                key={card.id}
                card={card}
                isTop={isTopCard}
                onSwipe={handleSwipe}
                category={card.data.category as CategoryKey}
                onSkip={isTopCard ? () => skipForever(card.data.text) : undefined}
                onFavorite={isTopCard ? () => toggleFavorite(card.data.text) : undefined}
                isFavorite={favoritePrompts.has(card.data.text)}
              />
            );
          })}

          {gameState.timerActive && (
            <View
              style={styles.timerOverlay}
              accessibilityRole="timer"
              accessibilityLabel={`${gameState.timerSeconds} seconds remaining`}
              accessibilityLiveRegion="polite"
            >
              <Animated.Text style={[styles.timerNum, timerTextStyle, { color: timerColor }]}>{gameState.timerSeconds}</Animated.Text>
              <View style={styles.timerTrack} accessibilityElementsHidden={true}>
                <Animated.View style={[styles.timerFill, timerBarStyle, { backgroundColor: timerColor }]} />
              </View>
            </View>
          )}
        </View>

        {/* Scoring buttons */}
        {gameState.showScoring && players.length > 0 && (
          <View style={styles.scoringSection} accessible={true} accessibilityLabel="Award points to players">
            <Text style={styles.scoringLabel} accessibilityRole="header">Award points</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scoringPlayers}>
              {players.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.scoringPlayer}
                  onPress={() => awardPoints(i, 1)}
                  onLongPress={() => addDrink(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}, ${p.score} points${p.drinks > 0 ? `, ${p.drinks} penalties` : ""}`}
                  accessibilityHint="Tap to award a point, long press to add a penalty"
                >
                  <Text style={styles.scoringAvatar} accessibilityElementsHidden={true}>{p.avatar}</Text>
                  <Text style={styles.scoringName}>{p.name}</Text>
                  <View style={styles.scoringStats} accessibilityElementsHidden={true}>
                    <Text style={styles.scoringScore}>+{p.score}</Text>
                    {p.drinks > 0 && <Text style={styles.scoringDrinks}>{p.drinks}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.playFooter}>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNextButton}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Next prompt"
            accessibilityHint="Double tap to move to the next game prompt"
          >
            <LinearGradient colors={catGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextBtnGradient}>
              <Text style={styles.nextBtnText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    );
  };

  // Render Round End
  const renderRoundEnd = () => (
    <View style={styles.screen} accessibilityRole="alert" accessibilityLabel={`Round ${gameState.round} complete`}>
      <LinearGradient colors={["#F9731620", "#000"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={styles.roundEndContent} entering={ZoomIn.duration(300)}>
        <Animated.Text entering={BounceIn.delay(200)} style={styles.roundEndEmoji} accessibilityElementsHidden={true}>🎉</Animated.Text>
        <Text style={styles.roundEndTitle} accessibilityRole="header">Round {gameState.round} Done!</Text>
        <Text style={styles.roundEndSub}>{gameState.totalRounds - gameState.round} more to go</Text>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={continueToNextRound}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`Continue to round ${gameState.round + 1}`}
          accessibilityHint="Double tap to start the next round"
        >
          <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.continueBtnGradient}>
            <Text style={styles.continueBtnText}>Round {gameState.round + 1}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      {showConfetti && <Confetti count={50} reduceMotion={reduceMotion} />}
    </View>
  );

  // Render Results
  const renderResults = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const drunkest = [...players].sort((a, b) => b.drinks - a.drinks)[0];

    return (
      <View style={styles.screen}>
        <LinearGradient colors={["#FFD70020", "#000"]} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Animated.Text
            entering={FadeInDown.duration(400)}
            style={styles.resultsTitle}
            accessibilityRole="header"
          >
            Game Over
          </Animated.Text>

          {winner && winner.score > 0 && (
            <Animated.View
              entering={ZoomIn.delay(150).duration(300)}
              style={styles.winnerCard}
              accessibilityRole="text"
              accessibilityLabel={`Champion: ${winner.name} with ${winner.score} points`}
            >
              <Animated.Text entering={BounceIn.delay(400)} style={styles.winnerEmoji} accessibilityElementsHidden={true}>👑</Animated.Text>
              <Text style={styles.winnerLabel}>CHAMPION</Text>
              <Text style={styles.winnerName}>{winner.avatar} {winner.name}</Text>
              <Text style={styles.winnerScore}>{winner.score} points</Text>
            </Animated.View>
          )}

          {drunkest && drunkest.drinks > 0 && (
            <Animated.View
              entering={ZoomIn.delay(280).duration(300)}
              style={[styles.winnerCard, styles.drunkestCard]}
              accessibilityRole="text"
              accessibilityLabel={`Most penalized: ${drunkest.name} with ${drunkest.drinks} penalties`}
            >
              <Text style={styles.drunkestEmoji} accessibilityElementsHidden={true}>🎭</Text>
              <Text style={styles.drunkestLabel}>MOST PENALIZED</Text>
              <Text style={styles.drunkestName}>{drunkest.avatar} {drunkest.name}</Text>
              <Text style={styles.drunkestScore}>{drunkest.drinks} penalties</Text>
            </Animated.View>
          )}

          <View style={styles.resultsList} accessible={true} accessibilityLabel="Final standings">
            {sortedPlayers.map((p, i) => (
              <Animated.View
                key={i}
                entering={SlideInRight.delay(300 + i * 60).duration(250)}
                style={styles.resultRow}
                accessible={true}
                accessibilityLabel={`${i === 0 ? "First" : `Number ${i + 1}`}: ${p.name}, ${p.score} points${p.drinks > 0 ? `, ${p.drinks} penalties` : ""}`}
              >
                <Text style={[styles.resultRank, i === 0 && styles.resultRankFirst]}>{i + 1}</Text>
                <Text style={styles.resultAvatar} accessibilityElementsHidden={true}>{p.avatar}</Text>
                <Text style={styles.resultName}>{p.name}</Text>
                <View style={styles.resultStats} accessibilityElementsHidden={true}>
                  <Text style={styles.resultScore}>{p.score}pts</Text>
                  {p.drinks > 0 && <Text style={styles.resultDrinks}>{p.drinks}</Text>}
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.resultsButtons}>
            <TouchableOpacity
              style={styles.shareResultsBtn}
              onPress={shareResults}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share Results"
              accessibilityHint="Double tap to share game results with others"
            >
              <Ionicons name="share-outline" size={22} color="#FFF" accessibilityElementsHidden={true} />
              <Text style={styles.shareResultsText}>Share Results</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playAgainBtn}
              onPress={resetGame}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Play Again"
              accessibilityHint="Double tap to start a new game"
            >
              <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.playAgainGradient}>
                <Text style={styles.playAgainText}>Play Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {showConfetti && <Confetti count={60} reduceMotion={reduceMotion} />}
      </View>
    );
  };

  // Get gradient colors based on current screen
  const getGradientColors = () => {
    switch (gameState.screen) {
      case "setup": return ["#F97316", "#EC4899", "#3B82F6"];
      case "categories": return ["#F97316", "#EC4899", "#F59E0B"];
      case "playing": return [catColor, "#EC4899", "#3B82F6"];
      case "results": return ["#FFD700", "#EC4899", "#F97316"];
      default: return ["#F97316", "#EC4899", "#3B82F6"];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Full-width background gradient */}
      <FluidGradient
        colors={getGradientColors()}
        speed={0.6}
        blur={100}
        style={styles.fullWidthGradient}
      />

      <View style={styles.inner}>
        {gameState.screen === "setup" && renderSetup()}
        {gameState.screen === "categories" && renderCategories()}
        {gameState.screen === "playing" && renderPlaying()}
        {gameState.screen === "roundEnd" && renderRoundEnd()}
        {gameState.screen === "results" && renderResults()}
      </View>

      <SlideDownPanel isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)}>
        <View style={styles.dialogHeader}>
          <Text style={styles.dialogTitle} accessibilityRole="header">Add Players</Text>
          <Text style={styles.dialogSubtitle} accessibilityLabel={`${players.length} player${players.length !== 1 ? "s" : ""} added`}>{players.length} player{players.length !== 1 ? "s" : ""} added</Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} accessibilityElementsHidden={true} />
            <TextInput
              style={styles.input}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Enter name..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="done"
              onSubmitEditing={addPlayer}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel="Player name"
              accessibilityHint="Enter a player name and tap Add or press return"
            />
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={addPlayer}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add player"
            accessibilityHint="Double tap to add this player to the game"
          >
            <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.addBtnGradient}>
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(index * 30).duration(180)}
              exiting={SlideOutLeft.duration(120)}
              layout={Layout.duration(200)}
              style={styles.dialogPlayer}
              accessible={true}
              accessibilityLabel={`${item.name}`}
            >
              <View style={styles.playerAvatarWrap}><Text style={styles.playerAvatar} accessibilityElementsHidden={true}>{item.avatar}</Text></View>
              <Text style={styles.dialogPlayerText}>{item.name}</Text>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removePlayer(index)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
                accessibilityHint="Double tap to remove this player"
              >
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </Animated.View>
          )}
          style={styles.dialogList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyList}><Text style={styles.emptyListText}>No players yet</Text></View>}
          accessibilityRole="list"
          accessibilityLabel="Player list"
        />

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => setIsAddPlayerVisible(false)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Done"
          accessibilityHint="Double tap to close the player panel"
        >
          <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.doneBtnGradient}>
            <Text style={styles.doneBtnText}>Done</Text>
            <Ionicons name="checkmark" size={20} color="#FFF" accessibilityElementsHidden={true} />
          </LinearGradient>
        </TouchableOpacity>
      </SlideDownPanel>

      {/* Web upgrade prompt — post-game, non-blocking */}
      {showWebUpgrade && Platform.OS === 'web' && (
        <WebUpgradePrompt
          onClose={() => setShowWebUpgrade(false)}
          onSuccess={() => {
            setShowWebUpgrade(false);
            setPurchasedEntitlements(prev => [...prev, 'Gambit Pro']);
          }}
        />
      )}

      {/* Paywall Modal — native only */}
      {showPaywall && Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFill}>
          <Paywall
            onClose={() => setShowPaywall(false)}
            onPurchaseSuccess={async (entitlements) => {
              setPurchasedEntitlements(entitlements);
              triggerHaptic("success");
              // Reload premium prompts after successful purchase
              const unlocked = await getUnlockedPremiumPrompts();
              setPremiumPrompts(unlocked as Prompt[]);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fullWidthGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  inner: { flex: 1, maxWidth: Platform.OS === "web" ? MAX_WIDTH : "100%", width: "100%", alignSelf: "center", zIndex: 1 },
  screen: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { flex: 1 },

  liveStats: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 8 },
  liveText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "600" },

  setupContent: { padding: 20, paddingBottom: Platform.OS === "web" ? 80 : 40 },
  hero: { alignItems: "center", marginTop: 20, marginBottom: 20 },
  logoContainer: { marginBottom: 16 },
  appIcon: { width: 100, height: 100, borderRadius: 24 },
  heroTitle: { fontSize: 48, fontWeight: "900", color: "#FFF", letterSpacing: 6 },
  heroSub: { fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6, letterSpacing: 1.5 },

  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardTouchable: { padding: 20 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardEmoji: { fontSize: 32, marginRight: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  cardSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  playerChips: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 8 },
  playerChip: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  playerChipText: { fontSize: 13, color: "#FFF" },
  moreChip: { fontSize: 13, color: "rgba(255,255,255,0.5)", alignSelf: "center" },

  modeCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modeCardActive: { backgroundColor: "rgba(236,72,153,0.1)", borderColor: "rgba(236,72,153,0.3)" },
  modeEmoji: { fontSize: 28, marginRight: 16 },
  modeText: { fontSize: 17, fontWeight: "600", color: "#FFF", flex: 1 },
  modeIndicator: { width: 48, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)" },
  modeIndicatorActive: { backgroundColor: "#EC4899" },
  adultModeCardActive: { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" },
  adultModeIndicatorActive: { backgroundColor: "#F59E0B" },

  sliderCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sliderLabel: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  chaosValueBadge: { backgroundColor: "#F97316", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chaosValue: { fontSize: 15, fontWeight: "800", color: "#FFF" },
  slider: { width: "100%", height: 40 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sliderLabelText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  startButton: { borderRadius: 20, overflow: "hidden" },
  startButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, paddingHorizontal: 32 },
  startButtonText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  catHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 0 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  catCount: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  catTitle: { fontSize: 32, fontWeight: "800", color: "#FFF", textAlign: "center", marginTop: 20, marginBottom: 24 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  catCard: { width: (SCREEN_WIDTH - 56) / 2, maxWidth: (MAX_WIDTH - 56) / 2, aspectRatio: 1.1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent", overflow: "hidden" },
  catEmoji: { fontSize: 40, marginBottom: 12 },
  catName: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  catCheck: { position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catStartWrap: { padding: 20, paddingTop: 32 },

  playHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  playBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  playRoundBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  playRoundText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },

  progressWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  playCount: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", minWidth: 40, textAlign: "right" },

  cardsArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  promptCard: { position: "absolute", width: "100%", aspectRatio: 0.85, backgroundColor: "#111", borderRadius: 24, padding: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cardTopRow: { position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promptCatBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  promptCatText: { fontSize: 18 },
  cardActions: { flexDirection: "row", gap: 8 },
  cardActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  promptText: { fontSize: 24, fontWeight: "700", color: "#FFF", textAlign: "center", lineHeight: 34 },
  swipeHint: { position: "absolute", bottom: 20, fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "600", letterSpacing: 2 },

  scoringSection: { paddingHorizontal: 16, paddingBottom: 8 },
  scoringLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, textAlign: "center" },
  scoringPlayers: { gap: 8, paddingHorizontal: 4 },
  scoringPlayer: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, minWidth: 70 },
  scoringAvatar: { fontSize: 20, marginBottom: 2 },
  scoringName: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  scoringStats: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  scoringScore: { fontSize: 12, fontWeight: "700", color: "#F97316" },
  scoringDrinks: { fontSize: 10, color: "rgba(255,255,255,0.4)" },

  timerOverlay: { position: "absolute", bottom: 80, alignItems: "center", width: "80%" },
  timerNum: { fontSize: 48, fontWeight: "900", marginBottom: 8 },
  timerTrack: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  timerFill: { height: "100%", borderRadius: 3 },

  playFooter: { padding: 16, paddingBottom: 32 },
  nextBtn: { borderRadius: 20, overflow: "hidden" },
  nextBtnGradient: { paddingVertical: 18, alignItems: "center" },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  roundEndContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  roundEndEmoji: { fontSize: 80, marginBottom: 24 },
  roundEndTitle: { fontSize: 36, fontWeight: "800", color: "#FFF", marginBottom: 8 },
  roundEndSub: { fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 48 },
  continueBtn: { borderRadius: 20, overflow: "hidden", width: "100%" },
  continueBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 8 },
  continueBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  resultsContent: { padding: 24, paddingTop: 48, alignItems: "center" },
  resultsTitle: { fontSize: 42, fontWeight: "900", color: "#FFF", marginBottom: 32 },
  winnerCard: { backgroundColor: "rgba(255,215,0,0.1)", borderWidth: 2, borderColor: "rgba(255,215,0,0.3)", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", marginBottom: 24 },
  winnerEmoji: { fontSize: 64, marginBottom: 16 },
  winnerLabel: { fontSize: 12, color: "rgba(255,215,0,0.7)", fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
  winnerName: { fontSize: 28, fontWeight: "800", color: "#FFD700" },
  resultsList: { width: "100%", gap: 12, marginBottom: 32 },
  resultRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, gap: 16 },
  resultRank: { fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.4)", width: 24 },
  resultRankFirst: { color: "#FFD700" },
  resultAvatar: { fontSize: 24 },
  resultName: { fontSize: 16, fontWeight: "600", color: "#FFF", flex: 1 },
  resultStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultScore: { fontSize: 14, fontWeight: "700", color: "#F97316" },
  resultDrinks: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  winnerScore: { fontSize: 16, color: "rgba(255,215,0,0.8)", marginTop: 4, fontWeight: "600" },
  drunkestCard: { backgroundColor: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.3)" },
  drunkestEmoji: { fontSize: 48, marginBottom: 12 },
  drunkestLabel: { fontSize: 11, color: "rgba(59,130,246,0.8)", fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
  drunkestName: { fontSize: 22, fontWeight: "700", color: "#3B82F6" },
  drunkestScore: { fontSize: 14, color: "rgba(59,130,246,0.7)", marginTop: 2, fontWeight: "600" },
  resultsButtons: { gap: 12, width: "100%", marginTop: 10 },
  shareResultsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  shareResultsText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  playAgainBtn: { borderRadius: 20, overflow: "hidden", width: "100%" },
  playAgainGradient: { paddingVertical: 18, alignItems: "center" },
  playAgainText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  dialogHeader: { marginBottom: 20 },
  dialogTitle: { fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center" },
  dialogSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 4, fontWeight: "500" },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "center", height: 52, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: 52, paddingHorizontal: 12, fontSize: 16, color: "#FFF", fontWeight: "500" },
  addBtn: { width: 52, height: 52, borderRadius: 16, overflow: "hidden" },
  addBtnGradient: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  dialogList: { maxHeight: 220, marginBottom: 20 },
  dialogPlayer: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  playerAvatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(139,92,246,0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  playerAvatar: { fontSize: 18 },
  dialogPlayerText: { flex: 1, fontSize: 16, color: "#FFF", fontWeight: "600" },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  emptyList: { paddingVertical: 32, alignItems: "center" },
  emptyListText: { fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: "500" },
  doneBtn: { borderRadius: 16, overflow: "hidden" },
  doneBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  getMoreContainer: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  getMoreButton: { borderRadius: 16, overflow: "hidden" },
  getMoreGradient: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 24, gap: 8 },
  getMoreText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  premiumBadge: { marginTop: 8, fontSize: 12, color: "#10B981", fontWeight: "600" },

  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 12 },
  footerLink: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: "500" },
  footerDot: { fontSize: 13, color: "rgba(255,255,255,0.2)" },
});
