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
import { feedingApi, sleepApi, diaperApi, growthApi } from "../services/api";
import type { FeedingType, BreastSide, SleepLocation, UrineVolume, StoolConsistency, StoolColor, DiaperType } from "../types/api";

interface QuickEntryProps {
  babyId: string;
  onActivityAdded: () => void;
}

export function QuickEntry({ babyId, onActivityAdded }: QuickEntryProps) {
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmitFeed = async () => {
    try {
      setLoading(true);

      const feedingType: FeedingType = formData.feedType === 'pump' ? 'breast' : formData.feedType;

      const payload: any = {
        baby_id: babyId,
        feeding_type: feedingType,
        start_time: new Date().toISOString(),
        notes: formData.notes,
      };

      if (formData.feedType === 'breast') {
        payload.breast_started = formData.side?.toLowerCase() as BreastSide;
        if (formData.side === 'Left' || formData.side === 'left') {
          payload.left_breast_duration = parseInt(formData.duration) || 0;
        } else {
          payload.right_breast_duration = parseInt(formData.duration) || 0;
        }
      } else if (formData.feedType === 'bottle') {
        payload.volume_offered_ml = parseInt(formData.amount) || 0;
        payload.volume_consumed_ml = parseInt(formData.amount) || 0;
      }

      await feedingApi.create(payload);
      toast.success('Feeding logged successfully!');
      setFormData({});
      setActiveEntry(null);
      onActivityAdded();
    } catch (error) {
      console.error('Failed to log feeding:', error);
      toast.error('Failed to log feeding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNappy = async () => {
    try {
      setLoading(true);

      let hasUrine = false;
      let hasStool = false;
      let urineVolume: UrineVolume = 'none';
      let stoolConsistency: StoolConsistency | undefined;

      if (formData.nappyType === 'Wet diaper') {
        hasUrine = true;
        urineVolume = 'moderate';
      } else if (formData.nappyType === 'Poopy diaper') {
        hasStool = true;
        stoolConsistency = 'soft';
      } else if (formData.nappyType === 'Both') {
        hasUrine = true;
        hasStool = true;
        urineVolume = 'moderate';
        stoolConsistency = 'soft';
      }

      await diaperApi.create({
        baby_id: babyId,
        timestamp: new Date().toISOString(),
        has_urine: hasUrine,
        urine_volume: urineVolume,
        has_stool: hasStool,
        stool_consistency: stoolConsistency,
        diaper_type: 'disposable',
        notes: formData.notes,
      });

      toast.success('Diaper change logged successfully!');
      setFormData({});
      setActiveEntry(null);
      onActivityAdded();
    } catch (error) {
      console.error('Failed to log diaper change:', error);
      toast.error('Failed to log diaper change. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSleep = async () => {
    try {
      setLoading(true);

      const payload: any = {
        baby_id: babyId,
        sleep_start: new Date().toISOString(),
        sleep_type: 'nap',
        location: (formData.location || 'crib') as SleepLocation,
        sleep_quality: 'good',
        notes: formData.notes,
      };

      if (formData.sleepType === 'end' && formData.duration) {
        // Calculate sleep_end based on duration
        const sleepEnd = new Date();
        sleepEnd.setMinutes(sleepEnd.getMinutes() - parseInt(formData.duration));
        payload.sleep_start = sleepEnd.toISOString();
        payload.sleep_end = new Date().toISOString();
      }

      await sleepApi.create(payload);
      toast.success('Sleep logged successfully!');
      setFormData({});
      setActiveEntry(null);
      onActivityAdded();
    } catch (error) {
      console.error('Failed to log sleep:', error);
      toast.error('Failed to log sleep. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrowth = async () => {
    try {
      setLoading(true);

      await growthApi.create({
        baby_id: babyId,
        measurement_date: new Date().toISOString().split('T')[0],
        weight_kg: formData.weight ? parseFloat(formData.weight) : undefined,
        length_cm: formData.height ? parseFloat(formData.height) : undefined,
        measurement_context: 'home',
        notes: formData.notes,
      });

      toast.success('Growth measurement logged successfully!');
      setFormData({});
      setActiveEntry(null);
      onActivityAdded();
    } catch (error) {
      console.error('Failed to log growth:', error);
      toast.error('Failed to log growth. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (type: string) => {
    switch (type) {
      case 'feed':
        return handleSubmitFeed();
      case 'nappy':
        return handleSubmitNappy();
      case 'sleep':
        return handleSubmitSleep();
      case 'growth':
        return handleSubmitGrowth();
    }
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
                variant={formData.side === 'left' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, side: 'left'})}
                className="flex-1"
              >
                Left
              </Button>
              <Button
                type="button"
                variant={formData.side === 'right' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, side: 'right'})}
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
        <Button onClick={() => handleSubmit('feed')} className="flex-1" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</> : 'Log Feed'}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={loading}>
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
        <Button onClick={() => handleSubmit('nappy')} className="flex-1" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</> : 'Log Nappy'}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={loading}>
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
            <SelectItem value="parent_bed">Parent's bed</SelectItem>
            <SelectItem value="stroller">Stroller</SelectItem>
            <SelectItem value="car_seat">Car seat</SelectItem>
          </SelectContent>
        </Select>
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
        <Button onClick={() => handleSubmit('sleep')} className="flex-1" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</> : 'Log Sleep'}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={loading}>
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
        <Button onClick={() => handleSubmit('growth')} className="flex-1" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</> : 'Log Growth'}
        </Button>
        <Button variant="outline" onClick={() => setActiveEntry(null)} className="flex-1" disabled={loading}>
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
