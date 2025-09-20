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
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { Scale, TrendingUp, Target, Baby, Zap, Award } from "lucide-react";

export function GrowthAnalytics() {
  // Mock data for detailed growth analytics
  const growthProgressData = [
    { 
      date: 'Birth', 
      weight: 3.2, 
      height: 48, 
      headCircumference: 34.5,
      weightPercentile: 45,
      heightPercentile: 50,
      age: 0 
    },
    { 
      date: 'Week 1', 
      weight: 3.1, 
      height: 48.5, 
      headCircumference: 35.0,
      weightPercentile: 40,
      heightPercentile: 52,
      age: 1 
    },
    { 
      date: 'Week 2', 
      weight: 3.4, 
      height: 49.2, 
      headCircumference: 35.5,
      weightPercentile: 48,
      heightPercentile: 55,
      age: 2 
    },
    { 
      date: 'Week 3', 
      weight: 3.7, 
      height: 50.1, 
      headCircumference: 36.0,
      weightPercentile: 52,
      heightPercentile: 58,
      age: 3 
    },
    { 
      date: 'Week 4', 
      weight: 4.1, 
      height: 51.0, 
      headCircumference: 36.5,
      weightPercentile: 58,
      heightPercentile: 62,
      age: 4 
    },
    { 
      date: 'Week 5', 
      weight: 4.3, 
      height: 51.8, 
      headCircumference: 37.0,
      weightPercentile: 60,
      heightPercentile: 65,
      age: 5 
    },
    { 
      date: 'Week 6', 
      weight: 4.6, 
      height: 52.5, 
      headCircumference: 37.5,
      weightPercentile: 65,
      heightPercentile: 68,
      age: 6 
    },
  ];

  const growthVelocityData = [
    { period: 'Week 1-2', weightGain: 300, heightGain: 0.7, velocity: 'Normal' },
    { period: 'Week 2-3', weightGain: 300, heightGain: 0.9, velocity: 'Normal' },
    { period: 'Week 3-4', weightGain: 400, heightGain: 0.9, velocity: 'Accelerated' },
    { period: 'Week 4-5', weightGain: 200, heightGain: 0.8, velocity: 'Normal' },
    { period: 'Week 5-6', weightGain: 300, heightGain: 0.7, velocity: 'Normal' },
  ];

  const percentileComparison = [
    { measurement: 'Weight', current: 65, birth: 45, target: 50 },
    { measurement: 'Height', current: 68, birth: 50, target: 50 },
    { measurement: 'Head Circumference', current: 62, birth: 48, target: 50 },
  ];

  const milestoneData = [
    { milestone: 'First Smile', expectedWeek: 6, actualWeek: 5, status: 'early' },
    { milestone: 'Holds Head Up', expectedWeek: 8, actualWeek: null, status: 'pending' },
    { milestone: 'Rolls Over', expectedWeek: 16, actualWeek: null, status: 'future' },
    { milestone: 'Sits Up', expectedWeek: 24, actualWeek: null, status: 'future' },
  ];

  const nutritionCorrelation = [
    { week: 1, dailyIntake: 480, weightGain: 150 },
    { week: 2, dailyIntake: 520, weightGain: 200 },
    { week: 3, dailyIntake: 580, weightGain: 300 },
    { week: 4, dailyIntake: 640, weightGain: 400 },
    { week: 5, dailyIntake: 680, weightGain: 200 },
    { week: 6, dailyIntake: 720, weightGain: 300 },
  ];

  const growthProjection = [
    { month: 'Month 2', projectedWeight: 5.2, projectedHeight: 55 },
    { month: 'Month 3', projectedWeight: 6.1, projectedHeight: 58 },
    { month: 'Month 4', projectedWeight: 7.0, projectedHeight: 61 },
    { month: 'Month 6', projectedWeight: 8.5, projectedHeight: 66 },
    { month: 'Month 12', projectedWeight: 10.2, projectedHeight: 75 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold">4.6kg</p>
              </div>
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+300g this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Height</p>
                <p className="text-2xl font-bold">52.5cm</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">+0.7cm this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weight Percentile</p>
                <p className="text-2xl font-bold">65th</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Velocity</p>
                <p className="text-2xl font-bold">Normal</p>
              </div>
              <Baby className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-green-600">Healthy rate</span>
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
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={growthProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="weight" orientation="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="height" orientation="right" label={{ value: 'Height (cm)', angle: 90, position: 'insideRight' }} />
                <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={3} name="Weight" />
                <Line yAxisId="height" type="monotone" dataKey="height" stroke="#82ca9d" strokeWidth={3} name="Height" />
                <ReferenceLine yAxisId="weight" y={3.2} stroke="#ff7c7c" strokeDasharray="5 5" label="Birth Weight" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Percentile Tracking</CardTitle>
            <CardDescription>How your baby compares to population averages</CardDescription>
          </CardHeader>
          <CardContent>
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
                <span className="font-semibold">300g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Weekly Height Gain</span>
                <span className="font-semibold">0.8cm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Percentile Progress</CardTitle>
            <CardDescription>Current vs birth percentiles</CardDescription>
          </CardHeader>
          <CardContent>
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
                      {item.current > item.birth ? "↑" : "→"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
              <strong>Correlation:</strong> Strong positive relationship (r=0.78) between daily intake and weight gain. 
              Current intake levels are supporting healthy growth.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Milestones & Projections */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Developmental Milestones</CardTitle>
            <CardDescription>Tracking developmental progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestoneData.map((milestone) => (
                <div key={milestone.milestone} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{milestone.milestone}</p>
                    <p className="text-sm text-muted-foreground">
                      Expected: Week {milestone.expectedWeek}
                      {milestone.actualWeek && ` | Achieved: Week ${milestone.actualWeek}`}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      milestone.status === 'early' ? "default" : 
                      milestone.status === 'pending' ? "secondary" : 
                      "outline"
                    }
                  >
                    {milestone.status === 'early' && <Award className="w-3 h-3 mr-1" />}
                    {milestone.status === 'early' ? 'Early!' : 
                     milestone.status === 'pending' ? 'Coming Soon' : 
                     'Future'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Projections</CardTitle>
            <CardDescription>Predicted growth based on current trends</CardDescription>
          </CardHeader>
          <CardContent>
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
                <span className="font-semibold">8.5kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projected 1-year weight</span>
                <span className="font-semibold">10.2kg</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Growth Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="bg-green-600">Excellent</Badge>
              <p className="text-sm">Growth velocity is consistently within healthy ranges. No concerns detected.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Percentile Trend</Badge>
              <p className="text-sm">Steady upward movement from 45th to 65th percentile indicates thriving development.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Nutrition</Badge>
              <p className="text-sm">Current feeding schedule is optimally supporting growth. Maintain current approach.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Milestone</Badge>
              <p className="text-sm">Early achievement of first smile suggests healthy neurological development.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Projection</Badge>
              <p className="text-sm">On track to reach 50th percentile for weight by 3 months based on current trajectory.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}