import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Baby, Droplets, Moon, Scale, Loader2 } from "lucide-react";
import { feedingApi, sleepApi, diaperApi, growthApi } from "../services/api";
import type { FeedingSession, SleepSession, DiaperEvent, GrowthMeasurement } from "../types/api";
import { format, isToday, subDays, startOfDay } from 'date-fns';

interface InsightsDashboardProps {
  babyId: string;
  refreshTrigger?: number;
}

export function InsightsDashboard({ babyId, refreshTrigger }: InsightsDashboardProps) {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [sleeps, setSleeps] = useState<SleepSession[]>([]);
  const [diapers, setDiapers] = useState<DiaperEvent[]>([]);
  const [growth, setGrowth] = useState<GrowthMeasurement[]>([]);

  useEffect(() => {
    fetchData();
  }, [babyId, refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedData, sleepData, diaperData, growthData] = await Promise.all([
        feedingApi.getAll({ baby_id: babyId, limit: 100 }),
        sleepApi.getAll({ baby_id: babyId, limit: 100 }),
        diaperApi.getAll({ baby_id: babyId, limit: 100 }),
        growthApi.getAll({ baby_id: babyId, limit: 20 }),
      ]);

      setFeedings(feedData);
      setSleeps(sleepData);
      setDiapers(diaperData);
      setGrowth(growthData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate today's stats
  const todayFeeds = feedings.filter(f => isToday(new Date(f.start_time)));
  const todaySleeps = sleeps.filter(s => isToday(new Date(s.sleep_start)));
  const todayDiapers = diapers.filter(d => isToday(new Date(d.timestamp)));

  const totalSleepToday = todaySleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const avgSleepHours = totalSleepToday / 60;

  // Calculate weekly feed data
  const weeklyFeedData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayFeeds = feedings.filter(f => {
      const feedDate = startOfDay(new Date(f.start_time));
      return feedDate.getTime() === startOfDay(date).getTime();
    });

    return {
      day: format(date, 'EEE'),
      feeds: dayFeeds.length,
      duration: dayFeeds.reduce((sum, f) => sum + (f.duration_minutes || 0), 0)
    };
  });

  // Calculate feed type distribution
  const breastFeeds = feedings.filter(f => f.feeding_type === 'breast').length;
  const bottleFeeds = feedings.filter(f => f.feeding_type === 'bottle').length;
  const solidFeeds = feedings.filter(f => f.feeding_type === 'solid').length;
  const total = breastFeeds + bottleFeeds + solidFeeds || 1;

  const feedTypeData = [
    { name: 'Breast', value: breastFeeds, color: '#8884d8', percentage: Math.round((breastFeeds / total) * 100) },
    { name: 'Bottle', value: bottleFeeds, color: '#82ca9d', percentage: Math.round((bottleFeeds / total) * 100) },
    { name: 'Solid', value: solidFeeds, color: '#ffc658', percentage: Math.round((solidFeeds / total) * 100) },
  ].filter(item => item.value > 0);

  // Calculate growth trend data
  const growthData = growth
    .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
    .slice(-6)
    .map(g => ({
      date: format(new Date(g.measurement_date), 'MMM d'),
      weight: g.weight_kg || 0,
      height: g.length_cm || 0
    }));

  const latestWeight = growth.length > 0 && growth[0].weight_kg
    ? `${growth[0].weight_kg}kg`
    : 'N/A';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                      <p className="text-2xl font-bold">{todayFeeds.length}</p>
                    </div>
                    <Baby className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Total this week: {feedings.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sleep Today</p>
                      <p className="text-2xl font-bold">{avgSleepHours.toFixed(1)}h</p>
                    </div>
                    <Moon className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">{todaySleeps.length} sleep sessions</span>
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
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Normal range</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Latest Weight</p>
                      <p className="text-2xl font-bold">{latestWeight}</p>
                    </div>
                    <Scale className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">{growth.length} measurements</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Feed Pattern */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Feeding Pattern</CardTitle>
                  <CardDescription>Number of feeds per day over the last week</CardDescription>
                </CardHeader>
                <CardContent>
                  {weeklyFeedData.some(d => d.feeds > 0) ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyFeedData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Bar dataKey="feeds" fill="#8884d8" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                        <span>Avg: {(weeklyFeedData.reduce((sum, d) => sum + d.feeds, 0) / 7).toFixed(1)} feeds/day</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>No feeding data for the past week</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feed Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Feeding Distribution</CardTitle>
                  <CardDescription>Breakdown of feeding methods</CardDescription>
                </CardHeader>
                <CardContent>
                  {feedTypeData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={feedTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name} ${percentage}%`}
                          >
                            {feedTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {feedTypeData.map((item) => (
                          <div key={item.name} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <p className="text-lg font-semibold mt-1">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>No feeding data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Growth Chart */}
            {growthData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Growth Trend</CardTitle>
                  <CardDescription>Weight and height measurements over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="weight"
                        stroke="#8884d8"
                        strokeWidth={3}
                        name="Weight (kg)"
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="height"
                        stroke="#82ca9d"
                        strokeWidth={3}
                        name="Height (cm)"
                        dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#8884d8]"></div>
                      <span className="text-sm">Weight (kg)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#82ca9d]"></div>
                      <span className="text-sm">Height (cm)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Placeholder tabs for specialized analytics */}
        <TabsContent value="sleep" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Analytics</CardTitle>
              <CardDescription>Detailed sleep pattern analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Moon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Detailed sleep analytics coming soon</p>
                <p className="text-sm mt-2">{sleeps.length} sleep sessions recorded</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feeds" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feeding Analytics</CardTitle>
              <CardDescription>Detailed feeding pattern analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Baby className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Detailed feeding analytics coming soon</p>
                <p className="text-sm mt-2">{feedings.length} feeding sessions recorded</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nappies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Diaper Analytics</CardTitle>
              <CardDescription>Detailed diaper change analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Detailed diaper analytics coming soon</p>
                <p className="text-sm mt-2">{diapers.length} diaper changes recorded</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Growth Analytics</CardTitle>
              <CardDescription>Detailed growth tracking and percentiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Detailed growth analytics coming soon</p>
                <p className="text-sm mt-2">{growth.length} measurements recorded</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
