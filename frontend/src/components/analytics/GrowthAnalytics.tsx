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
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { Scale, TrendingUp, Target, Baby, Zap, Award } from "lucide-react";
import { growthApi, feedingApi } from "../../services/api";
import type { GrowthMeasurement, FeedingSession } from "../../types/api";
import { parseISO, format, differenceInDays, differenceInWeeks } from "date-fns";

interface GrowthAnalyticsProps {
  babyId: string;
  refreshTrigger?: number;
}

export function GrowthAnalytics({ babyId, refreshTrigger }: GrowthAnalyticsProps) {
  const [growths, setGrowths] = useState<GrowthMeasurement[]>([]);
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [babyId, refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [growthsData, feedingsData] = await Promise.all([
        growthApi.getAll({ baby_id: babyId }),
        feedingApi.getAll({ baby_id: babyId }),
      ]);
      setGrowths(growthsData);
      setFeedings(feedingsData);
    } catch (error) {
      console.error('Failed to fetch growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading growth analytics...</div>;
  }

  // Sort growths by date
  const sortedGrowths = [...growths].sort((a, b) =>
    new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime()
  );

  // Growth progress data
  const growthProgressData = sortedGrowths.map((g, index) => {
    const weekNumber = index === 0 ? 'Birth' : `Week ${index}`;
    return {
      date: weekNumber,
      weight: g.weight_kg || 0,
      height: g.length_cm || 0,
      headCircumference: g.head_circumference_cm || 0,
      // Simplified percentile estimation (would need proper WHO data for accuracy)
      weightPercentile: g.percentiles?.weight || 50,
      heightPercentile: g.percentiles?.height || 50,
      age: index,
    };
  });

  // Growth velocity data (week-over-week changes)
  const growthVelocityData = sortedGrowths.slice(1).map((g, index) => {
    const prev = sortedGrowths[index];
    const daysDiff = differenceInDays(parseISO(g.measurement_date), parseISO(prev.measurement_date)) || 7;
    const weeklyFactor = 7 / daysDiff;

    const weightGain = ((g.weight_kg || 0) - (prev.weight_kg || 0)) * 1000 * weeklyFactor; // grams per week
    const heightGain = ((g.length_cm || 0) - (prev.length_cm || 0)) * weeklyFactor; // cm per week

    let velocity = 'Normal';
    if (weightGain > 250) velocity = 'Accelerated';
    else if (weightGain < 100) velocity = 'Slow';

    return {
      period: `Week ${index + 1}-${index + 2}`,
      weightGain: Math.round(weightGain),
      heightGain: Math.round(heightGain * 10) / 10,
      velocity,
    };
  });

  // Percentile comparison (current vs birth)
  const firstGrowth = sortedGrowths[0];
  const latestGrowth = sortedGrowths[sortedGrowths.length - 1];

  const percentileComparison = [
    {
      measurement: 'Weight',
      current: latestGrowth?.percentiles?.weight || 50,
      birth: firstGrowth?.percentiles?.weight || 50,
      target: 50,
    },
    {
      measurement: 'Height',
      current: latestGrowth?.percentiles?.height || 50,
      birth: firstGrowth?.percentiles?.height || 50,
      target: 50,
    },
    {
      measurement: 'Head Circumference',
      current: latestGrowth?.percentiles?.head || 50,
      birth: firstGrowth?.percentiles?.head || 50,
      target: 50,
    },
  ];

  // Nutrition correlation - compare feeding volume to weight gain
  const nutritionCorrelation = sortedGrowths.slice(1).map((g, index) => {
    const prev = sortedGrowths[index];
    const startDate = parseISO(prev.measurement_date);
    const endDate = parseISO(g.measurement_date);

    // Get feedings in this period
    const periodFeedings = feedings.filter((f: FeedingSession) => {
      const feedDate = parseISO(f.start_time);
      return feedDate >= startDate && feedDate < endDate;
    });

    const daysDiff = differenceInDays(endDate, startDate) || 1;
    const totalVolume = periodFeedings.reduce((sum: number, f: FeedingSession) => sum + (f.volume_consumed_ml || 0), 0);
    const dailyIntake = Math.round(totalVolume / daysDiff);

    const weightGain = ((g.weight_kg || 0) - (prev.weight_kg || 0)) * 1000; // in grams

    return {
      week: index + 1,
      dailyIntake,
      weightGain: Math.round(weightGain),
    };
  });

  // Growth projections based on current rate
  const calculateProjections = () => {
    if (sortedGrowths.length < 2) return [];

    const recentGrowths = sortedGrowths.slice(-3); // Last 3 measurements
    if (recentGrowths.length < 2) return [];

    const first = recentGrowths[0];
    const last = recentGrowths[recentGrowths.length - 1];
    const daysDiff = differenceInDays(parseISO(last.measurement_date), parseISO(first.measurement_date)) || 1;

    const weightGainPerDay = ((last.weight_kg || 0) - (first.weight_kg || 0)) / daysDiff;
    const heightGainPerDay = ((last.length_cm || 0) - (first.length_cm || 0)) / daysDiff;

    const currentWeight = last.weight_kg || 0;
    const currentHeight = last.length_cm || 0;

    return [
      { month: 'Month 2', projectedWeight: Math.round((currentWeight + weightGainPerDay * 30) * 10) / 10, projectedHeight: Math.round(currentHeight + heightGainPerDay * 30) },
      { month: 'Month 3', projectedWeight: Math.round((currentWeight + weightGainPerDay * 60) * 10) / 10, projectedHeight: Math.round(currentHeight + heightGainPerDay * 60) },
      { month: 'Month 4', projectedWeight: Math.round((currentWeight + weightGainPerDay * 90) * 10) / 10, projectedHeight: Math.round(currentHeight + heightGainPerDay * 90) },
      { month: 'Month 6', projectedWeight: Math.round((currentWeight + weightGainPerDay * 150) * 10) / 10, projectedHeight: Math.round(currentHeight + heightGainPerDay * 150) },
      { month: 'Month 12', projectedWeight: Math.round((currentWeight + weightGainPerDay * 330) * 10) / 10, projectedHeight: Math.round(currentHeight + heightGainPerDay * 330) },
    ];
  };

  const growthProjection = calculateProjections();

  // Calculate key metrics
  const currentWeight = latestGrowth?.weight_kg || 0;
  const currentHeight = latestGrowth?.length_cm || 0;
  const birthWeight = firstGrowth?.weight_kg || 0;
  const birthHeight = firstGrowth?.length_cm || 0;

  const totalWeightGain = currentWeight - birthWeight;
  const totalHeightGain = currentHeight - birthHeight;

  const weightGainPercent = birthWeight > 0 ? Math.round((totalWeightGain / birthWeight) * 100) : 0;
  const heightGainPercent = birthHeight > 0 ? Math.round((totalHeightGain / birthHeight) * 100) : 0;

  // Recent weekly gain
  const recentWeeklyGain = growthVelocityData.length > 0
    ? growthVelocityData[growthVelocityData.length - 1].weightGain
    : 0;

  // Average weekly gains
  const avgWeeklyWeightGain = growthVelocityData.length > 0
    ? Math.round(growthVelocityData.reduce((sum, d) => sum + d.weightGain, 0) / growthVelocityData.length)
    : 0;
  const avgWeeklyHeightGain = growthVelocityData.length > 0
    ? Math.round(growthVelocityData.reduce((sum, d) => sum + d.heightGain, 0) / growthVelocityData.length * 10) / 10
    : 0;

  // Growth velocity status
  const velocityStatus = avgWeeklyWeightGain >= 150 && avgWeeklyWeightGain <= 300 ? 'Normal' :
    avgWeeklyWeightGain > 300 ? 'Accelerated' : 'Monitor';

  // Calculate correlation coefficient between intake and weight gain
  const calculateCorrelation = () => {
    if (nutritionCorrelation.length < 2) return 0;
    const n = nutritionCorrelation.length;
    const sumX = nutritionCorrelation.reduce((sum, d) => sum + d.dailyIntake, 0);
    const sumY = nutritionCorrelation.reduce((sum, d) => sum + d.weightGain, 0);
    const sumXY = nutritionCorrelation.reduce((sum, d) => sum + d.dailyIntake * d.weightGain, 0);
    const sumX2 = nutritionCorrelation.reduce((sum, d) => sum + d.dailyIntake * d.dailyIntake, 0);
    const sumY2 = nutritionCorrelation.reduce((sum, d) => sum + d.weightGain * d.weightGain, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const nutritionCorrelationCoeff = calculateCorrelation();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold">{currentWeight > 0 ? `${currentWeight}kg` : 'N/A'}</p>
              </div>
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {recentWeeklyGain > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{recentWeeklyGain}g this week</span>
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
                <p className="text-sm text-muted-foreground">Current Height</p>
                <p className="text-2xl font-bold">{currentHeight > 0 ? `${currentHeight}cm` : 'N/A'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {avgWeeklyHeightGain > 0 ? (
                <span className="text-sm text-muted-foreground">+{avgWeeklyHeightGain}cm/week avg</span>
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
                <p className="text-sm text-muted-foreground">Weight Percentile</p>
                <p className="text-2xl font-bold">{latestGrowth?.percentiles?.weight ? `${latestGrowth.percentiles.weight}th` : 'N/A'}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            {latestGrowth?.percentiles?.weight && <Progress value={latestGrowth.percentiles.weight} className="mt-2" />}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Velocity</p>
                <p className="text-2xl font-bold">{velocityStatus}</p>
              </div>
              <Baby className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm ${velocityStatus === 'Normal' ? 'text-green-600' : 'text-yellow-600'}`}>
                {velocityStatus === 'Normal' ? 'Healthy rate' : 'Track more data'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth Progress</CardTitle>
            <CardDescription>Weight and height development over time</CardDescription>
          </CardHeader>
          <CardContent>
            {growthProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={growthProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="weight" orientation="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="height" orientation="right" label={{ value: 'Height (cm)', angle: 90, position: 'insideRight' }} />
                  <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={3} name="Weight" />
                  <Line yAxisId="height" type="monotone" dataKey="height" stroke="#82ca9d" strokeWidth={3} name="Height" />
                  {birthWeight > 0 && <ReferenceLine yAxisId="weight" y={birthWeight} stroke="#ff7c7c" strokeDasharray="5 5" label="Birth Weight" />}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No growth data available. Add measurements to see progress.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Percentile Tracking</CardTitle>
            <CardDescription>How your baby compares to population averages</CardDescription>
          </CardHeader>
          <CardContent>
            {growthProgressData.length > 0 && growthProgressData.some(d => d.weightPercentile !== 50) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" label={{ value: 'Age (weeks)', position: 'insideBottom', offset: -10 }} />
                  <YAxis label={{ value: 'Percentile', angle: -90, position: 'insideLeft' }} />
                  <Line type="monotone" dataKey="weightPercentile" stroke="#8884d8" strokeWidth={2} name="Weight %ile" />
                  <Line type="monotone" dataKey="heightPercentile" stroke="#82ca9d" strokeWidth={2} name="Height %ile" />
                  <ReferenceLine y={50} stroke="#ffc658" strokeDasharray="5 5" label="50th Percentile" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Percentile data not available. Consult your healthcare provider for accurate percentile tracking.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Velocity & Percentile Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth Velocity</CardTitle>
            <CardDescription>Weekly weight and height gains</CardDescription>
          </CardHeader>
          <CardContent>
            {growthVelocityData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={growthVelocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="weight" orientation="left" />
                    <YAxis yAxisId="height" orientation="right" />
                    <Bar yAxisId="weight" dataKey="weightGain" fill="#8884d8" name="Weight Gain (g)" />
                    <Line yAxisId="height" type="monotone" dataKey="heightGain" stroke="#82ca9d" strokeWidth={2} name="Height Gain (cm)" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Weekly Weight Gain</span>
                    <span className="font-semibold">{avgWeeklyWeightGain}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Weekly Height Gain</span>
                    <span className="font-semibold">{avgWeeklyHeightGain}cm</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Need at least 2 measurements to calculate growth velocity
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Percentile Progress</CardTitle>
            <CardDescription>Current vs birth percentiles</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedGrowths.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={percentileComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="measurement" />
                    <YAxis />
                    <Bar dataKey="birth" fill="#e5e7eb" name="Birth Percentile" />
                    <Bar dataKey="current" fill="#8884d8" name="Current Percentile" />
                    <ReferenceLine y={50} stroke="#ffc658" strokeDasharray="5 5" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {percentileComparison.map((item) => (
                    <div key={item.measurement} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{item.measurement}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.birth}th → {item.current}th</span>
                        <Badge variant={item.current > item.birth ? "default" : "secondary"}>
                          {item.current > item.birth ? "↑" : item.current === item.birth ? "→" : "↓"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No growth data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nutrition Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Nutrition & Growth Correlation</CardTitle>
          <CardDescription>Relationship between daily intake and weight gain</CardDescription>
        </CardHeader>
        <CardContent>
          {nutritionCorrelation.length > 0 && nutritionCorrelation.some(d => d.dailyIntake > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={nutritionCorrelation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -10 }} />
                  <YAxis yAxisId="intake" orientation="left" label={{ value: 'Daily Intake (ml)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="weight" orientation="right" label={{ value: 'Weight Gain (g)', angle: 90, position: 'insideRight' }} />
                  <Bar yAxisId="intake" dataKey="dailyIntake" fill="#8884d8" name="Daily Intake" />
                  <Line yAxisId="weight" type="monotone" dataKey="weightGain" stroke="#82ca9d" strokeWidth={3} name="Weight Gain" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm">
                  <strong>Correlation:</strong>{' '}
                  {Math.abs(nutritionCorrelationCoeff) > 0.7
                    ? `Strong ${nutritionCorrelationCoeff > 0 ? 'positive' : 'negative'}`
                    : Math.abs(nutritionCorrelationCoeff) > 0.4
                    ? `Moderate ${nutritionCorrelationCoeff > 0 ? 'positive' : 'negative'}`
                    : 'Weak'}{' '}
                  relationship (r={nutritionCorrelationCoeff.toFixed(2)}) between daily intake and weight gain.
                  {nutritionCorrelationCoeff > 0.4 && ' Current intake levels are supporting healthy growth.'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Need feeding volume data and multiple growth measurements to show nutrition correlation
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones & Projections */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth Summary</CardTitle>
            <CardDescription>Total growth since birth</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedGrowths.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Weight Gain</span>
                    <span className="font-semibold text-green-600">
                      {totalWeightGain > 0 ? `+${totalWeightGain.toFixed(2)}kg (${weightGainPercent}%)` : 'N/A'}
                    </span>
                  </div>
                  {totalWeightGain > 0 && <Progress value={Math.min(weightGainPercent, 100)} />}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Height Growth</span>
                    <span className="font-semibold text-blue-600">
                      {totalHeightGain > 0 ? `+${totalHeightGain.toFixed(1)}cm (${heightGainPercent}%)` : 'N/A'}
                    </span>
                  </div>
                  {totalHeightGain > 0 && <Progress value={Math.min(heightGainPercent, 100)} />}
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm">
                    <strong>Measurements:</strong> {sortedGrowths.length} recorded over{' '}
                    {sortedGrowths.length > 1
                      ? `${differenceInWeeks(parseISO(latestGrowth.measurement_date), parseISO(firstGrowth.measurement_date))} weeks`
                      : 'the tracking period'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No growth measurements recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Projections</CardTitle>
            <CardDescription>Predicted growth based on current trends</CardDescription>
          </CardHeader>
          <CardContent>
            {growthProjection.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={growthProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="weight" orientation="left" />
                    <YAxis yAxisId="height" orientation="right" />
                    <Line yAxisId="weight" type="monotone" dataKey="projectedWeight" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" name="Projected Weight" />
                    <Line yAxisId="height" type="monotone" dataKey="projectedHeight" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Projected Height" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projected 6-month weight</span>
                    <span className="font-semibold">{growthProjection.find(p => p.month === 'Month 6')?.projectedWeight || 'N/A'}kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projected 1-year weight</span>
                    <span className="font-semibold">{growthProjection.find(p => p.month === 'Month 12')?.projectedWeight || 'N/A'}kg</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Need at least 2 measurements to project growth
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data-based Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Growth Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedGrowths.length > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <Badge variant="default" className={velocityStatus === 'Normal' ? "bg-green-600" : "bg-yellow-600"}>
                    {velocityStatus === 'Normal' ? 'Excellent' : 'Monitor'}
                  </Badge>
                  <p className="text-sm">
                    {velocityStatus === 'Normal'
                      ? 'Growth velocity is consistently within healthy ranges. No concerns detected.'
                      : velocityStatus === 'Accelerated'
                      ? 'Growth is above average rate. This may be normal but consult your healthcare provider.'
                      : 'Growth rate is below average. Consider consulting your healthcare provider.'}
                  </p>
                </div>
                {totalWeightGain > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Weight Trend</Badge>
                    <p className="text-sm">
                      Total weight gain of {totalWeightGain.toFixed(2)}kg ({weightGainPercent}% from birth weight).
                      {weightGainPercent >= 10 && weightGainPercent <= 50 ? ' This is healthy progress!' : ''}
                    </p>
                  </div>
                )}
                {nutritionCorrelationCoeff > 0.4 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Nutrition</Badge>
                    <p className="text-sm">
                      Strong correlation between feeding and weight gain indicates optimal nutrition absorption.
                    </p>
                  </div>
                )}
                {growthProjection.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">Projection</Badge>
                    <p className="text-sm">
                      Based on current trends, projected to reach {growthProjection.find(p => p.month === 'Month 6')?.projectedWeight}kg by 6 months.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Badge variant="secondary">Getting Started</Badge>
                <p className="text-sm">
                  Start recording growth measurements to see personalized insights about weight, height, and development patterns!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
