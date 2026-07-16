"""Tests for analytics response schema validation."""

from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.analytics import (
    BabySummary,
    ComparisonResponse,
    DailyMetricsRow,
    WeeklyMetricsRow,
)


def make_daily_row(**overrides) -> dict:
    """A valid mart_daily_metrics row as the service returns it."""
    row = {
        "baby_id": uuid4(),
        "baby_name": "Imogen",
        "metric_date": date(2026, 6, 21),
        "age_days": 100,
        "age_weeks": 14,
        "night_sleep_minutes": 589,
        "night_sleep_segments": 3,
        "longest_night_stretch_minutes": 320,
        "night_waking_count": 2,
        "awake_at_night_minutes": 35,
        "nap_count": 4,
        "total_nap_minutes": 260,
        "avg_nap_minutes": 65,
        "feed_count": 8,
        "breast_feed_count": 8,
        "bottle_feed_count": 0,
        "total_volume_ml": None,
        "avg_feed_interval_minutes": 175,
        "avg_wake_window_minutes": 110,
        "max_wake_window_minutes": 180,
        "diaper_count": 7,
        "wet_diaper_count": 6,
        "dirty_diaper_count": 2,
    }
    row.update(overrides)
    return row


class TestDailyMetricsRow:
    def test_valid_row(self):
        row = DailyMetricsRow(**make_daily_row())
        assert row.age_days == 100
        assert row.night_sleep_minutes == 589

    def test_nullable_aggregates_accept_none(self):
        row = DailyMetricsRow(**make_daily_row(
            night_sleep_segments=None,
            avg_nap_minutes=None,
            avg_wake_window_minutes=None,
        ))
        assert row.night_sleep_segments is None

    def test_required_fields_reject_none(self):
        with pytest.raises(ValidationError):
            DailyMetricsRow(**make_daily_row(age_days=None))

    def test_invalid_uuid_rejected(self):
        with pytest.raises(ValidationError):
            DailyMetricsRow(**make_daily_row(baby_id="not-a-uuid"))


class TestComparisonResponse:
    def _babies(self) -> list[dict]:
        return [{
            "baby_id": uuid4(),
            "baby_name": "Ember",
            "date_of_birth": date(2023, 8, 18),
            "max_age_days": 365,
        }]

    def test_weekly_response(self):
        weekly = [{
            "baby_id": uuid4(),
            "baby_name": "Ember",
            "age_weeks": 12,
            "days_in_week": 7,
            "avg_night_sleep_minutes": 712.4,
        }]
        resp = ComparisonResponse(align="age_weeks", babies=self._babies(), weekly=weekly)
        assert resp.weekly[0].avg_night_sleep_minutes == pytest.approx(712.4)
        assert resp.daily is None

    def test_daily_response(self):
        resp = ComparisonResponse(
            align="age_days", babies=self._babies(), daily=[make_daily_row()]
        )
        assert resp.daily[0].baby_name == "Imogen"
        assert resp.weekly is None

    def test_align_must_be_known_value(self):
        with pytest.raises(ValidationError):
            ComparisonResponse(align="calendar", babies=self._babies())


class TestWeeklyMetricsRow:
    def test_all_averages_optional(self):
        row = WeeklyMetricsRow(
            baby_id=uuid4(), baby_name="Imogen", age_weeks=0, days_in_week=2
        )
        assert row.avg_feed_count is None


class TestBabySummary:
    def test_valid(self):
        summary = BabySummary(
            baby_id=uuid4(),
            baby_name="Imogen",
            date_of_birth=date(2026, 3, 13),
            max_age_days=113,
        )
        assert summary.baby_name == "Imogen"
