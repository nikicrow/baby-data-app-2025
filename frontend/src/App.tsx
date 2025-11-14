import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { QuickEntry } from "./components/QuickEntry";
import { InsightsDashboard } from "./components/InsightsDashboard";
import { ActivityFeed } from "./components/ActivityFeed";
import { Baby, BarChart3, Clock, Plus } from "lucide-react";
import { babyApi, feedingApi, sleepApi, diaperApi, growthApi } from "./services/api";
import type { BabyProfile } from "./types/api";
import { toast } from "sonner@2.0.3";

export default function App() {
  const [activeTab, setActiveTab] = useState('quick');
  const [currentBaby, setCurrentBaby] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize app - fetch or create baby profile
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Try to fetch existing babies
      const babies = await babyApi.getAll();

      if (babies.length > 0) {
        // Use the first active baby
        const activeBaby = babies.find(b => b.is_active) || babies[0];
        setCurrentBaby(activeBaby);
      } else {
        // Create a default baby profile for testing
        const newBaby = await babyApi.create({
          name: "Baby",
          date_of_birth: new Date().toISOString().split('T')[0],
          timezone: "Australia/Sydney"
        });
        setCurrentBaby(newBaby);
        toast.success("Baby profile created!");
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      toast.error("Failed to load baby profile. Using offline mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivityAdded = () => {
    // Trigger refresh of activity feed
    setRefreshTrigger(prev => prev + 1);
    toast.success("Activity logged successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Baby className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading BabyTracker...</p>
        </div>
      </div>
    );
  }

  if (!currentBaby) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load baby profile</p>
          <Button onClick={initializeApp}>Try Again</Button>
        </div>
      </div>
    );
  }

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
            <p className="text-primary-foreground/80">Tracking {currentBaby.name}</p>
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
                <QuickEntry babyId={currentBaby.id} onActivityAdded={handleActivityAdded} />
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <InsightsDashboard babyId={currentBaby.id} refreshTrigger={refreshTrigger} />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <ActivityFeed babyId={currentBaby.id} refreshTrigger={refreshTrigger} />
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
                <p className="text-primary-foreground/80 text-sm">Tracking {currentBaby.name}</p>
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
            {activeTab === 'quick' && <QuickEntry babyId={currentBaby.id} onActivityAdded={handleActivityAdded} />}
            {activeTab === 'insights' && <InsightsDashboard babyId={currentBaby.id} refreshTrigger={refreshTrigger} />}
            {activeTab === 'history' && <ActivityFeed babyId={currentBaby.id} refreshTrigger={refreshTrigger} />}
          </div>
        </div>
      </div>
    </div>
  );
}
