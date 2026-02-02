"""Tests for diaper schema validation."""

from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.diaper import (
    DiaperEventBase,
    DiaperEventCreate,
    DiaperEventUpdate,
    DiaperEventResponse,
)
from app.models.diaper import UrineVolume, StoolConsistency, StoolColor, DiaperType


class TestDiaperEventBase:
    """Tests for DiaperEventBase validation."""

    def test_defaults(self):
        """Test default values are set correctly."""
        schema = DiaperEventBase()

        assert schema.has_urine is False
        assert schema.urine_volume == UrineVolume.NONE
        assert schema.has_stool is False
        assert schema.stool_consistency is None
        assert schema.stool_color is None
        assert schema.diaper_type == DiaperType.DISPOSABLE
        assert schema.notes is None
        # timestamp should be close to now
        assert (datetime.utcnow() - schema.timestamp).total_seconds() < 1

    def test_timestamp_in_future_rejected(self):
        """Test timestamp in the future is rejected."""
        future = datetime.utcnow() + timedelta(hours=1)

        with pytest.raises(ValidationError) as exc_info:
            DiaperEventBase(timestamp=future)

        assert "timestamp cannot be in the future" in str(exc_info.value)

    def test_notes_max_length_enforced(self):
        """Test notes field has max length of 2000."""
        long_notes = "x" * 2001

        with pytest.raises(ValidationError) as exc_info:
            DiaperEventBase(notes=long_notes)

        assert "notes" in str(exc_info.value)

    def test_valid_diaper_event(self):
        """Test valid diaper event is accepted."""
        schema = DiaperEventBase(
            timestamp=datetime(2024, 1, 1, 10, 0, 0),
            has_urine=True,
            urine_volume=UrineVolume.MODERATE,
            has_stool=True,
            stool_consistency=StoolConsistency.SOFT,
            stool_color=StoolColor.YELLOW,
            diaper_type=DiaperType.DISPOSABLE,
            notes="Normal diaper change",
        )

        assert schema.has_urine is True
        assert schema.urine_volume == UrineVolume.MODERATE
        assert schema.has_stool is True


class TestDiaperEventCreate:
    """Tests for DiaperEventCreate validation."""

    def test_requires_baby_id(self):
        """Test baby_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            DiaperEventCreate()

        assert "baby_id" in str(exc_info.value)

    def test_valid_create_schema(self):
        """Test valid create schema is accepted."""
        baby_id = uuid4()

        schema = DiaperEventCreate(baby_id=baby_id)

        assert schema.baby_id == baby_id


class TestDiaperEventUpdate:
    """Tests for DiaperEventUpdate validation."""

    def test_all_fields_optional(self):
        """Test all fields are optional for updates."""
        schema = DiaperEventUpdate()

        assert schema.timestamp is None
        assert schema.has_urine is None
        assert schema.notes is None

    def test_notes_max_length_enforced(self):
        """Test notes field has max length of 2000 in updates."""
        long_notes = "x" * 2001

        with pytest.raises(ValidationError) as exc_info:
            DiaperEventUpdate(notes=long_notes)

        assert "notes" in str(exc_info.value)

    def test_partial_update(self):
        """Test partial update with only some fields."""
        schema = DiaperEventUpdate(
            has_stool=True,
            stool_color=StoolColor.GREEN,
        )

        assert schema.has_stool is True
        assert schema.stool_color == StoolColor.GREEN
        assert schema.has_urine is None


class TestDiaperEventResponse:
    """Tests for DiaperEventResponse validation."""

    def test_has_all_required_fields(self):
        """Test response has all required fields."""
        schema = DiaperEventResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            timestamp=datetime(2024, 1, 1, 10, 0, 0),
        )

        assert schema.id is not None
        assert schema.baby_id is not None
        assert schema.created_at is not None
