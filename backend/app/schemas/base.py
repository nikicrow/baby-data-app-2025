"""Base schema classes and mixins for DRY validation patterns."""

from datetime import datetime, date
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


# Constants
NOTES_MAX_LENGTH = 2000


class NotesMixin(BaseModel):
    """Mixin for schemas that have a notes field with max length validation."""
    notes: Optional[str] = Field(None, max_length=NOTES_MAX_LENGTH)


class TimestampValidatorMixin(BaseModel):
    """Mixin providing timestamp validation helpers."""

    @staticmethod
    def validate_not_future_datetime(v: datetime, field_name: str) -> datetime:
        """Validate that a datetime is not in the future."""
        if v > datetime.utcnow():
            raise ValueError(f"{field_name} cannot be in the future")
        return v

    @staticmethod
    def validate_not_future_date(v: date, field_name: str) -> date:
        """Validate that a date is not in the future."""
        if v > date.today():
            raise ValueError(f"{field_name} cannot be in the future")
        return v


class TimedSessionMixin(BaseModel):
    """Mixin for schemas with start_time/end_time fields and validation."""
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None

    @field_validator('start_time')
    @classmethod
    def validate_start_time_not_future(cls, v: datetime) -> datetime:
        """Reject start_time in the future."""
        if v > datetime.utcnow():
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
