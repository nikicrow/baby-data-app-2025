from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, validator, model_validator, computed_field
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

    @model_validator(mode='after')
    def check_right_or_left_breast_duration(self) -> 'FeedingSessionBase':
        if self.feeding_type == FeedingType.BREASTFEEDING:
            if (self.left_breast_duration is None or self.left_breast_duration == 0) and \
               (self.right_breast_duration is None or self.right_breast_duration == 0):
                raise ValueError('At least one of left_breast_duration or right_breast_duration must be provided for breastfeeding')
            
    # Add a validation method to check that if we feed by bottle then offered vol > 0
    @model_validator(mode='after')
    def check_bottle_feeding_volume(self) -> 'FeedingSessionBase':
        if self.feeding_type == FeedingType.BOTTLE:
            if self.volume_offered_ml is None or self.volume_offered_ml <= 0:
                raise ValueError('volume_offered_ml must be provided and greater than 0 for bottle feeding')
        return self

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
    created_at: datetime

    @computed_field
    @property
    def duration_minutes(self) -> Optional[int]:
        """Calculate duration from start_time, end_time, or breast durations."""
        if self.end_time and self.start_time:
            # For bottle/solid feeding: calculate from start to end time
            delta = self.end_time - self.start_time
            return int(delta.total_seconds() / 60)
        elif self.feeding_type == FeedingType.BREAST:
            # For breastfeeding: sum the breast durations
            left = self.left_breast_duration or 0
            right = self.right_breast_duration or 0
            total = left + right
            return total if total > 0 else None
        return None

    class Config:
        from_attributes = True