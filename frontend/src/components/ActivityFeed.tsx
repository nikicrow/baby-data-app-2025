import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Baby, Droplets, Moon, Scale, Clock, Edit, Trash2, TrendingUp, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { feedingApi, sleepApi, diaperApi, growthApi } from "../services/api";
import type { FeedingSession, SleepSession, DiaperEvent, GrowthMeasurement } from "../types/api";

interface Activity {
  id: string;
  type: 'feed' | 'nappy' | 'sleep' | 'growth';
  timestamp: Date;
  time: string;
  details: string;
  notes?: string;
}

interface ActivityFeedProps {
  babyId: string;
  refreshTrigger?: number;
}

export function ActivityFeed({ babyId, refreshTrigger }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [babyId, refreshTrigger]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Fetch all activity types in parallel
      const [feedings, sleeps, diapers, growth] = await Promise.all([
        feedingApi.getAll({ baby_id: babyId, limit: 50 }),
        sleepApi.getAll({ baby_id: babyId, limit: 50 }),
        diaperApi.getAll({ baby_id: babyId, limit: 50 }),
        growthApi.getAll({ baby_id: babyId, limit: 50 }),
      ]);

      // Transform and combine all activities
      const allActivities: Activity[] = [
        ...feedings.map(transformFeedingToActivity),
        ...sleeps.map(transformSleepToActivity),
        ...diapers.map(transformDiaperToActivity),
        ...growth.map(transformGrowthToActivity),
      ];

      // Sort by timestamp descending
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformFeedingToActivity = (feeding: FeedingSession): Activity => {
    const timestamp = new Date(feeding.start_time);
    let details = '';

    if (feeding.feeding_type === 'breast') {
      const duration = feeding.duration_minutes || 0;
      details = `${feeding.breast_started || 'Unknown'} breast, ${duration} min`;
    } else if (feeding.feeding_type === 'bottle') {
      details = `Bottle, ${feeding.volume_consumed_ml || 0}ml`;
    } else {
      details = `Solid food`;
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

  const transformSleepToActivity = (sleep: SleepSession): Activity => {
    const timestamp = new Date(sleep.sleep_start);
    const duration = sleep.duration_minutes || 0;
    const details = sleep.sleep_end
      ? `Slept for ${duration} min at ${sleep.location}`
      : `Sleep started at ${sleep.location}`;

    return {
      id: sleep.id,
      type: 'sleep',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details,
      notes: sleep.notes,
    };
  };

  const transformDiaperToActivity = (diaper: DiaperEvent): Activity => {
    const timestamp = new Date(diaper.timestamp);
    let details = '';

    if (diaper.has_urine && diaper.has_stool) {
      details = 'Both (wet and poopy)';
    } else if (diaper.has_urine) {
      details = `Wet diaper (${diaper.urine_volume})`;
    } else if (diaper.has_stool) {
      details = `Poopy diaper (${diaper.stool_consistency || 'unknown'})`;
    } else {
      details = 'Clean diaper';
    }

    return {
      id: diaper.id,
      type: 'nappy',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details,
      notes: diaper.notes,
    };
  };

  const transformGrowthToActivity = (measurement: GrowthMeasurement): Activity => {
    const timestamp = new Date(measurement.created_at);
    const parts = [];

    if (measurement.weight_kg) parts.push(`Weight: ${measurement.weight_kg}kg`);
    if (measurement.length_cm) parts.push(`Height: ${measurement.length_cm}cm`);
    if (measurement.head_circumference_cm) parts.push(`Head: ${measurement.head_circumference_cm}cm`);

    const details = parts.length > 0 ? parts.join(', ') : 'Growth measurement';

    return {
      id: measurement.id,
      type: 'growth',
      timestamp,
      time: format(timestamp, 'h:mm a'),
      details,
      notes: measurement.notes,
    };
  };

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
  }, {} as Record<string, Activity[]>);

  const todayStats = activities.filter(activity => isToday(activity.timestamp));
  const feedCount = todayStats.filter(a => a.type === 'feed').length;
  const nappyCount = todayStats.filter(a => a.type === 'nappy').length;
  const sleepActivities = todayStats.filter(a => a.type === 'sleep');

  // Calculate last weight from growth measurements
  const growthMeasurements = activities.filter(a => a.type === 'growth');
  const lastWeight = growthMeasurements.length > 0
    ? growthMeasurements[0].details.match(/Weight: ([\d.]+)kg/)?.[1] || 'N/A'
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
              <p className="text-2xl font-bold text-green-600">{lastWeight}kg</p>
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
              <p className="text-2xl font-bold text-green-600">-</p>
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
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No activities yet. Start logging your baby's activities!</p>
                  </div>
                ) : (
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
                              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
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
                                            {activity.type === 'nappy' ? 'Diaper' : activity.type}
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
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview Sidebar */}
        <div className="space-y-6">
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
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-semibold">
                    {activities.filter(a => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return a.timestamp >= weekAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
