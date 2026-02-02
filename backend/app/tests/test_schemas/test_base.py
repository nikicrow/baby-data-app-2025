"""Tests for base schema classes and mixins."""

from datetime import datetime, timedelta, date
from unittest.mock import patch
from uuid import uuid4

import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.base import (
    NOTES_MAX_LENGTH,
    NotesMixin,
    TimedSessionMixin,
    BabyEventResponseBase,
)


class TestNotesMixin:
    """Tests for NotesMixin validation."""

    class SampleNotesSchema(NotesMixin):
        """Test schema using NotesMixin."""
        pass

    @pytest.mark.parametrize("notes,should_pass", [
        (None, True),
        ("", True),
        ("valid note", True),
        ("x" * 2000, True),
        ("x" * 2001, False),
        ("x" * 5000, False),
    ])
    def test_notes_max_length(self, notes: str | None, should_pass: bool):
        """Test notes field respects max length constraint."""
        if should_pass:
            schema = self.SampleNotesSchema(notes=notes)
            assert schema.notes == notes
        else:
            with pytest.raises(ValidationError) as exc_info:
                self.SampleNotesSchema(notes=notes)
            assert "notes" in str(exc_info.value)

    def test_notes_max_length_constant(self):
        """Verify NOTES_MAX_LENGTH is set correctly."""
        assert NOTES_MAX_LENGTH == 2000


class TestTimedSessionMixin:
    """Tests for TimedSessionMixin validation."""

    class SampleTimedSchema(TimedSessionMixin):
        """Test schema using TimedSessionMixin."""
        pass

    def test_start_time_defaults_to_now(self):
        """Test start_time defaults to current time."""
        before = datetime.utcnow()
        schema = self.SampleTimedSchema()
        after = datetime.utcnow()

        assert before <= schema.start_time <= after

    def test_end_time_optional(self):
        """Test end_time is optional and defaults to None."""
        schema = self.SampleTimedSchema()
        assert schema.end_time is None

    def test_valid_start_and_end_times(self):
        """Test valid start_time and end_time are accepted."""
        start = datetime(2024, 1, 1, 10, 0, 0)
        end = datetime(2024, 1, 1, 12, 0, 0)

        schema = self.SampleTimedSchema(start_time=start, end_time=end)

        assert schema.start_time == start
        assert schema.end_time == end

    def test_start_time_in_future_rejected(self):
        """Test start_time in the future is rejected."""
        future_time = datetime.utcnow() + timedelta(hours=1)

        with pytest.raises(ValidationError) as exc_info:
            self.SampleTimedSchema(start_time=future_time)

        assert "start_time cannot be in the future" in str(exc_info.value)

    def test_end_time_before_start_time_rejected(self):
        """Test end_time before start_time is rejected."""
        start = datetime(2024, 1, 1, 12, 0, 0)
        end = datetime(2024, 1, 1, 10, 0, 0)  # Before start

        with pytest.raises(ValidationError) as exc_info:
            self.SampleTimedSchema(start_time=start, end_time=end)

        assert "end_time must be after start_time" in str(exc_info.value)

    def test_end_time_equal_to_start_time_rejected(self):
        """Test end_time equal to start_time is rejected."""
        same_time = datetime(2024, 1, 1, 12, 0, 0)

        with pytest.raises(ValidationError) as exc_info:
            self.SampleTimedSchema(start_time=same_time, end_time=same_time)

        assert "end_time must be after start_time" in str(exc_info.value)

    def test_end_time_without_start_time_uses_default(self):
        """Test end_time can be set when start_time uses default."""
        end = datetime.utcnow() + timedelta(hours=1)

        # This should work because start_time defaults to now,
        # and end is in the future
        schema = self.SampleTimedSchema(end_time=end)

        assert schema.end_time == end
        assert schema.start_time < schema.end_time


class TestBabyEventResponseBase:
    """Tests for BabyEventResponseBase."""

    def test_has_required_fields(self):
        """Test BabyEventResponseBase has all required fields."""
        baby_id = uuid4()
        event_id = uuid4()
        created = datetime.utcnow()
        updated = datetime.utcnow()

        schema = BabyEventResponseBase(
            id=event_id,
            baby_id=baby_id,
            created_at=created,
            updated_at=updated,
        )

        assert schema.id == event_id
        assert schema.baby_id == baby_id
        assert schema.created_at == created
        assert schema.updated_at == updated

    def test_from_attributes_config(self):
        """Test from_attributes is enabled for ORM mode."""
        assert BabyEventResponseBase.model_config.get("from_attributes") is True
