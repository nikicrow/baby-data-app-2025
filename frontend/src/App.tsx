import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { AppRoutes } from "./router";
import { Baby, BarChart3, Clock, Plus } from "lucide-react";
import { babyApi, feedingApi, sleepApi, diaperApi, growthApi } from "./services/api";
import type { BabyProfile } from "./types/api";
import { toast } from "sonner@2.0.3";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
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
    navigate('/activityhistory');
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
          <div className="w-full">
            <div className="grid grid-cols-3 gap-2 mx-6 mt-4 bg-muted p-1 rounded-lg">
              <Link
                to="/logactivity"
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  currentPath === '/logactivity'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Log</span>
              </Link>

              <Link
                to="/insights"
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  currentPath === '/insights'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Insights</span>
              </Link>

              <Link
                to="/activityhistory"
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  currentPath === '/activityhistory'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">History</span>
              </Link>
            </div>

            <div className="p-6">
              <AppRoutes
                babyId={currentBaby.id}
                onActivityAdded={handleActivityAdded}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
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
              <Link to="/logactivity">
                <Button
                  variant={currentPath === '/logactivity' ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3 h-12"
                >
                  <Plus className="w-5 h-5" />
                  Log Activity
                </Button>
              </Link>

              <Link to="/insights">
                <Button
                  variant={currentPath === '/insights' ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3 h-12"
                >
                  <BarChart3 className="w-5 h-5" />
                  Insights & Analytics
                </Button>
              </Link>

              <Link to="/activityhistory">
                <Button
                  variant={currentPath === '/activityhistory' ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3 h-12"
                >
                  <Clock className="w-5 h-5" />
                  Activity History
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">
            <AppRoutes
              babyId={currentBaby.id}
              onActivityAdded={handleActivityAdded}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
