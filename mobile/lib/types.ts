export interface ReceiptItem {
  name: string;
  quantity?: number;
  unit?: string;
  price: number;
  food_group: string;
  nutrient_tags: string[];
  confidence: string;
}

export interface ParsedReceipt {
  store_name?: string;
  purchased_at?: string;
  total_amount?: number;
  image_url?: string;
  items: ReceiptItem[];
}

export interface BodySystem {
  name: string;
  emoji: string;
  status: 'good' | 'partial' | 'missing';
  covered_nutrients: string[];
  missing_nutrients: string[];
}

export interface NutrientGap {
  nutrient: string;
  label: string;
  body_parts: string[];
  health_benefits: string;
  food_sources: string;
  last_seen_days_ago?: number;
}

export interface HealthReport {
  body_systems: BodySystem[];
  nutrient_gaps: NutrientGap[];
  overall_score: number;
  summary_message: string;
}

export interface SpendingGroup {
  food_group: string;
  total: number;
  percentage: number;
  item_count: number;
}

export interface WeeklyTrendPoint {
  week: string;
  total: number;
}

export interface Receipt {
  id: string;
  store_name?: string;
  purchased_at?: string;
  total_amount?: number;
  image_url?: string;
  created_at: string;
}

export interface DashboardSummary {
  period_days: number;
  total_receipts: number;
  total_spent: number;
  spending_by_group: SpendingGroup[];
  weekly_trend: WeeklyTrendPoint[];
  health_report: HealthReport;
  recent_receipts: Receipt[];
}
