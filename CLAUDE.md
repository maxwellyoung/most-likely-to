# CLAUDE.md - AI Assistant Guidelines for Social Chaos (Gambit)

## Project Overview

**Social Chaos** (branded as "Gambit") is a cross-platform party game application built with React Native and Expo. The app generates personalized prompts for groups, supporting drinking games, dares, and social activities with adjustable "chaos levels."

- **Package Name:** `social-chaos`
- **Version:** 1.0.3 (npm) / 1.0.5 (Expo app)
- **Bundle ID:** `com.maxwellyoung.socialchaos`
- **Author:** maxwellyoung (Maxwell Young)

## Tech Stack

### Core Framework
- **React Native 0.74.5** - Cross-platform mobile development
- **Expo 51.0.28** - Managed React Native platform
- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type safety (strict mode enabled)
- **Expo Router 3.5.23** - File-based routing

### Animation & Gestures
- `react-native-reanimated` (3.10.1) - Advanced animations
- `react-native-gesture-handler` (2.16.1) - Gesture detection
- `expo-haptics` - Haptic feedback

### UI & Styling
- `expo-linear-gradient` - Gradient backgrounds
- `expo-blur` - Blur effects
- `@expo/vector-icons` (Ionicons) - Icon library
- `@react-native-community/slider` - Slider component
- Custom theme system with light/dark mode support

### Backend
- `@supabase/supabase-js` (2.45.4) - Backend-as-a-service
- `expo-apple-authentication` - Apple Sign In

### Testing
- **Jest 29.2.1** with `jest-expo` preset

## Development Commands

```bash
npm start              # Start Expo development server
npm run android        # Build and run Android app
npm run ios            # Build and run iOS app
npm run web            # Run web version
npm test               # Run Jest tests in watch mode
npm run lint           # Run Expo linter
npm run reset-project  # Reset /app to blank state
```

## Directory Structure

```
social-chaos/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx           # Tab layout configuration
│   │   ├── index.tsx             # Home tab
│   │   └── explore.tsx           # Explore tab
│   ├── index.tsx                 # Main home screen
│   ├── _layout.tsx               # Root layout (Stack navigator)
│   ├── +html.tsx                 # Web-only HTML configuration
│   └── +not-found.tsx            # 404 page
│
├── components/                   # Reusable UI components
│   ├── PersonalizedPartyGame.tsx # Main game component (1,277 lines)
│   ├── ThemedView.tsx            # Theme-aware container
│   ├── ThemedText.tsx            # Theme-aware text component
│   ├── Button.tsx                # Button with gradient variant
│   ├── Select.tsx                # Custom select dropdown
│   ├── SlideDownPanel.tsx        # Animated slide panel
│   ├── Dialog.tsx                # Modal dialog
│   ├── QuestionList.tsx          # Question display list
│   └── __tests__/                # Component tests
│
├── constants/
│   └── Colors.ts                 # Theme color definitions
│
├── hooks/
│   ├── useThemeColor.ts          # Theme color resolution hook
│   └── useColorScheme.ts         # Color scheme detection hook
│
├── lib/
│   └── supabase.ts               # Supabase client configuration
│
├── types/
│   └── json.d.ts                 # TypeScript JSON module declarations
│
├── assets/
│   ├── images/                   # App icons, splash screens
│   ├── fonts/                    # Inter font family (multiple weights)
│   └── prompts/                  # Game prompt JSON files
│       ├── prompts.json          # Main prompts (normal + sexy modes)
│       ├── drinking.json         # Drinking category prompts
│       ├── chill.json            # Chill mode prompts
│       └── sexy.json             # Sexy mode prompts
│
├── styles/
│   └── global.css                # Web-specific global styles
│
├── android/                      # Android native project
├── ios/                          # iOS native project (Xcode)
└── scripts/
    └── reset-project.js          # Project reset script
```

## Key Files & Entry Points

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with Stack navigator and theming |
| `app/index.tsx` | Home screen, renders PersonalizedPartyGame |
| `components/PersonalizedPartyGame.tsx` | **Main game logic** - all game state, UI, and interactions |
| `constants/Colors.ts` | Light/dark theme color definitions |
| `lib/supabase.ts` | Supabase client initialization |

## Coding Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig.json)
- Path alias: `@/*` maps to project root (e.g., `@/components/Button`)
- Type definitions for JSON imports in `types/json.d.ts`

### Component Patterns

1. **Functional components with TypeScript interfaces:**
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "default" | "accent";
}

export function Button({ title, onPress, variant = "default" }: ButtonProps) {
  // ...
}
```

2. **Theme-aware components:** Use `useThemeColor` hook for colors
```typescript
const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
```

3. **Styles:** Use `StyleSheet.create()` at component level
```typescript
const styles = StyleSheet.create({
  container: { /* ... */ },
});
```

### Platform-Specific Code
```typescript
import { Platform } from "react-native";

fontFamily: Platform.select({
  ios: "Inter-Medium",
  android: "Inter-Medium",
  default: "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
}),
```

### Animation Patterns
- Use `react-native-reanimated` for complex animations
- Use `useSharedValue` and `useAnimatedStyle` for performant animations
- Use `withSpring`, `withTiming`, `withSequence` for animation composition

### Gesture Handling
- Wrap touch areas with `GestureDetector` from `react-native-gesture-handler`
- Use `Gesture.Pan()` for swipe gestures
- Standard swipe threshold: `SCREEN_WIDTH * 0.3` (30% of screen width)

## Theme System

### Color Palette (constants/Colors.ts)

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| text | `#1D1D1F` | `#F5F5F7` |
| background | `#F5F5F7` | `#1D1D1F` |
| tint | `#0071E3` | `#0071E3` |
| tabIconDefault | `#86868B` | `#86868B` |
| tabIconSelected | `#0071E3` | `#0071E3` |

### Accent Colors (Button gradients)
- Primary gradient: `["#818CF8", "#6366F1"]` (indigo)
- Border accent: `#4F46E5`

## Game Data Structures

### Player Type
```typescript
type Player = {
  name: string;
  avatar: string;  // Emoji avatar
};
```

### Game Modes
```typescript
type GameMode = "normal" | "sexy";
```

### Prompt Template
```typescript
interface PromptTemplate {
  text: string;
  minChaos: number;
  maxChaos: number;
  category: "social" | "drinking" | "action" | "dare" | "sexy";
  weight: number;
  sexyModeOnly?: boolean;
}
```

### Enhanced Prompt (JSON format)
```typescript
interface EnhancedPrompt {
  text: string;
  type: "single-player" | "call-response" | "conditional" | "group";
  category: "drinking" | "action" | "social";
}
```

### Prompt Placeholders
- `{player1}` - First randomly selected player
- `{player2}` - Second randomly selected player

## Important Constants

```typescript
const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;  // 30% for swipe detection
const MAX_WIDTH_WEB = 720;                    // Max container width for web
const MAX_WIDTH_PROMPT_WEB = 560;             // Max prompt card width for web
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | Production | iOS 13.4+, Build #5 |
| Android | Production | Version code 5 |
| Web | Supported | Webpack bundling with font support |

## Testing

- Tests located in `components/__tests__/`
- Using `jest-expo` preset
- Snapshot testing enabled
- Run tests: `npm test`

## Build Configuration

### EAS Build (eas.json)
- Production iOS builds with automatic version management
- Apple Connect App ID: 6737107968
- Team ID: AWN2WCN26Y

### Babel (babel.config.js)
- Uses `babel-preset-expo` for all transpilation

### Webpack (webpack.config.js)
- Extends `@expo/webpack-config`
- Custom font loader for `.woff|woff2|otf|ttf|eot` files

## Key Development Notes

1. **Main game logic is in one component:** `PersonalizedPartyGame.tsx` (1,277 lines) contains all game state, UI, and interactions. Consider this the central file for game-related changes.

2. **Prompt data is JSON-based:** Located in `assets/prompts/`. Prompts support player substitution and are filtered by chaos level.

3. **Haptic feedback:** Use `expo-haptics` for tactile responses on interactions.

4. **Web responsiveness:** Components use `MAX_WIDTH_WEB` constant to constrain width on larger screens.

5. **Supabase configuration:** Requires `supabaseUrl` and `supabaseAnonKey` in Expo config extras.

## Git Workflow

- Main development happens on feature branches
- Commit messages should be concise and descriptive
- Recent commits follow single-word/short phrase convention

## Common Tasks

### Adding a New Prompt
1. Edit the appropriate file in `assets/prompts/`
2. Follow the `EnhancedPrompt` structure
3. Use `{player1}`, `{player2}` placeholders for player names

### Creating a New Component
1. Add to `components/` directory
2. Use TypeScript interfaces for props
3. Implement theme support with `useThemeColor` hook
4. Use `StyleSheet.create()` for styles

### Modifying Game Logic
- All game logic is in `components/PersonalizedPartyGame.tsx`
- State management uses React hooks (`useState`, `useCallback`, `useMemo`)
- Animation state uses Reanimated shared values

### Adding Platform-Specific Code
- Use `Platform.select()` for style differences
- Use `.web.ts` suffix for web-only implementations (see `useColorScheme.web.ts`)


## Relevant Skills

Installed agent skills for this project's stack:

- **react-native-best-practices** — FPS, TTI, bundle size, memory, animations
- **vercel-react-native-skills** — React Native + Expo performance patterns
- **apple-hig-designer** — iOS HIG compliance for native feel
- **app-icon** — Generate app icons with iOS 26 support
- **expo-app-design:building-ui** — Navigation, styling, components, native tabs
- **expo-app-design:data-fetching** — Network requests, caching, offline support
- **expo-deployment:deployment** — App Store, Play Store, EAS builds
- **typescript-advanced-types** — Advanced generics, conditional types, type safety
- **ui-animation** — Motion, easing, springs, reduced-motion
- **accessibility-compliance** — WCAG 2.2, VoiceOver, screen readers
- **fixing-accessibility** — Diagnose and fix a11y issues
- **supabase-postgres-best-practices** — Query optimization, schema design, RLS policies
- **paywall-upgrade-cro** — In-app paywalls, upgrade screens, upsells
- **using-git-worktrees** — Isolated feature branches for parallel work
