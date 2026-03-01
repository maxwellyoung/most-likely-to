import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CustomerInfo } from "react-native-purchases";
import {
  initializePurchases,
  getCustomerInfo,
  hasGambitPro,
  restorePurchases,
  addCustomerInfoUpdateListener,
  ENTITLEMENT_ID,
} from "../lib/purchases";

interface RevenueCatContextType {
  isReady: boolean;
  isProUser: boolean;
  customerInfo: CustomerInfo | null;
  checkProStatus: () => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(
  undefined
);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Initialize RevenueCat on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        await initializePurchases();

        // Get initial customer info
        const info = await getCustomerInfo();
        if (info) {
          setCustomerInfo(info);
          const isPro = info.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
          setIsProUser(isPro);
        }

        // Listen for customer info updates (purchases, restores, etc.)
        unsubscribe = addCustomerInfoUpdateListener((updatedInfo) => {
          setCustomerInfo(updatedInfo);
          const isPro =
            updatedInfo.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
          setIsProUser(isPro);
          console.log("[RevenueCat] Customer info updated, isPro:", isPro);
        });

        setIsReady(true);
      } catch (error) {
        console.error("[RevenueCat] Initialization failed:", error);
        setIsReady(true); // Still mark as ready to not block the app
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const checkProStatus = useCallback(async (): Promise<boolean> => {
    const isPro = await hasGambitPro();
    setIsProUser(isPro);
    return isPro;
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await restorePurchases();
      if (info) {
        setCustomerInfo(info);
        const isPro = info.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
        setIsProUser(isPro);
        return isPro;
      }
      return false;
    } catch (error) {
      console.error("[RevenueCat] Restore failed:", error);
      return false;
    }
  }, []);

  return (
    <RevenueCatContext.Provider
      value={{
        isReady,
        isProUser,
        customerInfo,
        checkProStatus,
        restore,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error("useRevenueCat must be used within a RevenueCatProvider");
  }
  return context;
}

/**
 * Hook to check if user has Gambit Pro
 * Returns { isPro, isLoading }
 */
export function useIsProUser(): { isPro: boolean; isLoading: boolean } {
  const { isProUser, isReady } = useRevenueCat();
  return { isPro: isProUser, isLoading: !isReady };
}
