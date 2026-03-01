import { useCallback } from "react";
import { useRouter } from "expo-router";
import RevenueCatUI from "react-native-purchases-ui";
import { useRevenueCat } from "../contexts/RevenueCatContext";

/**
 * Hook to present the Customer Center for subscription management
 *
 * Usage:
 * const { presentCustomerCenter, navigateToCustomerCenter } = useCustomerCenter();
 *
 * // Present native customer center (recommended for Pro users)
 * await presentCustomerCenter();
 *
 * // Navigate to customer center screen
 * navigateToCustomerCenter();
 */
export function useCustomerCenter() {
  const router = useRouter();
  const { isProUser, checkProStatus } = useRevenueCat();

  /**
   * Present the native RevenueCat Customer Center
   * Shows subscription management options (cancel, change plan, etc.)
   */
  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    try {
      await RevenueCatUI.presentCustomerCenter();
      // Refresh status after customer center closes
      await checkProStatus();
    } catch (error) {
      console.error("[CustomerCenter] Error presenting:", error);
    }
  }, [checkProStatus]);

  /**
   * Navigate to the custom customer center screen
   */
  const navigateToCustomerCenter = useCallback(() => {
    router.push("/customer-center" as any);
  }, [router]);

  /**
   * Present customer center only if user is Pro
   * For free users, this will show an error or do nothing
   */
  const presentCustomerCenterIfSubscribed = useCallback(async (): Promise<boolean> => {
    if (!isProUser) {
      console.log("[CustomerCenter] User is not Pro, skipping");
      return false;
    }

    await presentCustomerCenter();
    return true;
  }, [isProUser, presentCustomerCenter]);

  return {
    presentCustomerCenter,
    presentCustomerCenterIfSubscribed,
    navigateToCustomerCenter,
  };
}

/**
 * Present Customer Center outside of React components
 */
export async function presentCustomerCenterAsync(): Promise<void> {
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    console.error("[CustomerCenter] Error presenting:", error);
  }
}
