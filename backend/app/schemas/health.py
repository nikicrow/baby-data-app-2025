from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.models.health import HealthEventType
from app.schemas.base import (
    NotesMixin,
    BabyEventResponseBase,
    _get_utc_now_naive,
    _to_naive_utc,
)


class HealthEventFields(NotesMixin):
    """Fields-only base for health events (no validators).

    Used by Response schemas that shouldn't run input validation.
    """
    event_date: datetime = Field(default_factory=_get_utc_now_naive)
    event_type: HealthEventType
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    temperature_celsius: Optional[float] = Field(None, ge=30, le=45, description="Temperature in Celsius")
    symptoms: Optional[List[str]] = None
    treatment: Optional[str] = None
    healthcare_provider: Optional[str] = Field(None, max_length=200)
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    attachments: Optional[List[str]] = None


class HealthEventBase(NotesMixin):
    """Base schema for health events with full validation.

    Used by Create schemas that need input validation.
    """
    event_date: datetime = Field(default_factory=_get_utc_now_naive)
    event_type: HealthEventType
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    temperature_celsius: Optional[float] = Field(None, ge=30, le=45, description="Temperature in Celsius")
    symptoms: Optional[List[str]] = None
    treatment: Optional[str] = None
    healthcare_provider: Optional[str] = Field(None, max_length=200)
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    attachments: Optional[List[str]] = None

    @field_validator('event_date')
    @classmethod
    def validate_event_date_not_future(cls, v: datetime) -> datetime:
        """Reject event_date in the future."""
        v_naive = _to_naive_utc(v)
        if v_naive > _get_utc_now_naive():
            raise ValueError("event_date cannot be in the future")
        return v


class HealthEventCreate(HealthEventBase):
    baby_id: UUID


class HealthEventUpdate(BaseModel):
    event_date: Optional[datetime] = None
    event_type: Optional[HealthEventType] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    temperature_celsius: Optional[float] = Field(None, ge=30, le=45)
    symptoms: Optional[List[str]] = None
    treatment: Optional[str] = None
    healthcare_provider: Optional[str] = Field(None, max_length=200)
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[datetime] = None
    attachments: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=2000)


class HealthEventResponse(HealthEventFields, BabyEventResponseBase):
    """Response schema for health events (no input validators)."""
    pass
