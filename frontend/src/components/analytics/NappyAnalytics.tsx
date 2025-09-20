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
import { Droplets, Clock, TrendingUp, Baby, Zap, AlertTriangle } from "lucide-react";

export function NappyAnalytics() {
  // Mock data for detailed nappy analytics
  const dailyNappyData = [
    { time: '6AM', wet: 1, poopy: 0, both: 0, total: 1 },
    { time: '9AM', wet: 1, poopy: 1, both: 0, total: 2 },
    { time: '12PM', wet: 0, poopy: 1, both: 0, total: 1 },
    { time: '3PM', wet: 1, poopy: 0, both: 1, total: 2 },
    { time: '6PM', wet: 1, poopy: 1, both: 0, total: 2 },
    { time: '9PM', wet: 1, poopy: 0, both: 0, total: 1 },
    { time: '12AM', wet: 1, poopy: 0, both: 0, total: 1 },
  ];

  const weeklyNappyTrends = [
    { date: 'Jan 15', wet: 6, poopy: 3, both: 1, total: 10, avgInterval: 2.4 },
    { date: 'Jan 16', wet: 7, poopy: 2, both: 2, total: 11, avgInterval: 2.2 },
    { date: 'Jan 17', wet: 5, poopy: 4, both: 1, total: 10, avgInterval: 2.4 },
    { date: 'Jan 18', wet: 8, poopy: 2, both: 1, total: 11, avgInterval: 2.2 },
    { date: 'Jan 19', wet: 6, poopy: 3, both: 2, total: 11, avgInterval: 2.2 },
    { date: 'Jan 20', wet: 7, poopy: 3, both: 1, total: 11, avgInterval: 2.2 },
    { date: 'Jan 21', wet: 6, poopy: 4, both: 1, total: 11, avgInterval: 2.2 },
  ];

  const nappyTypeDistribution = [
    { name: 'Wet Only', value: 60, color: '#8884d8', count: 42 },
    { name: 'Poopy Only', value: 25, color: '#82ca9d', count: 18 },
    { name: 'Both', value: 15, color: '#ffc658', count: 10 },
  ];

  const intervalAnalysis = [
    { interval: '0-1h', count: 5, percentage: 7, urgency: 'high' },
    { interval: '1-2h', count: 15, percentage: 21, urgency: 'normal' },
    { interval: '2-3h', count: 35, percentage: 50, urgency: 'normal' },
    { interval: '3-4h', count: 12, percentage: 17, urgency: 'normal' },
    { interval: '4+h', count: 3, percentage: 5, urgency: 'concerning' },
  ];

  const feedNappyCorrelation = [
    { hour: 0, feeds: 1, nappies: 0.8 },
    { hour: 1, feeds: 0, nappies: 0.5 },
    { hour: 2, feeds: 0, nappies: 0.3 },
    { hour: 3, feeds: 1, nappies: 0.9 },
    { hour: 4, feeds: 0, nappies: 0.4 },
    { hour: 5, feeds: 0, nappies: 0.2 },
    { hour: 6, feeds: 1, nappies: 1.1 },
  ];

  const nappyHealthIndicators = [
    { week: 'Week 1', hydration: 85, digestiveHealth: 78, frequency: 8.5 },
    { week: 'Week 2', hydration: 88, digestiveHealth: 82, frequency: 9.2 },
    { week: 'Week 3', hydration: 92, digestiveHealth: 85, frequency: 10.1 },
    { week: 'Week 4', hydration: 90, digestiveHealth: 88, frequency: 10.8 },
    { week: 'Week 5', hydration: 93, digestiveHealth: 90, frequency: 11.0 },
    { week: 'Week 6', hydration: 95, digestiveHealth: 92, frequency: 11.2 },
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
                <p className="text-2xl font-bold">11</p>
              </div>
              <Droplets className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+1 vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Interval</p>
                <p className="text-2xl font-bold">2.2h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">Healthy range</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hydration Score</p>
                <p className="text-2xl font-bold">95%</p>
              </div>
              <Droplets className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={95} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Digestive Health</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <Baby className="w-8 h-8 text-orange-600" />
            </div>
            <Progress value={92} className="mt-2" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
            <CardDescription>Nappy frequency and timing trends</CardDescription>
          </CardHeader>
          <CardContent>
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
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={nappyTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Intervals</CardTitle>
            <CardDescription>Time between nappy changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={intervalAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="interval" />
                <YAxis />
                <Bar 
                  dataKey="count" 
                  fill={(data) => {
                    if (data.urgency === 'high') return "#ff7c7c";
                    if (data.urgency === 'concerning') return "#ffa500";
                    return "#8884d8";
                  }}
                />
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
              <strong>Pattern:</strong> Peak nappy activity occurs 1 hour after feeds. 
              This timing is healthy and indicates good digestion.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Health Indicators Progress</CardTitle>
          <CardDescription>Weekly progression of digestive and hydration health</CardDescription>
        </CardHeader>
        <CardContent>
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
              <p className="text-lg font-bold text-blue-600">95%</p>
              <p className="text-xs text-green-600">↑10% improvement</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Digestive Health</p>
              <p className="text-lg font-bold text-green-600">92%</p>
              <p className="text-xs text-green-600">↑14% improvement</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Frequency Trend</p>
              <p className="text-lg font-bold text-orange-600">11.2/day</p>
              <p className="text-xs text-muted-foreground">Stable & healthy</p>
            </div>
          </div>
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
            <div className="flex items-start gap-3">
              <Badge variant="default" className="bg-green-600">Healthy</Badge>
              <p className="text-sm">Nappy frequency and patterns are within normal range for age.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Hydration</Badge>
              <p className="text-sm">Excellent hydration indicators - wet nappies occurring every 2-3 hours consistently.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Digestion</Badge>
              <p className="text-sm">Regular bowel movements with healthy timing patterns. No signs of constipation.</p>
            </div>
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
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Timing</Badge>
              <p className="text-sm">Most productive changes occur 30-60 minutes after feeds, indicating healthy digestion speed.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Pattern</Badge>
              <p className="text-sm">Evening cluster feeding correlates with increased nappy frequency 6-9PM. This is normal.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Efficiency</Badge>
              <p className="text-sm">92% of changes are necessary (not precautionary), indicating good timing recognition.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Prediction</Badge>
              <p className="text-sm">Based on growth trends, expect slight increase to 12-13 changes daily over next 2 weeks.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}