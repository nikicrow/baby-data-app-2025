from datetime import date
from sqlalchemy import Boolean, Column, Date, Float, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class BabyProfile(BaseModel):
    """Baby profile model with personal information and relationships to events."""

    __tablename__ = "baby_profiles"

    name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    birth_weight = Column(Float, nullable=True)  # in kg
    birth_length = Column(Float, nullable=True)  # in cm
    birth_head_circumference = Column(Float, nullable=True)  # in cm
    gender = Column(String(20), nullable=True)  # male, female, other
    timezone = Column(String(50), default="Australia/Sydney")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    diaper_events = relationship("DiaperEvent", back_populates="baby", cascade="all, delete-orphan")
    feeding_sessions = relationship("FeedingSession", back_populates="baby", cascade="all, delete-orphan")
    sleep_sessions = relationship("SleepSession", back_populates="baby", cascade="all, delete-orphan")
    growth_measurements = relationship("GrowthMeasurement", back_populates="baby", cascade="all, delete-orphan")
    health_events = relationship("HealthEvent", back_populates="baby", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BabyProfile(name='{self.name}', dob='{self.date_of_birth}')>"