import { Routes, Route, Navigate } from "react-router-dom";
import { LogActivity } from "./components/LogActivity";
import { InsightsDashboard } from "./components/InsightsDashboard";
import { ActivityFeed } from "./components/ActivityFeed";

interface AppRoutesProps {
  babyId: string;
  onActivityAdded: () => void;
  refreshTrigger: number;
}

export function AppRoutes({ babyId, onActivityAdded, refreshTrigger }: AppRoutesProps) {
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
        element={<InsightsDashboard babyId={babyId} refreshTrigger={refreshTrigger} />}
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
