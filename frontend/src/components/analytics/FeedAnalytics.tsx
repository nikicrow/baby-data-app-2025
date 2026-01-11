import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { Baby, Clock, TrendingUp, Droplets, Zap, Timer } from "lucide-react";
import { feedingApi } from "../../services/api";
import type { FeedingSession } from "../../types/api";
import { parseISO, format, startOfDay, subDays, getHours, differenceInMinutes } from "date-fns";

interface FeedAnalyticsProps {
  babyId: string;
  refreshTrigger?: number;
}

export function FeedAnalytics({ babyId, refreshTrigger }: FeedAnalyticsProps) {
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedings();
  }, [babyId, refreshTrigger]);

  const fetchFeedings = async () => {
    try {
      setLoading(true);
      const data = await feedingApi.getAll({ baby_id: babyId });
      setFeedings(data);
    } catch (error) {
      console.error('Failed to fetch feeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading feeding analytics...</div>;
  }

  // Calculate analytics from real data

  // 24-hour feeding pattern - group by 3-hour windows
  const feedingFrequencyData = Array.from({ length: 8 }, (_, i) => {
    const hourStart = i * 3;
    const timeLabel = `${hourStart === 0 ? 12 : hourStart > 12 ? hourStart - 12 : hourStart}${hourStart < 12 ? 'AM' : 'PM'}`;

    const feedsInWindow = feedings.filter((f: FeedingSession) => {
      const hour = getHours(parseISO(f.start_time));
      return hour >= hourStart && hour < hourStart + 3;
    });

    const avgDuration = feedsInWindow.length > 0
      ? feedsInWindow.reduce((sum: number, f: FeedingSession) => sum + (f.duration_minutes || 0), 0) / feedsInWindow.length
      : 0;

    return {
      time: timeLabel,
      feeds: feedsInWindow.length,
      avgDuration: Math.round(avgDuration),
      efficiency: avgDuration > 0 ? Math.min(100, Math.round((avgDuration / 30) * 100)) : 0, // Rough efficiency based on duration
    };
  });

  // Last 7 days feeding trends
  const feedingTrendsData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayFeedings = feedings.filter((f: FeedingSession) => {
      const feedDate = parseISO(f.start_time);
      return startOfDay(feedDate).getTime() === startOfDay(date).getTime();
    });

    const breastFeeds = dayFeedings.filter((f: FeedingSession) => f.feeding_type === 'breast').length;
    const bottleFeeds = dayFeedings.filter((f: FeedingSession) => f.feeding_type === 'bottle').length;
    const solidFeeds = dayFeedings.filter((f: FeedingSession) => f.feeding_type === 'solid').length;
    const totalVolume = dayFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.amount_ml || 0), 0);

    return {
      date: format(date, 'MMM d'),
      breastFeeds,
      bottleFeeds,
      pumpSessions: solidFeeds, // Reusing for solid foods
      totalVolume,
    };
  });

  // Calculate feeding intervals
  const sortedFeedings = [...feedings].sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const intervals = sortedFeedings.slice(1).map((feed, i) => {
    const prevFeed = sortedFeedings[i];
    return differenceInMinutes(parseISO(feed.start_time), parseISO(prevFeed.start_time));
  });

  const intervalCounts = {
    '1-2h': intervals.filter(i => i >= 60 && i < 120).length,
    '2-3h': intervals.filter(i => i >= 120 && i < 180).length,
    '3-4h': intervals.filter(i => i >= 180 && i < 240).length,
    '4+h': intervals.filter(i => i >= 240).length,
  };

  const totalIntervals = intervals.length || 1;
  const feedingIntervalsData = [
    { interval: '1-2h', count: intervalCounts['1-2h'], percentage: Math.round((intervalCounts['1-2h'] / totalIntervals) * 100) },
    { interval: '2-3h', count: intervalCounts['2-3h'], percentage: Math.round((intervalCounts['2-3h'] / totalIntervals) * 100) },
    { interval: '3-4h', count: intervalCounts['3-4h'], percentage: Math.round((intervalCounts['3-4h'] / totalIntervals) * 100) },
    { interval: '4+h', count: intervalCounts['4+h'], percentage: Math.round((intervalCounts['4+h'] / totalIntervals) * 100) },
  ];

  // Breast side preference
  const leftFeeds = feedings.filter((f: FeedingSession) => f.breast_side === 'left');
  const rightFeeds = feedings.filter((f: FeedingSession) => f.breast_side === 'right');
  const totalSideFeeds = leftFeeds.length + rightFeeds.length || 1;

  const leftAvgDuration = leftFeeds.length > 0
    ? leftFeeds.reduce((sum: number, f: FeedingSession) => sum + (f.duration_minutes || 0), 0) / leftFeeds.length
    : 0;
  const rightAvgDuration = rightFeeds.length > 0
    ? rightFeeds.reduce((sum: number, f: FeedingSession) => sum + (f.duration_minutes || 0), 0) / rightFeeds.length
    : 0;

  const sidePreferenceData = [
    { name: 'Left', value: Math.round((leftFeeds.length / totalSideFeeds) * 100), color: '#8884d8', avgDuration: Math.round(leftAvgDuration) },
    { name: 'Right', value: Math.round((rightFeeds.length / totalSideFeeds) * 100), color: '#82ca9d', avgDuration: Math.round(rightAvgDuration) },
  ].filter(d => d.value > 0);

  // Volume progress (last 6 weeks)
  const volumeProgressData = Array.from({ length: 6 }, (_, i) => {
    const weekStart = subDays(new Date(), (5 - i) * 7);
    const weekEnd = subDays(new Date(), (5 - i) * 7 - 7);

    const weekFeedings = feedings.filter((f: FeedingSession) => {
      const feedDate = parseISO(f.start_time);
      return feedDate >= weekEnd && feedDate < weekStart;
    });

    const bottleFeedings = weekFeedings.filter((f: FeedingSession) => f.feeding_type === 'bottle');
    const avgBottle = bottleFeedings.length > 0
      ? bottleFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.amount_ml || 0), 0) / bottleFeedings.length
      : 0;

    const dailyTotal = weekFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.amount_ml || 0), 0) / 7;

    return {
      week: `Week ${i + 1}`,
      avgBottle: Math.round(avgBottle),
      dailyTotal: Math.round(dailyTotal),
      pumpOutput: 0, // We don't track pump sessions separately
    };
  });

  // Cluster feeding analysis (2-hour windows)
  const clusterFeedingData = [
    { timeRange: '5-7PM', start: 17, end: 19 },
    { timeRange: '7-9PM', start: 19, end: 21 },
    { timeRange: '9-11PM', start: 21, end: 23 },
    { timeRange: '11PM-1AM', start: 23, end: 1 },
    { timeRange: '1-3AM', start: 1, end: 3 },
    { timeRange: '3-5AM', start: 3, end: 5 },
  ].map(window => {
    const feedsInWindow = feedings.filter((f: FeedingSession) => {
      const hour = getHours(parseISO(f.start_time));
      if (window.start > window.end) {
        // Crosses midnight
        return hour >= window.start || hour < window.end;
      }
      return hour >= window.start && hour < window.end;
    });

    const frequency = feedsInWindow.length / 7; // Average per day over week
    const isCluster = frequency > 2; // More than 2 feeds in 2-hour window = cluster

    return {
      timeRange: window.timeRange,
      frequency: Number(frequency.toFixed(1)),
      avgInterval: 0,
      isCluster,
    };
  });

  // Calculate key metrics
  const last7DaysFeedings = feedings.filter((f: FeedingSession) => {
    const feedDate = parseISO(f.start_time);
    return feedDate >= subDays(new Date(), 7);
  });

  const dailyAverage = (last7DaysFeedings.length / 7).toFixed(1);
  const avgDuration = feedings.length > 0
    ? Math.round(feedings.reduce((sum: number, f: FeedingSession) => sum + (f.duration_minutes || 0), 0) / feedings.length)
    : 0;

  const todayVolume = feedings.filter((f: FeedingSession) => {
    const feedDate = parseISO(f.start_time);
    return startOfDay(feedDate).getTime() === startOfDay(new Date()).getTime();
  }).reduce((sum: number, f: FeedingSession) => sum + (f.amount_ml || 0), 0);

  const avgVolume = feedingTrendsData.reduce((sum, d) => sum + d.totalVolume, 0) / 7;

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
                <Bar yAxisId="feeds" dataKey="breastFeeds" stackId="a" fill="#8884d8" name="Breast" />
                <Bar yAxisId="feeds" dataKey="bottleFeeds" stackId="a" fill="#82ca9d" name="Bottle" />
                <Bar yAxisId="feeds" dataKey="pumpSessions" stackId="a" fill="#ffc658" name="Pump" />
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
              <Bar dataKey="count" fill="#8884d8" />
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
                <Line type="monotone" dataKey="avgBottle" stroke="#8884d8" strokeWidth={2} name="Avg Bottle (ml)" />
                <Line type="monotone" dataKey="pumpOutput" stroke="#82ca9d" strokeWidth={2} name="Pump Output (ml)" />
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
              <Bar
                dataKey="frequency"
                fill={(data) => data.isCluster ? "#ff7c7c" : "#8884d8"}
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