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
import { Moon, Clock, TrendingUp, Target, Zap, Sun } from "lucide-react";
import { sleepApi } from "../../services/api";
import type { SleepSession } from "../../types/api";
import { parseISO, format, startOfDay, subDays, getHours, differenceInMinutes } from "date-fns";

interface SleepAnalyticsProps {
  babyId: string;
  refreshTrigger?: number;
}

export function SleepAnalytics({ babyId, refreshTrigger }: SleepAnalyticsProps) {
  const [sleeps, setSleeps] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSleeps();
  }, [babyId, refreshTrigger]);

  const fetchSleeps = async () => {
    try {
      setLoading(true);
      const data = await sleepApi.getAll({ baby_id: babyId });
      setSleeps(data);
    } catch (error) {
      console.error('Failed to fetch sleep data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading sleep analytics...</div>;
  }

  // Calculate analytics from real data

  // Last 7 days sleep trends
  const sleepTrendsData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySleeps = sleeps.filter((s: SleepSession) => {
      const sleepDate = parseISO(s.sleep_start);
      return startOfDay(sleepDate).getTime() === startOfDay(date).getTime();
    });

    const nightSleeps = daySleeps.filter((s: SleepSession) => s.sleep_type === 'nighttime');
    const napSleeps = daySleeps.filter((s: SleepSession) => s.sleep_type === 'nap');

    const nightSleepHours = nightSleeps.reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / 60;
    const napHours = napSleeps.reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / 60;
    const totalSleepHours = nightSleepHours + napHours;

    // Count wake-ups (sleep sessions that start between 10pm and 6am that aren't the main night sleep)
    const wakeUps = daySleeps.filter((s: SleepSession) => {
      const hour = getHours(parseISO(s.sleep_start));
      return (hour >= 22 || hour < 6) && (s.duration_minutes || 0) < 120;
    }).length;

    return {
      date: format(date, 'MMM d'),
      totalSleep: Math.round(totalSleepHours * 10) / 10,
      nightSleep: Math.round(nightSleepHours * 10) / 10,
      napTotal: Math.round(napHours * 10) / 10,
      wakeUps,
    };
  });

  // Sleep patterns by time of day
  const getSleepsByTimeOfDay = (hour: number, label: string, type: string) => {
    const relevantSleeps = sleeps.filter((s: SleepSession) => {
      const sleepHour = getHours(parseISO(s.sleep_start));
      return Math.abs(sleepHour - hour) <= 2;
    });

    const avgDuration = relevantSleeps.length > 0
      ? relevantSleeps.reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / relevantSleeps.length / 60
      : 0;

    // Calculate quality based on sleep_quality field
    const qualityScores = { 'deep': 100, 'good': 85, 'fair': 70, 'restless': 50 };
    const avgQuality = relevantSleeps.length > 0
      ? relevantSleeps.reduce((sum: number, s: SleepSession) => sum + (qualityScores[s.sleep_quality] || 70), 0) / relevantSleeps.length
      : 0;

    return {
      time: label,
      type,
      duration: Math.round(avgDuration * 10) / 10,
      quality: Math.round(avgQuality),
    };
  };

  const sleepPatternsData = [
    getSleepsByTimeOfDay(19, '7PM', 'bedtime'),
    getSleepsByTimeOfDay(9, '9AM', 'morning nap'),
    getSleepsByTimeOfDay(13, '1PM', 'afternoon nap'),
    getSleepsByTimeOfDay(16, '4PM', 'evening nap'),
  ].filter(d => d.duration > 0);

  // Wake window analysis
  const sortedSleeps = [...sleeps].sort((a, b) =>
    new Date(a.sleep_start).getTime() - new Date(b.sleep_start).getTime()
  );

  const wakeWindows: { timeOfDay: string; windows: number[] }[] = [
    { timeOfDay: '6-9AM', windows: [] },
    { timeOfDay: '9AM-1PM', windows: [] },
    { timeOfDay: '1-4PM', windows: [] },
    { timeOfDay: '4-7PM', windows: [] },
  ];

  sortedSleeps.slice(1).forEach((sleep, i) => {
    const prevSleep = sortedSleeps[i];
    const prevEnd = new Date(prevSleep.sleep_start).getTime() + (prevSleep.duration_minutes || 0) * 60000;
    const currentStart = new Date(sleep.sleep_start).getTime();
    const windowMinutes = (currentStart - prevEnd) / 60000;

    if (windowMinutes > 0 && windowMinutes < 600) { // Less than 10 hours
      const hour = getHours(parseISO(sleep.sleep_start));
      if (hour >= 6 && hour < 9) wakeWindows[0].windows.push(windowMinutes);
      else if (hour >= 9 && hour < 13) wakeWindows[1].windows.push(windowMinutes);
      else if (hour >= 13 && hour < 16) wakeWindows[2].windows.push(windowMinutes);
      else if (hour >= 16 && hour < 19) wakeWindows[3].windows.push(windowMinutes);
    }
  });

  const recommendedWindows = [2.5, 3.0, 3.0, 3.5]; // hours
  const wakeWindowData = wakeWindows.map((w, i) => {
    const avgWindow = w.windows.length > 0
      ? w.windows.reduce((a, b) => a + b, 0) / w.windows.length / 60
      : 0;
    const variance = w.windows.length > 1
      ? Math.sqrt(w.windows.map(x => Math.pow(x/60 - avgWindow, 2)).reduce((a, b) => a + b, 0) / w.windows.length)
      : 0;

    return {
      timeOfDay: w.timeOfDay,
      avgWindow: Math.round(avgWindow * 10) / 10,
      recommended: recommendedWindows[i],
      variance: Math.round(variance * 10) / 10,
    };
  }).filter(d => d.avgWindow > 0);

  // Sleep location distribution
  const locationCounts: Record<string, number> = {};
  sleeps.forEach((s: SleepSession) => {
    const location = s.location || 'other';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });

  const locationColors: Record<string, string> = {
    'crib': '#8884d8',
    'bassinet': '#82ca9d',
    'stroller': '#ffc658',
    'car_seat': '#ff7c7c',
    'parent_bed': '#a78bfa',
    'other': '#94a3b8',
  };

  const locationLabels: Record<string, string> = {
    'crib': 'Crib',
    'bassinet': 'Bassinet',
    'stroller': 'Stroller',
    'car_seat': 'Car Seat',
    'parent_bed': 'Parent Bed',
    'other': 'Other',
  };

  const totalSleepSessions = sleeps.length || 1;
  const sleepLocationData = Object.entries(locationCounts).map(([location, count]) => ({
    name: locationLabels[location] || location,
    value: Math.round((count / totalSleepSessions) * 100),
    color: locationColors[location] || '#94a3b8',
  }));

  // Sleep efficiency by week (last 6 weeks)
  const sleepEfficiencyData = Array.from({ length: 6 }, (_, i) => {
    const weekStart = subDays(new Date(), (5 - i) * 7 + 7);
    const weekEnd = subDays(new Date(), (5 - i) * 7);

    const weekSleeps = sleeps.filter((s: SleepSession) => {
      const sleepDate = parseISO(s.sleep_start);
      return sleepDate >= weekStart && sleepDate < weekEnd;
    });

    // Efficiency based on quality scores
    const qualityScores = { 'deep': 100, 'good': 85, 'fair': 70, 'restless': 50 };
    const avgEfficiency = weekSleeps.length > 0
      ? weekSleeps.reduce((sum: number, s: SleepSession) => sum + (qualityScores[s.sleep_quality] || 70), 0) / weekSleeps.length
      : 0;

    const avgDuration = weekSleeps.length > 0
      ? weekSleeps.reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / weekSleeps.length
      : 0;

    // Count wake-ups for the week
    const wakeUps = weekSleeps.filter((s: SleepSession) => {
      const hour = getHours(parseISO(s.sleep_start));
      return (hour >= 22 || hour < 6) && (s.duration_minutes || 0) < 120;
    }).length / 7;

    return {
      week: `Week ${i + 1}`,
      efficiency: Math.round(avgEfficiency),
      avgDuration: Math.round(avgDuration),
      wakeUps: Math.round(wakeUps * 10) / 10,
    };
  }).filter(d => d.efficiency > 0);

  // Calculate key metrics
  const last7DaysSleeps = sleeps.filter((s: SleepSession) => {
    const sleepDate = parseISO(s.sleep_start);
    return sleepDate >= subDays(new Date(), 7);
  });

  const currentEfficiency = sleepEfficiencyData.length > 0
    ? sleepEfficiencyData[sleepEfficiencyData.length - 1].efficiency
    : 0;

  const avgNightSleep = sleepTrendsData.reduce((sum, d) => sum + d.nightSleep, 0) / sleepTrendsData.filter(d => d.nightSleep > 0).length || 0;
  const avgWakeUps = sleepTrendsData.reduce((sum, d) => sum + d.wakeUps, 0) / sleepTrendsData.filter(d => d.wakeUps >= 0).length || 0;
  const avgNapTime = sleepTrendsData.reduce((sum, d) => sum + d.napTotal, 0) / sleepTrendsData.filter(d => d.napTotal > 0).length || 0;

  // Week over week comparison
  const thisWeekSleeps = sleeps.filter((s: SleepSession) => {
    const sleepDate = parseISO(s.sleep_start);
    return sleepDate >= subDays(new Date(), 7);
  });
  const lastWeekSleeps = sleeps.filter((s: SleepSession) => {
    const sleepDate = parseISO(s.sleep_start);
    return sleepDate >= subDays(new Date(), 14) && sleepDate < subDays(new Date(), 7);
  });

  const thisWeekNightSleep = thisWeekSleeps
    .filter((s: SleepSession) => s.sleep_type === 'nighttime')
    .reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / 60 / 7;
  const lastWeekNightSleep = lastWeekSleeps
    .filter((s: SleepSession) => s.sleep_type === 'nighttime')
    .reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / 60 / 7;
  const nightSleepChange = (thisWeekNightSleep - lastWeekNightSleep) * 60; // in minutes

  const thisWeekWakeUps = thisWeekSleeps.filter((s: SleepSession) => {
    const hour = getHours(parseISO(s.sleep_start));
    return (hour >= 22 || hour < 6) && (s.duration_minutes || 0) < 120;
  }).length / 7;
  const lastWeekWakeUps = lastWeekSleeps.filter((s: SleepSession) => {
    const hour = getHours(parseISO(s.sleep_start));
    return (hour >= 22 || hour < 6) && (s.duration_minutes || 0) < 120;
  }).length / 7;
  const wakeUpsChange = lastWeekWakeUps - thisWeekWakeUps;

  // Find best sleeping location
  const bestLocation = sleepLocationData.length > 0
    ? sleepLocationData.reduce((best, current) => current.value > best.value ? current : best)
    : null;

  // Calculate improvement over time
  const firstWeekEfficiency = sleepEfficiencyData.length > 0 ? sleepEfficiencyData[0].efficiency : 0;
  const latestEfficiency = sleepEfficiencyData.length > 0 ? sleepEfficiencyData[sleepEfficiencyData.length - 1].efficiency : 0;
  const efficiencyImprovement = latestEfficiency - firstWeekEfficiency;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sleep Efficiency</p>
                <p className="text-2xl font-bold">{currentEfficiency > 0 ? `${currentEfficiency}%` : 'N/A'}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
            {currentEfficiency > 0 && <Progress value={currentEfficiency} className="mt-2" />}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Night Sleep</p>
                <p className="text-2xl font-bold">{avgNightSleep > 0 ? `${avgNightSleep.toFixed(1)}h` : 'N/A'}</p>
              </div>
              <Moon className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {nightSleepChange !== 0 && !isNaN(nightSleepChange) ? (
                <>
                  <TrendingUp className={`w-4 h-4 ${nightSleepChange > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm ${nightSleepChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {nightSleepChange > 0 ? '+' : ''}{Math.round(nightSleepChange)}min vs last week
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Track more data</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Wake Ups</p>
                <p className="text-2xl font-bold">{avgWakeUps > 0 ? avgWakeUps.toFixed(1) : 'N/A'}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {wakeUpsChange !== 0 && !isNaN(wakeUpsChange) ? (
                <>
                  <TrendingUp className={`w-4 h-4 ${wakeUpsChange > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm ${wakeUpsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {wakeUpsChange > 0 ? '-' : '+'}{Math.abs(wakeUpsChange).toFixed(1)} vs last week
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Track more data</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Nap Time</p>
                <p className="text-2xl font-bold">{avgNapTime > 0 ? `${avgNapTime.toFixed(1)}h` : 'N/A'}</p>
              </div>
              <Sun className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">
                {avgNapTime >= 3 && avgNapTime <= 5 ? 'Optimal range' : avgNapTime > 0 ? 'Daily average' : 'Track more data'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Duration Trends</CardTitle>
            <CardDescription>Daily breakdown of night sleep vs naps</CardDescription>
          </CardHeader>
          <CardContent>
            {sleepTrendsData.some(d => d.totalSleep > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={sleepTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Bar dataKey="nightSleep" stackId="a" fill="#8884d8" name="Night Sleep" />
                  <Bar dataKey="napTotal" stackId="a" fill="#82ca9d" name="Naps" />
                  <Line type="monotone" dataKey="wakeUps" stroke="#ff7c7c" strokeWidth={2} name="Wake Ups" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sleep data available for the last 7 days
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Quality by Time</CardTitle>
            <CardDescription>Sleep duration and quality for different sleep periods</CardDescription>
          </CardHeader>
          <CardContent>
            {sleepPatternsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sleepPatternsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="duration" orientation="left" />
                  <YAxis yAxisId="quality" orientation="right" />
                  <Bar yAxisId="duration" dataKey="duration" fill="#8884d8" name="Duration (hours)" />
                  <Line yAxisId="quality" type="monotone" dataKey="quality" stroke="#82ca9d" strokeWidth={2} name="Quality %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sleep pattern data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wake Windows Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Wake Window Analysis</CardTitle>
          <CardDescription>How your baby's wake windows compare to recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          {wakeWindowData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wakeWindowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeOfDay" />
                  <YAxis />
                  <Bar dataKey="avgWindow" fill="#8884d8" name="Actual" />
                  <Bar dataKey="recommended" fill="#82ca9d" opacity={0.6} name="Recommended" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {wakeWindowData.map((period) => (
                  <div key={period.timeOfDay} className="text-center">
                    <p className="text-sm font-medium">{period.timeOfDay}</p>
                    <p className="text-xs text-muted-foreground">
                      {period.avgWindow}h actual vs {period.recommended}h ideal
                    </p>
                    <Badge
                      variant={Math.abs(period.avgWindow - period.recommended) <= 0.3 ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {Math.abs(period.avgWindow - period.recommended) <= 0.3 ? "On Track" : "Adjust"}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Not enough data to analyze wake windows. Track more sleep sessions to see insights.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Location & Efficiency */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Locations</CardTitle>
            <CardDescription>Where your baby sleeps best</CardDescription>
          </CardHeader>
          <CardContent>
            {sleepLocationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sleepLocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {sleepLocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {bestLocation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">
                      <strong>Insight:</strong> {bestLocation.name} sleep accounts for {bestLocation.value}% of total sleep sessions.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No sleep location data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Efficiency Progress</CardTitle>
            <CardDescription>Weekly improvement in sleep patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {sleepEfficiencyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={sleepEfficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Efficiency %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Efficiency</span>
                    <span className="font-semibold">{latestEfficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Improvement</span>
                    <span className={`font-semibold ${efficiencyImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {efficiencyImprovement >= 0 ? '+' : ''}{efficiencyImprovement}% over {sleepEfficiencyData.length} weeks
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Not enough data to show efficiency trends
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data-based Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Sleep Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sleeps.length > 0 ? (
              <>
                {avgNightSleep > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Pattern</Badge>
                    <p className="text-sm">
                      Average night sleep is {avgNightSleep.toFixed(1)} hours.
                      {avgNightSleep >= 10 ? ' This is excellent for development!' :
                       avgNightSleep >= 8 ? ' This is within healthy range.' :
                       ' Consider establishing earlier bedtime routines.'}
                    </p>
                  </div>
                )}
                {bestLocation && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Location</Badge>
                    <p className="text-sm">
                      {bestLocation.name} is the most common sleep location ({bestLocation.value}% of sessions).
                      Consistency in sleep location helps establish better sleep patterns.
                    </p>
                  </div>
                )}
                {wakeWindowData.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Optimization</Badge>
                    <p className="text-sm">
                      {wakeWindowData.some(w => Math.abs(w.avgWindow - w.recommended) <= 0.3)
                        ? 'Wake windows are well-aligned with recommendations. Keep up the good work!'
                        : 'Consider adjusting wake windows to match age-appropriate recommendations for better sleep quality.'}
                    </p>
                  </div>
                )}
                {efficiencyImprovement > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Progress</Badge>
                    <p className="text-sm">
                      Sleep efficiency has improved by {efficiencyImprovement}% over the tracking period. Great progress!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Getting Started</Badge>
                <p className="text-sm">
                  Start tracking sleep sessions to see personalized insights about patterns, quality, and efficiency!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
