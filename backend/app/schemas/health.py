from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.health import HealthEventType


class HealthEventBase(BaseModel):
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
    attachments: Optional[List[str]] = None  # File paths/URLs
    notes: Optional[str] = None


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
    notes: Optional[str] = None


class HealthEventResponse(HealthEventBase):
    id: UUID
    baby_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True