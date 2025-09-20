import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class SleepType(enum.Enum):
    NAP = "nap"
    NIGHTTIME = "nighttime"


class SleepLocation(enum.Enum):
    CRIB = "crib"
    BASSINET = "bassinet"
    PARENT_BED = "parent_bed"
    STROLLER = "stroller"
    CAR_SEAT = "car_seat"
    OTHER = "other"


class SleepQuality(enum.Enum):
    RESTLESS = "restless"
    FAIR = "fair"
    GOOD = "good"
    DEEP = "deep"


class WakeReason(enum.Enum):
    NATURAL = "natural"
    CRYING = "crying"
    FEEDING = "feeding"
    DIAPER = "diaper"
    NOISE = "noise"
    OTHER = "other"


class SleepSession(Base):
    __tablename__ = "sleep_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
    sleep_start = Column(DateTime, nullable=False, default=datetime.utcnow)
    sleep_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Calculated field
    sleep_type = Column(Enum(SleepType), nullable=False, default=SleepType.NAP)
    location = Column(Enum(SleepLocation), default=SleepLocation.CRIB)
    sleep_quality = Column(Enum(SleepQuality), default=SleepQuality.GOOD)
    
    # Environment tracking (stored as JSON for flexibility)
    sleep_environment = Column(JSON, nullable=True)  # temperature, noise_level, lighting, etc.
    
    wake_reason = Column(Enum(WakeReason), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    baby = relationship("BabyProfile", back_populates="sleep_sessions")

    def calculate_duration(self):
        """Calculate duration if sleep_end is set"""
        if self.sleep_end and self.sleep_start:
            delta = self.sleep_end - self.sleep_start
            self.duration_minutes = int(delta.total_seconds() / 60)

    def __repr__(self):
        return f"<SleepSession(baby_id='{self.baby_id}', type='{self.sleep_type}', start='{self.sleep_start}', duration={self.duration_minutes})>"