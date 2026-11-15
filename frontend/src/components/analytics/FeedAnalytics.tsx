import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts';
import { Baby, Clock, Droplets, Zap, Timer } from "lucide-react";
import { feedingApi } from "../../services/api";
import type { FeedingSession } from "../../types/api";
import { buildFeedingAnalytics } from './feedingCalculations';

interface FeedAnalyticsProps {
  babyId: string;
  refreshTrigger?: number;
  /** Anchor for all relative time windows. Defaults to the real "now". */
  referenceDate?: Date;
}

export function FeedAnalytics({ babyId, refreshTrigger, referenceDate }: FeedAnalyticsProps) {
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedings = async () => {
      try {
        setLoading(true);
        const data = await feedingApi.getAll({ baby_id: babyId, limit: 2000 });
        setFeedings(data);
      } catch (error) {
        console.error('Failed to fetch feeding data:', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchFeedings();
  }, [babyId, refreshTrigger]);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading feeding analytics...</div>;
  }

  // Anchor all relative windows on the reference date (defaults to now).
  const now = referenceDate ?? new Date();

  const { feedingFrequencyData, feedingTrendsData, intervals, intervalCounts, totalIntervals, feedingIntervalsData, volumeProgressData, clusterFeedingData, dailyAverage, avgDuration, todayVolume, avgVolume, sidePreferenceData } = buildFeedingAnalytics(feedings, now);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{dailyAverage}</p>
              </div>
              <Baby className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{avgDuration > 0 ? `${avgDuration}min` : 'N/A'}</p>
              </div>
              <Timer className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">
                {avgDuration >= 15 && avgDuration <= 30 ? 'Optimal range' : 'Track more data'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Interval</p>
                <p className="text-2xl font-bold">
                  {intervals.length > 0
                    ? `${Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length / 60 * 10) / 10}h`
                    : 'N/A'}
                </p>
              </div>
              <Droplets className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">{intervals.length} intervals</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Volume</p>
                <p className="text-2xl font-bold">{avgVolume > 0 ? `${Math.round(avgVolume)}ml` : 'N/A'}</p>
              </div>
              <Baby className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Today: {todayVolume}ml</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feeding Patterns */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>24-Hour Feeding Pattern</CardTitle>
            <CardDescription>Feed frequency and duration throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={feedingFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="duration" orientation="left" />
                <YAxis yAxisId="efficiency" orientation="right" />
                <Legend />
                <Bar yAxisId="duration" dataKey="avgDuration" fill="#8884d8" name="Duration (min)" />
                <Line yAxisId="efficiency" type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} name="Efficiency %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Feeding Trends</CardTitle>
            <CardDescription>Breakdown of feeding methods and volumes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={feedingTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="feeds" orientation="left" />
                <YAxis yAxisId="volume" orientation="right" />
                <Legend />
                <Bar yAxisId="feeds" dataKey="breastFeeds" stackId="a" fill="#8884d8" name="Breast" />
                <Bar yAxisId="feeds" dataKey="bottleFeeds" stackId="a" fill="#82ca9d" name="Bottle" />
                <Bar yAxisId="feeds" dataKey="solidFeeds" stackId="a" fill="#ffc658" name="Solid" />
                <Line yAxisId="volume" type="monotone" dataKey="totalVolume" stroke="#ff7c7c" strokeWidth={2} name="Volume (ml)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feeding Intervals */}
      <Card>
        <CardHeader>
          <CardTitle>Feeding Interval Analysis</CardTitle>
          <CardDescription>Distribution of time between feeds</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={feedingIntervalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="interval" />
              <YAxis />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Feed intervals" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {feedingIntervalsData.map((interval) => (
              <div key={interval.interval} className="text-center">
                <p className="text-sm font-medium">{interval.interval}</p>
                <p className="text-lg font-bold">{interval.percentage}%</p>
                <p className="text-xs text-muted-foreground">{interval.count} feeds</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side Preference & Volume Progress */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Breast Side Preference</CardTitle>
            <CardDescription>Usage and duration by side</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sidePreferenceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {sidePreferenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {sidePreferenceData.map((side) => (
                <div key={side.name} className="text-center">
                  <p className="text-sm font-medium">{side.name} Side</p>
                  <p className="text-xs text-muted-foreground">Avg: {side.avgDuration}min</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Progress</CardTitle>
            <CardDescription>Weekly progression in feeding volumes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={volumeProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Legend />
                <Line type="monotone" dataKey="avgBottle" stroke="#8884d8" strokeWidth={2} name="Avg Bottle (ml)" />
                <Line type="monotone" dataKey="dailyTotal" stroke="#82ca9d" strokeWidth={2} name="Daily Total (ml)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Latest Bottle Size</span>
                <span className="font-semibold">
                  {volumeProgressData.length > 0 && volumeProgressData[volumeProgressData.length - 1].avgBottle > 0
                    ? `${volumeProgressData[volumeProgressData.length - 1].avgBottle}ml`
                    : 'No data'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Daily Total</span>
                <span className="font-semibold text-green-600">
                  {avgVolume > 0 ? `${Math.round(avgVolume)}ml` : 'No data'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Feeding Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cluster Feeding Patterns</CardTitle>
          <CardDescription>Identifying high-frequency feeding periods</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clusterFeedingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeRange" />
              <YAxis />
              <Legend />
              <Bar
                dataKey="frequency"
                fill="#8884d8"
                name="Feeds per 2h period"
              />
            </BarChart>
          </ResponsiveContainer>
          {clusterFeedingData.some(d => d.isCluster) ? (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm">
                <strong>Cluster Period Detected:</strong>{' '}
                {clusterFeedingData
                  .filter(d => d.isCluster)
                  .map(d => d.timeRange)
                  .join(', ')}{' '}
                shows elevated feeding frequency. This is typical cluster feeding behavior.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm">
                No clear cluster feeding patterns detected. Feeds are distributed relatively evenly throughout the day.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data-based Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Feeding Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedings.length > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary">Volume</Badge>
                  <p className="text-sm">
                    Average daily volume is {Math.round(avgVolume)}ml based on last 7 days of tracking.
                    {todayVolume > avgVolume && ' Today is above average!'}
                  </p>
                </div>
                {sidePreferenceData.length === 2 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Side Preference</Badge>
                    <p className="text-sm">
                      {sidePreferenceData[0].name} side: {sidePreferenceData[0].value}% ({sidePreferenceData[0].avgDuration}min avg),{' '}
                      {sidePreferenceData[1].name} side: {sidePreferenceData[1].value}% ({sidePreferenceData[1].avgDuration}min avg).
                    </p>
                  </div>
                )}
                {intervals.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Timing</Badge>
                    <p className="text-sm">
                      Most common feeding interval: {
                        Object.entries(intervalCounts).sort((a, b) => b[1] - a[1])[0][0]
                      } ({Math.round((Object.entries(intervalCounts).sort((a, b) => b[1] - a[1])[0][1] / totalIntervals) * 100)}% of feeds).
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Getting Started</Badge>
                <p className="text-sm">
                  Start tracking feedings to see personalized insights about patterns, volumes, and timing!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
