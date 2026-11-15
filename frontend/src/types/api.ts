// Public names retained for callers; wire contracts come from Pydantic.
export * from './api.generated';
export type {
  BabyProfileResponse as BabyProfile,
  FeedingSessionResponse as FeedingSession,
  SleepSessionResponse as SleepSession,
  DiaperEventResponse as DiaperEvent,
  GrowthMeasurementResponse as GrowthMeasurement,
} from './api.generated';

export interface ApiError {
  detail: string;
}
