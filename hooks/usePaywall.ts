import { useCallback } from "react";
import { useRouter } from "expo-router";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useRevenueCat } from "../contexts/RevenueCatContext";

/**
 * Hook to present paywalls in your app
 *
 * Usage:
 * const { presentPaywall, presentPaywallIfNeeded, navigateToPaywall } = usePaywall();
 *
 * // Present native paywall (recommended)
 * const purchased = await presentPaywall();
 *
 * // Only show paywall if user isn't Pro
 * const result = await presentPaywallIfNeeded();
 *
 * // Navigate to paywall screen (for custom UI)
 * navigateToPaywall();
 */
export function usePaywall() {
  const router = useRouter();
  const { isProUser, checkProStatus } = useRevenueCat();

  /**
   * Present the native RevenueCat paywall
   * Returns true if purchase/restore was successful
   */
  const presentPaywall = useCallback(async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywall();

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        await checkProStatus();
        return true;
      }

      return false;
    } catch (error) {
      console.error("[Paywall] Error presenting paywall:", error);
      return false;
    }
  }, [checkProStatus]);

  /**
   * Present paywall with a specific offering
   * Note: You need to pass a PurchasesOffering object, not just an identifier
   */
  const presentPaywallWithOffering = useCallback(
    async (offering: any): Promise<boolean> => {
      try {
        const result = await RevenueCatUI.presentPaywall({
          offering,
        });

        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          await checkProStatus();
          return true;
        }

        return false;
      } catch (error) {
        console.error("[Paywall] Error presenting paywall:", error);
        return false;
      }
    },
    [checkProStatus]
  );

  /**
   * Present paywall only if user doesn't have Pro
   * Returns:
   * - true: User is now Pro (either already was, or just purchased)
   * - false: User cancelled or error
   */
  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    if (isProUser) {
      return true; // Already Pro
    }

    return await presentPaywall();
  }, [isProUser, presentPaywall]);

  /**
   * Navigate to the custom paywall screen
   * Use this if you want the custom paywall UI instead of native
   */
  const navigateToPaywall = useCallback(() => {
    router.push("/paywall" as any);
  }, [router]);

  return {
    presentPaywall,
    presentPaywallWithOffering,
    presentPaywallIfNeeded,
    navigateToPaywall,
  };
}

/**
 * Present paywall outside of React components
 * Call this from event handlers or utility functions
 */
export async function presentPaywallAsync(): Promise<boolean> {
  try {
    const result = await RevenueCatUI.presentPaywall();
    return (
      result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED
    );
  } catch (error) {
    console.error("[Paywall] Error presenting paywall:", error);
    return false;
  }
}
