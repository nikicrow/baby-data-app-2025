from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, validator
from app.models.feeding import FeedingType, BreastSide, Appetite


class FeedingSessionBase(BaseModel):
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    feeding_type: FeedingType
    
    # Breastfeeding fields
    breast_started: Optional[BreastSide] = None
    left_breast_duration: Optional[int] = Field(None, ge=0, description="Duration in minutes")
    right_breast_duration: Optional[int] = Field(None, ge=0, description="Duration in minutes")
    
    # Bottle feeding fields
    volume_offered_ml: Optional[int] = Field(None, ge=0)
    volume_consumed_ml: Optional[int] = Field(None, ge=0)
    formula_type: Optional[str] = Field(None, max_length=100)
    
    # Solid food fields
    food_items: Optional[List[str]] = None
    appetite: Optional[Appetite] = None
    
    notes: Optional[str] = None

    @validator('volume_consumed_ml')
    def validate_volume_consumed(cls, v, values):
        if v is not None and 'volume_offered_ml' in values and values['volume_offered_ml'] is not None:
            if v > values['volume_offered_ml']:
                raise ValueError('Volume consumed cannot exceed volume offered')
        return v


class FeedingSessionCreate(FeedingSessionBase):
    baby_id: UUID


class FeedingSessionUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    breast_started: Optional[BreastSide] = None
    left_breast_duration: Optional[int] = Field(None, ge=0)
    right_breast_duration: Optional[int] = Field(None, ge=0)
    volume_offered_ml: Optional[int] = Field(None, ge=0)
    volume_consumed_ml: Optional[int] = Field(None, ge=0)
    formula_type: Optional[str] = Field(None, max_length=100)
    food_items: Optional[List[str]] = None
    appetite: Optional[Appetite] = None
    notes: Optional[str] = None


class FeedingSessionResponse(FeedingSessionBase):
    id: UUID
    baby_id: UUID
    duration_minutes: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True