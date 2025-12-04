import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Baby, Droplets, Moon, Scale, Clock, Edit, Trash2, TrendingUp } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { feedingApi, sleepApi, diaperApi, growthApi } from "../services/api";
import type { FeedingSession, SleepSession, DiaperEvent, GrowthMeasurement } from "../types/api";

interface ActivityFeedProps {
  babyId: string;
  refreshTrigger: number;
}

interface Activity {
  id: string;
  type: 'feed' | 'nappy' | 'sleep' | 'growth';
  timestamp: Date;
  time: string;
  details: string;
  notes?: string;
}

export function ActivityFeed({ babyId, refreshTrigger }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [babyId, refreshTrigger]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Fetch all activity types in parallel
      const [feedings, sleeps, diapers, growths] = await Promise.all([
        feedingApi.getAll({ baby_id: babyId }),
        sleepApi.getAll({ baby_id: babyId }),
        diaperApi.getAll({ baby_id: babyId }),
        growthApi.getAll({ baby_id: babyId }),
      ]);

      // Transform and combine all activities
      const allActivities: Activity[] = [
        ...feedings.map(f => transformFeeding(f)),
        ...sleeps.map(s => transformSleep(s)),
        ...diapers.map(d => transformDiaper(d)),
        ...growths.map(g => transformGrowth(g)),
      ];

      // Sort by timestamp descending
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(allActivities);

      // Set latest weight
      if (growths.length > 0) {
        const sortedGrowths = [...growths].sort((a, b) =>
          new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime()
        );
        setLatestWeight(sortedGrowths[0].weight_kg || null);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformFeeding = (feeding: FeedingSession): Activity => {
    const timestamp = parseISO(feeding.start_time);
    let details = '';

    if (feeding.feeding_type === 'breast') {
      const leftDur = feeding.left_breast_duration || 0;
      const rightDur = feeding.right_breast_duration || 0;
      details = `Breast feeding - Left: ${leftDur}min, Right: ${rightDur}min`;
    } else if (feeding.feeding_type === 'bottle') {
      details = `Bottle - ${feeding.volume_consumed_ml || 0}ml`;
    } else if (feeding.feeding_type === 'solid') {
      details = `Solid food - ${feeding.food_items?.join(', ') || 'Unknown'}`;
    }

    return {
      id: feeding.id,
      type: 'feed',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details,
      notes: feeding.notes,
    };
  };

  const transformSleep = (sleep: SleepSession): Activity => {
    const timestamp = parseISO(sleep.sleep_start);
    const duration = sleep.duration_minutes || 0;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;

    return {
      id: sleep.id,
      type: 'sleep',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details: `${sleep.sleep_type} sleep - ${hours}h ${mins}m (${sleep.sleep_quality})`,
      notes: sleep.notes,
    };
  };

  const transformDiaper = (diaper: DiaperEvent): Activity => {
    const timestamp = parseISO(diaper.timestamp);
    const types = [];
    if (diaper.has_urine) types.push('wet');
    if (diaper.has_stool) types.push('dirty');

    return {
      id: diaper.id,
      type: 'nappy',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details: `Diaper change - ${types.join(' & ') || 'clean'}`,
      notes: diaper.notes,
    };
  };

  const transformGrowth = (growth: GrowthMeasurement): Activity => {
    const timestamp = parseISO(growth.measurement_date);
    const details = [];
    if (growth.weight_kg) details.push(`${growth.weight_kg}kg`);
    if (growth.length_cm) details.push(`${growth.length_cm}cm`);

    return {
      id: growth.id,
      type: 'growth',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details: `Growth measurement - ${details.join(', ')}`,
      notes: growth.notes,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'feed':
        return <Baby className="w-4 h-4 text-blue-600" />;
      case 'nappy':
        return <Droplets className="w-4 h-4 text-orange-600" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-purple-600" />;
      case 'growth':
        return <Scale className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'feed':
        return 'bg-blue-50 border-blue-200';
      case 'nappy':
        return 'bg-orange-50 border-orange-200';
      case 'sleep':
        return 'bg-purple-50 border-purple-200';
      case 'growth':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = format(activity.timestamp, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, any[]>);

  const todayStats = activities.filter(activity => isToday(activity.timestamp));
  const feedCount = todayStats.filter(a => a.type === 'feed').length;
  const nappyCount = todayStats.filter(a => a.type === 'nappy').length;
  const sleepActivities = todayStats.filter(a => a.type === 'sleep');

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
          <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Baby className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{feedCount}</p>
              <p className="text-sm text-muted-foreground">Feeds</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Droplets className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{nappyCount}</p>
              <p className="text-sm text-muted-foreground">Nappies</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{sleepActivities.length}</p>
              <p className="text-sm text-muted-foreground">Sleep Events</p>
            </div>
            <div className="text-center lg:block hidden">
              <div className="flex items-center justify-center mb-2">
                <Scale className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {latestWeight ? `${latestWeight}kg` : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Last Weight</p>
            </div>
            <div className="text-center lg:block hidden">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">-</p>
              <p className="text-sm text-muted-foreground">Avg Wake Window</p>
            </div>
            <div className="text-center lg:block hidden">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {(() => {
                  const sleepToday = todayStats.filter(a => a.type === 'sleep');
                  if (sleepToday.length === 0) return '-';
                  const longestSleep = Math.max(...sleepToday.map(s => {
                    const match = s.details.match(/(\d+)h (\d+)m/);
                    if (!match) return 0;
                    return parseInt(match[1]) * 60 + parseInt(match[2]);
                  }));
                  const hours = Math.floor(longestSleep / 60);
                  const mins = longestSleep % 60;
                  return `${hours}h ${mins}m`;
                })()}
              </p>
              <p className="text-sm text-muted-foreground">Longest Sleep</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent baby activities and events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 lg:h-[600px]">
                <div className="space-y-4">
                  {Object.entries(groupedActivities)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, dayActivities]) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold text-sm">{getDateLabel(new Date(date))}</h4>
                          <div className="flex-1 h-px bg-border"></div>
                          <Badge variant="outline">{dayActivities.length} events</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {dayActivities
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((activity) => (
                              <div 
                                key={activity.id} 
                                className={`p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                      {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium capitalize">
                                          {activity.type}
                                        </h5>
                                        <Badge variant="secondary" className="text-xs">
                                          {activity.time}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {activity.details}
                                      </p>
                                      {activity.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                          "{activity.notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
              <CardDescription>Activity trends from your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h5 className="font-medium">Total Activities</h5>
                  <p className="text-sm text-muted-foreground">{activities.length} recorded</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Today's Feeds</h5>
                  <p className="text-sm text-muted-foreground">{feedCount} feeds logged</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(feedCount * 10, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Today's Nappies</h5>
                  <p className="text-sm text-muted-foreground">{nappyCount} changes</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(nappyCount * 10, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Activities</span>
                  <span className="font-semibold">{activities.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="font-semibold">{todayStats.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Feeds Today</span>
                  <span className="font-semibold">{feedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sleep Events</span>
                  <span className="font-semibold text-purple-600">{sleepActivities.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}