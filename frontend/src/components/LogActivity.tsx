import { useState, useEffect, useMemo } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import { Baby, Droplets, Moon, Scale, Zap, Loader2, Clock, Sun } from "lucide-react";
import { feedingApi, diaperApi, sleepApi, growthApi } from "../services/api";
import type { SleepSession } from "../types/api";

// Helper to format duration as "Xh Ym"
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
import type {
  FeedingSessionCreate,
  DiaperEventCreate,
  SleepSessionCreate,
  GrowthMeasurementCreate
} from "../types/api";

interface LogActivityProps {
  babyId: string;
  onActivityAdded: () => void;
}

export function LogActivity({ babyId, onActivityAdded }: LogActivityProps) {
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [activeSleep, setActiveSleep] = useState<SleepSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('');

  // Check for active sleep session (one with no end time)
  useEffect(() => {
    const checkActiveSleep = async () => {
      try {
        const sessions = await sleepApi.getAll({ baby_id: babyId });
        const active = sessions.find(s => s.start_time && !s.end_time);
        setActiveSleep(active || null);
      } catch (error) {
        console.error('Failed to check for active sleep:', error);
      }
    };
    checkActiveSleep();
  }, [babyId]);

  // Update elapsed time every minute when there's an active sleep
  useEffect(() => {
    if (!activeSleep) {
      setElapsedTime('');
      return;
    }

    const updateElapsed = () => {
      const startTime = new Date(activeSleep.start_time).getTime();
      const now = Date.now();
      const elapsedMins = Math.floor((now - startTime) / (1000 * 60));
      setElapsedTime(formatDuration(elapsedMins));
    };

    updateElapsed(); // Initial update
    const interval = setInterval(updateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeSleep]);

  // Helper function to get timestamp (current or custom)
  const getTimestamp = (): string => {
    if (useCustomTime && customDate && customTime) {
      return new Date(`${customDate}T${customTime}`).toISOString();
    }
    return new Date().toISOString();
  };

  // Helper to initialize custom date/time with current values when toggled
  const toggleCustomTime = () => {
    if (!useCustomTime) {
      // Initialize with current date/time when opening
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 5); // HH:MM
      setCustomDate(dateStr);
      setCustomTime(timeStr);
    }
    setUseCustomTime(!useCustomTime);
  };

  // Helper to refresh active sleep state
  const refreshActiveSleep = async () => {
    try {
      const sessions = await sleepApi.getAll({ baby_id: babyId });
      const active = sessions.find(s => s.start_time && !s.end_time);
      setActiveSleep(active || null);
    } catch (error) {
      console.error('Failed to refresh active sleep:', error);
    }
  };

  // Compute sleep time preview for "Log Past Sleep"
  const sleepTimePreview = useMemo(() => {
    if (formData.sleepType !== 'log' || !formData.duration) return null;

    const duration = parseInt(formData.duration) || 0;
    if (duration <= 0) return null;

    const endTime = useCustomTime && customDate && customTime
      ? new Date(`${customDate}T${customTime}`)
      : new Date();
    const startTime = new Date(endTime.getTime() - duration * 60 * 1000);

    return {
      start: startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      formatted: formatDuration(duration),
    };
  }, [formData.sleepType, formData.duration, useCustomTime, customDate, customTime]);

  const handleSubmit = async (type: string) => {
    setIsSubmitting(true);
    try {
      switch (type) {
        case 'feed':
          await handleFeedingSubmit();
          break;
        case 'nappy':
          await handleDiaperSubmit();
          break;
        case 'sleep':
          await handleSleepSubmit();
          // Refresh active sleep state after sleep actions
          await refreshActiveSleep();
          break;
        case 'growth':
          await handleGrowthSubmit();
          break;
      }

      setFormData({});
      setActiveEntry(null);
      setUseCustomTime(false);
      setCustomDate('');
      setCustomTime('');
      onActivityAdded();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} logged successfully!`);
    } catch (error: any) {
      console.error(`Failed to log ${type}:`, error);
      // Only show generic error if it's not a validation error we already handled
      if (error.response?.data?.detail) {
        toast.error(`Failed to log ${type}. ${error.response.data.detail}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedingSubmit = async () => {
    const feedingData: FeedingSessionCreate = {
      baby_id: babyId,
      feeding_type: formData.feedType === 'pump' ? 'bottle' : formData.feedType, // Map 'pump' to 'bottle' for now
      start_time: getTimestamp(),
    };

    // Add breast-specific fields
    if (formData.feedType === 'breast' && formData.firstBreast) {
      feedingData.breast_started = formData.firstBreast.toLowerCase() as 'left' | 'right';

      // Add first breast duration
      const firstDuration = parseInt(formData.firstBreastDuration) || 0;
      if (formData.firstBreast === 'left') {
        feedingData.left_breast_duration = firstDuration;
      } else {
        feedingData.right_breast_duration = firstDuration;
      }

      // Add second breast duration if provided
      if (formData.addSecondBreast && formData.secondBreastDuration) {
        const secondDuration = parseInt(formData.secondBreastDuration) || 0;
        if (formData.firstBreast === 'left') {
          feedingData.right_breast_duration = secondDuration;
        } else {
          feedingData.left_breast_duration = secondDuration;
        }
      }
    }

    // Add bottle-specific fields
    if (formData.feedType === 'bottle' || formData.feedType === 'pump') {
      const amount = parseInt(formData.amount) || 0;
      feedingData.volume_consumed_ml = amount;
      feedingData.volume_offered_ml = amount;
    }

    await feedingApi.create(feedingData);
  };

  const handleDiaperSubmit = async () => {
    const nappyType = formData.nappyType || 'Clean';
    const diaperData: DiaperEventCreate = {
      baby_id: babyId,
      timestamp: getTimestamp(),
      has_urine: nappyType === 'Wet diaper' || nappyType === 'Both',
      has_stool: nappyType === 'Poopy diaper' || nappyType === 'Both',
      urine_volume: nappyType === 'Wet diaper' || nappyType === 'Both' ? 'moderate' : 'none',
      diaper_type: 'disposable',
      notes: formData.notes,
    };

    if (diaperData.has_stool) {
      diaperData.stool_consistency = 'soft';
      diaperData.stool_color = 'yellow';
    }

    await diaperApi.create(diaperData);
  };

  const handleSleepSubmit = async () => {
    if (formData.sleepType === 'start') {
      // Start a new sleep timer
      const sleepData: SleepSessionCreate = {
        baby_id: babyId,
        sleep_type: 'nap',
        location: formData.location || 'crib',
        sleep_quality: 'good',
        start_time: getTimestamp(),
        // end_time intentionally omitted - marks as "in progress"
      };
      await sleepApi.create(sleepData);
      setActiveSleep(null); // Will be refreshed on next check

    } else if (formData.sleepType === 'end') {
      // End active sleep - update existing record
      if (!activeSleep) {
        toast.error('No active sleep to end. Use "Log Past Sleep" instead.');
        throw new Error('No active sleep session');
      }
      await sleepApi.update(activeSleep.id, {
        end_time: new Date().toISOString()
      });
      setActiveSleep(null);

    } else if (formData.sleepType === 'log') {
      // Log completed sleep retroactively
      const duration = parseInt(formData.duration) || 0;
      if (duration <= 0) {
        toast.error('Please enter how long baby slept');
        throw new Error('Duration required');
      }

      // Use custom end time if set, otherwise use now
      const endTime = useCustomTime && customDate && customTime
        ? new Date(`${customDate}T${customTime}`)
        : new Date();
      const startTime = new Date(endTime.getTime() - duration * 60 * 1000);

      const sleepData: SleepSessionCreate = {
        baby_id: babyId,
        sleep_type: 'nap',
        location: formData.location || 'crib',
        sleep_quality: 'good',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      };
      await sleepApi.create(sleepData);
    } else {
      toast.error('Please select a sleep action');
      throw new Error('No sleep action selected');
    }
  };

  const handleGrowthSubmit = async () => {
    const growthData: GrowthMeasurementCreate = {
      baby_id: babyId,
      measurement_date: getTimestamp(),
      measurement_context: 'home',
      notes: formData.notes,
    };

    if (formData.weight) {
      growthData.weight_kg = parseFloat(formData.weight);
    }

    if (formData.height) {
      growthData.length_cm = parseFloat(formData.height);
    }

    await growthApi.create(growthData);
  };

  // Reusable time picker component
  const renderTimePicker = () => (
    <div className="border-t pt-4 mt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleCustomTime}
        className="w-full text-left justify-start"
      >
        <Clock className="w-4 h-4 mr-2" />
        {useCustomTime ? 'Using custom time ✓' : 'Log for different time?'}
      </Button>

      {useCustomTime && (
        <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded-md">
          <div>
            <Label htmlFor="customDate" className="text-sm">Date</Label>
            <Input
              id="customDate"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customTime" className="text-sm">Time</Label>
            <Input
              id="customTime"
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="mt-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Logging for: {customDate} at {customTime}
          </p>
        </div>
      )}
    </div>
  );

  const renderFeedingForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Feed Type</Label>
        <Select onValueChange={(value) => setFormData({...formData, feedType: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select feed type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breast">Breastfeed</SelectItem>
            <SelectItem value="bottle">Bottle</SelectItem>
            <SelectItem value="pump">Pump</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.feedType === 'breast' && (
        <>
          <div>
            <Label>Which breast first?</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={formData.firstBreast === 'left' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, firstBreast: 'left'})}
                className="flex-1"
              >
                Left
              </Button>
              <Button
                type="button"
                variant={formData.firstBreast === 'right' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, firstBreast: 'right'})}
                className="flex-1"
              >
                Right
              </Button>
            </div>
          </div>

          {formData.firstBreast && (
            <>
              <div>
                <Label htmlFor="firstBreastDuration">
                  {formData.firstBreast === 'left' ? 'Left' : 'Right'} breast duration (minutes)
                </Label>
                <Input
                  id="firstBreastDuration"
                  type="number"
                  placeholder="15"
                  value={formData.firstBreastDuration || ''}
                  onChange={(e) => setFormData({...formData, firstBreastDuration: e.target.value})}
                />
              </div>

              {!formData.addSecondBreast ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({...formData, addSecondBreast: true})}
                  className="w-full"
                >
                  + Add {formData.firstBreast === 'left' ? 'right' : 'left'} breast
                </Button>
              ) : (
                <>
                  <div>
                    <Label htmlFor="secondBreastDuration">
                      {formData.firstBreast === 'left' ? 'Right' : 'Left'} breast duration (minutes)
                    </Label>
                    <Input
                      id="secondBreastDuration"
                      type="number"
                      placeholder="15"
                      value={formData.secondBreastDuration || ''}
                      onChange={(e) => setFormData({...formData, secondBreastDuration: e.target.value})}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({...formData, addSecondBreast: false, secondBreastDuration: ''})}
                    className="w-full text-muted-foreground"
                  >
                    Remove second breast
                  </Button>
                </>
              )}

              {formData.firstBreastDuration && formData.addSecondBreast && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                  <p className="text-blue-900">
                    <strong>Total feeding time:</strong>{' '}
                    {(parseInt(formData.firstBreastDuration || '0') + parseInt(formData.secondBreastDuration || '0'))} minutes
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    Started {formData.firstBreast} breast for {formData.firstBreastDuration}min,
                    then {formData.firstBreast === 'left' ? 'right' : 'left'} breast
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {formData.feedType === 'bottle' && (
        <div>
          <Label htmlFor="amount">Amount (ml)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="120"
            value={formData.amount || ''}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
          />
        </div>
      )}

      {formData.feedType === 'pump' && (
        <>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="20"
              value={formData.duration || ''}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount Pumped (ml)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="150"
              value={formData.amount || ''}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
        </>
      )}

      {renderTimePicker()}

      <div className="flex gap-2">
        <Button onClick={() => handleSubmit('feed')} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            'Log Feed'
          )}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderNappyForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Nappy Type</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            type="button"
            variant={formData.nappyType === 'Wet diaper' ? 'default' : 'outline'}
            onClick={() => setFormData({...formData, nappyType: 'Wet diaper'})}
          >
            💧 Wet
          </Button>
          <Button
            type="button"
            variant={formData.nappyType === 'Poopy diaper' ? 'default' : 'outline'}
            onClick={() => setFormData({...formData, nappyType: 'Poopy diaper'})}
          >
            💩 Poopy
          </Button>
          <Button
            type="button"
            variant={formData.nappyType === 'Both' ? 'default' : 'outline'}
            onClick={() => setFormData({...formData, nappyType: 'Both'})}
          >
            🌊 Both
          </Button>
          <Button
            type="button"
            variant={formData.nappyType === 'Clean' ? 'default' : 'outline'}
            onClick={() => setFormData({...formData, nappyType: 'Clean'})}
          >
            ✨ Clean
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes..."
          value={formData.notes || ''}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      {renderTimePicker()}

      <div className="flex gap-2">
        <Button onClick={() => handleSubmit('nappy')} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            'Log Nappy'
          )}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderSleepForm = () => (
    <div className="space-y-4">
      {/* Show active sleep indicator if one exists */}
      {activeSleep && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-900 font-medium">Sleep in progress</p>
              <p className="text-blue-700 text-xs mt-0.5">
                Started at {new Date(activeSleep.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            {elapsedTime && (
              <div className="text-right">
                <p className="text-blue-900 font-bold text-lg">{elapsedTime}</p>
                <p className="text-blue-600 text-xs">elapsed</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Three clear action buttons */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant={formData.sleepType === 'start' ? 'default' : 'outline'}
          onClick={() => setFormData({...formData, sleepType: 'start'})}
          className="h-16 justify-start px-4"
          disabled={!!activeSleep}
        >
          <Moon className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Fell Asleep</div>
            <div className="text-xs opacity-70">
              {activeSleep ? 'Sleep already in progress' : 'Start tracking now'}
            </div>
          </div>
        </Button>

        <Button
          type="button"
          variant={formData.sleepType === 'end' ? 'default' : 'outline'}
          onClick={() => setFormData({...formData, sleepType: 'end'})}
          className="h-16 justify-start px-4"
          disabled={!activeSleep}
        >
          <Sun className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Woke Up</div>
            <div className="text-xs opacity-70">
              {activeSleep ? `End sleep (${elapsedTime})` : 'No active sleep'}
            </div>
          </div>
        </Button>

        <Button
          type="button"
          variant={formData.sleepType === 'log' ? 'default' : 'outline'}
          onClick={() => setFormData({...formData, sleepType: 'log'})}
          className="h-16 justify-start px-4"
        >
          <Clock className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Log Past Sleep</div>
            <div className="text-xs opacity-70">Enter completed nap</div>
          </div>
        </Button>
      </div>

      {/* Duration field for "Log Past Sleep" */}
      {formData.sleepType === 'log' && (
        <div className="space-y-3 pt-2">
          {/* Quick duration presets */}
          <div>
            <Label className="text-sm">Quick select</Label>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {[30, 45, 60, 90, 120].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={formData.duration === mins.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({...formData, duration: mins.toString()})}
                  className="text-xs"
                >
                  {formatDuration(mins)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom duration input */}
          <div>
            <Label htmlFor="duration">Or enter minutes</Label>
            <Input
              id="duration"
              type="number"
              placeholder="45"
              value={formData.duration || ''}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            />
          </div>

          {/* Duration preview */}
          {sleepTimePreview && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 text-sm">
              <p className="text-purple-900">
                <span className="font-medium">{sleepTimePreview.formatted}</span> sleep
              </p>
              <p className="text-purple-700 text-xs mt-0.5">
                {sleepTimePreview.start} → {sleepTimePreview.end}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Location picker - shown for start and log */}
      {(formData.sleepType === 'start' || formData.sleepType === 'log') && (
        <div>
          <Label htmlFor="location">Sleep Location (optional)</Label>
          <Select onValueChange={(value) => setFormData({...formData, location: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Where did baby sleep?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crib">Crib</SelectItem>
              <SelectItem value="bassinet">Bassinet</SelectItem>
              <SelectItem value="parent_bed">Parent's bed</SelectItem>
              <SelectItem value="stroller">Stroller</SelectItem>
              <SelectItem value="car_seat">Car seat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom time picker - for "Fell Asleep" (past start) and "Log Past Sleep" (custom end time) */}
      {(formData.sleepType === 'start' || formData.sleepType === 'log') && renderTimePicker()}

      {/* Submit and Cancel buttons */}
      <div className="flex gap-2">
        {formData.sleepType && (
          <Button onClick={() => handleSubmit('sleep')} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                {formData.sleepType === 'start' && 'Start Sleep Timer'}
                {formData.sleepType === 'end' && 'End Sleep'}
                {formData.sleepType === 'log' && 'Log Sleep'}
              </>
            )}
          </Button>
        )}
        <Button variant="outline" onClick={() => setActiveEntry(null)} className={formData.sleepType ? 'flex-1' : 'w-full'} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderGrowthForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          placeholder="4.5"
          value={formData.weight || ''}
          onChange={(e) => setFormData({...formData, weight: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="height">Height (cm)</Label>
        <Input
          id="height"
          type="number"
          placeholder="55"
          value={formData.height || ''}
          onChange={(e) => setFormData({...formData, height: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Pediatrician visit, growth milestone..."
          value={formData.notes || ''}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      {renderTimePicker()}

      <div className="flex gap-2">
        <Button onClick={() => handleSubmit('growth')} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            'Log Growth'
          )}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );

  if (activeEntry) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeEntry === 'feed' && <Baby className="w-5 h-5" />}
              {activeEntry === 'nappy' && <Droplets className="w-5 h-5" />}
              {activeEntry === 'sleep' && <Moon className="w-5 h-5" />}
              {activeEntry === 'growth' && <Scale className="w-5 h-5" />}
              Log {activeEntry.charAt(0).toUpperCase() + activeEntry.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeEntry === 'feed' && renderFeedingForm()}
            {activeEntry === 'nappy' && renderNappyForm()}
            {activeEntry === 'sleep' && renderSleepForm()}
            {activeEntry === 'growth' && renderGrowthForm()}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop: Two Column Layout, Mobile: Single Column */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Quick Entry</CardTitle>
            <CardDescription>Tap to log baby activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setActiveEntry('feed')}
                className="h-24 lg:h-28 flex flex-col gap-2"
                variant="outline"
              >
                <Baby className="w-8 h-8 lg:w-10 lg:h-10" />
                Feed
              </Button>
              <Button
                onClick={() => setActiveEntry('nappy')}
                className="h-24 lg:h-28 flex flex-col gap-2"
                variant="outline"
              >
                <Droplets className="w-8 h-8 lg:w-10 lg:h-10" />
                Nappy
              </Button>
              <Button
                onClick={() => setActiveEntry('sleep')}
                className="h-24 lg:h-28 flex flex-col gap-2"
                variant="outline"
              >
                <Moon className="w-8 h-8 lg:w-10 lg:h-10" />
                Sleep
              </Button>
              <Button
                onClick={() => setActiveEntry('growth')}
                className="h-24 lg:h-28 flex flex-col gap-2"
                variant="outline"
              >
                <Scale className="w-8 h-8 lg:w-10 lg:h-10" />
                Growth
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ML Prediction Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Smart Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Next nap likely in:</span>
                <Badge variant="secondary">2h 15min</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Feeding due around:</span>
                <Badge variant="secondary">4:45 PM</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Optimal wake window:</span>
                <Badge variant="secondary">45min left</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Based on your baby's patterns and development stage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
