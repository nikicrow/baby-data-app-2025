// Generated from backend/app/schemas by frontend/scripts/generate_api_types.py.
// Do not edit. Dates are YYYY-MM-DD; datetimes are ISO 8601 strings.
// Optional request fields may be omitted; null follows Pydantic's nullable fields.

export const appetiteValues = ["poor", "fair", "good", "excellent"] as const;
export type Appetite = typeof appetiteValues[number];

export interface BabyProfileCreate {
  notes?: string | null;
  /** {"minLength":1,"maxLength":100} */
  name: string;
  /** {"format":"date"} */
  date_of_birth: string;
  birth_weight?: number | null;
  birth_length?: number | null;
  birth_head_circumference?: number | null;
  gender?: "male" | "female" | "other" | null;
  /** {"maxLength":50} */
  timezone?: string;
}

export interface BabyProfileResponse {
  notes: string | null;
  /** {"minLength":1,"maxLength":100} */
  name: string;
  /** {"format":"date"} */
  date_of_birth: string;
  birth_weight: number | null;
  birth_length: number | null;
  birth_head_circumference: number | null;
  gender: "male" | "female" | "other" | null;
  /** {"maxLength":50} */
  timezone: string;
  /** {"format":"uuid"} */
  id: string;
  /** {"format":"date-time"} */
  created_at: string;
  /** {"format":"date-time"} */
  updated_at: string;
  is_active: boolean;
}

export interface BabyProfileUpdate {
  name?: string | null;
  birth_weight?: number | null;
  birth_length?: number | null;
  birth_head_circumference?: number | null;
  gender?: "male" | "female" | "other" | null;
  timezone?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
}

export interface BabySummary {
  /** {"format":"uuid"} */
  baby_id: string;
  baby_name: string;
  /** {"format":"date"} */
  date_of_birth: string;
  max_age_days: number;
}

export const breastSideValues = ["left", "right"] as const;
export type BreastSide = typeof breastSideValues[number];

export interface ComparisonResponse {
  align: "age_weeks" | "age_days";
  babies: Array<BabySummary>;
  weekly: Array<WeeklyMetricsRow> | null;
  daily: Array<DailyMetricsRow> | null;
}

export interface DailyMetricsRow {
  /** {"format":"uuid"} */
  baby_id: string;
  baby_name: string;
  /** {"format":"date"} */
  metric_date: string;
  age_days: number;
  age_weeks: number;
  night_sleep_minutes: number;
  night_sleep_segments: number | null;
  longest_night_stretch_minutes: number | null;
  night_waking_count: number | null;
  awake_at_night_minutes: number | null;
  nap_count: number;
  total_nap_minutes: number;
  avg_nap_minutes: number | null;
  feed_count: number;
  breast_feed_count: number;
  bottle_feed_count: number;
  total_volume_ml: number | null;
  avg_feed_interval_minutes: number | null;
  avg_wake_window_minutes: number | null;
  max_wake_window_minutes: number | null;
  diaper_count: number;
  wet_diaper_count: number;
  dirty_diaper_count: number;
}

export interface DiaperEventCreate {
  notes?: string | null;
  /** {"format":"date-time"} */
  timestamp?: string;
  has_urine?: boolean;
  urine_volume?: UrineVolume;
  has_stool?: boolean;
  stool_consistency?: StoolConsistency | null;
  stool_color?: StoolColor | null;
  diaper_type?: DiaperType;
  /** {"format":"uuid"} */
  baby_id: string;
}

export interface DiaperEventResponse {
  /** {"format":"uuid"} */
  id: string;
  /** {"format":"uuid"} */
  baby_id: string;
  /** {"format":"date-time"} */
  created_at: string;
  /** {"format":"date-time"} */
  updated_at: string;
  notes: string | null;
  /** {"format":"date-time"} */
  timestamp: string;
  has_urine: boolean;
  urine_volume: UrineVolume;
  has_stool: boolean;
  stool_consistency: StoolConsistency | null;
  stool_color: StoolColor | null;
  diaper_type: DiaperType;
}

export interface DiaperEventUpdate {
  timestamp?: string | null;
  has_urine?: boolean | null;
  urine_volume?: UrineVolume | null;
  has_stool?: boolean | null;
  stool_consistency?: StoolConsistency | null;
  stool_color?: StoolColor | null;
  diaper_type?: DiaperType | null;
  notes?: string | null;
}

export const diaperTypeValues = ["disposable", "cloth", "training"] as const;
export type DiaperType = typeof diaperTypeValues[number];

export interface FeedingSessionCreate {
  notes?: string | null;
  /** {"format":"date-time"} */
  start_time?: string;
  end_time?: string | null;
  feeding_type: FeedingType;
  breast_started?: BreastSide | null;
  left_breast_duration?: number | null;
  right_breast_duration?: number | null;
  volume_offered_ml?: number | null;
  volume_consumed_ml?: number | null;
  formula_type?: string | null;
  food_items?: Array<string> | null;
  appetite?: Appetite | null;
  /** {"format":"uuid"} */
  baby_id: string;
}

export interface FeedingSessionResponse {
  /** {"format":"uuid"} */
  id: string;
  /** {"format":"uuid"} */
  baby_id: string;
  /** {"format":"date-time"} */
  created_at: string;
  /** {"format":"date-time"} */
  updated_at: string;
  notes: string | null;
  /** {"format":"date-time"} */
  start_time: string;
  end_time: string | null;
  feeding_type: FeedingType;
  breast_started: BreastSide | null;
  left_breast_duration: number | null;
  right_breast_duration: number | null;
  volume_offered_ml: number | null;
  volume_consumed_ml: number | null;
  formula_type: string | null;
  food_items: Array<string> | null;
  appetite: Appetite | null;
  duration_minutes: number | null;
}

export interface FeedingSessionUpdate {
  start_time?: string | null;
  end_time?: string | null;
  breast_started?: BreastSide | null;
  left_breast_duration?: number | null;
  right_breast_duration?: number | null;
  volume_offered_ml?: number | null;
  volume_consumed_ml?: number | null;
  formula_type?: string | null;
  food_items?: Array<string> | null;
  appetite?: Appetite | null;
  notes?: string | null;
}

export const feedingTypeValues = ["breast", "bottle", "solid"] as const;
export type FeedingType = typeof feedingTypeValues[number];

export interface GrowthMeasurementCreate {
  notes?: string | null;
  /** {"format":"date"} */
  measurement_date?: string;
  weight_kg?: number | null;
  length_cm?: number | null;
  head_circumference_cm?: number | null;
  measurement_context?: MeasurementContext;
  measured_by?: string | null;
  /** {"format":"uuid"} */
  baby_id: string;
}

export interface GrowthMeasurementResponse {
  /** {"format":"uuid"} */
  id: string;
  /** {"format":"uuid"} */
  baby_id: string;
  /** {"format":"date-time"} */
  created_at: string;
  /** {"format":"date-time"} */
  updated_at: string;
  notes: string | null;
  /** {"format":"date"} */
  measurement_date: string;
  weight_kg: number | null;
  length_cm: number | null;
  head_circumference_cm: number | null;
  measurement_context: MeasurementContext;
  measured_by: string | null;
  percentiles: Record<string, unknown> | null;
}

export interface GrowthMeasurementUpdate {
  measurement_date?: string | null;
  weight_kg?: number | null;
  length_cm?: number | null;
  head_circumference_cm?: number | null;
  measurement_context?: MeasurementContext | null;
  measured_by?: string | null;
  notes?: string | null;
}

export const measurementContextValues = ["home", "doctor_visit", "hospital", "clinic"] as const;
export type MeasurementContext = typeof measurementContextValues[number];

export const sleepLocationValues = ["crib", "bassinet", "parent_bed", "stroller", "car_seat", "other"] as const;
export type SleepLocation = typeof sleepLocationValues[number];

export const sleepQualityValues = ["restless", "fair", "good", "deep"] as const;
export type SleepQuality = typeof sleepQualityValues[number];

export interface SleepSessionCreate {
  notes?: string | null;
  /** {"format":"date-time"} */
  start_time?: string;
  end_time?: string | null;
  sleep_type?: SleepType;
  location?: SleepLocation;
  sleep_quality?: SleepQuality;
  sleep_environment?: Record<string, unknown> | null;
  wake_reason?: WakeReason | null;
  /** {"format":"uuid"} */
  baby_id: string;
}

export interface SleepSessionResponse {
  /** {"format":"uuid"} */
  id: string;
  /** {"format":"uuid"} */
  baby_id: string;
  /** {"format":"date-time"} */
  created_at: string;
  /** {"format":"date-time"} */
  updated_at: string;
  notes: string | null;
  /** {"format":"date-time"} */
  start_time: string;
  end_time: string | null;
  sleep_type: SleepType;
  location: SleepLocation;
  sleep_quality: SleepQuality | null;
  sleep_environment: Record<string, unknown> | null;
  wake_reason: WakeReason | null;
  duration_minutes: number | null;
}

export interface SleepSessionUpdate {
  start_time?: string | null;
  end_time?: string | null;
  sleep_type?: SleepType | null;
  location?: SleepLocation | null;
  sleep_quality?: SleepQuality | null;
  sleep_environment?: Record<string, unknown> | null;
  wake_reason?: WakeReason | null;
  notes?: string | null;
}

export const sleepTypeValues = ["nap", "nighttime"] as const;
export type SleepType = typeof sleepTypeValues[number];

export const stoolColorValues = ["yellow", "brown", "green", "red", "black", "other"] as const;
export type StoolColor = typeof stoolColorValues[number];

export const stoolConsistencyValues = ["liquid", "soft", "formed", "hard"] as const;
export type StoolConsistency = typeof stoolConsistencyValues[number];

export const urineVolumeValues = ["none", "light", "moderate", "heavy"] as const;
export type UrineVolume = typeof urineVolumeValues[number];

export const wakeReasonValues = ["natural", "crying", "feeding", "diaper", "noise", "other"] as const;
export type WakeReason = typeof wakeReasonValues[number];

export interface WeeklyMetricsRow {
  /** {"format":"uuid"} */
  baby_id: string;
  baby_name: string;
  age_weeks: number;
  days_in_week: number;
  avg_night_sleep_minutes: number | null;
  avg_longest_night_stretch_minutes: number | null;
  avg_night_waking_count: number | null;
  avg_awake_at_night_minutes: number | null;
  avg_nap_count: number | null;
  avg_total_nap_minutes: number | null;
  avg_nap_length_minutes: number | null;
  avg_feed_count: number | null;
  avg_feed_interval_minutes: number | null;
  avg_wake_window_minutes: number | null;
  avg_max_wake_window_minutes: number | null;
  avg_diaper_count: number | null;
}
