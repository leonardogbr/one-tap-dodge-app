/**
 * Icon set aligned with code.html (Material Symbols Outlined).
 * Maps document icon names to characters for use without an icon font.
 * To use Material Icons font later: install react-native-vector-icons and swap Icon.tsx implementation.
 */

export const ICON_NAMES = [
  // Navigation & general UI
  'home',
  'arrow_back',
  'settings',
  'close',
  'exit_to_app',
  'play_arrow',
  'pause',
  'replay',
  'help_outline',
  'touch_app',
  'warning',
  'timer',
  'play_circle',
  'history',

  // Skins & store
  'checkroom',
  'lock',
  'lock_open',
  'check',
  'check_circle',

  // Game elements
  'shield',
  'monetization_on',
  'bolt',
  'emoji_events',
  'redeem',
  'volume_up',
  'vibration',

  // Trophies
  'directions_walk',
  'paid',
  'star_outline',
  'palette',
  'savings',
  'sports_esports',
  'gps_fixed',
  'flash_on',
  'account_balance',
  'speed',
  'electric_bolt',
  'military_tech',
  'track_changes',
  'toll',
  'workspace_premium',
  'auto_awesome',
  'verified',
  'videogame_asset',
  'inventory_2',
  'crisis_alert',
  'king_bed',
  'looks_one',
  'local_atm',
  'whatshot',
  'diamond',
  'attach_money',
  'all_inclusive',
  'radar',
  'looks_two',
  'grade',
  'currency_exchange',
  'adjust',
  'looks_5',
  'account_balance_wallet',
  'money',
  'stars',
  'psychology',
  'landscape',
  'auto_fix_high',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Map icon name → Unicode/emoji fallback (used when react-native-vector-icons is unavailable). */
export const ICON_MAP: Record<IconName, string> = {
  // Navigation & general UI
  home: '\u2302',            // ⌂
  arrow_back: '\u2190',     // ←
  settings: '\u2699',        // ⚙
  close: '\u00D7',           // ×
  exit_to_app: '\u2396',    // ⎖
  play_arrow: '\u25B6',      // ▶
  pause: '\u23F8',           // ⏸
  replay: '\u21BB',          // ↻
  help_outline: '\u2139',    // ℹ
  touch_app: '\u261D',       // ☝
  warning: '\u26A0',         // ⚠
  timer: '\u23F1',           // ⏱
  play_circle: '\u25B6',     // ▶
  history: '\u21BA',         // ↺

  // Skins & store
  checkroom: '\u1F455',      // 👕
  lock: '\u1F512',           // 🔒
  lock_open: '\u1F513',      // 🔓
  check: '\u2713',           // ✓
  check_circle: '\u2713',    // ✓

  // Game elements
  shield: '\u26E8',          // ⛨
  monetization_on: '\u00A2', // ¢
  bolt: '\u26A1',            // ⚡
  emoji_events: '\u1F3C6',   // 🏆
  redeem: '\u1F381',         // 🎁
  volume_up: '\u1F50A',      // 🔊
  vibration: '\u1F4F3',      // 📳

  // Trophies
  directions_walk: '\u1F6B6', // 🚶
  paid: '\u1F4B0',            // 💰
  star_outline: '\u2606',     // ☆
  palette: '\u1F3A8',         // 🎨
  savings: '\u1F3E6',         // 🏦
  sports_esports: '\u1F3AE',  // 🎮
  gps_fixed: '\u1F3AF',       // 🎯
  flash_on: '\u26A1',         // ⚡
  account_balance: '\u1F3DB', // 🏛
  speed: '\u23E9',            // ⏩
  electric_bolt: '\u26A1',    // ⚡
  military_tech: '\u1F396',   // 🎖
  track_changes: '\u25CE',    // ◎
  toll: '\u1F4B2',            // 💲
  workspace_premium: '\u1F451', // 👑
  auto_awesome: '\u2728',     // ✨
  verified: '\u2705',         // ✅
  videogame_asset: '\u1F3AE', // 🎮
  inventory_2: '\u1F4E6',     // 📦
  crisis_alert: '\u26A0',     // ⚠
  king_bed: '\u1F451',        // 👑
  looks_one: '\u0031\uFE0F',  // 1️
  local_atm: '\u1F4B5',       // 💵
  whatshot: '\u1F525',         // 🔥
  diamond: '\u1F48E',         // 💎
  attach_money: '\u1F4B2',    // 💲
  all_inclusive: '\u221E',     // ∞
  radar: '\u1F4E1',           // 📡
  looks_two: '\u0032\uFE0F',  // 2️
  grade: '\u2B50',            // ⭐
  currency_exchange: '\u1F4B1', // 💱
  adjust: '\u25CE',            // ◎
  looks_5: '\u0035\uFE0F',    // 5️
  account_balance_wallet: '\u1F4B3', // 💳
  money: '\u1F4B5',            // 💵
  stars: '\u1F31F',            // 🌟
  psychology: '\u1F9E0',       // 🧠
  landscape: '\u1F3D4',        // 🏔
  auto_fix_high: '\u2728',     // ✨
};

export function getIconChar(name: IconName | string): string {
  if (name in ICON_MAP) return ICON_MAP[name as IconName];
  return name;
}

export function isIconName(s: string): s is IconName {
  return ICON_NAMES.includes(s as IconName);
}
