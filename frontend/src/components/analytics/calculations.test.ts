import { describe, expect, it } from 'vitest';
import type { FeedingSession, GrowthMeasurement } from '../../types/api';
import { buildFeedingAnalytics } from './feedingCalculations';
import { buildGrowthProgress, buildPercentileComparison, readPercentile } from './growthCalculations';

const feeding = (overrides: Partial<FeedingSession>): FeedingSession => ({
  id: 'feed', baby_id: 'baby', created_at: '2026-10-15T12:00:00',
  updated_at: '2026-10-15T12:00:00', notes: null, end_time: null, breast_started: null,
  left_breast_duration: null, right_breast_duration: null, volume_offered_ml: null, volume_consumed_ml: null,
  formula_type: null, food_items: null, appetite: null, duration_minutes: null,
  start_time: '2026-10-15T12:00:00', feeding_type: 'bottle', ...overrides,
});
const growth = (overrides: Partial<GrowthMeasurement>): GrowthMeasurement => ({
  id: 'growth', baby_id: 'baby', created_at: '2026-10-15T12:00:00',
  updated_at: '2026-10-15T12:00:00', notes: null, weight_kg: null, length_cm: null,
  head_circumference_cm: null, measured_by: null, percentiles: null,
  measurement_date: '2026-10-15', measurement_context: 'home', ...overrides,
});

describe('feeding calculations', () => {
  it('uses consumed volume, includes the reference day, and excludes later records', () => {
    const result = buildFeedingAnalytics([
      feeding({ volume_consumed_ml: 120, volume_offered_ml: 150 }),
      feeding({ start_time: '2026-10-16T12:00:00', volume_consumed_ml: 999 }),
    ], new Date('2026-10-15T15:00:00'));
    expect(result.todayVolume).toBe(120);
    expect(result.volumeProgressData.at(-1)?.avgBottle).toBe(120);
    expect(result.volumeProgressData.at(-1)?.dailyTotal).toBe(17);
  });

  it('puts adjacent seven-day windows on the correct side of the boundary', () => {
    const result = buildFeedingAnalytics([
      feeding({ start_time: '2026-10-08T23:59:00', volume_consumed_ml: 60 }),
      feeding({ start_time: '2026-10-09T00:00:00', volume_consumed_ml: 120 }),
    ], new Date('2026-10-15T15:00:00'));
    expect(result.volumeProgressData.at(-2)?.avgBottle).toBe(60);
    expect(result.volumeProgressData.at(-1)?.avgBottle).toBe(120);
  });

  it('counts both breasts independently and uses each side duration', () => {
    const result = buildFeedingAnalytics([
      feeding({ feeding_type: 'breast', left_breast_duration: 10, right_breast_duration: 20 }),
      feeding({ feeding_type: 'breast', left_breast_duration: 30 }),
    ], new Date('2026-10-15T15:00:00'));
    expect(result.sidePreferenceData).toMatchObject([
      { name: 'Left', value: 67, avgDuration: 20 },
      { name: 'Right', value: 33, avgDuration: 20 },
    ]);
  });

  it('labels solid food separately and includes short intervals', () => {
    const result = buildFeedingAnalytics([
      feeding({ feeding_type: 'solid' }), feeding({ start_time: '2026-10-15T12:30:00' }),
    ], new Date('2026-10-15T15:00:00'));
    expect(result.feedingTrendsData.at(-1)?.solidFeeds).toBe(1);
    expect(result.intervalCounts['0-1h']).toBe(1);
  });
});

describe('growth calculations', () => {
  it('uses actual dates and age for irregular measurements without mutating input', () => {
    const measurements = [growth({ measurement_date: '2026-10-22' }), growth({ measurement_date: '2026-10-08' })];
    const result = buildGrowthProgress(measurements, '2026-10-01');
    expect(result.map(row => row.age)).toEqual([1, 3]);
    expect(result.map(row => row.date)).toEqual(['Oct 8, 2026', 'Oct 22, 2026']);
    expect(measurements[0].measurement_date).toBe('2026-10-22');
  });

  it('preserves absent values while retaining genuine zero and 50th percentiles', () => {
    const result = buildGrowthProgress([growth({ percentiles: { weight: 50, height: 0 } }), growth({})], '2026-10-01');
    expect(result[0]).toMatchObject({ weight: null, height: null, weightPercentile: 50, heightPercentile: 0 });
    expect(result[1].weightPercentile).toBeNull();
    expect(buildPercentileComparison(growth({}), growth({}))).toEqual([]);
    expect(readPercentile({ weight: '50' }, 'weight')).toBeNull();
    expect(readPercentile({ weight: 101 }, 'weight')).toBeNull();
  });
});
