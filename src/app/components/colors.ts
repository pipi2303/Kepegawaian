/**
 * colors.ts — Token warna utama HCMS Smart Hospital
 * Semua komponen wajib import dari sini, bukan hardcode hex.
 */

export const C = {
  // ── 1. Brand ──────────────────────────────────────────────
  brand:       '#013E37',
  brandMid:    '#025C52',
  brandLight:  '#038E7D',
  brandXLight: '#5BB5AB',
  lemon:       '#FFEFB2',
  lemonDark:   '#F5D800',
  lemonMid:    '#FFE066',
  lemonSoft:   '#FFF9DC',

  // ── 2. Layout & Surface ───────────────────────────────────
  bg:          '#EEF7F5',
  card:        '#FFFFFF',
  cardHover:   '#F5FBFA',
  sidebar:     '#013E37',

  // ── 3. Borders ────────────────────────────────────────────
  border:      '#C3DDD9',
  borderLight: '#DFF0EC',

  // ── 4. Semantic Status ────────────────────────────────────
  success:     '#16A34A',
  warning:     '#D97706',
  danger:      '#DC2626',
  primary:     '#E8F5F2',
  secondary:   '#025C52',
  accent:      '#038E7D',

  // ── 5. Text ───────────────────────────────────────────────
  text:        '#012D29',
  textMuted:   '#4D8078',
  white:       '#FFFFFF',

  // ── 6. Sidebar-Specific ───────────────────────────────────
  sidebarText:         '#FFFFFF',
  sidebarTextMuted:    'rgba(255,255,255,0.55)',
  sidebarActiveText:   '#013E37',
  sidebarActiveBg:     '#FFEFB2',
  sidebarHoverBg:      'rgba(255,239,178,0.10)',
  sidebarBorder:       'rgba(255,239,178,0.15)',
  sidebarSectionLabel: 'rgba(255,239,178,0.45)',

  // ── 7. Chart Helpers ──────────────────────────────────────
  chartGrid:     '#C3DDD9',
  chartTooltipBg:'#012D29',
} as const;

/** Multi-series chart palette — 8 warna berbeda, urutan konsisten */
export const CHART_COLORS = [
  '#038E7D', // Bright Teal
  '#FFBE00', // Golden Lemon
  '#E87040', // Warm Coral
  '#0891B2', // Sky Blue
  '#6C63FF', // Violet
  '#FF6B6B', // Soft Red
  '#4ECDC4', // Aqua
  '#16A34A', // Emerald
] as const;

/** BSC Perspective Colors */
export const BSC_COLORS = {
  keuangan:     '#D97706',
  pelanggan:    '#0891B2',
  prosesBisnis: '#16A34A',
  pembelajaran: '#7C3AED',
} as const;

/** Page Accent Colors — per halaman/tab */
export const PAGE_ACCENT = {
  executive:    { main: '#013E37', lightBg: '#E0F7F4', lightBorder: '#5BB5AB' },
  keperawatan:  { main: '#038E7D', lightBg: '#E0F7F4', lightBorder: '#5BB5AB' },
  pelayanan:    { main: '#7C3AED', lightBg: '#F5F3FF', lightBorder: '#C4B5FD' },
  penunjang:    { main: '#D97706', lightBg: '#FFFBEB', lightBorder: '#FCD34D' },
  keuangan:     { main: '#0891B2', lightBg: '#EFF6FF', lightBorder: '#93C5FD' },
  sdm:          { main: '#16A34A', lightBg: '#F0FDF4', lightBorder: '#86EFAC' },
  sarana:       { main: '#E87040', lightBg: '#FFF7F0', lightBorder: '#FDBA74' },
  igd:          { main: '#DC2626', lightBg: '#FFF1F2', lightBorder: '#FCA5A5' },
} as const;

/** Insight / Alert Box Colors */
export const ALERT_COLORS = {
  success: { bg: '#F0FDF4', border: '#86EFAC' },
  warning: { bg: '#FFFBEB', border: '#FCD34D' },
  danger:  { bg: '#FFF1F2', border: '#FCA5A5' },
  info:    { bg: '#EFF6FF', border: '#93C5FD' },
} as const;
