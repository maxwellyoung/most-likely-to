import { hasEntitlement, hasGambitPro, getActiveEntitlements, ENTITLEMENT_ID } from "./purchases";
import partyPack from "../assets/prompts/premium-party.json";
import spicyPack from "../assets/prompts/premium-spicy.json";
import chaosPack from "../assets/prompts/premium-chaos.json";

export interface Prompt {
  text: string;
  category: string;
  chaos: number;
  type: string;
  timer?: number;
  isPremium?: boolean;
  packId?: string;
}

interface PremiumPack {
  packId: string;
  name: string;
  description: string;
  prompts: Prompt[];
}

// All premium packs are now unlocked with Gambit Pro
const PREMIUM_PACKS: Record<string, PremiumPack> = {
  party_pack: partyPack as PremiumPack,
  spicy_pack: spicyPack as PremiumPack,
  chaos_pack: chaosPack as PremiumPack,
};

/**
 * Get all unlocked premium prompts based on user's entitlements
 * With Gambit Pro, all packs are unlocked
 */
export async function getUnlockedPremiumPrompts(): Promise<Prompt[]> {
  const isPro = await hasGambitPro();

  if (!isPro) {
    return []; // No premium prompts for free users
  }

  // Pro users get all premium content
  const prompts: Prompt[] = [];

  for (const pack of Object.values(PREMIUM_PACKS)) {
    const packPrompts = pack.prompts.map((p) => ({
      ...p,
      isPremium: true,
      packId: pack.packId,
    }));
    prompts.push(...packPrompts);
  }

  // Remove duplicates
  const uniquePrompts = prompts.filter(
    (prompt, index, self) =>
      index === self.findIndex((p) => p.text === prompt.text)
  );

  return uniquePrompts;
}

/**
 * Check if a specific pack is unlocked
 * With Gambit Pro, all packs are unlocked together
 */
export async function isPackUnlocked(packId: string): Promise<boolean> {
  return hasGambitPro();
}

/**
 * Get info about all available packs
 */
export function getAvailablePacks(): { id: string; name: string; description: string; promptCount: number }[] {
  return Object.entries(PREMIUM_PACKS).map(([id, pack]) => ({
    id,
    name: pack.name,
    description: pack.description,
    promptCount: pack.prompts.length,
  }));
}

/**
 * Get total premium prompt count
 */
export function getTotalPremiumPromptCount(): number {
  return Object.values(PREMIUM_PACKS).reduce(
    (total, pack) => total + pack.prompts.length,
    0
  );
}
