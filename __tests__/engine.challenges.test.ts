import {
  CHALLENGE_TYPES,
  CHALLENGE_SCOPE,
  getChallengesForGroup,
  getInitialProgressForGroup,
  getLifetimeValue,
  type ChallengeType,
  type LifetimeStatsLike,
} from '../src/engine/challenges';

describe('engine/challenges', () => {
  describe('constants', () => {
    it('has 7 challenge types', () => {
      expect(CHALLENGE_TYPES).toHaveLength(7);
    });

    it('every challenge type has a scope', () => {
      for (const type of CHALLENGE_TYPES) {
        expect(['run', 'cumulative']).toContain(CHALLENGE_SCOPE[type]);
      }
    });

    it('run-scoped types end with _run, cumulative types do not', () => {
      const runTypes = CHALLENGE_TYPES.filter((t) => CHALLENGE_SCOPE[t] === 'run');
      const cumulativeTypes = CHALLENGE_TYPES.filter((t) => CHALLENGE_SCOPE[t] === 'cumulative');
      for (const t of runTypes) {
        expect(t).toMatch(/_run$/);
      }
      for (const t of cumulativeTypes) {
        expect(t).not.toMatch(/_run$/);
      }
    });
  });

  describe('getChallengesForGroup', () => {
    it('returns exactly 2 challenges', () => {
      const challenges = getChallengesForGroup(0);
      expect(challenges).toHaveLength(2);
    });

    it('challenges have distinct types', () => {
      for (let i = 0; i <= 17; i++) {
        const [a, b] = getChallengesForGroup(i);
        expect(a.type).not.toBe(b.type);
      }
    });

    it('challenges have correct id format', () => {
      const [a, b] = getChallengesForGroup(5);
      expect(a.id).toBe('group_5_challenge_0');
      expect(b.id).toBe('group_5_challenge_1');
    });

    it('challenges have valid types', () => {
      const typeSet = new Set<string>(CHALLENGE_TYPES);
      for (let i = 0; i <= 17; i++) {
        const [a, b] = getChallengesForGroup(i);
        expect(typeSet.has(a.type)).toBe(true);
        expect(typeSet.has(b.type)).toBe(true);
      }
    });

    it('challenges have positive targets', () => {
      for (let i = 0; i <= 17; i++) {
        const [a, b] = getChallengesForGroup(i);
        expect(a.target).toBeGreaterThan(0);
        expect(b.target).toBeGreaterThan(0);
      }
    });

    it('challenges have description keys', () => {
      const [a, b] = getChallengesForGroup(0);
      expect(a.descriptionKey).toMatch(/^challenges\./);
      expect(b.descriptionKey).toMatch(/^challenges\./);
    });

    it('is deterministic — same input yields same output', () => {
      const first = getChallengesForGroup(3, 42);
      const second = getChallengesForGroup(3, 42);
      expect(first).toEqual(second);
    });

    it('shuffleSeed changes the challenge types', () => {
      const [a1] = getChallengesForGroup(0, 0);
      const [a2] = getChallengesForGroup(0, 999999);
      const sameTypes = a1.type === a2.type;
      const [, b1] = getChallengesForGroup(0, 0);
      const [, b2] = getChallengesForGroup(0, 999999);
      const allSame = sameTypes && b1.type === b2.type;
      expect(allSame).toBe(false);
    });

    it('targets scale with groupIndex', () => {
      const [a0] = getChallengesForGroup(0);
      const [a17] = getChallengesForGroup(17);
      if (a0.type === a17.type) {
        expect(a17.target).toBeGreaterThanOrEqual(a0.target);
      }
    });
  });

  describe('difficulty scaling', () => {
    it('targets stay within min/max bounds for all groups', () => {
      const bounds: Record<ChallengeType, { min: number; max: number }> = {
        near_miss_run: { min: 2, max: 25 },
        coins_run: { min: 3, max: 40 },
        score_run: { min: 500, max: 15000 },
        coins_total: { min: 20, max: 800 },
        score_total: { min: 2000, max: 80000 },
        games_played: { min: 2, max: 50 },
        near_miss_total: { min: 5, max: 100 },
      };

      for (let i = 0; i <= 17; i++) {
        const [a, b] = getChallengesForGroup(i);
        for (const c of [a, b]) {
          const { min, max } = bounds[c.type];
          expect(c.target).toBeGreaterThanOrEqual(min);
          expect(c.target).toBeLessThanOrEqual(max);
        }
      }
    });
  });

  describe('getInitialProgressForGroup', () => {
    it('returns object with two keys set to 0', () => {
      const progress = getInitialProgressForGroup(0);
      const keys = Object.keys(progress);
      expect(keys).toHaveLength(2);
      for (const key of keys) {
        expect(progress[key]).toBe(0);
      }
    });

    it('keys match challenge ids', () => {
      const [a, b] = getChallengesForGroup(3, 100);
      const progress = getInitialProgressForGroup(3, 100);
      expect(progress).toHaveProperty(a.id, 0);
      expect(progress).toHaveProperty(b.id, 0);
    });
  });

  describe('getLifetimeValue', () => {
    const stats: LifetimeStatsLike = {
      totalCoins: 100,
      totalScore: 5000,
      gamesPlayed: 25,
      totalNearMisses: 50,
    };

    it('returns totalCoins for coins_total', () => {
      expect(getLifetimeValue('coins_total', stats)).toBe(100);
    });

    it('returns totalScore for score_total', () => {
      expect(getLifetimeValue('score_total', stats)).toBe(5000);
    });

    it('returns gamesPlayed for games_played', () => {
      expect(getLifetimeValue('games_played', stats)).toBe(25);
    });

    it('returns totalNearMisses for near_miss_total', () => {
      expect(getLifetimeValue('near_miss_total', stats)).toBe(50);
    });

    it('returns 0 for run-scoped types', () => {
      expect(getLifetimeValue('near_miss_run', stats)).toBe(0);
      expect(getLifetimeValue('coins_run', stats)).toBe(0);
      expect(getLifetimeValue('score_run', stats)).toBe(0);
    });
  });
});
