// ── API ────────────────────────────────────────────────────────────────────
// Development:  http://YOUR_COMPUTER_LAN_IP:8000  (e.g. http://192.168.1.42:8000)
// Production:   https://your-domain.com
export const API_URL = 'http://localhost:8000';

// ── Design tokens ──────────────────────────────────────────────────────────
export const Colors = {
  bg:           '#FAFAF8',
  surface:      '#FFFFFF',
  border:       '#E7E5E4',
  borderSubtle: '#F5F4F2',
  text:         '#1C1917',
  textSecondary:'#78716C',
  textMuted:    '#A8A29E',

  green:        '#16A34A',
  greenLight:   '#DCFCE7',
  greenMid:     '#BBF7D0',
  amber:        '#D97706',
  amberLight:   '#FEF3C7',
  red:          '#DC2626',
  redLight:     '#FEE2E2',
};

// ── Food groups ────────────────────────────────────────────────────────────
export const FOOD_GROUPS = [
  'produce', 'protein', 'dairy', 'grains',
  'snacks', 'beverages', 'condiments', 'non_food',
] as const;

export const FOOD_GROUP_COLOR: Record<string, string> = {
  produce:    '#16A34A',
  protein:    '#DC2626',
  dairy:      '#D97706',
  grains:     '#CA8A04',
  snacks:     '#9333EA',
  beverages:  '#2563EB',
  condiments: '#EA580C',
  non_food:   '#6B7280',
};

export const FOOD_GROUP_BG: Record<string, string> = {
  produce:    '#DCFCE7',
  protein:    '#FEE2E2',
  dairy:      '#FEF3C7',
  grains:     '#FEF9C3',
  snacks:     '#F3E8FF',
  beverages:  '#DBEAFE',
  condiments: '#FFEDD5',
  non_food:   '#F3F4F6',
};

export const FOOD_GROUP_LABEL: Record<string, string> = {
  produce:    'Fruits & Veg',
  protein:    'Protein',
  dairy:      'Dairy',
  grains:     'Grains',
  snacks:     'Snacks',
  beverages:  'Drinks',
  condiments: 'Condiments',
  non_food:   'Non-food',
};

export const FOOD_GROUP_EMOJI: Record<string, string> = {
  produce:    '🥦',
  protein:    '🥩',
  dairy:      '🧀',
  grains:     '🌾',
  snacks:     '🍫',
  beverages:  '🥤',
  condiments: '🫙',
  non_food:   '🧹',
};

// ── Body system status colors ──────────────────────────────────────────────
export const STATUS_COLOR = {
  good:    '#16A34A',
  partial: '#D97706',
  missing: '#DC2626',
};

export const STATUS_BG = {
  good:    '#F0FDF4',
  partial: '#FFFBEB',
  missing: '#FFF5F5',
};

export const STATUS_BORDER = {
  good:    '#BBF7D0',
  partial: '#FDE68A',
  missing: '#FECACA',
};
