import { TrendingUp, Moon, Baby, Droplets, Scale, Users } from "lucide-react";

// Single source of truth for the analytics sub-sections. Shared by the
// InsightsDashboard tab bar and the sidebar (App.tsx) so the two never drift.
// Each `value` doubles as the ?tab= URL param used to deep link into a section.
export const INSIGHTS_TABS = [
  { value: 'overview', label: 'Overview', icon: TrendingUp },
  { value: 'sleep', label: 'Sleep', icon: Moon },
  { value: 'feeds', label: 'Feeds', icon: Baby },
  { value: 'nappies', label: 'Nappies', icon: Droplets },
  { value: 'growth', label: 'Growth', icon: Scale },
  { value: 'compare', label: 'Compare', icon: Users },
] as const;
