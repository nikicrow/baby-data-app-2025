import { Routes, Route, Navigate } from "react-router-dom";
import { LogActivity } from "./components/LogActivity";
import { InsightsDashboard } from "./components/InsightsDashboard";
import { ActivityFeed } from "./components/ActivityFeed";
import type { BabyProfile } from "./types/api";

interface AppRoutesProps {
  baby: BabyProfile;
  onActivityAdded: () => void;
  refreshTrigger: number;
}

export function AppRoutes({ baby, onActivityAdded, refreshTrigger }: AppRoutesProps) {
  const babyId = baby.id;
  return (
    <Routes>
      {/* Default route - redirect / to /logactivity */}
      <Route index element={<Navigate to="/logactivity" replace />} />

      {/* Main routes */}
      <Route
        path="/logactivity"
        element={<LogActivity babyId={babyId} onActivityAdded={onActivityAdded} />}
      />
      <Route
        path="/insights"
        element={<InsightsDashboard baby={baby} refreshTrigger={refreshTrigger} />}
      />
      <Route
        path="/activityhistory"
        element={<ActivityFeed babyId={babyId} refreshTrigger={refreshTrigger} />}
      />

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<Navigate to="/logactivity" replace />} />
    </Routes>
  );
}
