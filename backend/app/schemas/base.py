"""Base schema classes and mixins for DRY validation patterns."""

from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


# Constants
NOTES_MAX_LENGTH = 2000


def _get_utc_now_naive() -> datetime:
    """Get current UTC time as a naive datetime for comparison."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _to_naive_utc(dt: datetime) -> datetime:
    """Convert a datetime to naive UTC for comparison.

    If the datetime is timezone-aware, convert to UTC and remove tzinfo.
    If already naive, assume it's UTC and return as-is.
    """
    if dt.tzinfo is not None:
        # Convert to UTC, then strip timezone info
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class NotesMixin(BaseModel):
    """Mixin for schemas that have a notes field with max length validation."""
    notes: Optional[str] = Field(None, max_length=NOTES_MAX_LENGTH)


class TimestampValidatorMixin(BaseModel):
    """Mixin providing timestamp validation helpers."""

    @staticmethod
    def validate_not_future_datetime(v: datetime, field_name: str) -> datetime:
        """Validate that a datetime is not in the future."""
        v_naive = _to_naive_utc(v)
        if v_naive > _get_utc_now_naive():
            raise ValueError(f"{field_name} cannot be in the future")
        return v

    @staticmethod
    def validate_not_future_date(v: date, field_name: str) -> date:
        """Validate that a date is not in the future."""
        if v > date.today():
            raise ValueError(f"{field_name} cannot be in the future")
        return v


class TimedSessionFieldsMixin(BaseModel):
    """Mixin with just start_time/end_time fields (no validators).

    Use this for Response schemas that shouldn't run input validators.
    """
    start_time: datetime = Field(default_factory=_get_utc_now_naive)
    end_time: Optional[datetime] = None


class TimedSessionMixin(TimedSessionFieldsMixin):
    """Mixin for input schemas with start_time/end_time fields AND validation.

    Use this for Create/Update schemas that need input validation.
    """

    @field_validator('start_time')
    @classmethod
    def validate_start_time_not_future(cls, v: datetime) -> datetime:
        """Reject start_time in the future."""
        v_naive = _to_naive_utc(v)
        if v_naive > _get_utc_now_naive():
            raise ValueError("start_time cannot be in the future")
        return v

    @model_validator(mode='after')
    def validate_end_after_start(self) -> 'TimedSessionMixin':
        """Ensure end_time is after start_time if both are provided."""
        if self.end_time is not None and self.start_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class BabyEventResponseBase(BaseModel):
    """Base response class for all baby-related events.

    Provides common fields: id, baby_id, created_at, updated_at, and ORM mode config.
    Used by: DiaperEventResponse, FeedingSessionResponse, SleepSessionResponse,
             GrowthMeasurementResponse, HealthEventResponse
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    baby_id: UUID
    created_at: datetime
    updated_at: datetime
