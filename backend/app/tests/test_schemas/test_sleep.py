"""Tests for sleep schema validation."""

from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.sleep import (
    SleepSessionBase,
    SleepSessionCreate,
    SleepSessionUpdate,
    SleepSessionResponse,
)
from app.models.sleep import SleepType, SleepLocation, SleepQuality, WakeReason


class TestSleepSessionBase:
    """Tests for SleepSessionBase validation."""

    def test_defaults(self):
        """Test default values are set correctly."""
        schema = SleepSessionBase()

        assert schema.sleep_type == SleepType.NAP
        assert schema.location == SleepLocation.CRIB
        assert schema.sleep_quality == SleepQuality.GOOD
        assert schema.sleep_environment is None
        assert schema.wake_reason is None
        assert schema.notes is None
        assert schema.end_time is None
        # start_time should be close to now
        assert (datetime.utcnow() - schema.start_time).total_seconds() < 1

    def test_start_time_in_future_rejected(self):
        """Test start_time in the future is rejected."""
        future = datetime.utcnow() + timedelta(hours=1)

        with pytest.raises(ValidationError) as exc_info:
            SleepSessionBase(start_time=future)

        assert "start_time cannot be in the future" in str(exc_info.value)

    def test_end_time_before_start_time_rejected(self):
        """Test end_time before start_time is rejected."""
        start = datetime(2024, 1, 1, 22, 0, 0)
        end = datetime(2024, 1, 1, 20, 0, 0)

        with pytest.raises(ValidationError) as exc_info:
            SleepSessionBase(start_time=start, end_time=end)

        assert "end_time must be after start_time" in str(exc_info.value)

    def test_notes_max_length_enforced(self):
        """Test notes field has max length of 2000."""
        long_notes = "x" * 2001

        with pytest.raises(ValidationError) as exc_info:
            SleepSessionBase(notes=long_notes)

        assert "notes" in str(exc_info.value)

    def test_valid_sleep_session(self):
        """Test valid sleep session is accepted."""
        start = datetime(2024, 1, 1, 22, 0, 0)
        end = datetime(2024, 1, 2, 6, 0, 0)

        schema = SleepSessionBase(
            start_time=start,
            end_time=end,
            sleep_type=SleepType.NIGHTTIME,
            location=SleepLocation.CRIB,
            sleep_quality=SleepQuality.DEEP,
            wake_reason=WakeReason.NATURAL,
            notes="Slept through the night!",
        )

        assert schema.start_time == start
        assert schema.end_time == end
        assert schema.sleep_type == SleepType.NIGHTTIME


class TestSleepSessionCreate:
    """Tests for SleepSessionCreate validation."""

    def test_requires_baby_id(self):
        """Test baby_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            SleepSessionCreate()

        assert "baby_id" in str(exc_info.value)

    def test_valid_create_schema(self):
        """Test valid create schema is accepted."""
        baby_id = uuid4()

        schema = SleepSessionCreate(baby_id=baby_id)

        assert schema.baby_id == baby_id


class TestSleepSessionUpdate:
    """Tests for SleepSessionUpdate validation."""

    def test_all_fields_optional(self):
        """Test all fields are optional for updates."""
        schema = SleepSessionUpdate()

        assert schema.start_time is None
        assert schema.end_time is None
        assert schema.sleep_type is None
        assert schema.notes is None

    def test_notes_max_length_enforced(self):
        """Test notes field has max length of 2000 in updates."""
        long_notes = "x" * 2001

        with pytest.raises(ValidationError) as exc_info:
            SleepSessionUpdate(notes=long_notes)

        assert "notes" in str(exc_info.value)

    def test_partial_update(self):
        """Test partial update with only some fields."""
        schema = SleepSessionUpdate(
            sleep_quality=SleepQuality.RESTLESS,
            notes="Baby was fussy",
        )

        assert schema.sleep_quality == SleepQuality.RESTLESS
        assert schema.notes == "Baby was fussy"
        assert schema.start_time is None


class TestSleepSessionResponse:
    """Tests for SleepSessionResponse validation."""

    def test_duration_minutes_calculated(self):
        """Test duration_minutes is computed correctly."""
        start = datetime(2024, 1, 1, 22, 0, 0)
        end = datetime(2024, 1, 2, 6, 30, 0)  # 8.5 hours = 510 minutes

        schema = SleepSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=start,
            end_time=end,
            sleep_type=SleepType.NIGHTTIME,
        )

        assert schema.duration_minutes == 510

    def test_duration_minutes_none_when_no_end_time(self):
        """Test duration_minutes is None when end_time not set."""
        schema = SleepSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=datetime(2024, 1, 1, 22, 0, 0),
            end_time=None,
            sleep_type=SleepType.NIGHTTIME,
        )

        assert schema.duration_minutes is None

    @pytest.mark.parametrize("start,end,expected_minutes", [
        (datetime(2024, 1, 1, 14, 0), datetime(2024, 1, 1, 15, 30), 90),
        (datetime(2024, 1, 1, 22, 0), datetime(2024, 1, 2, 6, 0), 480),
        (datetime(2024, 1, 1, 12, 0), datetime(2024, 1, 1, 12, 45), 45),
    ])
    def test_duration_minutes_various_durations(
        self, start: datetime, end: datetime, expected_minutes: int
    ):
        """Test duration_minutes calculation with various durations."""
        schema = SleepSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=start,
            end_time=end,
            sleep_type=SleepType.NAP,
        )

        assert schema.duration_minutes == expected_minutes
