from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, computed_field
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
    created_at: datetime

    @computed_field
    @property
    def duration_minutes(self) -> Optional[int]:
        """Calculate sleep duration from sleep_start and sleep_end."""
        if self.sleep_end and self.sleep_start:
            delta = self.sleep_end - self.sleep_start
            return int(delta.total_seconds() / 60)
        return None

    class Config:
        from_attributes = True