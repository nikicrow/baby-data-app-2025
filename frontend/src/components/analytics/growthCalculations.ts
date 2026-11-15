import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { GrowthMeasurement } from '../../types/api';

export function readPercentile(values: Record<string, unknown> | null | undefined, key: string): number | null {
  const value = values?.[key];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value : null;
}

export function buildGrowthProgress(measurements: GrowthMeasurement[], dateOfBirth: string) {
  return [...measurements].sort((a, b) => a.measurement_date.localeCompare(b.measurement_date)).map(g => ({
    date: format(parseISO(g.measurement_date), 'MMM d, yyyy'),
    weight: g.weight_kg ?? null,
    height: g.length_cm ?? null,
    headCircumference: g.head_circumference_cm ?? null,
    weightPercentile: readPercentile(g.percentiles, 'weight'),
    heightPercentile: readPercentile(g.percentiles, 'height'),
    age: differenceInCalendarDays(parseISO(g.measurement_date), parseISO(dateOfBirth)) / 7,
  }));
}

export function buildPercentileComparison(first: GrowthMeasurement | undefined, latest: GrowthMeasurement | undefined) {
  return ([['Weight', 'weight'], ['Height', 'height'], ['Head Circumference', 'head']] as const)
    .map(([measurement, key]) => ({
      measurement,
      birth: readPercentile(first?.percentiles, key),
      current: readPercentile(latest?.percentiles, key),
    }))
    .filter(row => row.birth !== null || row.current !== null);
}
