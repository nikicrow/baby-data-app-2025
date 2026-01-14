import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Baby, Droplets, Moon, Scale, Clock, Edit, Trash2, TrendingUp, Loader2 } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "sonner";
import { feedingApi, sleepApi, diaperApi, growthApi } from "../services/api";
import type {
  FeedingSession,
  SleepSession,
  DiaperEvent,
  GrowthMeasurement,
  FeedingSessionUpdate,
  SleepSessionUpdate,
  DiaperEventUpdate,
  GrowthMeasurementUpdate,
} from "../types/api";

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
  // Store original data for editing
  originalData?: FeedingSession | SleepSession | DiaperEvent | GrowthMeasurement;
}

export function ActivityFeed({ babyId, refreshTrigger }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);

  // Delete state
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  // Edit state
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const editDialogRef = useRef<HTMLDialogElement>(null);

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

      // Show both breasts if both were used
      if (leftDur > 0 && rightDur > 0) {
        const firstBreast = feeding.breast_started === 'left' ? 'Left' : 'Right';
        const secondBreast = feeding.breast_started === 'left' ? 'Right' : 'Left';
        const firstDur = feeding.breast_started === 'left' ? leftDur : rightDur;
        const secondDur = feeding.breast_started === 'left' ? rightDur : leftDur;
        details = `Breast - ${firstBreast}: ${firstDur}min, then ${secondBreast}: ${secondDur}min (${leftDur + rightDur}min total)`;
      } else if (leftDur > 0) {
        details = `Breast - Left: ${leftDur}min`;
      } else if (rightDur > 0) {
        details = `Breast - Right: ${rightDur}min`;
      } else {
        details = 'Breast feeding';
      }
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
      originalData: feeding,
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
      originalData: sleep,
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
      originalData: diaper,
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
      originalData: growth,
    };
  };

  // Delete handlers
  const handleDeleteClick = (activity: Activity) => {
    setActivityToDelete(activity);
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteDialog = () => {
    deleteDialogRef.current?.close();
    setActivityToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!activityToDelete) return;

    setIsDeleting(true);
    try {
      switch (activityToDelete.type) {
        case 'feed':
          await feedingApi.delete(activityToDelete.id);
          break;
        case 'sleep':
          await sleepApi.delete(activityToDelete.id);
          break;
        case 'nappy':
          await diaperApi.delete(activityToDelete.id);
          break;
        case 'growth':
          await growthApi.delete(activityToDelete.id);
          break;
      }
      toast.success('Activity deleted successfully');
      fetchActivities();
    } catch (error: any) {
      console.error('Failed to delete activity:', error);
      toast.error(`Failed to delete: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsDeleting(false);
      closeDeleteDialog();
    }
  };

  // Edit handlers
  const handleEditClick = (activity: Activity) => {
    setActivityToEdit(activity);

    // Pre-populate form based on activity type
    if (activity.originalData) {
      switch (activity.type) {
        case 'feed': {
          const feeding = activity.originalData as FeedingSession;
          const feedingDate = parseISO(feeding.start_time);
          setEditFormData({
            feedType: feeding.feeding_type,
            leftBreastDuration: feeding.left_breast_duration || '',
            rightBreastDuration: feeding.right_breast_duration || '',
            breastStarted: feeding.breast_started || '',
            volume: feeding.volume_consumed_ml || '',
            notes: feeding.notes || '',
            date: format(feedingDate, 'yyyy-MM-dd'),
            time: format(feedingDate, 'HH:mm'),
          });
          break;
        }
        case 'sleep': {
          const sleep = activity.originalData as SleepSession;
          const sleepDate = parseISO(sleep.sleep_start);
          setEditFormData({
            sleepType: sleep.sleep_type,
            location: sleep.location,
            sleepQuality: sleep.sleep_quality,
            notes: sleep.notes || '',
            date: format(sleepDate, 'yyyy-MM-dd'),
            time: format(sleepDate, 'HH:mm'),
          });
          break;
        }
        case 'nappy': {
          const diaper = activity.originalData as DiaperEvent;
          const diaperDate = parseISO(diaper.timestamp);
          setEditFormData({
            hasUrine: diaper.has_urine,
            hasStool: diaper.has_stool,
            notes: diaper.notes || '',
            date: format(diaperDate, 'yyyy-MM-dd'),
            time: format(diaperDate, 'HH:mm'),
          });
          break;
        }
        case 'growth': {
          const growth = activity.originalData as GrowthMeasurement;
          const growthDate = parseISO(growth.measurement_date);
          setEditFormData({
            weight: growth.weight_kg || '',
            length: growth.length_cm || '',
            notes: growth.notes || '',
            date: format(growthDate, 'yyyy-MM-dd'),
            time: format(growthDate, 'HH:mm'),
          });
          break;
        }
      }
    }
    editDialogRef.current?.showModal();
  };

  const closeEditDialog = () => {
    editDialogRef.current?.close();
    setActivityToEdit(null);
    setEditFormData({});
  };

  const handleEditSubmit = async () => {
    if (!activityToEdit) return;

    setIsEditing(true);
    try {
      // Build timestamp from date and time fields
      const newTimestamp = editFormData.date && editFormData.time
        ? new Date(`${editFormData.date}T${editFormData.time}`).toISOString()
        : undefined;

      switch (activityToEdit.type) {
        case 'feed': {
          const updateData: FeedingSessionUpdate = {
            notes: editFormData.notes || undefined,
            start_time: newTimestamp,
          };
          if (editFormData.feedType === 'breast') {
            updateData.left_breast_duration = editFormData.leftBreastDuration ? parseInt(editFormData.leftBreastDuration) : undefined;
            updateData.right_breast_duration = editFormData.rightBreastDuration ? parseInt(editFormData.rightBreastDuration) : undefined;
            updateData.breast_started = editFormData.breastStarted || undefined;
          } else if (editFormData.feedType === 'bottle') {
            updateData.volume_consumed_ml = editFormData.volume ? parseInt(editFormData.volume) : undefined;
            updateData.volume_offered_ml = editFormData.volume ? parseInt(editFormData.volume) : undefined;
          }
          await feedingApi.update(activityToEdit.id, updateData);
          break;
        }
        case 'sleep': {
          const updateData: SleepSessionUpdate = {
            sleep_type: editFormData.sleepType,
            location: editFormData.location,
            sleep_quality: editFormData.sleepQuality,
            notes: editFormData.notes || undefined,
            sleep_start: newTimestamp,
          };
          await sleepApi.update(activityToEdit.id, updateData);
          break;
        }
        case 'nappy': {
          const updateData: DiaperEventUpdate = {
            has_urine: editFormData.hasUrine,
            has_stool: editFormData.hasStool,
            notes: editFormData.notes || undefined,
            timestamp: newTimestamp,
          };
          await diaperApi.update(activityToEdit.id, updateData);
          break;
        }
        case 'growth': {
          const updateData: GrowthMeasurementUpdate = {
            weight_kg: editFormData.weight ? parseFloat(editFormData.weight) : undefined,
            length_cm: editFormData.length ? parseFloat(editFormData.length) : undefined,
            notes: editFormData.notes || undefined,
            measurement_date: newTimestamp,
          };
          await growthApi.update(activityToEdit.id, updateData);
          break;
        }
      }
      toast.success('Activity updated successfully');
      fetchActivities();
    } catch (error: any) {
      console.error('Failed to update activity:', error);
      toast.error(`Failed to update: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsEditing(false);
      closeEditDialog();
    }
  };

  // Reusable date/time picker for edit forms
  const renderDateTimePicker = () => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="editDate">Date</Label>
        <Input
          id="editDate"
          type="date"
          value={editFormData.date || ''}
          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="editTime">Time</Label>
        <Input
          id="editTime"
          type="time"
          value={editFormData.time || ''}
          onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
        />
      </div>
    </div>
  );

  // Render edit form based on activity type
  const renderEditForm = () => {
    if (!activityToEdit) return null;

    switch (activityToEdit.type) {
      case 'feed': {
        const feeding = activityToEdit.originalData as FeedingSession;
        return (
          <div className="space-y-4">
            {renderDateTimePicker()}
            <div className="text-sm text-muted-foreground">
              Type: <span className="font-medium capitalize">{feeding.feeding_type}</span>
            </div>
            {feeding.feeding_type === 'breast' && (
              <>
                <div>
                  <Label htmlFor="leftBreastDuration">Left breast (minutes)</Label>
                  <Input
                    id="leftBreastDuration"
                    type="number"
                    value={editFormData.leftBreastDuration}
                    onChange={(e) => setEditFormData({ ...editFormData, leftBreastDuration: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="rightBreastDuration">Right breast (minutes)</Label>
                  <Input
                    id="rightBreastDuration"
                    type="number"
                    value={editFormData.rightBreastDuration}
                    onChange={(e) => setEditFormData({ ...editFormData, rightBreastDuration: e.target.value })}
                  />
                </div>
              </>
            )}
            {feeding.feeding_type === 'bottle' && (
              <div>
                <Label htmlFor="volume">Volume (ml)</Label>
                <Input
                  id="volume"
                  type="number"
                  value={editFormData.volume}
                  onChange={(e) => setEditFormData({ ...editFormData, volume: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="feedNotes">Notes</Label>
              <Textarea
                id="feedNotes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>
          </div>
        );
      }
      case 'sleep':
        return (
          <div className="space-y-4">
            {renderDateTimePicker()}
            <div>
              <Label htmlFor="sleepType">Sleep Type</Label>
              <Select
                value={editFormData.sleepType}
                onValueChange={(value) => setEditFormData({ ...editFormData, sleepType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nap">Nap</SelectItem>
                  <SelectItem value="nighttime">Nighttime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sleepQuality">Quality</Label>
              <Select
                value={editFormData.sleepQuality}
                onValueChange={(value) => setEditFormData({ ...editFormData, sleepQuality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restless">Restless</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={editFormData.location}
                onValueChange={(value) => setEditFormData({ ...editFormData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crib">Crib</SelectItem>
                  <SelectItem value="bassinet">Bassinet</SelectItem>
                  <SelectItem value="parent_bed">Parent's bed</SelectItem>
                  <SelectItem value="stroller">Stroller</SelectItem>
                  <SelectItem value="car_seat">Car seat</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sleepNotes">Notes</Label>
              <Textarea
                id="sleepNotes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>
          </div>
        );
      case 'nappy':
        return (
          <div className="space-y-4">
            {renderDateTimePicker()}
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editFormData.hasUrine}
                  onChange={(e) => setEditFormData({ ...editFormData, hasUrine: e.target.checked })}
                  className="w-4 h-4"
                />
                Wet
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editFormData.hasStool}
                  onChange={(e) => setEditFormData({ ...editFormData, hasStool: e.target.checked })}
                  className="w-4 h-4"
                />
                Dirty
              </Label>
            </div>
            <div>
              <Label htmlFor="nappyNotes">Notes</Label>
              <Textarea
                id="nappyNotes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>
          </div>
        );
      case 'growth':
        return (
          <div className="space-y-4">
            {renderDateTimePicker()}
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={editFormData.weight}
                onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="length">Length (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                value={editFormData.length}
                onChange={(e) => setEditFormData({ ...editFormData, length: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="growthNotes">Notes</Label>
              <Textarea
                id="growthNotes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
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
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditClick(activity)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={() => handleDeleteClick(activity)}
                                    >
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

      {/* Delete Confirmation Dialog - Native HTML dialog */}
      <dialog
        ref={deleteDialogRef}
        className="rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50 w-full max-w-md"
        onClose={() => setActivityToDelete(null)}
      >
        <div className="p-6">
          <div className="flex flex-col gap-2 text-center sm:text-left mb-4">
            <h2 className="text-lg font-semibold">Delete Activity</h2>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete this {activityToDelete?.type} entry? This action cannot be undone.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </dialog>

      {/* Edit Dialog - Native HTML dialog */}
      <dialog
        ref={editDialogRef}
        className="rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50 w-full max-w-lg"
        onClose={() => {
          setActivityToEdit(null);
          setEditFormData({});
        }}
      >
        <div className="p-6">
          <div className="flex flex-col gap-2 text-center sm:text-left mb-4">
            <h2 className="text-lg font-semibold capitalize">Edit {activityToEdit?.type}</h2>
            <p className="text-muted-foreground text-sm">
              Make changes to this activity entry.
            </p>
          </div>
          {renderEditForm()}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-6">
            <Button variant="outline" onClick={closeEditDialog} disabled={isEditing}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}