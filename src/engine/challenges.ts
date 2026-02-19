/**
 * Challenge groups — deterministic generation per group index.
 * Two challenges per group; types differ; difficulty scales with groupIndex (0–17).
 */

export const CHALLENGE_TYPES = [
  'near_miss_run',
  'coins_run',
  'score_run',
  'coins_total',
  'score_total',
  'games_played',
  'near_miss_total',
] as const;

export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export interface Challenge {
  id: string;
  type: ChallengeType;
  target: number;
  descriptionKey: string;
}

/** Scope: progress resets each run vs cumulative. */
export const CHALLENGE_SCOPE: Record<ChallengeType, 'run' | 'cumulative'> = {
  near_miss_run: 'run',
  coins_run: 'run',
  score_run: 'run',
  coins_total: 'cumulative',
  score_total: 'cumulative',
  games_played: 'cumulative',
  near_miss_total: 'cumulative',
};

/** Base target and step per group for difficulty curve. Min/max clamp. */
const TARGET_CONFIG: Record<
  ChallengeType,
  { base: number; step: number; min: number; max: number }
> = {
  near_miss_run: { base: 2, step: 1, min: 2, max: 25 },
  coins_run: { base: 3, step: 2, min: 3, max: 40 },
  score_run: { base: 500, step: 400, min: 500, max: 15000 },
  coins_total: { base: 20, step: 30, min: 20, max: 800 },
  score_total: { base: 2000, step: 3000, min: 2000, max: 80000 },
  games_played: { base: 3, step: 2, min: 2, max: 50 },
  near_miss_total: { base: 5, step: 4, min: 5, max: 100 },
};

/** Deterministic seeded shuffle: pick two distinct types for the group.
 * shuffleSeed: per-install random offset so each device gets different challenge combos (0 = legacy). */
function pickTwoTypes(groupIndex: number, shuffleSeed = 0): [ChallengeType, ChallengeType] {
  const seed = groupIndex * 7919 + 1 + shuffleSeed;
  let s = seed;
  const next = () => {
    const n = s * 1103515245 + 12345;
    s = n % 2147483647;
    if (s < 0) s += 2147483647;
    return s;
  };
  const types = [...CHALLENGE_TYPES];
  for (let i = types.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    [types[i], types[j]] = [types[j], types[i]];
  }
  return [types[0], types[1]];
}

function getTarget(type: ChallengeType, groupIndex: number): number {
  const { base, step, min, max } = TARGET_CONFIG[type];
  const value = base + groupIndex * step;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function descriptionKeyFor(type: ChallengeType): string {
  return `challenges.${type}`;
}

/**
 * Returns the two challenges for the given group index (0–17).
 * Deterministic per install: same groupIndex + shuffleSeed yields the same pair.
 * shuffleSeed varies per installation for variety.
 */
export function getChallengesForGroup(
  groupIndex: number,
  shuffleSeed = 0
): [Challenge, Challenge] {
  const [t1, t2] = pickTwoTypes(groupIndex, shuffleSeed);
  const id0 = `group_${groupIndex}_challenge_0`;
  const id1 = `group_${groupIndex}_challenge_1`;
  return [
    {
      id: id0,
      type: t1,
      target: getTarget(t1, groupIndex),
      descriptionKey: descriptionKeyFor(t1),
    },
    {
      id: id1,
      type: t2,
      target: getTarget(t2, groupIndex),
      descriptionKey: descriptionKeyFor(t2),
    },
  ];
}

/**
 * Initial progress object for a group (both challenge ids with 0).
 */
export function getInitialProgressForGroup(
  groupIndex: number,
  shuffleSeed = 0
): Record<string, number> {
  const [a, b] = getChallengesForGroup(groupIndex, shuffleSeed);
  return { [a.id]: 0, [b.id]: 0 };
}

export interface LifetimeStatsLike {
  totalCoins: number;
  totalScore: number;
  gamesPlayed: number;
  totalNearMisses: number;
}

/** Value for a cumulative challenge type from lifetime stats. */
export function getLifetimeValue(
  type: ChallengeType,
  stats: LifetimeStatsLike
): number {
  switch (type) {
    case 'coins_total':
      return stats.totalCoins;
    case 'score_total':
      return stats.totalScore;
    case 'games_played':
      return stats.gamesPlayed;
    case 'near_miss_total':
      return stats.totalNearMisses;
    default:
      return 0;
  }
}
