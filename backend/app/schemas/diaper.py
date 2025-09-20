from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.diaper import UrineVolume, StoolConsistency, StoolColor, DiaperType


class DiaperEventBase(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    has_urine: bool = False
    urine_volume: UrineVolume = UrineVolume.NONE
    has_stool: bool = False
    stool_consistency: Optional[StoolConsistency] = None
    stool_color: Optional[StoolColor] = None
    diaper_type: DiaperType = DiaperType.DISPOSABLE
    notes: Optional[str] = None


class DiaperEventCreate(DiaperEventBase):
    baby_id: UUID


class DiaperEventUpdate(BaseModel):
    timestamp: Optional[datetime] = None
    has_urine: Optional[bool] = None
    urine_volume: Optional[UrineVolume] = None
    has_stool: Optional[bool] = None
    stool_consistency: Optional[StoolConsistency] = None
    stool_color: Optional[StoolColor] = None
    diaper_type: Optional[DiaperType] = None
    notes: Optional[str] = None


class DiaperEventResponse(DiaperEventBase):
    id: UUID
    baby_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True