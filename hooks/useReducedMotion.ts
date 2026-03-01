import { useState, useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Hook to check if the user has enabled reduced motion in their device settings.
 * Returns true if reduced motion is enabled, false otherwise.
 *
 * Use this to conditionally disable or simplify animations for accessibility.
 */
export function useReducedMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    // Check initial value
    const checkReduceMotion = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotionEnabled(isEnabled);
      } catch (error) {
        // Default to false if there's an error
        setReduceMotionEnabled(false);
      }
    };

    checkReduceMotion();

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isEnabled: boolean) => {
        setReduceMotionEnabled(isEnabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotionEnabled;
}

/**
 * Web-compatible hook that also checks the prefers-reduced-motion media query.
 */
export function useReducedMotionWeb(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // Check CSS media query on web
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduceMotionEnabled(mediaQuery.matches);

      const handler = (event: MediaQueryListEvent) => {
        setReduceMotionEnabled(event.matches);
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      // Use native API on mobile
      const checkReduceMotion = async () => {
        try {
          const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
          setReduceMotionEnabled(isEnabled);
        } catch (error) {
          setReduceMotionEnabled(false);
        }
      };

      checkReduceMotion();

      const subscription = AccessibilityInfo.addEventListener(
        "reduceMotionChanged",
        (isEnabled: boolean) => {
          setReduceMotionEnabled(isEnabled);
        }
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return reduceMotionEnabled;
}
