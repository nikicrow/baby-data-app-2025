import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { QuickEntry } from "./components/QuickEntry";
import { InsightsDashboard } from "./components/InsightsDashboard";
import { ActivityFeed } from "./components/ActivityFeed";
import { Baby, BarChart3, Clock, Plus } from "lucide-react";

// Mock data for demonstration
const mockActivities = [
  { id: 1, type: 'feed', time: '2:30 PM', details: 'Left breast, 15 min', timestamp: new Date('2024-01-15T14:30:00') },
  { id: 2, type: 'nappy', time: '1:45 PM', details: 'Wet diaper', timestamp: new Date('2024-01-15T13:45:00') },
  { id: 3, type: 'sleep', time: '12:00 PM', details: 'Nap started', timestamp: new Date('2024-01-15T12:00:00') },
  { id: 4, type: 'feed', time: '11:15 AM', details: 'Bottle, 120ml', timestamp: new Date('2024-01-15T11:15:00') },
  { id: 5, type: 'nappy', time: '10:30 AM', details: 'Poopy diaper', timestamp: new Date('2024-01-15T10:30:00') },
];

export default function App() {
  const [activities, setActivities] = useState(mockActivities);
  const [activeTab, setActiveTab] = useState('quick');

  const addActivity = (activity: any) => {
    const newActivity = {
      id: activities.length + 1,
      ...activity,
      timestamp: new Date()
    };
    setActivities([newActivity, ...activities]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Baby className="w-8 h-8" />
              <h1 className="text-2xl font-bold">BabyTracker</h1>
            </div>
            <p className="text-primary-foreground/80">Smart baby care logging</p>
          </div>

          {/* Main Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Log
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="quick" className="mt-0">
                <QuickEntry onAddActivity={addActivity} />
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <InsightsDashboard activities={activities} />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <ActivityFeed activities={activities} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center gap-3 mb-2">
              <Baby className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">BabyTracker</h1>
                <p className="text-primary-foreground/80 text-sm">Smart baby care logging</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-6 flex-1">
            <div className="space-y-2">
              <Button
                variant={activeTab === 'quick' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('quick')}
                className="w-full justify-start gap-3 h-12"
              >
                <Plus className="w-5 h-5" />
                Quick Entry
              </Button>
              <Button
                variant={activeTab === 'insights' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('insights')}
                className="w-full justify-start gap-3 h-12"
              >
                <BarChart3 className="w-5 h-5" />
                Insights & Analytics
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('history')}
                className="w-full justify-start gap-3 h-12"
              >
                <Clock className="w-5 h-5" />
                Activity History
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">
            {activeTab === 'quick' && <QuickEntry onAddActivity={addActivity} />}
            {activeTab === 'insights' && <InsightsDashboard activities={activities} />}
            {activeTab === 'history' && <ActivityFeed activities={activities} />}
          </div>
        </div>
      </div>
    </div>
  );
}