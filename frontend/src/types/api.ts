// TypeScript types matching backend API schemas

// Union string types (instead of enums for cleaner, lighter code)
export type FeedingType = 'breast' | 'bottle' | 'solid';
export type BreastSide = 'left' | 'right';
export type Appetite = 'poor' | 'fair' | 'good' | 'excellent';
export type SleepType = 'nap' | 'nighttime';
export type SleepLocation = 'crib' | 'bassinet' | 'parent_bed' | 'stroller' | 'car_seat' | 'other';
export type SleepQuality = 'restless' | 'fair' | 'good' | 'deep';
export type WakeReason = 'natural' | 'crying' | 'feeding' | 'diaper' | 'noise' | 'other';
export type UrineVolume = 'none' | 'light' | 'moderate' | 'heavy';
export type StoolConsistency = 'liquid' | 'soft' | 'formed' | 'hard';
export type StoolColor = 'yellow' | 'brown' | 'green' | 'red' | 'black' | 'other';
export type DiaperType = 'disposable' | 'cloth' | 'training';
export type MeasurementContext = 'home' | 'doctor_visit' | 'hospital';

// Baby Profile Types
export interface BabyProfile {
  id: string;
  name: string;
  date_of_birth: string;
  birth_weight?: number;
  birth_length?: number;
  birth_head_circumference?: number;
  gender?: 'male' | 'female' | 'other';
  timezone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface BabyProfileCreate {
  name: string;
  date_of_birth: string;
  birth_weight?: number;
  birth_length?: number;
  birth_head_circumference?: number;
  gender?: 'male' | 'female' | 'other';
  timezone?: string;
  notes?: string;
}

export interface BabyProfileUpdate {
  name?: string;
  birth_weight?: number;
  birth_length?: number;
  birth_head_circumference?: number;
  gender?: 'male' | 'female' | 'other';
  timezone?: string;
  notes?: string;
  is_active?: boolean;
}

// Feeding Session Types
export interface FeedingSession {
  id: string;
  baby_id: string;
  start_time: string;
  end_time?: string;
  feeding_type: FeedingType;
  breast_started?: BreastSide;
  left_breast_duration?: number;
  right_breast_duration?: number;
  volume_offered_ml?: number;
  volume_consumed_ml?: number;
  formula_type?: string;
  food_items?: string[];
  appetite?: Appetite;
  notes?: string;
  created_at: string;
  duration_minutes?: number;
}

export interface FeedingSessionCreate {
  baby_id: string;
  start_time?: string;
  end_time?: string;
  feeding_type: FeedingType;
  breast_started?: BreastSide;
  left_breast_duration?: number;
  right_breast_duration?: number;
  volume_offered_ml?: number;
  volume_consumed_ml?: number;
  formula_type?: string;
  food_items?: string[];
  appetite?: Appetite;
  notes?: string;
}

export interface FeedingSessionUpdate {
  start_time?: string;
  end_time?: string;
  breast_started?: BreastSide;
  left_breast_duration?: number;
  right_breast_duration?: number;
  volume_offered_ml?: number;
  volume_consumed_ml?: number;
  formula_type?: string;
  food_items?: string[];
  appetite?: Appetite;
  notes?: string;
}

// Sleep Session Types
export interface SleepSession {
  id: string;
  baby_id: string;
  sleep_start: string;
  sleep_end?: string;
  sleep_type: SleepType;
  location: SleepLocation;
  sleep_quality: SleepQuality;
  sleep_environment?: Record<string, any>;
  wake_reason?: WakeReason;
  notes?: string;
  created_at: string;
  duration_minutes?: number;
}

export interface SleepSessionCreate {
  baby_id: string;
  sleep_start?: string;
  sleep_end?: string;
  sleep_type?: SleepType;
  location?: SleepLocation;
  sleep_quality?: SleepQuality;
  sleep_environment?: Record<string, any>;
  wake_reason?: WakeReason;
  notes?: string;
}

export interface SleepSessionUpdate {
  sleep_start?: string;
  sleep_end?: string;
  sleep_type?: SleepType;
  location?: SleepLocation;
  sleep_quality?: SleepQuality;
  sleep_environment?: Record<string, any>;
  wake_reason?: WakeReason;
  notes?: string;
}

// Diaper Event Types
export interface DiaperEvent {
  id: string;
  baby_id: string;
  timestamp: string;
  has_urine: boolean;
  urine_volume: UrineVolume;
  has_stool: boolean;
  stool_consistency?: StoolConsistency;
  stool_color?: StoolColor;
  diaper_type: DiaperType;
  notes?: string;
  created_at: string;
}

export interface DiaperEventCreate {
  baby_id: string;
  timestamp?: string;
  has_urine?: boolean;
  urine_volume?: UrineVolume;
  has_stool?: boolean;
  stool_consistency?: StoolConsistency;
  stool_color?: StoolColor;
  diaper_type?: DiaperType;
  notes?: string;
}

export interface DiaperEventUpdate {
  timestamp?: string;
  has_urine?: boolean;
  urine_volume?: UrineVolume;
  has_stool?: boolean;
  stool_consistency?: StoolConsistency;
  stool_color?: StoolColor;
  diaper_type?: DiaperType;
  notes?: string;
}

// Growth Measurement Types
export interface GrowthMeasurement {
  id: string;
  baby_id: string;
  measurement_date: string;
  weight_kg?: number;
  length_cm?: number;
  head_circumference_cm?: number;
  measurement_context: MeasurementContext;
  measured_by?: string;
  notes?: string;
  percentiles?: Record<string, any>;
  created_at: string;
}

export interface GrowthMeasurementCreate {
  baby_id: string;
  measurement_date?: string;
  weight_kg?: number;
  length_cm?: number;
  head_circumference_cm?: number;
  measurement_context?: MeasurementContext;
  measured_by?: string;
  notes?: string;
}

export interface GrowthMeasurementUpdate {
  measurement_date?: string;
  weight_kg?: number;
  length_cm?: number;
  head_circumference_cm?: number;
  measurement_context?: MeasurementContext;
  measured_by?: string;
  notes?: string;
}

// Generic API Response
export interface ApiError {
  detail: string;
}
