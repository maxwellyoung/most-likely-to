import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat API Keys — production keys from env vars, test fallback for dev
const API_KEYS = {
  ios:
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ??
    (__DEV__ ? "test_CFQqHCyjZaZKeYAJDyjwvGfclwl" : ""),
  android:
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ??
    (__DEV__ ? "test_CFQqHCyjZaZKeYAJDyjwvGfclwl" : ""),
};

// Entitlement identifier - must match RevenueCat dashboard
export const ENTITLEMENT_ID = "Gambit Pro";

// Product identifiers - must match App Store Connect / Play Console
export const PRODUCTS = {
  MONTHLY: "gambit_pro_monthly",
  YEARLY: "gambit_pro_yearly",
  LIFETIME: "gambit_pro_lifetime",
} as const;

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this once at app startup in _layout.tsx
 */
export async function initializePurchases(userId?: string): Promise<void> {
  if (isInitialized) {
    console.log("[Purchases] Already initialized");
    return;
  }

  try {
    const apiKey = Platform.OS === "ios" ? API_KEYS.ios : API_KEYS.android;

    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure with optional user ID for cross-platform purchase syncing
    if (userId) {
      await Purchases.configure({ apiKey, appUserID: userId });
    } else {
      await Purchases.configure({ apiKey });
    }

    isInitialized = true;
    console.log("[Purchases] Initialized successfully");
  } catch (error) {
    console.error("[Purchases] Failed to initialize:", error);
    throw error;
  }
}

/**
 * Check if RevenueCat is initialized
 */
export function isPurchasesInitialized(): boolean {
  return isInitialized;
}

/**
 * Get available offerings (products for sale)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (__DEV__) {
      console.log("[Purchases] Offerings:", {
        current: offerings.current?.identifier,
        packages: offerings.current?.availablePackages.map(p => ({
          id: p.identifier,
          product: p.product.identifier,
          price: p.product.priceString,
        })),
      });
    }

    return offerings.current;
  } catch (error) {
    console.error("[Purchases] Failed to get offerings:", error);
    return null;
  }
}

/**
 * Get all offerings (for accessing specific offering by ID)
 */
export async function getAllOfferings(): Promise<Record<string, PurchasesOffering>> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all;
  } catch (error) {
    console.error("[Purchases] Failed to get all offerings:", error);
    return {};
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    if (__DEV__) {
      console.log("[Purchases] Purchase successful:", {
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
      });
    }

    return customerInfo;
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // User cancelled - not an error
    if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log("[Purchases] User cancelled purchase");
      return null;
    }

    // Payment pending (e.g., Ask to Buy)
    if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      console.log("[Purchases] Payment pending approval");
      return null;
    }

    console.error("[Purchases] Purchase failed:", purchaseError.message);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();

    if (__DEV__) {
      console.log("[Purchases] Restore completed:", {
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
      });
    }

    return customerInfo;
  } catch (error) {
    console.error("[Purchases] Restore failed:", error);
    throw error;
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[Purchases] Failed to get customer info:", error);
    return null;
  }
}

/**
 * Check if user has Gambit Pro entitlement
 */
export async function hasGambitPro(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return entitlement?.isActive ?? false;
  } catch (error) {
    console.error("[Purchases] Failed to check entitlement:", error);
    return false;
  }
}

/**
 * Check if user has any active entitlement
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error("[Purchases] Failed to check subscription:", error);
    return false;
  }
}

/**
 * Get all active entitlements
 */
export async function getActiveEntitlements(): Promise<string[]> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active);
  } catch (error) {
    console.error("[Purchases] Failed to get entitlements:", error);
    return [];
  }
}

/**
 * Log in a user (for cross-device sync)
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log("[Purchases] User logged in:", userId);
    return customerInfo;
  } catch (error) {
    console.error("[Purchases] Login failed:", error);
    return null;
  }
}

/**
 * Log out current user (creates anonymous user)
 */
export async function logoutUser(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.logOut();
    console.log("[Purchases] User logged out");
    return customerInfo;
  } catch (error) {
    console.error("[Purchases] Logout failed:", error);
    return null;
  }
}

/**
 * Get the current app user ID
 */
export async function getAppUserID(): Promise<string> {
  return await Purchases.getAppUserID();
}

/**
 * Add a listener for customer info updates
 */
export function addCustomerInfoUpdateListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(callback);
  // Return a no-op since the SDK doesn't provide a remove function
  // The listener persists for the lifetime of the app
  return () => {};
}

/**
 * Check if user has a specific entitlement (legacy support)
 */
export async function hasEntitlement(entitlementId: string): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[entitlementId]?.isActive ?? false;
  } catch (error) {
    console.error("[Purchases] Failed to check entitlement:", error);
    return false;
  }
}

// Legacy exports for backwards compatibility
export const ENTITLEMENTS = {
  GAMBIT_PRO: ENTITLEMENT_ID,
  // Keep old names mapped to new entitlement for migration
  PARTY_PACK: ENTITLEMENT_ID,
  SPICY_PACK: ENTITLEMENT_ID,
  CHAOS_PACK: ENTITLEMENT_ID,
  PREMIUM: ENTITLEMENT_ID,
} as const;
