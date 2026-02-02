"""Tests for feeding schema validation."""

from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.feeding import (
    FeedingSessionBase,
    FeedingSessionCreate,
    FeedingSessionUpdate,
    FeedingSessionResponse,
)
from app.models.feeding import FeedingType, BreastSide, Appetite


class TestFeedingSessionBase:
    """Tests for FeedingSessionBase validation."""

    def test_start_time_in_future_rejected(self):
        """Test start_time in the future is rejected."""
        future = datetime.utcnow() + timedelta(hours=1)

        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(
                start_time=future,
                feeding_type=FeedingType.BOTTLE,
                volume_offered_ml=100,
            )

        assert "start_time cannot be in the future" in str(exc_info.value)

    def test_end_time_before_start_time_rejected(self):
        """Test end_time before start_time is rejected."""
        start = datetime(2024, 1, 1, 12, 0, 0)
        end = datetime(2024, 1, 1, 10, 0, 0)

        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(
                start_time=start,
                end_time=end,
                feeding_type=FeedingType.BOTTLE,
                volume_offered_ml=100,
            )

        assert "end_time must be after start_time" in str(exc_info.value)

    def test_notes_max_length_enforced(self):
        """Test notes field has max length of 2000."""
        long_notes = "x" * 2001

        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(
                notes=long_notes,
                feeding_type=FeedingType.BOTTLE,
                volume_offered_ml=100,
            )

        assert "notes" in str(exc_info.value)


class TestBreastfeedingValidation:
    """Tests for breastfeeding-specific validation."""

    def test_breast_feeding_requires_duration(self):
        """Test breastfeeding requires at least one breast duration."""
        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(feeding_type=FeedingType.BREAST)

        assert "left_breast_duration or right_breast_duration" in str(exc_info.value)

    def test_breast_feeding_with_zero_durations_rejected(self):
        """Test breastfeeding with zero durations is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(
                feeding_type=FeedingType.BREAST,
                left_breast_duration=0,
                right_breast_duration=0,
            )

        assert "left_breast_duration or right_breast_duration" in str(exc_info.value)

    def test_breast_feeding_left_only_valid(self):
        """Test breastfeeding with only left breast is valid."""
        schema = FeedingSessionBase(
            feeding_type=FeedingType.BREAST,
            left_breast_duration=15,
        )

        assert schema.left_breast_duration == 15
        assert schema.right_breast_duration is None

    def test_breast_feeding_right_only_valid(self):
        """Test breastfeeding with only right breast is valid."""
        schema = FeedingSessionBase(
            feeding_type=FeedingType.BREAST,
            right_breast_duration=10,
        )

        assert schema.right_breast_duration == 10
        assert schema.left_breast_duration is None

    def test_breast_feeding_both_sides_valid(self):
        """Test breastfeeding with both sides is valid."""
        schema = FeedingSessionBase(
            feeding_type=FeedingType.BREAST,
            left_breast_duration=10,
            right_breast_duration=12,
            breast_started=BreastSide.LEFT,
        )

        assert schema.left_breast_duration == 10
        assert schema.right_breast_duration == 12


class TestBottleFeedingValidation:
    """Tests for bottle feeding-specific validation."""

    def test_bottle_feeding_requires_volume(self):
        """Test bottle feeding requires volume_offered_ml."""
        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(feeding_type=FeedingType.BOTTLE)

        assert "volume_offered_ml must be provided" in str(exc_info.value)

    def test_bottle_feeding_zero_volume_rejected(self):
        """Test bottle feeding with zero volume is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(
                feeding_type=FeedingType.BOTTLE,
                volume_offered_ml=0,
            )

        assert "volume_offered_ml must be provided and greater than 0" in str(exc_info.value)

    def test_bottle_feeding_valid(self):
        """Test valid bottle feeding is accepted."""
        schema = FeedingSessionBase(
            feeding_type=FeedingType.BOTTLE,
            volume_offered_ml=120,
            volume_consumed_ml=100,
            formula_type="Similac",
        )

        assert schema.volume_offered_ml == 120
        assert schema.volume_consumed_ml == 100

    def test_consumed_exceeds_offered_rejected(self):
        """Test volume_consumed_ml exceeding volume_offered_ml is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionBase(
                feeding_type=FeedingType.BOTTLE,
                volume_offered_ml=100,
                volume_consumed_ml=150,
            )

        assert "Volume consumed cannot exceed volume offered" in str(exc_info.value)


class TestSolidFeedingValidation:
    """Tests for solid food feeding validation."""

    def test_solid_feeding_valid(self):
        """Test solid feeding is valid without volume requirements."""
        schema = FeedingSessionBase(
            feeding_type=FeedingType.SOLID,
            food_items=["banana", "avocado"],
            appetite=Appetite.GOOD,
        )

        assert schema.feeding_type == FeedingType.SOLID
        assert schema.food_items == ["banana", "avocado"]


class TestFeedingSessionCreate:
    """Tests for FeedingSessionCreate validation."""

    def test_requires_baby_id(self):
        """Test baby_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionCreate(
                feeding_type=FeedingType.BOTTLE,
                volume_offered_ml=100,
            )

        assert "baby_id" in str(exc_info.value)

    def test_valid_create_schema(self):
        """Test valid create schema is accepted."""
        baby_id = uuid4()

        schema = FeedingSessionCreate(
            baby_id=baby_id,
            feeding_type=FeedingType.BOTTLE,
            volume_offered_ml=120,
        )

        assert schema.baby_id == baby_id


class TestFeedingSessionUpdate:
    """Tests for FeedingSessionUpdate validation."""

    def test_all_fields_optional(self):
        """Test all fields are optional for updates."""
        schema = FeedingSessionUpdate()

        assert schema.start_time is None
        assert schema.volume_offered_ml is None
        assert schema.notes is None

    def test_notes_max_length_enforced(self):
        """Test notes field has max length of 2000 in updates."""
        long_notes = "x" * 2001

        with pytest.raises(ValidationError) as exc_info:
            FeedingSessionUpdate(notes=long_notes)

        assert "notes" in str(exc_info.value)


class TestFeedingSessionResponse:
    """Tests for FeedingSessionResponse validation."""

    def test_duration_minutes_from_times(self):
        """Test duration_minutes is computed from start/end times."""
        start = datetime(2024, 1, 1, 12, 0, 0)
        end = datetime(2024, 1, 1, 12, 30, 0)

        schema = FeedingSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=start,
            end_time=end,
            feeding_type=FeedingType.BOTTLE,
            volume_offered_ml=120,
        )

        assert schema.duration_minutes == 30

    def test_duration_minutes_from_breast_durations(self):
        """Test duration_minutes is sum of breast durations."""
        schema = FeedingSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=datetime(2024, 1, 1, 12, 0, 0),
            end_time=None,
            feeding_type=FeedingType.BREAST,
            left_breast_duration=10,
            right_breast_duration=15,
        )

        assert schema.duration_minutes == 25

    def test_duration_minutes_none_when_no_data(self):
        """Test duration_minutes is None when no end_time or breast durations."""
        schema = FeedingSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=datetime(2024, 1, 1, 12, 0, 0),
            end_time=None,
            feeding_type=FeedingType.SOLID,
            food_items=["banana"],
        )

        assert schema.duration_minutes is None

    @pytest.mark.parametrize("feeding_type,left,right,expected", [
        (FeedingType.BREAST, 10, 15, 25),
        (FeedingType.BREAST, 20, 0, 20),
        (FeedingType.BREAST, 0, 18, 18),
        (FeedingType.BREAST, 5, 5, 10),
    ])
    def test_duration_minutes_breast_variations(
        self, feeding_type: FeedingType, left: int, right: int, expected: int
    ):
        """Test duration_minutes calculation for various breast durations."""
        schema = FeedingSessionResponse(
            id=uuid4(),
            baby_id=uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_time=datetime(2024, 1, 1, 12, 0, 0),
            feeding_type=feeding_type,
            left_breast_duration=left if left > 0 else None,
            right_breast_duration=right if right > 0 else None,
        )

        assert schema.duration_minutes == expected
