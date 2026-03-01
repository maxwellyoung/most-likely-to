/**
 * Gambit Brand Colors
 * Primary: Purple (#8B5CF6)
 * Accent: Pink (#EC4899)
 * Background: Near Black (#050505)
 */

// Brand Colors
export const Brand = {
  primary: "#8B5CF6",
  primaryDark: "#7C3AED",
  primaryLight: "#A78BFA",
  accent: "#EC4899",
  accentDark: "#DB2777",

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ["#8B5CF6", "#7C3AED"] as const,
  gradientAccent: ["#EC4899", "#DB2777"] as const,
  gradientMixed: ["#8B5CF6", "#EC4899"] as const,

  // Category Colors
  drinking: "#F59E0B",
  dares: "#EF4444",
  confessions: "#A855F7",
  hotTakes: "#F97316",
  physical: "#10B981",
  social: "#3B82F6",
  creative: "#EC4899",
  chaos: "#8B5CF6",

  // Semantic Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Backgrounds
  background: "#050505",
  backgroundLight: "#0A0A0A",
  backgroundCard: "#111111",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255, 255, 255, 0.5)",
  textDisabled: "rgba(255, 255, 255, 0.3)",

  // Borders
  border: "rgba(255, 255, 255, 0.1)",
  borderLight: "rgba(255, 255, 255, 0.06)",
  borderPrimary: "rgba(139, 92, 246, 0.3)",
};

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: "#1D1D1F",
    background: "#F5F5F7",
    tint: Brand.primary,
    tabIconDefault: "#86868B",
    tabIconSelected: Brand.primary,
  },
  dark: {
    text: "#F5F5F7",
    background: Brand.background,
    tint: Brand.primary,
    tabIconDefault: "rgba(255, 255, 255, 0.4)",
    tabIconSelected: Brand.primary,
  },
};

// Category configuration with full branding
export const Categories = {
  drinking: {
    name: "Drinking",
    emoji: "🍻",
    color: Brand.drinking,
    gradient: ["#F59E0B", "#D97706"] as const,
  },
  dares: {
    name: "Dares",
    emoji: "🎯",
    color: Brand.dares,
    gradient: ["#EF4444", "#DC2626"] as const,
  },
  confessions: {
    name: "Confessions",
    emoji: "🤫",
    color: Brand.confessions,
    gradient: ["#A855F7", "#9333EA"] as const,
  },
  hot_takes: {
    name: "Hot Takes",
    emoji: "🔥",
    color: Brand.hotTakes,
    gradient: ["#F97316", "#EA580C"] as const,
  },
  physical: {
    name: "Physical",
    emoji: "💪",
    color: Brand.physical,
    gradient: ["#10B981", "#059669"] as const,
  },
  social: {
    name: "Social",
    emoji: "💬",
    color: Brand.social,
    gradient: ["#3B82F6", "#2563EB"] as const,
  },
  creative: {
    name: "Creative",
    emoji: "🎨",
    color: Brand.creative,
    gradient: ["#EC4899", "#DB2777"] as const,
  },
  chaos: {
    name: "Chaos",
    emoji: "🌪️",
    color: Brand.chaos,
    gradient: ["#8B5CF6", "#7C3AED"] as const,
  },
} as const;

export type CategoryKey = keyof typeof Categories;
