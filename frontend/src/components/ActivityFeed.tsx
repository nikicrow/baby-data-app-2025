import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Baby, Droplets, Moon, Scale, Clock, Edit, Trash2, TrendingUp } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface ActivityFeedProps {
  activities: any[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
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
              <p className="text-2xl font-bold text-green-600">4.2kg</p>
              <p className="text-sm text-muted-foreground">Last Weight</p>
            </div>
            <div className="text-center lg:block hidden">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">2h 15m</p>
              <p className="text-sm text-muted-foreground">Avg Wake Window</p>
            </div>
            <div className="text-center lg:block hidden">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">8h 30m</p>
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
              <CardDescription>Activity trends over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h5 className="font-medium">Most Active Day</h5>
                  <p className="text-sm text-muted-foreground">Tuesday (24 activities)</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-xs">85%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Average Daily Feeds</h5>
                  <p className="text-sm text-muted-foreground">8.2 feeds per day</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs">↑12%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Sleep Quality</h5>
                  <p className="text-sm text-muted-foreground">Good consistency</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                    <span className="text-xs">90%</span>
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
                  <span className="font-semibold">147</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-semibold">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average per Day</span>
                  <span className="font-semibold">3.3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="font-semibold text-green-600">12 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}