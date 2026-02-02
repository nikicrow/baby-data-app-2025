from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.models.health import HealthEventType
from app.schemas.base import NotesMixin, BabyEventResponseBase


class HealthEventBase(NotesMixin):
    """Base schema for health events with notes validation."""
    event_date: datetime = Field(default_factory=datetime.utcnow)
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
        if v > datetime.utcnow():
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


class HealthEventResponse(HealthEventBase, BabyEventResponseBase):
    """Response schema for health events."""
    pass
