/**
 * ASTRA Design Tokens
 * Single source of truth for all design values.
 * These values mirror tailwind.config.ts — update both if changing.
 */

export const colors = {
  // Core palette
  navy:     '#07152F',
  midnight: '#000C35',
  cyan:     '#35D6E8',
  blue:     '#38B6FF',
  teal:     '#19C7A5',
  mint:     '#2DD4BF',
  coral:    '#FF5A67',
  red:      '#ED3631',
  warning:  '#FFD166',
  white:    '#F4F7FB',
  muted:    '#9AAAC2',

  // Surfaces
  surface: {
    primary:   '#07152F',
    secondary: '#0D1F45',
    elevated:  '#112050',
    deep:      '#000C35',
  },

  // Text
  text: {
    primary:   '#F4F7FB',
    secondary: '#9AAAC2',
    inverse:   '#07152F',
    disabled:  '#4A5A78',
  },

  // Borders
  border: {
    default: '#1E2E50',
    muted:   '#152040',
    accent:  '#35D6E8',
  },
} as const

export const verificationColors = {
  VERIFIED:       colors.teal,
  SELF_REPORTED:  colors.blue,
  INFERRED:       colors.warning,
  STALE:          colors.coral,
} as const

export const referralStatusColors = {
  PENDING:    colors.warning,
  MATCHED:    colors.blue,
  SENT:       colors.cyan,
  REVIEWING:  colors.cyan,
  ACCEPTED:   colors.teal,
  DECLINED:   colors.coral,
  ESCALATED:  colors.red,
  CONFIRMED:  colors.teal,
  ARRIVED:    colors.mint,
  CANCELLED:  colors.muted,
} as const

/**
 * Freshness thresholds in milliseconds.
 * Used by FreshnessIndicator and staleness utilities.
 */
export const freshnessThresholds = {
  FRESH_MS:   24 * 60 * 60 * 1000,  // < 24h  → fresh (green)
  WARNING_MS: 7 * 24 * 60 * 60 * 1000,  // 24h–7d → aging (yellow)
  // > 7d → STALE (red)
} as const

/**
 * Escalation timeout in milliseconds.
 * How long before a non-responded referral is escalated.
 */
export const escalationTimeout = {
  DEFAULT_MS: 30 * 60 * 1000,   // 30 minutes
  CRITICAL_MS: 15 * 60 * 1000,  // 15 minutes for critical cases
} as const

export const spacing = {
  base: 4, // px — all spacing is multiples of 4
} as const

export const zIndex = {
  base:    0,
  raised:  10,
  overlay: 100,
  modal:   200,
  toast:   300,
  tooltip: 400,
} as const
