/**
 * Trophy definitions, predicates, and evaluation logic.
 * 46 trophies: 45 earnable + Platinum (earn all 45).
 */

export type TrophyTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'elite' | 'platinum';

export interface TrophyEvalState {
  lifetimeStats: {
    totalCoins: number;
    totalScore: number;
    gamesPlayed: number;
    totalNearMisses: number;
  };
  highScore: number;
  totalCoins: number;
  unlockedSkins: string[];
  scoreMultiplier: number;
  challengeGroupIndex: number;
  coinsThisRun: number;
  nearMissesThisRun: number;
  earnedTrophies: string[];
}

export interface TrophyDef {
  id: string;
  nameKey: string;
  descriptionKey: string;
  tier: TrophyTier;
  icon: string;
  order: number;
  predicate: (state: TrophyEvalState) => boolean;
}

const EARNABLE_IDS = [
  'first_step',
  'first_coin',
  'first_near_miss',
  'high_score_100',
  'first_skin',
  'coins_250',
  'games_10',
  'near_miss_100',
  'high_score_1000',
  'coins_run_15',
  'near_miss_run_5',
  'coins_1000',
  'multiplier_3',
  'near_miss_run_20',
  'high_score_5000',
  'near_miss_250',
  'coins_2500',
  'high_score_15000',
  'skins_5',
  'challenge_group_9',
  'games_50',
  'coins_run_25',
  'coins_10000',
  'near_miss_500',
  'high_score_25000',
  'games_100',
  'coins_run_40',
  'near_miss_run_50',
  'coins_25000',
  'high_score_50000',
  'coins_run_100',
  'multiplier_10',
  'near_miss_1000',
  'games_250',
  'high_score_150000',
  'coins_run_250',
  'near_miss_2500',
  'games_500',
  'coins_50000',
  'coins_run_500',
  'high_score_200000',
  'near_miss_5000',
  'coins_run_1000',
  'games_1000',
  'skins_all',
] as const;

export const TROPHY_IDS = [...EARNABLE_IDS, 'platinum'] as const;
export type TrophyId = (typeof TROPHY_IDS)[number];

export const TROPHIES: TrophyDef[] = [
  // --- Starter (1-5) ---
  {
    id: 'first_step',
    nameKey: 'trophies.first_step',
    descriptionKey: 'trophies.first_step_desc',
    tier: 'starter',
    icon: 'directions_walk',
    order: 1,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 1,
  },
  {
    id: 'first_coin',
    nameKey: 'trophies.first_coin',
    descriptionKey: 'trophies.first_coin_desc',
    tier: 'starter',
    icon: 'paid',
    order: 2,
    predicate: (s) => s.lifetimeStats.totalCoins >= 1,
  },
  {
    id: 'first_near_miss',
    nameKey: 'trophies.first_near_miss',
    descriptionKey: 'trophies.first_near_miss_desc',
    tier: 'starter',
    icon: 'bolt',
    order: 3,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 1,
  },
  {
    id: 'high_score_100',
    nameKey: 'trophies.high_score_100',
    descriptionKey: 'trophies.high_score_100_desc',
    tier: 'starter',
    icon: 'star_outline',
    order: 4,
    predicate: (s) => s.highScore >= 100,
  },
  {
    id: 'first_skin',
    nameKey: 'trophies.first_skin',
    descriptionKey: 'trophies.first_skin_desc',
    tier: 'starter',
    icon: 'palette',
    order: 5,
    predicate: (s) => s.unlockedSkins.length >= 2,
  },

  // --- Bronze (6-10) ---
  {
    id: 'coins_250',
    nameKey: 'trophies.coins_250',
    descriptionKey: 'trophies.coins_250_desc',
    tier: 'bronze',
    icon: 'savings',
    order: 6,
    predicate: (s) => s.totalCoins >= 250,
  },
  {
    id: 'games_10',
    nameKey: 'trophies.games_10',
    descriptionKey: 'trophies.games_10_desc',
    tier: 'bronze',
    icon: 'sports_esports',
    order: 7,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 10,
  },
  {
    id: 'near_miss_100',
    nameKey: 'trophies.near_miss_100',
    descriptionKey: 'trophies.near_miss_100_desc',
    tier: 'bronze',
    icon: 'gps_fixed',
    order: 8,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 100,
  },
  {
    id: 'high_score_1000',
    nameKey: 'trophies.high_score_1000',
    descriptionKey: 'trophies.high_score_1000_desc',
    tier: 'bronze',
    icon: 'emoji_events',
    order: 9,
    predicate: (s) => s.highScore >= 1000,
  },
  {
    id: 'coins_run_15',
    nameKey: 'trophies.coins_run_15',
    descriptionKey: 'trophies.coins_run_15_desc',
    tier: 'bronze',
    icon: 'shield',
    order: 10,
    predicate: (s) => s.coinsThisRun >= 15,
  },

  // --- Silver (11-17) ---
  {
    id: 'near_miss_run_5',
    nameKey: 'trophies.near_miss_run_5',
    descriptionKey: 'trophies.near_miss_run_5_desc',
    tier: 'silver',
    icon: 'flash_on',
    order: 11,
    predicate: (s) => s.nearMissesThisRun >= 5,
  },
  {
    id: 'coins_1000',
    nameKey: 'trophies.coins_1000',
    descriptionKey: 'trophies.coins_1000_desc',
    tier: 'silver',
    icon: 'account_balance',
    order: 12,
    predicate: (s) => s.totalCoins >= 1000,
  },
  {
    id: 'multiplier_3',
    nameKey: 'trophies.multiplier_3',
    descriptionKey: 'trophies.multiplier_3_desc',
    tier: 'silver',
    icon: 'speed',
    order: 13,
    predicate: (s) => s.scoreMultiplier >= 3,
  },
  {
    id: 'near_miss_run_20',
    nameKey: 'trophies.near_miss_run_20',
    descriptionKey: 'trophies.near_miss_run_20_desc',
    tier: 'gold',
    icon: 'electric_bolt',
    order: 14,
    predicate: (s) => s.nearMissesThisRun >= 20,
  },
  {
    id: 'high_score_5000',
    nameKey: 'trophies.high_score_5000',
    descriptionKey: 'trophies.high_score_5000_desc',
    tier: 'silver',
    icon: 'military_tech',
    order: 15,
    predicate: (s) => s.highScore >= 5000,
  },
  {
    id: 'near_miss_250',
    nameKey: 'trophies.near_miss_250',
    descriptionKey: 'trophies.near_miss_250_desc',
    tier: 'silver',
    icon: 'track_changes',
    order: 16,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 250,
  },
  {
    id: 'coins_2500',
    nameKey: 'trophies.coins_2500',
    descriptionKey: 'trophies.coins_2500_desc',
    tier: 'silver',
    icon: 'toll',
    order: 17,
    predicate: (s) => s.totalCoins >= 2500,
  },

  // --- Gold (18-25) ---
  {
    id: 'high_score_15000',
    nameKey: 'trophies.high_score_15000',
    descriptionKey: 'trophies.high_score_15000_desc',
    tier: 'gold',
    icon: 'workspace_premium',
    order: 18,
    predicate: (s) => s.highScore >= 15000,
  },
  {
    id: 'skins_5',
    nameKey: 'trophies.skins_5',
    descriptionKey: 'trophies.skins_5_desc',
    tier: 'gold',
    icon: 'auto_awesome',
    order: 19,
    predicate: (s) => s.unlockedSkins.length >= 5,
  },
  {
    id: 'challenge_group_9',
    nameKey: 'trophies.challenge_group_9',
    descriptionKey: 'trophies.challenge_group_9_desc',
    tier: 'gold',
    icon: 'verified',
    order: 20,
    predicate: (s) => s.challengeGroupIndex >= 9,
  },
  {
    id: 'games_50',
    nameKey: 'trophies.games_50',
    descriptionKey: 'trophies.games_50_desc',
    tier: 'gold',
    icon: 'videogame_asset',
    order: 21,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 50,
  },
  {
    id: 'coins_run_25',
    nameKey: 'trophies.coins_run_25',
    descriptionKey: 'trophies.coins_run_25_desc',
    tier: 'gold',
    icon: 'monetization_on',
    order: 22,
    predicate: (s) => s.coinsThisRun >= 25,
  },
  {
    id: 'coins_10000',
    nameKey: 'trophies.coins_10000',
    descriptionKey: 'trophies.coins_10000_desc',
    tier: 'gold',
    icon: 'inventory_2',
    order: 23,
    predicate: (s) => s.totalCoins >= 10000,
  },
  {
    id: 'near_miss_500',
    nameKey: 'trophies.near_miss_500',
    descriptionKey: 'trophies.near_miss_500_desc',
    tier: 'gold',
    icon: 'crisis_alert',
    order: 24,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 500,
  },
  {
    id: 'high_score_25000',
    nameKey: 'trophies.high_score_25000',
    descriptionKey: 'trophies.high_score_25000_desc',
    tier: 'gold',
    icon: 'king_bed',
    order: 25,
    predicate: (s) => s.highScore >= 25000,
  },

  // --- Elite (26-45) ---
  {
    id: 'games_100',
    nameKey: 'trophies.games_100',
    descriptionKey: 'trophies.games_100_desc',
    tier: 'elite',
    icon: 'looks_one',
    order: 26,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 100,
  },
  {
    id: 'coins_run_40',
    nameKey: 'trophies.coins_run_40',
    descriptionKey: 'trophies.coins_run_40_desc',
    tier: 'elite',
    icon: 'local_atm',
    order: 27,
    predicate: (s) => s.coinsThisRun >= 40,
  },
  {
    id: 'near_miss_run_50',
    nameKey: 'trophies.near_miss_run_50',
    descriptionKey: 'trophies.near_miss_run_50_desc',
    tier: 'elite',
    icon: 'whatshot',
    order: 28,
    predicate: (s) => s.nearMissesThisRun >= 50,
  },
  {
    id: 'coins_25000',
    nameKey: 'trophies.coins_25000',
    descriptionKey: 'trophies.coins_25000_desc',
    tier: 'elite',
    icon: 'diamond',
    order: 29,
    predicate: (s) => s.totalCoins >= 25000,
  },
  {
    id: 'high_score_50000',
    nameKey: 'trophies.high_score_50000',
    descriptionKey: 'trophies.high_score_50000_desc',
    tier: 'elite',
    icon: 'emoji_events',
    order: 30,
    predicate: (s) => s.highScore >= 50000,
  },
  {
    id: 'coins_run_100',
    nameKey: 'trophies.coins_run_100',
    descriptionKey: 'trophies.coins_run_100_desc',
    tier: 'elite',
    icon: 'attach_money',
    order: 31,
    predicate: (s) => s.coinsThisRun >= 100,
  },
  {
    id: 'multiplier_10',
    nameKey: 'trophies.multiplier_10',
    descriptionKey: 'trophies.multiplier_10_desc',
    tier: 'elite',
    icon: 'all_inclusive',
    order: 32,
    predicate: (s) => s.scoreMultiplier >= 10,
  },
  {
    id: 'near_miss_1000',
    nameKey: 'trophies.near_miss_1000',
    descriptionKey: 'trophies.near_miss_1000_desc',
    tier: 'elite',
    icon: 'radar',
    order: 33,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 1000,
  },
  {
    id: 'games_250',
    nameKey: 'trophies.games_250',
    descriptionKey: 'trophies.games_250_desc',
    tier: 'elite',
    icon: 'looks_two',
    order: 34,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 250,
  },
  {
    id: 'high_score_150000',
    nameKey: 'trophies.high_score_150000',
    descriptionKey: 'trophies.high_score_150000_desc',
    tier: 'elite',
    icon: 'grade',
    order: 35,
    predicate: (s) => s.highScore >= 150000,
  },
  {
    id: 'coins_run_250',
    nameKey: 'trophies.coins_run_250',
    descriptionKey: 'trophies.coins_run_250_desc',
    tier: 'elite',
    icon: 'currency_exchange',
    order: 36,
    predicate: (s) => s.coinsThisRun >= 250,
  },
  {
    id: 'near_miss_2500',
    nameKey: 'trophies.near_miss_2500',
    descriptionKey: 'trophies.near_miss_2500_desc',
    tier: 'elite',
    icon: 'adjust',
    order: 37,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 2500,
  },
  {
    id: 'games_500',
    nameKey: 'trophies.games_500',
    descriptionKey: 'trophies.games_500_desc',
    tier: 'elite',
    icon: 'looks_5',
    order: 38,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 500,
  },
  {
    id: 'coins_50000',
    nameKey: 'trophies.coins_50000',
    descriptionKey: 'trophies.coins_50000_desc',
    tier: 'elite',
    icon: 'account_balance_wallet',
    order: 39,
    predicate: (s) => s.totalCoins >= 50000,
  },
  {
    id: 'coins_run_500',
    nameKey: 'trophies.coins_run_500',
    descriptionKey: 'trophies.coins_run_500_desc',
    tier: 'elite',
    icon: 'money',
    order: 40,
    predicate: (s) => s.coinsThisRun >= 500,
  },
  {
    id: 'high_score_200000',
    nameKey: 'trophies.high_score_200000',
    descriptionKey: 'trophies.high_score_200000_desc',
    tier: 'elite',
    icon: 'stars',
    order: 41,
    predicate: (s) => s.highScore >= 200000,
  },
  {
    id: 'near_miss_5000',
    nameKey: 'trophies.near_miss_5000',
    descriptionKey: 'trophies.near_miss_5000_desc',
    tier: 'elite',
    icon: 'psychology',
    order: 42,
    predicate: (s) => s.lifetimeStats.totalNearMisses >= 5000,
  },
  {
    id: 'coins_run_1000',
    nameKey: 'trophies.coins_run_1000',
    descriptionKey: 'trophies.coins_run_1000_desc',
    tier: 'elite',
    icon: 'landscape',
    order: 43,
    predicate: (s) => s.coinsThisRun >= 1000,
  },
  {
    id: 'games_1000',
    nameKey: 'trophies.games_1000',
    descriptionKey: 'trophies.games_1000_desc',
    tier: 'elite',
    icon: 'military_tech',
    order: 44,
    predicate: (s) => s.lifetimeStats.gamesPlayed >= 1000,
  },
  {
    id: 'skins_all',
    nameKey: 'trophies.skins_all',
    descriptionKey: 'trophies.skins_all_desc',
    tier: 'elite',
    icon: 'auto_fix_high',
    order: 45,
    predicate: (s) => s.unlockedSkins.length >= 21,
  },

  // --- Platinum ---
  {
    id: 'platinum',
    nameKey: 'trophies.platinum',
    descriptionKey: 'trophies.platinum_desc',
    tier: 'platinum',
    icon: 'emoji_events',
    order: 46,
    predicate: (s) =>
      EARNABLE_IDS.every((id) => s.earnedTrophies.includes(id)),
  },
];

export const TROPHY_MAP: Record<string, TrophyDef> = Object.fromEntries(
  TROPHIES.map((t) => [t.id, t]),
);

export { TIER_COLORS } from '../design-system/tokens/colors';

/**
 * Evaluate all trophies against current state.
 * Returns IDs of newly unlocked trophies (not previously in earnedTrophies).
 */
export function evaluateTrophies(state: TrophyEvalState): string[] {
  const newlyUnlocked: string[] = [];
  for (const trophy of TROPHIES) {
    if (state.earnedTrophies.includes(trophy.id)) continue;
    if (trophy.predicate(state)) {
      newlyUnlocked.push(trophy.id);
    }
  }
  return newlyUnlocked;
}
