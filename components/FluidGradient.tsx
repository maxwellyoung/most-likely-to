import React, { useEffect, Component, type ReactNode } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Skia can fail in Expo Go — lazy import with fallback
let Canvas: any, SkiaLinearGradient: any, Rect: any, vec: any, Blur: any, Circle: any, Group: any;
let skiaAvailable = false;
try {
  const skia = require("@shopify/react-native-skia");
  Canvas = skia.Canvas;
  SkiaLinearGradient = skia.LinearGradient;
  Rect = skia.Rect;
  vec = skia.vec;
  Blur = skia.Blur;
  Circle = skia.Circle;
  Group = skia.Group;
  skiaAvailable = true;
} catch {
  skiaAvailable = false;
}

// Error boundary to catch Skia runtime errors (arraybuffer init failures)
class SkiaErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FluidGradientProps {
  colors?: string[];
  speed?: number;
  blur?: number;
  style?: any;
  width?: number;
  height?: number;
}

/**
 * FluidGradient - Animated fluid gradient background using Skia
 * Creates beautiful mesh-like gradient with soft, flowing blobs
 */
export function FluidGradient({
  colors = ["#8B5CF6", "#EC4899", "#3B82F6"],
  speed = 1,
  style,
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
}: FluidGradientProps) {
  // Animation values for blob positions
  const blob1X = useSharedValue(width * 0.2);
  const blob1Y = useSharedValue(height * 0.3);
  const blob2X = useSharedValue(width * 0.7);
  const blob2Y = useSharedValue(height * 0.6);
  const blob3X = useSharedValue(width * 0.4);
  const blob3Y = useSharedValue(height * 0.8);

  const baseDuration = 8000 / speed;

  useEffect(() => {
    // Blob 1: Slow drift upper-left area
    blob1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.15, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.35, { duration: baseDuration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.2, { duration: baseDuration * 0.8, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.25, { duration: baseDuration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.4, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.3, { duration: baseDuration * 0.9, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );

    // Blob 2: Medium drift center-right
    blob2X.value = withRepeat(
      withSequence(
        withTiming(width * 0.75, { duration: baseDuration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.55, { duration: baseDuration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.7, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.5, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.7, { duration: baseDuration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.6, { duration: baseDuration * 0.8, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );

    // Blob 3: Slower drift bottom area
    blob3X.value = withRepeat(
      withSequence(
        withTiming(width * 0.3, { duration: baseDuration * 1.3, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.5, { duration: baseDuration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.4, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
    blob3Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.75, { duration: baseDuration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.85, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.8, { duration: baseDuration * 0.9, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, [baseDuration, height, width]);

  // Calculate blob sizes based on dimensions
  const blobSize1 = Math.min(width, height) * 0.6;
  const blobSize2 = Math.min(width, height) * 0.5;
  const blobSize3 = Math.min(width, height) * 0.45;

  // Add alpha to colors for transparency
  const gradientColors = [
    colors[0] + "80", // 50% opacity
    colors[1] + "70", // ~44% opacity
    colors[2] + "60", // ~38% opacity
  ];

  const fallback = (
    <View style={[styles.container, style, { width, height }]} pointerEvents="none">
      <ExpoLinearGradient
        colors={[colors[0] + "40", colors[1] + "30", "#050505"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );

  if (!skiaAvailable) return fallback;

  return (
    <SkiaErrorBoundary fallback={fallback}>
      <View style={[styles.container, style, { width, height }]} pointerEvents="none">
        <Canvas style={styles.canvas}>
          {/* Dark base gradient */}
          <Rect x={0} y={0} width={width} height={height}>
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={["#050505", "#0a0a0a"]}
            />
          </Rect>

          {/* Blurred gradient blobs */}
          <Group>
            <Blur blur={80} />

            {/* Blob 1 - Primary color (purple) */}
            <Circle
              cx={width * 0.25}
              cy={height * 0.3}
              r={blobSize1}
              color={gradientColors[0]}
            />

            {/* Blob 2 - Secondary color (pink) */}
            <Circle
              cx={width * 0.7}
              cy={height * 0.6}
              r={blobSize2}
              color={gradientColors[1]}
            />

            {/* Blob 3 - Tertiary color (blue) */}
            <Circle
              cx={width * 0.4}
              cy={height * 0.8}
              r={blobSize3}
              color={gradientColors[2]}
            />
          </Group>
        </Canvas>
      </View>
    </SkiaErrorBoundary>
  );
}

/**
 * AnimatedFluidGradient - Version with additional overall movement
 */
export function AnimatedFluidGradient({
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
  speed = 1,
  colors,
  style,
}: FluidGradientProps) {
  // Animation for subtle overall movement
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const duration = 12000 / speed;

    translateX.value = withRepeat(
      withSequence(
        withTiming(10, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(8, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, [speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.animatedContainer, animatedStyle, style]} pointerEvents="none">
      <FluidGradient width={width + 40} height={height + 40} speed={speed} colors={colors} />
    </Animated.View>
  );
}

// Alias for compatibility
export function FluidGradientSimple(props: FluidGradientProps) {
  return <FluidGradient {...props} />;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
    backgroundColor: "#050505",
  },
  canvas: {
    flex: 1,
  },
  animatedContainer: {
    position: "absolute",
    top: -20,
    left: -20,
  },
});
