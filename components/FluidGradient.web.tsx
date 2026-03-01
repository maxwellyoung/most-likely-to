import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

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
 * FluidGradient (Web) - CSS-based animated gradient background
 * Uses CSS blur filters and animated transforms for web compatibility
 */
export function FluidGradient({
  colors = ["#8B5CF6", "#EC4899", "#3B82F6"],
  speed = 1,
  style,
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
}: FluidGradientProps) {
  // Animation values for blob positions
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob1Scale = useSharedValue(1);
  const blob1Rotate = useSharedValue(0);

  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob2Scale = useSharedValue(1);

  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);
  const blob3Scale = useSharedValue(1);

  useEffect(() => {
    const duration = 10000 / speed;

    // Blob 1 animations
    blob1X.value = withRepeat(
      withSequence(
        withTiming(40, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(40, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Rotate.value = withRepeat(
      withTiming(360, { duration: duration * 6, easing: Easing.linear }),
      -1,
      false
    );

    // Blob 2 animations
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(30, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(50, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2Scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Blob 3 animations
    blob3X.value = withRepeat(
      withSequence(
        withTiming(35, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(-45, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob3Y.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(30, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob3Scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [speed]);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value },
      { scale: blob1Scale.value },
      { rotate: `${blob1Rotate.value}deg` },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value },
      { scale: blob2Scale.value },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob3X.value },
      { translateY: blob3Y.value },
      { scale: blob3Scale.value },
    ],
  }));

  const blobSize = Math.max(width, height) * 0.7;

  return (
    <View style={[styles.container, style, { width, height }]} pointerEvents="none">
      {/* Dark base */}
      <View style={styles.darkBase} />

      {/* Blob 1 - Primary color (purple) */}
      <Animated.View
        style={[
          styles.blob,
          blob1Style,
          {
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            top: -blobSize * 0.3,
            left: -blobSize * 0.2,
            backgroundColor: colors[0] + "60",
          },
        ]}
      />

      {/* Blob 2 - Secondary color (pink) */}
      <Animated.View
        style={[
          styles.blob,
          blob2Style,
          {
            width: blobSize * 0.85,
            height: blobSize * 0.85,
            borderRadius: blobSize * 0.425,
            top: height * 0.2,
            right: -blobSize * 0.3,
            backgroundColor: colors[1] + "50",
          },
        ]}
      />

      {/* Blob 3 - Tertiary color (blue) */}
      <Animated.View
        style={[
          styles.blob,
          blob3Style,
          {
            width: blobSize * 0.75,
            height: blobSize * 0.75,
            borderRadius: blobSize * 0.375,
            bottom: -blobSize * 0.2,
            left: width * 0.1,
            backgroundColor: colors[2] + "45",
          },
        ]}
      />

      {/* Overlay for depth */}
      <View style={styles.overlay} />
    </View>
  );
}

/**
 * AnimatedFluidGradient - Version with additional overall movement
 */
export function AnimatedFluidGradient(props: FluidGradientProps) {
  return <FluidGradient {...props} />;
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
  darkBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050505",
  },
  blob: {
    position: "absolute",
    // @ts-ignore - web-specific style
    filter: "blur(80px)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
});
