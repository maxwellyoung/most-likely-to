/**
 * purchases.web.ts — RevenueCat Web SDK module
 * Uses @revenuecat/purchases-js (separate from the mobile react-native-purchases SDK)
 *
 * Web API key: EXPO_PUBLIC_REVENUECAT_WEB_KEY
 * Get it from: RevenueCat dashboard → App Settings → API Keys → Public app-specific key
 */

import { Purchases, type Package } from '@revenuecat/purchases-js';

const WEB_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY ?? '';

let _purchases: Purchases | null = null;

function getAnonymousUserId(): string {
  const key = 'gambit_anon_uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, uid);
  }
  return uid;
}

export async function initializeWebPurchases(): Promise<Purchases | null> {
  if (!WEB_API_KEY) {
    console.warn('[RC Web] No web API key set — set EXPO_PUBLIC_REVENUECAT_WEB_KEY');
    return null;
  }
  if (_purchases) return _purchases;
  try {
    const userId = getAnonymousUserId();
    _purchases = await Purchases.configure(WEB_API_KEY, userId);
    return _purchases;
  } catch (e) {
    console.error('[RC Web] Init failed:', e);
    return null;
  }
}

export async function getWebOfferings(): Promise<Package[]> {
  const rc = await initializeWebPurchases();
  if (!rc) return [];
  try {
    const offerings = await rc.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages;
  } catch (e) {
    console.error('[RC Web] getOfferings failed:', e);
    return [];
  }
}

export async function purchaseWebPackage(pkg: Package): Promise<boolean> {
  const rc = await initializeWebPurchases();
  if (!rc) return false;
  try {
    await rc.purchase({ rcPackage: pkg });
    return true;
  } catch (e: any) {
    if (e?.userCancelled) return false;
    console.error('[RC Web] Purchase failed:', e);
    return false;
  }
}

export async function checkWebProStatus(): Promise<boolean> {
  const rc = await initializeWebPurchases();
  if (!rc) return false;
  try {
    const info = await rc.getCustomerInfo();
    return !!info.entitlements.active['Gambit Pro'];
  } catch (e) {
    return false;
  }
}
