from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.models.diaper import UrineVolume, StoolConsistency, StoolColor, DiaperType
from app.schemas.base import NotesMixin, BabyEventResponseBase


class DiaperEventBase(NotesMixin):
    """Base schema for diaper events with notes validation."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    has_urine: bool = False
    urine_volume: UrineVolume = UrineVolume.NONE
    has_stool: bool = False
    stool_consistency: Optional[StoolConsistency] = None
    stool_color: Optional[StoolColor] = None
    diaper_type: DiaperType = DiaperType.DISPOSABLE

    @field_validator('timestamp')
    @classmethod
    def validate_timestamp_not_future(cls, v: datetime) -> datetime:
        """Reject timestamp in the future."""
        if v > datetime.utcnow():
            raise ValueError("timestamp cannot be in the future")
        return v


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
    notes: Optional[str] = Field(None, max_length=2000)


class DiaperEventResponse(DiaperEventBase, BabyEventResponseBase):
    """Response schema for diaper events."""
    pass
