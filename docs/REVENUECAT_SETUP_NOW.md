# 🚀 Gambit RevenueCat Setup — DO THIS NOW

> Time required: 30-45 minutes
> Result: Your live app starts making money

---

## Current State

Your code is **READY**. Looking at `src/lib/purchases.ts`:

```typescript
// Already configured:
export const ENTITLEMENT_ID = "Gambit Pro";
export const PRODUCTS = {
  MONTHLY: "gambit_pro_monthly",
  YEARLY: "gambit_pro_yearly", 
  LIFETIME: "gambit_pro_lifetime",
};
```

The code uses **test keys** right now:
```typescript
const API_KEYS = {
  ios: "test_CFQqHCyjZaZKeYAJDyjwvGfclwl",
  android: "test_CFQqHCyjZaZKeYAJDyjwvGfclwl",
};
```

You need to:
1. Create products in App Store Connect
2. Set up RevenueCat dashboard
3. Replace test keys with production keys
4. Submit an update

---

## Step 1: App Store Connect Products (15 min)

### Go to App Store Connect → Gambit → In-App Purchases

Create these 3 products:

| Product ID | Type | Price | Display Name |
|------------|------|-------|--------------|
| `gambit_pro_monthly` | Auto-Renewable Subscription | $2.99/mo | Gambit Pro Monthly |
| `gambit_pro_yearly` | Auto-Renewable Subscription | $19.99/yr | Gambit Pro Yearly |
| `gambit_pro_lifetime` | Non-Consumable | $29.99 | Gambit Pro Lifetime |

### For the subscription products:

1. Create a **Subscription Group** called "Gambit Pro"
2. Add both monthly and yearly to this group
3. Set the **Subscription Duration** correctly
4. Add **Localization** (at minimum: English US)
   - Display Name: "Gambit Pro Monthly" / "Gambit Pro Yearly"
   - Description: "Unlock all 480+ prompts and premium content"
5. Add a **Review Screenshot** (any screenshot of premium content)
6. Set status to **Ready to Submit**

### For the lifetime product:

1. Type: Non-Consumable
2. Reference Name: Gambit Pro Lifetime
3. Product ID: `gambit_pro_lifetime`
4. Add localization
5. Add review screenshot
6. Set to Ready to Submit

---

## Step 2: RevenueCat Dashboard (10 min)

### 2.1 Create Project

1. Go to [app.revenuecat.com](https://app.revenuecat.com)
2. Create new project: **Gambit**
3. Add iOS app:
   - Bundle ID: `com.maxwellyoung.socialchaos`
   - App Store Connect App-Specific Shared Secret (get from ASC → App → App Information → Shared Secret)

### 2.2 Create Entitlement

1. Go to **Entitlements** → Create New
2. Identifier: `Gambit Pro` (must match code exactly!)
3. This is what your code checks: `customerInfo.entitlements.active["Gambit Pro"]`

### 2.3 Create Products

1. Go to **Products** → Add New for each:

| Identifier | App Store Product ID |
|------------|---------------------|
| `gambit_pro_monthly` | `gambit_pro_monthly` |
| `gambit_pro_yearly` | `gambit_pro_yearly` |
| `gambit_pro_lifetime` | `gambit_pro_lifetime` |

2. Attach ALL products to the "Gambit Pro" entitlement

### 2.4 Create Offering

1. Go to **Offerings** → Create New
2. Identifier: `default` (RevenueCat uses this automatically)
3. Add packages:
   - `$rc_monthly` → gambit_pro_monthly
   - `$rc_annual` → gambit_pro_yearly
   - `$rc_lifetime` → gambit_pro_lifetime

### 2.5 Get API Keys

1. Go to **API Keys**
2. Copy the **Public iOS API Key** (starts with `appl_`)
3. This replaces your test key

---

## Step 3: Update Your Code (5 min)

### Option A: EAS Secrets (Recommended)

```bash
# Set the production key as an EAS secret
eas secret:create --scope project --name REVENUECAT_IOS_KEY --value "appl_YOUR_KEY_HERE"
```

Then update `src/lib/purchases.ts`:

```typescript
const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "appl_YOUR_KEY_HERE",
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "",
};
```

### Option B: Hardcode (Quick but less secure)

Just replace the test key directly:

```typescript
const API_KEYS = {
  ios: "appl_YOUR_ACTUAL_KEY_HERE",
  android: "", // Add later for Android
};
```

---

## Step 4: Build & Submit (15 min)

```bash
cd ~/Development/gambit

# Commit the key change
git add src/lib/purchases.ts
git commit -m "chore: switch to production RevenueCat keys"

# Build for production
eas build --platform ios --profile production

# While building, make sure your app version is incremented
# Check app.json → version and ios.buildNumber

# Once built, submit
eas submit --platform ios
```

---

## Step 5: Test Before Going Live

1. Use a **Sandbox Tester** in App Store Connect
2. Add sandbox tester email to your device's App Store settings
3. Test the purchase flow in TestFlight
4. Verify the entitlement appears in RevenueCat dashboard

---

## Pricing Recommendation

Based on the app (480+ prompts, party game):

| Product | Price | Why |
|---------|-------|-----|
| Monthly | $2.99 | Low barrier, tests price sensitivity |
| Yearly | $19.99 | ~45% discount, good for retention |
| Lifetime | $29.99 | Capture whales, ~10x monthly |

The lifetime at $29.99 is your real winner for a game like this.

---

## Checklist

- [ ] Created 3 products in App Store Connect
- [ ] Created subscription group "Gambit Pro"
- [ ] All products have localizations
- [ ] All products have review screenshots
- [ ] Created RevenueCat project
- [ ] Created "Gambit Pro" entitlement
- [ ] Added all 3 products to RevenueCat
- [ ] Attached products to entitlement
- [ ] Created "default" offering with packages
- [ ] Got production API key
- [ ] Updated code with production key
- [ ] Committed and pushed
- [ ] Triggered EAS build
- [ ] Tested with sandbox tester
- [ ] Submitted to App Store

---

## Quick Reference

| Item | Value |
|------|-------|
| Bundle ID | `com.maxwellyoung.socialchaos` |
| Entitlement ID | `Gambit Pro` |
| Monthly Product | `gambit_pro_monthly` |
| Yearly Product | `gambit_pro_yearly` |
| Lifetime Product | `gambit_pro_lifetime` |
| EAS Project ID | `12cac593-c00c-46f3-80f4-28dbab5d1dca` |

---

**DO THIS NOW. Your app is live with users. Every day without monetization is money lost.**
