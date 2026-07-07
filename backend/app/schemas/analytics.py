"""Response schemas for the analytics endpoints.

These mirror marts.mart_daily_metrics, which is built by dbt in the
dbt-baby-data repo (see COMPARISON_ROADMAP.md there). The API only reads
these tables — they are refreshed by `dbt run`, not by this app.
"""

from datetime import date
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DailyMetricsRow(BaseModel):
    """One row per baby per day from marts.mart_daily_metrics."""
    model_config = ConfigDict(from_attributes=True)

    baby_id: UUID
    baby_name: str
    metric_date: date
    age_days: int
    age_weeks: int
    night_sleep_minutes: int
    night_sleep_segments: Optional[int] = None
    longest_night_stretch_minutes: Optional[int] = None
    nap_count: int
    total_nap_minutes: int
    avg_nap_minutes: Optional[int] = None
    feed_count: int
    breast_feed_count: int
    bottle_feed_count: int
    total_volume_ml: Optional[int] = None
    avg_feed_interval_minutes: Optional[int] = None
    avg_wake_window_minutes: Optional[int] = None
    max_wake_window_minutes: Optional[int] = None
    diaper_count: int
    wet_diaper_count: int
    dirty_diaper_count: int


class WeeklyMetricsRow(BaseModel):
    """Daily metrics averaged over one week of a baby's age."""
    model_config = ConfigDict(from_attributes=True)

    baby_id: UUID
    baby_name: str
    age_weeks: int
    days_in_week: int
    avg_night_sleep_minutes: Optional[float] = None
    avg_longest_night_stretch_minutes: Optional[float] = None
    avg_nap_count: Optional[float] = None
    avg_total_nap_minutes: Optional[float] = None
    avg_nap_length_minutes: Optional[float] = None
    avg_feed_count: Optional[float] = None
    avg_feed_interval_minutes: Optional[float] = None
    avg_wake_window_minutes: Optional[float] = None
    avg_max_wake_window_minutes: Optional[float] = None
    avg_diaper_count: Optional[float] = None


class BabySummary(BaseModel):
    """Identifies a baby included in a comparison response."""
    model_config = ConfigDict(from_attributes=True)

    baby_id: UUID
    baby_name: str
    date_of_birth: date
    max_age_days: int


class ComparisonResponse(BaseModel):
    """All babies' metrics on a shared age axis.

    Exactly one of `weekly` / `daily` is populated, matching `align`.
    """
    align: Literal["age_weeks", "age_days"]
    babies: List[BabySummary]
    weekly: Optional[List[WeeklyMetricsRow]] = None
    daily: Optional[List[DailyMetricsRow]] = None
