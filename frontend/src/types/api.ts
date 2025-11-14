// TypeScript types matching backend API schemas

// Enums
export enum FeedingType {
  BREAST = 'breast',
  BOTTLE = 'bottle',
  SOLID = 'solid',
}

export enum BreastSide {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum Appetite {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent',
}

export enum SleepType {
  NAP = 'nap',
  NIGHTTIME = 'nighttime',
}

export enum SleepLocation {
  CRIB = 'crib',
  BASSINET = 'bassinet',
  PARENT_BED = 'parent_bed',
  STROLLER = 'stroller',
  CAR_SEAT = 'car_seat',
  OTHER = 'other',
}

export enum SleepQuality {
  RESTLESS = 'restless',
  FAIR = 'fair',
  GOOD = 'good',
  DEEP = 'deep',
}

export enum WakeReason {
  NATURAL = 'natural',
  CRYING = 'crying',
  FEEDING = 'feeding',
  DIAPER = 'diaper',
  NOISE = 'noise',
  OTHER = 'other',
}

export enum UrineVolume {
  NONE = 'none',
  LIGHT = 'light',
  MODERATE = 'moderate',
  HEAVY = 'heavy',
}

export enum StoolConsistency {
  LIQUID = 'liquid',
  SOFT = 'soft',
  FORMED = 'formed',
  HARD = 'hard',
}

export enum StoolColor {
  YELLOW = 'yellow',
  BROWN = 'brown',
  GREEN = 'green',
  RED = 'red',
  BLACK = 'black',
  OTHER = 'other',
}

export enum DiaperType {
  DISPOSABLE = 'disposable',
  CLOTH = 'cloth',
  TRAINING = 'training',
}

export enum MeasurementContext {
  HOME = 'home',
  DOCTOR_VISIT = 'doctor_visit',
  HOSPITAL = 'hospital',
}

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
