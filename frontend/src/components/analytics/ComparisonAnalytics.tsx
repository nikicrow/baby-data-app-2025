import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  Legend,
} from 'recharts';
import { Moon, Baby, Sun, Timer } from "lucide-react";
import { analyticsApi } from "../../services/api";
import type { ComparisonResponse, WeeklyMetricsRow } from "../../types/api";

// Stable series colours assigned by baby order (API orders by date of birth)
const BABY_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8093'];

// Weeks with fewer logged days than this are hidden from charts — a
// 2-day-old week average swings wildly and reads as a sudden drop.
const MIN_DAYS_PER_WEEK = 4;

type MetricKey = keyof Pick<
  WeeklyMetricsRow,
  | 'avg_night_sleep_minutes'
  | 'avg_nap_count'
  | 'avg_nap_length_minutes'
  | 'avg_total_nap_minutes'
  | 'avg_feed_count'
  | 'avg_feed_interval_minutes'
  | 'avg_wake_window_minutes'
  | 'avg_longest_night_stretch_minutes'
>;

export function ComparisonAnalytics() {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const comparison = await analyticsApi.compare('age_weeks');
      setData(comparison);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to load comparison data');
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading comparison...</div>;
  }

  if (error || !data || !data.weekly) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {error || 'No comparison data available'}
        </CardContent>
      </Card>
    );
  }

  if (data.babies.length < 2) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Comparison needs at least two babies with tracked data.
        </CardContent>
      </Card>
    );
  }

  const babies = data.babies; // ordered by date of birth
  const babyNames = babies.map(b => b.baby_name);

  // The comparison window ends where the youngest baby's data ends
  const overlapWeeks = Math.min(...babies.map(b => Math.floor(b.max_age_days / 7)));

  const usableRows = data.weekly.filter(
    row => row.days_in_week >= MIN_DAYS_PER_WEEK && row.age_weeks <= overlapWeeks
  );

  // Pivot rows for one metric into [{ week, Ember: v, Imogen: v }, ...]
  const pivot = (metric: MetricKey, transform: (v: number) => number = v => v) => {
    const byWeek = new Map<number, Record<string, number>>();
    for (const row of usableRows) {
      const value = row[metric];
      if (value === null) continue;
      const entry = byWeek.get(row.age_weeks) ?? { week: row.age_weeks };
      entry[row.baby_name] = Math.round(transform(value) * 10) / 10;
      byWeek.set(row.age_weeks, entry);
    }
    return Array.from(byWeek.values()).sort((a, b) => a.week - b.week);
  };

  // Latest week where every baby has a usable value for the summary cards
  const latestSharedWeek = (metric: MetricKey): { week: number; values: Record<string, number> } | null => {
    const rows = pivot(metric);
    for (let i = rows.length - 1; i >= 0; i--) {
      if (babyNames.every(name => rows[i][name] !== undefined)) {
        const { week, ...values } = rows[i];
        return { week, values: values as Record<string, number> };
      }
    }
    return null;
  };

  const minutesToHours = (v: number) => v / 60;

  const nightSleepData = pivot('avg_night_sleep_minutes', minutesToHours);
  const feedsData = pivot('avg_feed_count');
  const napLengthData = pivot('avg_nap_length_minutes');
  const wakeWindowData = pivot('avg_wake_window_minutes');

  const summaries = [
    {
      title: 'Night sleep',
      icon: Moon,
      unit: 'h',
      shared: latestSharedWeek('avg_night_sleep_minutes'),
      format: (v: number) => (v / 60).toFixed(1),
    },
    {
      title: 'Feeds / day',
      icon: Baby,
      unit: '',
      shared: latestSharedWeek('avg_feed_count'),
      format: (v: number) => v.toFixed(1),
    },
    {
      title: 'Avg nap length',
      icon: Sun,
      unit: 'min',
      shared: latestSharedWeek('avg_nap_length_minutes'),
      format: (v: number) => Math.round(v).toString(),
    },
    {
      title: 'Avg wake window',
      icon: Timer,
      unit: 'min',
      shared: latestSharedWeek('avg_wake_window_minutes'),
      format: (v: number) => Math.round(v).toString(),
    },
  ];

  const comparisonChart = (
    title: string,
    description: string,
    chartData: Record<string, number>[],
    yLabel: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              type="number"
              domain={[0, overlapWeeks]}
              label={{ value: 'Age (weeks)', position: 'insideBottom', offset: -2 }}
            />
            <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip labelFormatter={(week) => `Week ${week}`} />
            <Legend />
            {babyNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={BABY_COLORS[i % BABY_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Comparison window note */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-medium">
            {babyNames.join(' vs ')} at the same age
          </h3>
          <p className="text-sm text-muted-foreground">
            Weekly averages over the first {overlapWeeks} weeks — the window grows as{' '}
            {babies[babies.length - 1].baby_name} does.
          </p>
        </div>
        <div className="flex gap-2">
          {babies.map((b, i) => (
            <Badge
              key={b.baby_id}
              variant="outline"
              style={{ borderColor: BABY_COLORS[i % BABY_COLORS.length], color: BABY_COLORS[i % BABY_COLORS.length] }}
            >
              {b.baby_name} · born {new Date(b.date_of_birth).toLocaleDateString()}
            </Badge>
          ))}
        </div>
      </div>

      {/* Summary cards at the latest shared week */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map(({ title, icon: Icon, unit, shared, format }) => (
          <Card key={title}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{title}</span>
              </div>
              {shared ? (
                <>
                  <div className="space-y-1">
                    {babyNames.map((name, i) => (
                      <div key={name} className="flex items-baseline justify-between">
                        <span className="text-sm" style={{ color: BABY_COLORS[i % BABY_COLORS.length] }}>
                          {name}
                        </span>
                        <span className="font-semibold">
                          {format(shared.values[name])}
                          {unit && <span className="text-xs font-normal text-muted-foreground"> {unit}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">at week {shared.week}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not enough data</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {comparisonChart(
          'Night sleep',
          'Average hours of night sleep per night, by week of age',
          nightSleepData,
          'Hours'
        )}
        {comparisonChart(
          'Feeding frequency',
          'Average feeds per day, by week of age',
          feedsData,
          'Feeds / day'
        )}
        {comparisonChart(
          'Nap length',
          'Average nap length in minutes, by week of age',
          napLengthData,
          'Minutes'
        )}
        {comparisonChart(
          'Wake windows',
          'Average daytime wake window in minutes, by week of age',
          wakeWindowData,
          'Minutes'
        )}
      </div>
    </div>
  );
}
