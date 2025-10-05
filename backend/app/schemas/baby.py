from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, PositiveFloat, field_validator


class BabyProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    birth_weight: Optional[PositiveFloat] = Field(None, gt=0, description="Birth weight in kg")
    birth_length: Optional[PositiveFloat] = Field(None, gt=0, description="Birth length in cm")
    birth_head_circumference: Optional[PositiveFloat] = Field(None, gt=0, description="Birth head circumference in cm")
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    timezone: str = Field(default="Australia/Sydney", max_length=50)
    notes: Optional[str] = None

    @field_validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        if v > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return v


class BabyProfileCreate(BabyProfileBase):
    pass


class BabyProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    birth_weight: Optional[PositiveFloat] = Field(None, gt=0)
    birth_length: Optional[PositiveFloat] = Field(None, gt=0)
    birth_head_circumference: Optional[PositiveFloat] = Field(None, gt=0)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    timezone: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class BabyProfileResponse(BabyProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True