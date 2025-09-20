from datetime import datetime, date
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.growth import MeasurementContext


class GrowthMeasurementBase(BaseModel):
    measurement_date: date = Field(default_factory=date.today)
    weight_kg: Optional[float] = Field(None, gt=0, description="Weight in kg")
    length_cm: Optional[float] = Field(None, gt=0, description="Length in cm") 
    head_circumference_cm: Optional[float] = Field(None, gt=0, description="Head circumference in cm")
    measurement_context: MeasurementContext = MeasurementContext.HOME
    measured_by: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class GrowthMeasurementCreate(GrowthMeasurementBase):
    baby_id: UUID


class GrowthMeasurementUpdate(BaseModel):
    measurement_date: Optional[date] = None
    weight_kg: Optional[float] = Field(None, gt=0)
    length_cm: Optional[float] = Field(None, gt=0)
    head_circumference_cm: Optional[float] = Field(None, gt=0)
    measurement_context: Optional[MeasurementContext] = None
    measured_by: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class GrowthMeasurementResponse(GrowthMeasurementBase):
    id: UUID
    baby_id: UUID
    percentiles: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True