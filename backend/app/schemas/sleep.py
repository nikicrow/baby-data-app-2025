from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, computed_field
from app.models.sleep import SleepType, SleepLocation, SleepQuality, WakeReason
from app.schemas.base import NotesMixin, TimedSessionFieldsMixin, TimedSessionMixin, BabyEventResponseBase


class SleepSessionFields(TimedSessionFieldsMixin, NotesMixin):
    """Fields-only base for sleep sessions (no validators).

    Used by Response schemas that shouldn't run input validation.
    """
    sleep_type: SleepType = SleepType.NAP
    location: SleepLocation = SleepLocation.CRIB
    sleep_quality: SleepQuality = SleepQuality.GOOD
    sleep_environment: Optional[Dict[str, Any]] = None
    wake_reason: Optional[WakeReason] = None


class SleepSessionBase(TimedSessionMixin, NotesMixin):
    """Base schema for sleep sessions with full validation.

    Used by Create schemas that need input validation.
    """
    sleep_type: SleepType = SleepType.NAP
    location: SleepLocation = SleepLocation.CRIB
    sleep_quality: SleepQuality = SleepQuality.GOOD
    sleep_environment: Optional[Dict[str, Any]] = None
    wake_reason: Optional[WakeReason] = None


class SleepSessionCreate(SleepSessionBase):
    baby_id: UUID


class SleepSessionUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    sleep_type: Optional[SleepType] = None
    location: Optional[SleepLocation] = None
    sleep_quality: Optional[SleepQuality] = None
    sleep_environment: Optional[Dict[str, Any]] = None
    wake_reason: Optional[WakeReason] = None
    notes: Optional[str] = Field(None, max_length=2000)


class SleepSessionResponse(SleepSessionFields, BabyEventResponseBase):
    """Response schema for sleep sessions (no input validators)."""

    @computed_field
    @property
    def duration_minutes(self) -> Optional[int]:
        """Calculate sleep duration from start_time and end_time."""
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            return int(delta.total_seconds() / 60)
        return None
