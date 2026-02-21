import {
  TROPHIES,
  TROPHY_IDS,
  TROPHY_MAP,
  TIER_COLORS,
  evaluateTrophies,
  type TrophyEvalState,
  type TrophyTier,
} from '../src/engine/trophies';

function makeState(overrides: Partial<TrophyEvalState> = {}): TrophyEvalState {
  return {
    lifetimeStats: {
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      totalNearMisses: 0,
    },
    highScore: 0,
    totalCoins: 0,
    unlockedSkins: ['classic'],
    scoreMultiplier: 1,
    challengeGroupIndex: 0,
    coinsThisRun: 0,
    nearMissesThisRun: 0,
    earnedTrophies: [],
    ...overrides,
    lifetimeStats: {
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      totalNearMisses: 0,
      ...overrides.lifetimeStats,
    },
  };
}

describe('engine/trophies', () => {
  describe('data integrity', () => {
    it('has 46 trophies total (45 earnable + platinum)', () => {
      expect(TROPHIES).toHaveLength(46);
      expect(TROPHY_IDS).toHaveLength(46);
    });

    it('every trophy has a unique ID', () => {
      const ids = TROPHIES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every trophy has a unique order', () => {
      const orders = TROPHIES.map((t) => t.order);
      expect(new Set(orders).size).toBe(orders.length);
    });

    it('every TROPHY_IDS entry matches a trophy definition', () => {
      for (const id of TROPHY_IDS) {
        expect(TROPHY_MAP[id]).toBeDefined();
      }
    });

    it('every trophy definition is listed in TROPHY_IDS', () => {
      const idSet = new Set<string>(TROPHY_IDS);
      for (const trophy of TROPHIES) {
        expect(idSet.has(trophy.id)).toBe(true);
      }
    });

    it('platinum is the last trophy by order', () => {
      const platinum = TROPHY_MAP.platinum;
      expect(platinum).toBeDefined();
      expect(platinum.order).toBe(46);
      expect(platinum.tier).toBe('platina');
    });

    it('every trophy has required fields', () => {
      for (const trophy of TROPHIES) {
        expect(trophy.id).toBeTruthy();
        expect(trophy.nameKey).toContain('trophies.');
        expect(trophy.descriptionKey).toContain('_desc');
        expect(trophy.icon).toBeTruthy();
        expect(typeof trophy.predicate).toBe('function');
        expect(trophy.order).toBeGreaterThan(0);
      }
    });

    it('has valid tier colors for every tier', () => {
      const tiers: TrophyTier[] = ['inicio', 'bronze', 'prata', 'ouro', 'elite', 'platina'];
      for (const tier of tiers) {
        expect(TIER_COLORS[tier]).toBeDefined();
        expect(TIER_COLORS[tier]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('orders are sequential from 1 to 46', () => {
      const orders = TROPHIES.map((t) => t.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        expect(orders[i]).toBe(i + 1);
      }
    });
  });

  describe('evaluateTrophies', () => {
    it('returns empty array for fresh state', () => {
      const state = makeState();
      const result = evaluateTrophies(state);
      expect(result).toEqual([]);
    });

    it('unlocks first_step after 1 game', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 1, totalNearMisses: 0 },
      });
      const result = evaluateTrophies(state);
      expect(result).toContain('first_step');
    });

    it('unlocks first_coin after earning 1 coin', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 1, totalScore: 0, gamesPlayed: 0, totalNearMisses: 0 },
      });
      const result = evaluateTrophies(state);
      expect(result).toContain('first_coin');
    });

    it('unlocks first_near_miss after 1 near miss', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 0, totalNearMisses: 1 },
      });
      const result = evaluateTrophies(state);
      expect(result).toContain('first_near_miss');
    });

    it('unlocks high_score_100 at score 100', () => {
      const state = makeState({ highScore: 100 });
      const result = evaluateTrophies(state);
      expect(result).toContain('high_score_100');
    });

    it('unlocks first_skin with 2 skins', () => {
      const state = makeState({ unlockedSkins: ['classic', 'magma'] });
      const result = evaluateTrophies(state);
      expect(result).toContain('first_skin');
    });

    it('unlocks coins_run_15 when collecting 15 coins in a run', () => {
      const state = makeState({ coinsThisRun: 15 });
      const result = evaluateTrophies(state);
      expect(result).toContain('coins_run_15');
    });

    it('unlocks near_miss_run_5 with 5 near misses in a run', () => {
      const state = makeState({ nearMissesThisRun: 5 });
      const result = evaluateTrophies(state);
      expect(result).toContain('near_miss_run_5');
    });

    it('unlocks multiplier_3 at score multiplier 3', () => {
      const state = makeState({ scoreMultiplier: 3 });
      const result = evaluateTrophies(state);
      expect(result).toContain('multiplier_3');
    });

    it('does not unlock already earned trophies', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 1, totalScore: 0, gamesPlayed: 1, totalNearMisses: 1 },
        earnedTrophies: ['first_step', 'first_coin', 'first_near_miss'],
      });
      const result = evaluateTrophies(state);
      expect(result).not.toContain('first_step');
      expect(result).not.toContain('first_coin');
      expect(result).not.toContain('first_near_miss');
    });

    it('can unlock multiple trophies at once', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 1, totalScore: 0, gamesPlayed: 1, totalNearMisses: 1 },
        highScore: 100,
      });
      const result = evaluateTrophies(state);
      expect(result).toContain('first_step');
      expect(result).toContain('first_coin');
      expect(result).toContain('first_near_miss');
      expect(result).toContain('high_score_100');
      expect(result.length).toBeGreaterThanOrEqual(4);
    });

    it('near_miss_100 requires 100 total near misses', () => {
      const below = makeState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 0, totalNearMisses: 99 },
      });
      expect(evaluateTrophies(below)).not.toContain('near_miss_100');

      const at = makeState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 0, totalNearMisses: 100 },
      });
      expect(evaluateTrophies(at)).toContain('near_miss_100');
    });

    it('near_miss_5000 requires 5000 total near misses', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 0, totalNearMisses: 5000 },
      });
      expect(evaluateTrophies(state)).toContain('near_miss_5000');
    });

    it('high_score_200000 requires 200k high score', () => {
      const state = makeState({ highScore: 200000 });
      expect(evaluateTrophies(state)).toContain('high_score_200000');
    });

    it('games_1000 requires 1000 games played', () => {
      const state = makeState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 1000, totalNearMisses: 0 },
      });
      expect(evaluateTrophies(state)).toContain('games_1000');
    });

    it('skins_all requires 21 skins', () => {
      const skins = Array.from({ length: 21 }, (_, i) => `skin_${i}`);
      const state = makeState({ unlockedSkins: skins });
      expect(evaluateTrophies(state)).toContain('skins_all');
    });

    it('challenge_group_9 requires challenge group index >= 9', () => {
      const state = makeState({ challengeGroupIndex: 9 });
      expect(evaluateTrophies(state)).toContain('challenge_group_9');
    });
  });

  describe('platinum trophy', () => {
    const allEarnableIds = TROPHY_IDS.filter((id) => id !== 'platinum');

    it('is not unlocked when missing any earnable trophy', () => {
      const almostAll = allEarnableIds.slice(0, -1);
      const state = makeState({ earnedTrophies: [...almostAll] });
      const result = evaluateTrophies(state);
      expect(result).not.toContain('platinum');
    });

    it('is unlocked when all 45 earnable trophies are earned', () => {
      const state = makeState({ earnedTrophies: [...allEarnableIds] });
      const result = evaluateTrophies(state);
      expect(result).toContain('platinum');
    });

    it('requires exactly 45 earnable trophies', () => {
      expect(allEarnableIds).toHaveLength(45);
    });
  });

  describe('TROPHY_MAP', () => {
    it('maps all trophy IDs correctly', () => {
      for (const trophy of TROPHIES) {
        expect(TROPHY_MAP[trophy.id]).toBe(trophy);
      }
    });

    it('has same number of entries as TROPHIES', () => {
      expect(Object.keys(TROPHY_MAP)).toHaveLength(TROPHIES.length);
    });
  });
});
