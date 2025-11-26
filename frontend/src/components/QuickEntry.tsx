import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import { Baby, Droplets, Moon, Scale, Zap, Loader2 } from "lucide-react";
import { feedingApi, diaperApi, sleepApi, growthApi } from "../services/api";
import type {
  FeedingSessionCreate,
  DiaperEventCreate,
  SleepSessionCreate,
  GrowthMeasurementCreate
} from "../types/api";

interface QuickEntryProps {
  babyId: string;
  onActivityAdded: () => void;
}

export function QuickEntry({ babyId, onActivityAdded }: QuickEntryProps) {
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          break;
        case 'growth':
          await handleGrowthSubmit();
          break;
      }

      setFormData({});
      setActiveEntry(null);
      onActivityAdded();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} logged successfully!`);
    } catch (error: any) {
      console.error(`Failed to log ${type}:`, error);
      toast.error(`Failed to log ${type}. ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedingSubmit = async () => {
    const feedingData: FeedingSessionCreate = {
      baby_id: babyId,
      feeding_type: formData.feedType === 'pump' ? 'bottle' : formData.feedType, // Map 'pump' to 'bottle' for now
      start_time: new Date().toISOString(),
    };

    // Add breast-specific fields
    if (formData.feedType === 'breast' && formData.side) {
      feedingData.breast_started = formData.side.toLowerCase() as 'left' | 'right';
      const duration = parseInt(formData.duration) || 0;
      if (formData.side === 'Left') {
        feedingData.left_breast_duration = duration;
      } else if (formData.side === 'Right') {
        feedingData.right_breast_duration = duration;
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
      timestamp: new Date().toISOString(),
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
    const sleepData: SleepSessionCreate = {
      baby_id: babyId,
      sleep_type: 'nap', // Default to nap for now
      location: formData.location || 'crib',
      sleep_quality: 'good',
    };

    if (formData.sleepType === 'start') {
      sleepData.sleep_start = new Date().toISOString();
    } else if (formData.sleepType === 'end') {
      // Calculate start time based on duration
      const duration = parseInt(formData.duration) || 0;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - duration * 60 * 1000);
      sleepData.sleep_start = startTime.toISOString();
      sleepData.sleep_end = endTime.toISOString();
    }

    await sleepApi.create(sleepData);
  };

  const handleGrowthSubmit = async () => {
    const growthData: GrowthMeasurementCreate = {
      baby_id: babyId,
      measurement_date: new Date().toISOString(),
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
            <Label>Which Side?</Label>
            <div className="flex gap-2 mt-2">
              <Button 
                type="button"
                variant={formData.side === 'Left' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, side: 'Left'})}
                className="flex-1"
              >
                Left
              </Button>
              <Button 
                type="button"
                variant={formData.side === 'Right' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, side: 'Right'})}
                className="flex-1"
              >
                Right
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="15"
              value={formData.duration || ''}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            />
          </div>
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
      <div>
        <Label>Sleep Action</Label>
        <div className="flex gap-2 mt-2">
          <Button 
            type="button"
            variant={formData.sleepType === 'start' ? 'default' : 'outline'}
            onClick={() => setFormData({...formData, sleepType: 'start'})}
            className="flex-1"
          >
            😴 Sleep Started
          </Button>
          <Button 
            type="button"
            variant={formData.sleepType === 'end' ? 'default' : 'outline'}
            onClick={() => setFormData({...formData, sleepType: 'end'})}
            className="flex-1"
          >
            😊 Woke Up
          </Button>
        </div>
      </div>

      {formData.sleepType === 'end' && (
        <div>
          <Label htmlFor="duration">Sleep Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="90"
            value={formData.duration || ''}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
          />
        </div>
      )}

      <div>
        <Label htmlFor="location">Sleep Location (optional)</Label>
        <Select onValueChange={(value) => setFormData({...formData, location: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Where did baby sleep?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crib">Crib</SelectItem>
            <SelectItem value="bassinet">Bassinet</SelectItem>
            <SelectItem value="bed">Parent's bed</SelectItem>
            <SelectItem value="stroller">Stroller</SelectItem>
            <SelectItem value="car">Car seat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => handleSubmit('sleep')} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            'Log Sleep'
          )}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={isSubmitting}>
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