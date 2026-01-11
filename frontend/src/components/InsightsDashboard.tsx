import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  ScatterChart,
  Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Baby, Droplets, Moon, Scale } from "lucide-react";
import { SleepAnalytics } from "./analytics/SleepAnalytics";
import { FeedAnalytics } from "./analytics/FeedAnalytics";
import { NappyAnalytics } from "./analytics/NappyAnalytics";
import { GrowthAnalytics } from "./analytics/GrowthAnalytics";
import { feedingApi, sleepApi, diaperApi, growthApi } from "../services/api";
import type { FeedingSession, SleepSession, DiaperEvent, GrowthMeasurement } from "../types/api";
import { isToday, parseISO, startOfDay, format, subDays } from "date-fns";

interface InsightsDashboardProps {
  babyId: string;
  refreshTrigger: number;
}

export function InsightsDashboard({ babyId, refreshTrigger }: InsightsDashboardProps) {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Real data from backend
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [sleeps, setSleeps] = useState<SleepSession[]>([]);
  const [diapers, setDiapers] = useState<DiaperEvent[]>([]);
  const [growths, setGrowths] = useState<GrowthMeasurement[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [babyId, refreshTrigger]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [feedingsData, sleepsData, diapersData, growthsData] = await Promise.all([
        feedingApi.getAll({ baby_id: babyId }),
        sleepApi.getAll({ baby_id: babyId }),
        diaperApi.getAll({ baby_id: babyId }),
        growthApi.getAll({ baby_id: babyId }),
      ]);

      setFeedings(feedingsData);
      setSleeps(sleepsData);
      setDiapers(diapersData);
      setGrowths(growthsData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real analytics from data
  const todayFeedings = feedings.filter(f => isToday(parseISO(f.start_time)));
  const todaySleeps = sleeps.filter(s => isToday(parseISO(s.sleep_start)));
  const todayDiapers = diapers.filter(d => isToday(parseISO(d.timestamp)));

  const totalSleepToday = todaySleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const sleepHoursToday = Math.floor(totalSleepToday / 60);
  const sleepMinsToday = totalSleepToday % 60;

  // Weekly feed data - last 7 days
  const weeklyFeedData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayFeedings = feedings.filter(f => {
      const feedDate = parseISO(f.start_time);
      return startOfDay(feedDate).getTime() === startOfDay(date).getTime();
    });
    return {
      day: format(date, 'EEE'),
      feeds: dayFeedings.length,
      duration: dayFeedings.reduce((sum, f) => sum + (f.duration_minutes || 0), 0),
    };
  });

  // Feed type distribution
  const breastCount = feedings.filter(f => f.feeding_type === 'breast').length;
  const bottleCount = feedings.filter(f => f.feeding_type === 'bottle').length;
  const solidCount = feedings.filter(f => f.feeding_type === 'solid').length;
  const totalFeeds = breastCount + bottleCount + solidCount;

  const feedTypeData = [
    { name: 'Breast', value: breastCount, color: '#8884d8' },
    { name: 'Bottle', value: bottleCount, color: '#82ca9d' },
    { name: 'Solid', value: solidCount, color: '#ffc658' },
  ].filter(d => d.value > 0);

  // Growth data
  const growthData = growths
    .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
    .map(g => ({
      date: format(parseISO(g.measurement_date), 'MMM d'),
      weight: g.weight_kg || 0,
      height: g.length_cm || 0,
    }));

  // Sleep pattern data - last 7 days
  const sleepPatternData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySleeps = sleeps.filter((s: SleepSession) => {
      const sleepDate = parseISO(s.sleep_start);
      return startOfDay(sleepDate).getTime() === startOfDay(date).getTime();
    });
    const totalDuration = daySleeps.reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0);
    return {
      time: format(date, 'EEE'),
      duration: Math.round(totalDuration / 60 * 10) / 10, // hours with 1 decimal
    };
  });

  // Correlation data - feeds vs diapers per day (last 14 days)
  const correlationData = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayFeeds = feedings.filter((f: FeedingSession) => {
      const feedDate = parseISO(f.start_time);
      return startOfDay(feedDate).getTime() === startOfDay(date).getTime();
    });
    const dayDiapers = diapers.filter((d: DiaperEvent) => {
      const diaperDate = parseISO(d.timestamp);
      return startOfDay(diaperDate).getTime() === startOfDay(date).getTime();
    });
    return {
      feeds: dayFeeds.length,
      nappies: dayDiapers.length,
      date: format(date, 'MMM d'),
    };
  }).filter(d => d.feeds > 0 || d.nappies > 0); // Only show days with data

  // Calculate feeding statistics
  const avgFeedsPerDay = weeklyFeedData.length > 0
    ? (weeklyFeedData.reduce((sum, day) => sum + day.feeds, 0) / weeklyFeedData.length).toFixed(1)
    : '0.0';
  const totalFeedingTime = weeklyFeedData.reduce((sum, day) => sum + day.duration, 0);
  const totalFeedingHours = (totalFeedingTime / 60).toFixed(1);

  // Calculate sleep statistics
  const longestSleep = sleeps.length > 0
    ? Math.max(...sleeps.map((s: SleepSession) => s.duration_minutes || 0))
    : 0;
  const longestSleepHours = Math.floor(longestSleep / 60);
  const longestSleepMins = longestSleep % 60;

  const naps = sleeps.filter((s: SleepSession) => (s.duration_minutes || 0) < 180); // Naps < 3 hours
  const avgNapDuration = naps.length > 0
    ? naps.reduce((sum: number, s: SleepSession) => sum + (s.duration_minutes || 0), 0) / naps.length
    : 0;
  const avgNapHours = Math.floor(avgNapDuration / 60);
  const avgNapMins = Math.round(avgNapDuration % 60);

  // Calculate wake windows (time between sleep sessions)
  const sortedSleeps = [...sleeps].sort((a, b) =>
    new Date(a.sleep_start).getTime() - new Date(b.sleep_start).getTime()
  );
  const wakeWindows = sortedSleeps.slice(1).map((sleep, i) => {
    const prevSleep = sortedSleeps[i];
    const prevEnd = new Date(prevSleep.sleep_start).getTime() + (prevSleep.duration_minutes || 0) * 60000;
    const currentStart = new Date(sleep.sleep_start).getTime();
    return (currentStart - prevEnd) / 60000; // minutes
  }).filter(w => w > 0 && w < 600); // Filter out unrealistic values (< 10 hours)

  const avgWakeWindow = wakeWindows.length > 0
    ? wakeWindows.reduce((sum, w) => sum + w, 0) / wakeWindows.length
    : 0;
  const avgWakeHours = Math.floor(avgWakeWindow / 60);
  const avgWakeMins = Math.round(avgWakeWindow % 60);

  // Calculate growth statistics
  const sortedGrowths = [...growths].sort((a, b) =>
    new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime()
  );
  const firstGrowth = sortedGrowths[0];
  const latestGrowth = sortedGrowths[sortedGrowths.length - 1];

  const weightGain = firstGrowth && latestGrowth
    ? (latestGrowth.weight_kg || 0) - (firstGrowth.weight_kg || 0)
    : 0;
  const weightGainPercent = firstGrowth && firstGrowth.weight_kg
    ? ((weightGain / firstGrowth.weight_kg) * 100).toFixed(0)
    : '0';

  const heightGain = firstGrowth && latestGrowth
    ? (latestGrowth.length_cm || 0) - (firstGrowth.length_cm || 0)
    : 0;
  const heightGainPercent = firstGrowth && firstGrowth.length_cm
    ? ((heightGain / firstGrowth.length_cm) * 100).toFixed(0)
    : '0';

  // Calculate correlation coefficient (Pearson's r)
  const calculateCorrelation = (data: Array<{ feeds: number; nappies: number }>) => {
    if (data.length < 2) return 0;
    const n = data.length;
    const sumFeeds = data.reduce((sum, d) => sum + d.feeds, 0);
    const sumNappies = data.reduce((sum, d) => sum + d.nappies, 0);
    const sumFeedsNappies = data.reduce((sum, d) => sum + d.feeds * d.nappies, 0);
    const sumFeedsSquared = data.reduce((sum, d) => sum + d.feeds * d.feeds, 0);
    const sumNappiesSquared = data.reduce((sum, d) => sum + d.nappies * d.nappies, 0);

    const numerator = n * sumFeedsNappies - sumFeeds * sumNappies;
    const denominator = Math.sqrt((n * sumFeedsSquared - sumFeeds * sumFeeds) * (n * sumNappiesSquared - sumNappies * sumNappies));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const correlation = calculateCorrelation(correlationData);
  const avgDiapersPerFeed = correlationData.length > 0
    ? (correlationData.reduce((sum, d) => sum + d.nappies, 0) / correlationData.reduce((sum, d) => sum + d.feeds, 0)).toFixed(1)
    : '0.0';

  // Generate smart insights
  const avgFeedInterval = feedings.length > 1
    ? (new Date(feedings[0].start_time).getTime() - new Date(feedings[feedings.length - 1].start_time).getTime()) / (feedings.length - 1) / 3600000 // hours
    : 0;
  const avgFeedIntervalHours = Math.abs(avgFeedInterval).toFixed(1);

  // Weight milestone prediction
  const daysOfGrowthData = sortedGrowths.length >= 2
    ? (new Date(latestGrowth.measurement_date).getTime() - new Date(firstGrowth.measurement_date).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const weightGainPerDay = daysOfGrowthData > 0 ? weightGain / daysOfGrowthData : 0;
  const currentWeight = latestGrowth?.weight_kg || 0;
  const nextMilestone = Math.ceil(currentWeight);
  const daysToMilestone = weightGainPerDay > 0 ? Math.round((nextMilestone - currentWeight) / weightGainPerDay) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Tabs */}
      <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="sleep" className="flex items-center gap-2">
            <Moon className="w-4 h-4" />
            <span className="hidden sm:inline">Sleep</span>
          </TabsTrigger>
          <TabsTrigger value="feeds" className="flex items-center gap-2">
            <Baby className="w-4 h-4" />
            <span className="hidden sm:inline">Feeds</span>
          </TabsTrigger>
          <TabsTrigger value="nappies" className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            <span className="hidden sm:inline">Nappies</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Growth</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Feeds</p>
                      <p className="text-2xl font-bold">{todayFeedings.length}</p>
                    </div>
                    <Baby className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {totalFeeds} total logged
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sleep Today</p>
                      <p className="text-2xl font-bold">
                        {totalSleepToday > 0 ? `${sleepHoursToday}h ${sleepMinsToday}m` : '0h'}
                      </p>
                    </div>
                    <Moon className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {todaySleeps.length} sessions
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Nappies Today</p>
                      <p className="text-2xl font-bold">{todayDiapers.length}</p>
                    </div>
                    <Droplets className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-green-600">Normal range</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Latest Weight</p>
                      <p className="text-2xl font-bold">
                        {growths.length > 0
                          ? `${growths.sort((a, b) => new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime())[0].weight_kg}kg`
                          : '-'}
                      </p>
                    </div>
                    <Scale className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {growths.length} measurements
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

      {/* Charts Grid - Responsive Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Feed Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Feeding Pattern</CardTitle>
            <CardDescription>Number of feeds and total feeding time per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyFeedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Bar dataKey="feeds" fill="#8884d8" radius={4} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Avg: {avgFeedsPerDay} feeds/day</span>
              <span>Total: {totalFeedingHours}h feeding time</span>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Sleep Pattern Analysis</CardTitle>
            <CardDescription>Daily sleep duration by time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sleepPatternData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Longest Stretch</p>
                <p className="font-semibold">
                  {longestSleep > 0 ? `${longestSleepHours}h ${longestSleepMins}min` : 'No data'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Nap</p>
                <p className="font-semibold">
                  {avgNapDuration > 0 ? `${avgNapHours}h ${avgNapMins}min` : 'No data'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Wake Windows</p>
                <p className="font-semibold">
                  {avgWakeWindow > 0 ? `${avgWakeHours}h ${avgWakeMins}min` : 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Feed Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Feeding Distribution</CardTitle>
            <CardDescription>Breakdown of feeding methods this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={feedTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {feedTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {feedTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Progress</CardTitle>
            <CardDescription>Weight and height development over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="weight" orientation="left" />
                <YAxis yAxisId="height" orientation="right" />
                <Line 
                  yAxisId="weight"
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Weight (kg)"
                />
                <Line 
                  yAxisId="height"
                  type="monotone" 
                  dataKey="height" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Height (cm)"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Weight Gain</p>
                <p className="font-semibold text-green-600">
                  {weightGain > 0 ? `+${weightGain.toFixed(1)}kg (${weightGainPercent}%)` : 'No data'}
                </p>
                <Progress value={Math.min(Number(weightGainPercent), 100)} className="mt-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Height Growth</p>
                <p className="font-semibold text-blue-600">
                  {heightGain > 0 ? `+${heightGain.toFixed(1)}cm (${heightGainPercent}%)` : 'No data'}
                </p>
                <Progress value={Math.min(Number(heightGainPercent), 100)} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Correlation Analysis - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Feed vs. Diaper Correlation</CardTitle>
          <CardDescription>Relationship between daily feeds and diaper changes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feeds" name="Feeds" />
              <YAxis dataKey="nappies" name="Nappies" />
              <Scatter fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm">
              <strong>Insight:</strong> {correlationData.length >= 2 ? (
                <>
                  {correlation > 0.7 ? 'Strong' : correlation > 0.4 ? 'Moderate' : 'Weak'} positive correlation
                  (r={correlation.toFixed(2)}) between feeds and diaper changes.
                  Expect about {avgDiapersPerFeed} diapers per feed on average.
                </>
              ) : (
                'Need more data to calculate correlation between feeds and diaper changes.'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sleeps.length > 0 && (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Pattern</Badge>
                <p className="text-sm">
                  {longestSleep > 0
                    ? `Your baby's longest sleep session was ${longestSleepHours}h ${longestSleepMins}min. `
                    : 'Track more sleep sessions to identify patterns. '}
                  {avgNapDuration > 0 && `Average nap duration is ${avgNapHours}h ${avgNapMins}min.`}
                </p>
              </div>
            )}
            {daysToMilestone > 0 && currentWeight > 0 && (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Prediction</Badge>
                <p className="text-sm">
                  Based on growth rate, expect next weight milestone ({nextMilestone}kg) in approximately {daysToMilestone} days.
                </p>
              </div>
            )}
            {avgFeedIntervalHours !== '0.0' && Number(avgFeedIntervalHours) > 0 && (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Tip</Badge>
                <p className="text-sm">
                  Your average feeding interval is every {avgFeedIntervalHours} hours.
                  {avgWakeWindow > 0 && ` Wake windows average ${avgWakeHours}h ${avgWakeMins}min.`}
                </p>
              </div>
            )}
            {sleeps.length === 0 && feedings.length === 0 && growths.length === 0 && (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Getting Started</Badge>
                <p className="text-sm">
                  Start logging your baby's activities to see personalized insights and patterns here!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
          </div>
        </TabsContent>

        <TabsContent value="sleep" className="mt-6">
          <SleepAnalytics babyId={babyId} refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="feeds" className="mt-6">
          <FeedAnalytics babyId={babyId} refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="nappies" className="mt-6">
          <NappyAnalytics babyId={babyId} refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="growth" className="mt-6">
          <GrowthAnalytics babyId={babyId} refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
}