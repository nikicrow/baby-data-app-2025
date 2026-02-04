from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.models.diaper import UrineVolume, StoolConsistency, StoolColor, DiaperType
from app.schemas.base import (
    NotesMixin,
    BabyEventResponseBase,
    _get_utc_now_naive,
    _to_naive_utc,
)


class DiaperEventFields(NotesMixin):
    """Fields-only base for diaper events (no validators).

    Used by Response schemas that shouldn't run input validation.
    """
    timestamp: datetime = Field(default_factory=_get_utc_now_naive)
    has_urine: bool = False
    urine_volume: UrineVolume = UrineVolume.NONE
    has_stool: bool = False
    stool_consistency: Optional[StoolConsistency] = None
    stool_color: Optional[StoolColor] = None
    diaper_type: DiaperType = DiaperType.DISPOSABLE


class DiaperEventBase(NotesMixin):
    """Base schema for diaper events with full validation.

    Used by Create schemas that need input validation.
    """
    timestamp: datetime = Field(default_factory=_get_utc_now_naive)
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
        v_naive = _to_naive_utc(v)
        if v_naive > _get_utc_now_naive():
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


class DiaperEventResponse(DiaperEventFields, BabyEventResponseBase):
    """Response schema for diaper events (no input validators)."""
    pass
