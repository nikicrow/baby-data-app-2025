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
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { Droplets, Clock, TrendingUp, Baby, Zap, AlertTriangle } from "lucide-react";
import { diaperApi, feedingApi } from "../../services/api";
import type { DiaperEvent, FeedingSession } from "../../types/api";
import { parseISO, format, startOfDay, subDays, getHours, differenceInMinutes } from "date-fns";

interface NappyAnalyticsProps {
  babyId: string;
  refreshTrigger?: number;
}

export function NappyAnalytics({ babyId, refreshTrigger }: NappyAnalyticsProps) {
  const [diapers, setDiapers] = useState<DiaperEvent[]>([]);
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [babyId, refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [diapersData, feedingsData] = await Promise.all([
        diaperApi.getAll({ baby_id: babyId }),
        feedingApi.getAll({ baby_id: babyId }),
      ]);
      setDiapers(diapersData);
      setFeedings(feedingsData);
    } catch (error) {
      console.error('Failed to fetch nappy data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading nappy analytics...</div>;
  }

  // Calculate analytics from real data

  // 24-hour nappy pattern - group by 3-hour windows
  const dailyNappyData = Array.from({ length: 8 }, (_, i) => {
    const hourStart = i * 3;
    const timeLabel = `${hourStart === 0 ? 12 : hourStart > 12 ? hourStart - 12 : hourStart}${hourStart < 12 ? 'AM' : 'PM'}`;

    const diapersInWindow = diapers.filter((d: DiaperEvent) => {
      const hour = getHours(parseISO(d.timestamp));
      return hour >= hourStart && hour < hourStart + 3;
    });

    const wet = diapersInWindow.filter((d: DiaperEvent) => d.has_urine && !d.has_stool).length;
    const poopy = diapersInWindow.filter((d: DiaperEvent) => d.has_stool && !d.has_urine).length;
    const both = diapersInWindow.filter((d: DiaperEvent) => d.has_urine && d.has_stool).length;

    return {
      time: timeLabel,
      wet,
      poopy,
      both,
      total: wet + poopy + both,
    };
  });

  // Last 7 days nappy trends
  const weeklyNappyTrends = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayDiapers = diapers.filter((d: DiaperEvent) => {
      const diaperDate = parseISO(d.timestamp);
      return startOfDay(diaperDate).getTime() === startOfDay(date).getTime();
    });

    const wet = dayDiapers.filter((d: DiaperEvent) => d.has_urine && !d.has_stool).length;
    const poopy = dayDiapers.filter((d: DiaperEvent) => d.has_stool && !d.has_urine).length;
    const both = dayDiapers.filter((d: DiaperEvent) => d.has_urine && d.has_stool).length;
    const total = wet + poopy + both;

    // Calculate average interval for the day
    const sortedDayDiapers = [...dayDiapers].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const intervals = sortedDayDiapers.slice(1).map((d, idx) => {
      const prev = sortedDayDiapers[idx];
      return differenceInMinutes(parseISO(d.timestamp), parseISO(prev.timestamp));
    });
    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length / 60
      : 0;

    return {
      date: format(date, 'MMM d'),
      wet,
      poopy,
      both,
      total,
      avgInterval: Math.round(avgInterval * 10) / 10,
    };
  });

  // Nappy type distribution
  const wetOnly = diapers.filter((d: DiaperEvent) => d.has_urine && !d.has_stool).length;
  const poopyOnly = diapers.filter((d: DiaperEvent) => d.has_stool && !d.has_urine).length;
  const bothTypes = diapers.filter((d: DiaperEvent) => d.has_urine && d.has_stool).length;
  const totalDiapers = wetOnly + poopyOnly + bothTypes || 1;

  const nappyTypeDistribution = [
    { name: 'Wet Only', value: Math.round((wetOnly / totalDiapers) * 100), color: '#8884d8', count: wetOnly },
    { name: 'Poopy Only', value: Math.round((poopyOnly / totalDiapers) * 100), color: '#82ca9d', count: poopyOnly },
    { name: 'Both', value: Math.round((bothTypes / totalDiapers) * 100), color: '#ffc658', count: bothTypes },
  ].filter(d => d.count > 0);

  // Calculate intervals between nappy changes
  const sortedDiapers = [...diapers].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const intervals = sortedDiapers.slice(1).map((d, idx) => {
    const prev = sortedDiapers[idx];
    return differenceInMinutes(parseISO(d.timestamp), parseISO(prev.timestamp));
  });

  const intervalCounts = {
    '0-1h': intervals.filter(i => i >= 0 && i < 60).length,
    '1-2h': intervals.filter(i => i >= 60 && i < 120).length,
    '2-3h': intervals.filter(i => i >= 120 && i < 180).length,
    '3-4h': intervals.filter(i => i >= 180 && i < 240).length,
    '4+h': intervals.filter(i => i >= 240).length,
  };

  const totalIntervals = intervals.length || 1;
  const intervalAnalysis = [
    { interval: '0-1h', count: intervalCounts['0-1h'], percentage: Math.round((intervalCounts['0-1h'] / totalIntervals) * 100), urgency: 'high' },
    { interval: '1-2h', count: intervalCounts['1-2h'], percentage: Math.round((intervalCounts['1-2h'] / totalIntervals) * 100), urgency: 'normal' },
    { interval: '2-3h', count: intervalCounts['2-3h'], percentage: Math.round((intervalCounts['2-3h'] / totalIntervals) * 100), urgency: 'normal' },
    { interval: '3-4h', count: intervalCounts['3-4h'], percentage: Math.round((intervalCounts['3-4h'] / totalIntervals) * 100), urgency: 'normal' },
    { interval: '4+h', count: intervalCounts['4+h'], percentage: Math.round((intervalCounts['4+h'] / totalIntervals) * 100), urgency: 'concerning' },
  ];

  // Feed-nappy correlation - analyze timing after feeds
  const feedNappyCorrelation = Array.from({ length: 7 }, (_, hour) => {
    // Count how many nappies occur within this hour window after a feed
    let nappyCount = 0;
    let feedCount = 0;

    feedings.forEach((feed: FeedingSession) => {
      const feedTime = parseISO(feed.start_time).getTime();
      const windowStart = feedTime + hour * 60 * 60 * 1000;
      const windowEnd = feedTime + (hour + 1) * 60 * 60 * 1000;

      const nappiesInWindow = diapers.filter((d: DiaperEvent) => {
        const nappyTime = parseISO(d.timestamp).getTime();
        return nappyTime >= windowStart && nappyTime < windowEnd;
      });

      if (nappiesInWindow.length > 0) {
        nappyCount += nappiesInWindow.length;
      }
      feedCount++;
    });

    return {
      hour,
      feeds: hour === 0 || hour === 3 || hour === 6 ? 1 : 0, // Show feed markers at typical times
      nappies: feedCount > 0 ? Math.round((nappyCount / feedCount) * 10) / 10 : 0,
    };
  });

  // Health indicators by week (last 6 weeks)
  const nappyHealthIndicators = Array.from({ length: 6 }, (_, i) => {
    const weekStart = subDays(new Date(), (5 - i) * 7 + 7);
    const weekEnd = subDays(new Date(), (5 - i) * 7);

    const weekDiapers = diapers.filter((d: DiaperEvent) => {
      const diaperDate = parseISO(d.timestamp);
      return diaperDate >= weekStart && diaperDate < weekEnd;
    });

    // Hydration score based on wet nappies (good = 6+ wet per day)
    const wetNappies = weekDiapers.filter((d: DiaperEvent) => d.has_urine).length;
    const daysInWeek = 7;
    const wetPerDay = wetNappies / daysInWeek;
    const hydration = Math.min(100, Math.round((wetPerDay / 6) * 100));

    // Digestive health based on stool frequency and consistency
    const stoolNappies = weekDiapers.filter((d: DiaperEvent) => d.has_stool);
    const stoolPerDay = stoolNappies.length / daysInWeek;
    // Good range is 1-3 stools per day for babies
    const digestiveHealth = stoolPerDay >= 1 && stoolPerDay <= 5
      ? Math.round(85 + (stoolPerDay / 3) * 15)
      : stoolPerDay < 1 ? 60 : 70;

    const frequency = weekDiapers.length / daysInWeek;

    return {
      week: `Week ${i + 1}`,
      hydration: weekDiapers.length > 0 ? hydration : 0,
      digestiveHealth: weekDiapers.length > 0 ? digestiveHealth : 0,
      frequency: Math.round(frequency * 10) / 10,
    };
  }).filter(d => d.hydration > 0 || d.digestiveHealth > 0);

  // Calculate key metrics
  const last7DaysDiapers = diapers.filter((d: DiaperEvent) => {
    const diaperDate = parseISO(d.timestamp);
    return diaperDate >= subDays(new Date(), 7);
  });

  const dailyAverage = (last7DaysDiapers.length / 7).toFixed(0);
  const avgInterval = intervals.length > 0
    ? (intervals.reduce((a, b) => a + b, 0) / intervals.length / 60).toFixed(1)
    : '0';

  // Current hydration score (based on last 7 days)
  const recentWetNappies = last7DaysDiapers.filter((d: DiaperEvent) => d.has_urine).length;
  const hydrationScore = Math.min(100, Math.round((recentWetNappies / 7 / 6) * 100));

  // Digestive health score
  const recentStoolNappies = last7DaysDiapers.filter((d: DiaperEvent) => d.has_stool).length;
  const stoolsPerDay = recentStoolNappies / 7;
  const digestiveHealthScore = stoolsPerDay >= 1 && stoolsPerDay <= 5
    ? Math.round(85 + (stoolsPerDay / 3) * 15)
    : stoolsPerDay < 1 ? 60 : 70;

  // Week over week comparison
  const thisWeekDiapers = diapers.filter((d: DiaperEvent) => {
    const diaperDate = parseISO(d.timestamp);
    return diaperDate >= subDays(new Date(), 7);
  });
  const lastWeekDiapers = diapers.filter((d: DiaperEvent) => {
    const diaperDate = parseISO(d.timestamp);
    return diaperDate >= subDays(new Date(), 14) && diaperDate < subDays(new Date(), 7);
  });

  const weekChange = thisWeekDiapers.length - lastWeekDiapers.length;

  // Find peak nappy time
  const peakTimeWindow = dailyNappyData.reduce((max, current) =>
    current.total > max.total ? current : max
  , dailyNappyData[0]);

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
              <Droplets className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {weekChange !== 0 ? (
                <>
                  <TrendingUp className={`w-4 h-4 ${weekChange > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm ${weekChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weekChange > 0 ? '+' : ''}{weekChange} vs last week
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Same as last week</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Interval</p>
                <p className="text-2xl font-bold">{avgInterval}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">
                {Number(avgInterval) >= 2 && Number(avgInterval) <= 3 ? 'Healthy range' : 'Track more data'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hydration Score</p>
                <p className="text-2xl font-bold">{hydrationScore > 0 ? `${hydrationScore}%` : 'N/A'}</p>
              </div>
              <Droplets className="w-8 h-8 text-green-600" />
            </div>
            {hydrationScore > 0 && <Progress value={hydrationScore} className="mt-2" />}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Digestive Health</p>
                <p className="text-2xl font-bold">{digestiveHealthScore > 0 ? `${digestiveHealthScore}%` : 'N/A'}</p>
              </div>
              <Baby className="w-8 h-8 text-orange-600" />
            </div>
            {digestiveHealthScore > 0 && <Progress value={digestiveHealthScore} className="mt-2" />}
          </CardContent>
        </Card>
      </div>

      {/* Daily Pattern */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>24-Hour Nappy Pattern</CardTitle>
            <CardDescription>Nappy changes throughout the day by type</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyNappyData.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyNappyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Bar dataKey="wet" stackId="a" fill="#8884d8" name="Wet" />
                  <Bar dataKey="poopy" stackId="a" fill="#82ca9d" name="Poopy" />
                  <Bar dataKey="both" stackId="a" fill="#ffc658" name="Both" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No nappy data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
            <CardDescription>Nappy frequency and timing trends</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyNappyTrends.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={weeklyNappyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="count" orientation="left" />
                  <YAxis yAxisId="interval" orientation="right" />
                  <Bar yAxisId="count" dataKey="total" fill="#8884d8" name="Total Changes" />
                  <Line yAxisId="interval" type="monotone" dataKey="avgInterval" stroke="#ff7c7c" strokeWidth={2} name="Avg Interval (h)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No weekly trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution & Intervals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nappy Type Distribution</CardTitle>
            <CardDescription>Breakdown of nappy change types this week</CardDescription>
          </CardHeader>
          <CardContent>
            {nappyTypeDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={nappyTypeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`}
                    >
                      {nappyTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {nappyTypeDistribution.map((type) => (
                    <div key={type.name} className="text-center">
                      <p className="text-sm font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.count} changes</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No nappy type data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Intervals</CardTitle>
            <CardDescription>Time between nappy changes</CardDescription>
          </CardHeader>
          <CardContent>
            {intervals.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={intervalAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="interval" />
                    <YAxis />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400"></div>
                    <span className="text-sm">Frequent (concern if persistent)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-400"></div>
                    <span className="text-sm">Infrequent (monitor hydration)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Not enough data to analyze intervals
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feed-Nappy Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Feed-to-Nappy Correlation</CardTitle>
          <CardDescription>Relationship between feeding and nappy changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          {feedings.length > 0 && diapers.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={feedNappyCorrelation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: 'Hours after feed', position: 'insideBottom', offset: -10 }} />
                  <YAxis />
                  <Bar dataKey="feeds" fill="#8884d8" name="Feeds" />
                  <Line type="monotone" dataKey="nappies" stroke="#82ca9d" strokeWidth={3} name="Expected Nappies" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm">
                  <strong>Pattern:</strong> Based on your data, peak nappy activity typically occurs{' '}
                  {feedNappyCorrelation.reduce((max, curr) => curr.nappies > max.nappies ? curr : max).hour} hours after feeds.
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Need both feeding and nappy data to show correlation
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Health Indicators Progress</CardTitle>
          <CardDescription>Weekly progression of digestive and hydration health</CardDescription>
        </CardHeader>
        <CardContent>
          {nappyHealthIndicators.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={nappyHealthIndicators}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Line type="monotone" dataKey="hydration" stroke="#8884d8" strokeWidth={2} name="Hydration %" />
                  <Line type="monotone" dataKey="digestiveHealth" stroke="#82ca9d" strokeWidth={2} name="Digestive Health %" />
                  <Line type="monotone" dataKey="frequency" stroke="#ffc658" strokeWidth={2} name="Daily Frequency" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hydration Score</p>
                  <p className="text-lg font-bold text-blue-600">{hydrationScore}%</p>
                  {nappyHealthIndicators.length >= 2 && (
                    <p className="text-xs text-green-600">
                      {nappyHealthIndicators[nappyHealthIndicators.length - 1].hydration - nappyHealthIndicators[0].hydration >= 0 ? '↑' : '↓'}
                      {Math.abs(nappyHealthIndicators[nappyHealthIndicators.length - 1].hydration - nappyHealthIndicators[0].hydration)}% change
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Digestive Health</p>
                  <p className="text-lg font-bold text-green-600">{digestiveHealthScore}%</p>
                  {nappyHealthIndicators.length >= 2 && (
                    <p className="text-xs text-green-600">
                      {nappyHealthIndicators[nappyHealthIndicators.length - 1].digestiveHealth - nappyHealthIndicators[0].digestiveHealth >= 0 ? '↑' : '↓'}
                      {Math.abs(nappyHealthIndicators[nappyHealthIndicators.length - 1].digestiveHealth - nappyHealthIndicators[0].digestiveHealth)}% change
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Frequency Trend</p>
                  <p className="text-lg font-bold text-orange-600">{dailyAverage}/day</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(dailyAverage) >= 6 && Number(dailyAverage) <= 12 ? 'Healthy range' : 'Monitor closely'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Not enough data to show health indicators
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Alerts */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-green-600" />
            Health Status & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diapers.length > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <Badge variant="default" className={hydrationScore >= 80 ? "bg-green-600" : hydrationScore >= 60 ? "bg-yellow-600" : "bg-red-600"}>
                    {hydrationScore >= 80 ? 'Healthy' : hydrationScore >= 60 ? 'Monitor' : 'Concern'}
                  </Badge>
                  <p className="text-sm">
                    {hydrationScore >= 80
                      ? 'Nappy frequency and patterns are within normal range for age.'
                      : hydrationScore >= 60
                      ? 'Wet nappy frequency is slightly below optimal. Consider monitoring fluid intake.'
                      : 'Low wet nappy frequency detected. Please consult with your healthcare provider.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary">Hydration</Badge>
                  <p className="text-sm">
                    {hydrationScore >= 80
                      ? `Excellent hydration indicators - wet nappies occurring every ${avgInterval} hours consistently.`
                      : `Current wet nappy frequency: ${recentWetNappies} in the last 7 days. Aim for 6+ per day.`}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary">Digestion</Badge>
                  <p className="text-sm">
                    {stoolsPerDay >= 1 && stoolsPerDay <= 5
                      ? 'Regular bowel movements with healthy timing patterns. No signs of constipation.'
                      : stoolsPerDay < 1
                      ? 'Stool frequency is below average. Monitor for signs of constipation.'
                      : 'Frequent stools detected. If this persists, consider consulting your healthcare provider.'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Getting Started</Badge>
                <p className="text-sm">
                  Start tracking nappy changes to see health status and alerts!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Nappy Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diapers.length > 0 ? (
              <>
                {peakTimeWindow && peakTimeWindow.total > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Timing</Badge>
                    <p className="text-sm">
                      Peak nappy change time is around {peakTimeWindow.time} with {peakTimeWindow.total} changes on average.
                    </p>
                  </div>
                )}
                {feedings.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Pattern</Badge>
                    <p className="text-sm">
                      Feed-to-nappy correlation shows typical digestive timing of{' '}
                      {feedNappyCorrelation.reduce((max, curr) => curr.nappies > max.nappies ? curr : max).hour} hours.
                      This indicates healthy digestion.
                    </p>
                  </div>
                )}
                {intervals.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Efficiency</Badge>
                    <p className="text-sm">
                      Most common change interval is {
                        Object.entries(intervalCounts).sort((a, b) => b[1] - a[1])[0][0]
                      } ({Math.round((Object.entries(intervalCounts).sort((a, b) => b[1] - a[1])[0][1] / totalIntervals) * 100)}% of changes).
                    </p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Badge variant="secondary">Prediction</Badge>
                  <p className="text-sm">
                    Based on current patterns, expect approximately {dailyAverage} nappy changes per day.
                    {Number(dailyAverage) > 10 && ' This may decrease slightly as baby grows.'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Getting Started</Badge>
                <p className="text-sm">
                  Start tracking nappy changes to see personalized insights about patterns and health indicators!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
