from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.sleep import SleepType, SleepLocation, SleepQuality, WakeReason


class SleepSessionBase(BaseModel):
    sleep_start: datetime = Field(default_factory=datetime.utcnow)
    sleep_end: Optional[datetime] = None
    sleep_type: SleepType = SleepType.NAP
    location: SleepLocation = SleepLocation.CRIB
    sleep_quality: SleepQuality = SleepQuality.GOOD
    sleep_environment: Optional[Dict[str, Any]] = None
    wake_reason: Optional[WakeReason] = None
    notes: Optional[str] = None


class SleepSessionCreate(SleepSessionBase):
    baby_id: UUID


class SleepSessionUpdate(BaseModel):
    sleep_start: Optional[datetime] = None
    sleep_end: Optional[datetime] = None
    sleep_type: Optional[SleepType] = None
    location: Optional[SleepLocation] = None
    sleep_quality: Optional[SleepQuality] = None
    sleep_environment: Optional[Dict[str, Any]] = None
    wake_reason: Optional[WakeReason] = None
    notes: Optional[str] = None


class SleepSessionResponse(SleepSessionBase):
    id: UUID
    baby_id: UUID
    duration_minutes: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True