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

export function SleepAnalytics() {
  // Mock data for detailed sleep analytics
  const sleepTrendsData = [
    { date: 'Jan 15', totalSleep: 14.5, nightSleep: 11, napTotal: 3.5, wakeUps: 2 },
    { date: 'Jan 16', totalSleep: 13.8, nightSleep: 10.5, napTotal: 3.3, wakeUps: 3 },
    { date: 'Jan 17', totalSleep: 15.2, nightSleep: 11.5, napTotal: 3.7, wakeUps: 1 },
    { date: 'Jan 18', totalSleep: 14.1, nightSleep: 10.8, napTotal: 3.3, wakeUps: 2 },
    { date: 'Jan 19', totalSleep: 14.9, nightSleep: 11.2, napTotal: 3.7, wakeUps: 1 },
    { date: 'Jan 20', totalSleep: 13.5, nightSleep: 10.2, napTotal: 3.3, wakeUps: 4 },
    { date: 'Jan 21', totalSleep: 15.8, nightSleep: 12, napTotal: 3.8, wakeUps: 1 },
  ];

  const sleepPatternsData = [
    { time: '7PM', type: 'bedtime', duration: 11.5, quality: 85 },
    { time: '9AM', type: 'morning nap', duration: 1.2, quality: 90 },
    { time: '1PM', type: 'afternoon nap', duration: 2.5, quality: 95 },
    { time: '4PM', type: 'evening nap', duration: 0.5, quality: 70 },
  ];

  const wakeWindowData = [
    { timeOfDay: '6-9AM', avgWindow: 2.5, recommended: 2.5, variance: 0.3 },
    { timeOfDay: '9AM-1PM', avgWindow: 3.2, recommended: 3.0, variance: 0.5 },
    { timeOfDay: '1-4PM', avgWindow: 2.8, recommended: 3.0, variance: 0.4 },
    { timeOfDay: '4-7PM', avgWindow: 3.5, recommended: 3.5, variance: 0.2 },
  ];

  const sleepLocationData = [
    { name: 'Crib', value: 70, color: '#8884d8' },
    { name: 'Bassinet', value: 15, color: '#82ca9d' },
    { name: 'Stroller', value: 10, color: '#ffc658' },
    { name: 'Car Seat', value: 5, color: '#ff7c7c' },
  ];

  const sleepEfficiencyData = [
    { week: 'Week 1', efficiency: 78, avgDuration: 45, wakeUps: 3.2 },
    { week: 'Week 2', efficiency: 82, avgDuration: 52, wakeUps: 2.8 },
    { week: 'Week 3', efficiency: 85, avgDuration: 58, wakeUps: 2.3 },
    { week: 'Week 4', efficiency: 88, avgDuration: 65, wakeUps: 1.9 },
    { week: 'Week 5', efficiency: 91, avgDuration: 72, wakeUps: 1.5 },
    { week: 'Week 6', efficiency: 89, avgDuration: 68, wakeUps: 1.8 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sleep Efficiency</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={89} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Night Sleep</p>
                <p className="text-2xl font-bold">11.2h</p>
              </div>
              <Moon className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+45min vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Wake Ups</p>
                <p className="text-2xl font-bold">1.8</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">-1.2 vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Nap Time</p>
                <p className="text-2xl font-bold">3.6h</p>
              </div>
              <Sun className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">Optimal range</span>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Quality by Time</CardTitle>
            <CardDescription>Sleep duration and quality for different sleep periods</CardDescription>
          </CardHeader>
          <CardContent>
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
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm">
                <strong>Insight:</strong> Crib sleep accounts for 70% of total sleep with highest efficiency ratings.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Efficiency Progress</CardTitle>
            <CardDescription>Weekly improvement in sleep patterns</CardDescription>
          </CardHeader>
          <CardContent>
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
                <span className="font-semibold">89%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Improvement</span>
                <span className="font-semibold text-green-600">+11% in 6 weeks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Sleep Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Pattern</Badge>
              <p className="text-sm">Your baby sleeps 23% longer when put down within 15 minutes of showing tired signs.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Optimization</Badge>
              <p className="text-sm">The 1PM nap shows highest quality scores. Consider protecting this sleep window.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Prediction</Badge>
              <p className="text-sm">Based on current trends, expect 12+ hour nights consistently within 2 weeks.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Recommendation</Badge>
              <p className="text-sm">Try extending morning wake window by 15 minutes to improve afternoon nap duration.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}