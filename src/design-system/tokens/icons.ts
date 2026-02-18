/**
 * Icon set aligned with code.html (Material Symbols Outlined).
 * Maps document icon names to characters for use without an icon font.
 * To use Material Icons font later: install react-native-vector-icons and swap Icon.tsx implementation.
 */

export const ICON_NAMES = [
  'home',
  'arrow_back',
  'settings',
  'close',
  'exit_to_app',
  'play_arrow',
  'pause',
  'replay',
  'shield',
  'monetization_on',
  'checkroom',
  'emoji_events',
  'redeem',
  'volume_up',
  'vibration',
  'help_outline', // Como Jogar — ícone universal de ajuda/instruções
  'touch_app',    // How to Play: tap to swap
  'warning',     // How to Play: dodge obstacles / Game Over near miss
  'bolt',        // How to Play: near-miss bonus
  'timer',       // Game Over: time card
  'play_circle', // Game Over: botão assistir anúncio (revive)
  'history',     // Última pontuação / histórico
  'lock',        // Skins: indicador de bloqueado
  'lock_open',   // Skins: botão desbloquear
  'check',       // Skins: botão equipar
  'check_circle', // Skins: indicador equipado
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Map document icon name → character (Unicode/emoji). Swap to icon font glyph when using react-native-vector-icons. */
export const ICON_MAP: Record<IconName, string> = {
  home: '\u2302',           // ⌂ (house)
  arrow_back: '\u2190',    // ←
  settings: '\u2699',       // ⚙ (gear)
  close: '\u00D7',          // ×
  exit_to_app: '\u2396',   // ⎖ (exit / leave) — fallback when not using icon font
  play_arrow: '\u25B6',     // ▶
  pause: '\u23F8',         // ⏸
  replay: '\u21BB',        // ↻ (restart)
  shield: '\u26E8',        // ⛨ (shield)
  monetization_on: '\u00A2', // ¢ (coin / currency)
  checkroom: '\u1F45C',     // 👕 (Skins / wardrobe)
  emoji_events: '\u1F3C6',  // 🏆 (trophy / Challenges)
  redeem: '\u1F381',        // 🎁 (Rewards)
  volume_up: '\u1F50A',     // 🔊
  vibration: '\u1F4F3',     // 📳
  help_outline: '\u2139',   // ℹ (help / how to play)
  touch_app: '\u1F446',     // 👆 (tap)
  warning: '\u26A0',        // ⚠
  bolt: '\u26A1',           // ⚡
  timer: '\u23F1',          // ⏱ (stopwatch)
  play_circle: '\u25B6',    // ▶ (play)
  history: '\u21BA',        // ↺ (history / clock with counter-clockwise arrow)
  lock: '\u1F512',         // 🔒 (lock / cadeado)
  lock_open: '\u1F513',    // 🔓 (lock open / cadeado aberto)
  check: '\u2713',        // ✓ (check mark / equipar)
  check_circle: '\u2713', // ✓ (fallback; Material Icons render check_circle)
};

export function getIconChar(name: IconName | string): string {
  if (name in ICON_MAP) return ICON_MAP[name as IconName];
  return name;
}

export function isIconName(s: string): s is IconName {
  return ICON_NAMES.includes(s as IconName);
}
