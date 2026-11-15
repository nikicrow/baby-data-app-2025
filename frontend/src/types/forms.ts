import type { BreastSide, FeedingSessionCreate, FeedingType, SleepLocation, SleepQuality, SleepType } from './api';

export type ActivityType = 'feed' | 'nappy' | 'sleep' | 'growth';

// Draft numeric inputs remain strings until submission. API enums come from Pydantic.
export interface ActivityFormData {
  feedType?: FeedingSessionCreate['feeding_type'] | 'pump';
  firstBreast?: BreastSide;
  firstBreastDuration?: string;
  addSecondBreast?: boolean;
  secondBreastDuration?: string;
  amount?: string;
  duration?: string;
  nappyType?: 'Clean' | 'Wet diaper' | 'Poopy diaper' | 'Both';
  sleepType?: 'start' | 'end' | 'log';
  location?: SleepLocation;
  weight?: string;
  height?: string;
  notes?: string;
}

export interface EditActivityFormData {
  feedType: FeedingType | '';
  breastStarted: BreastSide | '';
  leftBreastDuration: string;
  rightBreastDuration: string;
  volume: string;
  date: string;
  time: string;
  sleepType: SleepType | '';
  sleepQuality: SleepQuality | '';
  location: SleepLocation | '';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  duration: string;
  hasUrine: boolean;
  hasStool: boolean;
  weight: string;
  length: string;
  notes: string;
}

export const EMPTY_EDIT_FORM: EditActivityFormData = {
  feedType: '', breastStarted: '', leftBreastDuration: '', rightBreastDuration: '',
  volume: '', date: '', time: '', sleepType: '', sleepQuality: '', location: '',
  startDate: '', startTime: '', endDate: '', endTime: '', duration: '',
  hasUrine: false, hasStool: false, weight: '', length: '', notes: '',
};

export function enumValue<T extends string>(value: string, values: readonly T[]): T | undefined {
  return values.find(option => option === value);
}
