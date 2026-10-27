export interface FeatureFlags {
  premiumGames: boolean;
  advancedStats: boolean;
  dailyChallenge: boolean;
}

export const features: FeatureFlags = {
  premiumGames: false,
  advancedStats: false,
  dailyChallenge: false,
};
