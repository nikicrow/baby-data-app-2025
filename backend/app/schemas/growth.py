from datetime import datetime, date
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.models.growth import MeasurementContext
from app.schemas.base import NotesMixin, BabyEventResponseBase


class GrowthMeasurementBase(NotesMixin):
    """Base schema for growth measurements with notes validation."""
    measurement_date: date = Field(default_factory=date.today)
    weight_kg: Optional[float] = Field(None, gt=0, description="Weight in kg")
    length_cm: Optional[float] = Field(None, gt=0, description="Length in cm")
    head_circumference_cm: Optional[float] = Field(None, gt=0, description="Head circumference in cm")
    measurement_context: MeasurementContext = MeasurementContext.HOME
    measured_by: Optional[str] = Field(None, max_length=100)

    @field_validator('measurement_date')
    @classmethod
    def validate_measurement_date_not_future(cls, v: date) -> date:
        """Reject measurement_date in the future."""
        if v > date.today():
            raise ValueError("measurement_date cannot be in the future")
        return v


class GrowthMeasurementCreate(GrowthMeasurementBase):
    baby_id: UUID


class GrowthMeasurementUpdate(BaseModel):
    measurement_date: Optional[date] = None
    weight_kg: Optional[float] = Field(None, gt=0)
    length_cm: Optional[float] = Field(None, gt=0)
    head_circumference_cm: Optional[float] = Field(None, gt=0)
    measurement_context: Optional[MeasurementContext] = None
    measured_by: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=2000)


class GrowthMeasurementResponse(GrowthMeasurementBase, BabyEventResponseBase):
    """Response schema for growth measurements."""
    percentiles: Optional[Dict[str, Any]] = None
