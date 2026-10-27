"use client";

import type { FeatureFlags } from "./config";

export function useEntitlement(): FeatureFlags {
  // Always returns everything unlocked until accounts/payments are added.
  return {
    premiumGames: true,
    advancedStats: true,
    dailyChallenge: true,
  };
}
