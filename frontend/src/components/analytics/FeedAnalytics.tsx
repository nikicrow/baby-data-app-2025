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

export function FeedAnalytics() {
  // Mock data for detailed feeding analytics
  const feedingFrequencyData = [
    { time: '12AM', feeds: 1, avgDuration: 25, efficiency: 85 },
    { time: '3AM', feeds: 1, avgDuration: 20, efficiency: 80 },
    { time: '6AM', feeds: 1, avgDuration: 30, efficiency: 90 },
    { time: '9AM', feeds: 1, avgDuration: 15, efficiency: 75 },
    { time: '12PM', feeds: 1, avgDuration: 25, efficiency: 85 },
    { time: '3PM', feeds: 1, avgDuration: 20, efficiency: 80 },
    { time: '6PM', feeds: 1, avgDuration: 35, efficiency: 95 },
    { time: '9PM', feeds: 1, avgDuration: 30, efficiency: 90 },
  ];

  const feedingTrendsData = [
    { date: 'Jan 15', breastFeeds: 6, bottleFeeds: 2, pumpSessions: 1, totalVolume: 680 },
    { date: 'Jan 16', breastFeeds: 7, bottleFeeds: 1, pumpSessions: 2, totalVolume: 720 },
    { date: 'Jan 17', breastFeeds: 5, bottleFeeds: 3, pumpSessions: 1, totalVolume: 650 },
    { date: 'Jan 18', breastFeeds: 8, bottleFeeds: 1, pumpSessions: 2, totalVolume: 750 },
    { date: 'Jan 19', breastFeeds: 6, bottleFeeds: 2, pumpSessions: 1, totalVolume: 700 },
    { date: 'Jan 20', breastFeeds: 7, bottleFeeds: 2, pumpSessions: 1, totalVolume: 730 },
    { date: 'Jan 21', breastFeeds: 8, bottleFeeds: 1, pumpSessions: 2, totalVolume: 780 },
  ];

  const feedingIntervalsData = [
    { interval: '1-2h', count: 2, percentage: 15 },
    { interval: '2-3h', count: 8, percentage: 60 },
    { interval: '3-4h', count: 3, percentage: 20 },
    { interval: '4+h', count: 1, percentage: 5 },
  ];

  const sidePreferenceData = [
    { name: 'Left', value: 55, color: '#8884d8', avgDuration: 18 },
    { name: 'Right', value: 45, color: '#82ca9d', avgDuration: 16 },
  ];

  const volumeProgressData = [
    { week: 'Week 1', avgBottle: 60, dailyTotal: 480, pumpOutput: 90 },
    { week: 'Week 2', avgBottle: 80, dailyTotal: 560, pumpOutput: 120 },
    { week: 'Week 3', avgBottle: 100, dailyTotal: 650, pumpOutput: 150 },
    { week: 'Week 4', avgBottle: 120, dailyTotal: 720, pumpOutput: 180 },
    { week: 'Week 5', avgBottle: 130, dailyTotal: 750, pumpOutput: 200 },
    { week: 'Week 6', avgBottle: 140, dailyTotal: 780, pumpOutput: 220 },
  ];

  const clusterFeedingData = [
    { timeRange: '5-7PM', frequency: 3.2, avgInterval: 45, isCluster: true },
    { timeRange: '7-9PM', frequency: 2.8, avgInterval: 50, isCluster: true },
    { timeRange: '9-11PM', frequency: 1.5, avgInterval: 120, isCluster: false },
    { timeRange: '11PM-1AM', frequency: 1.0, avgInterval: 180, isCluster: false },
    { timeRange: '1-3AM', frequency: 1.2, avgInterval: 150, isCluster: false },
    { timeRange: '3-5AM', frequency: 1.0, avgInterval: 180, isCluster: false },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">8.2</p>
              </div>
              <Baby className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+0.3 vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">22min</p>
              </div>
              <Timer className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">Optimal range</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Feed Efficiency</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <Droplets className="w-8 h-8 text-orange-600" />
            </div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Volume</p>
                <p className="text-2xl font-bold">750ml</p>
              </div>
              <Baby className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+50ml vs target</span>
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
                <span className="text-sm text-muted-foreground">Current Bottle Size</span>
                <span className="font-semibold">140ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pump Efficiency</span>
                <span className="font-semibold text-green-600">220ml/session</span>
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
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm">
              <strong>Cluster Period Detected:</strong> 5-9PM shows 3x normal feeding frequency. 
              This is typical evening cluster feeding behavior.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Feeding Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Growth Correlation</Badge>
              <p className="text-sm">Daily intake increased 15% following growth spurt at 4 weeks. Weight gain on track.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Efficiency</Badge>
              <p className="text-sm">Left side feeds are 12% longer but show higher satisfaction rates (longer intervals).</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Timing</Badge>
              <p className="text-sm">Feeds within 30min of wake-up are 25% more efficient than delayed feeds.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Prediction</Badge>
              <p className="text-sm">Based on current growth rate, expect bottle sizes to increase to 150ml within 2 weeks.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}