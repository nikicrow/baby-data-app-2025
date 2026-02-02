import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BabyEventModel


class UrineVolume(enum.Enum):
    NONE = "none"
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"


class StoolConsistency(enum.Enum):
    LIQUID = "liquid"
    SOFT = "soft"
    FORMED = "formed"
    HARD = "hard"


class StoolColor(enum.Enum):
    YELLOW = "yellow"
    BROWN = "brown"
    GREEN = "green"
    RED = "red"
    BLACK = "black"
    OTHER = "other"


class DiaperType(enum.Enum):
    DISPOSABLE = "disposable"
    CLOTH = "cloth"
    TRAINING = "training"


class DiaperEvent(BabyEventModel):
    """Diaper change event model tracking urine, stool, and diaper type."""

    __tablename__ = "diaper_events"

    baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Urine tracking
    has_urine = Column(Boolean, default=False)
    urine_volume = Column(Enum(UrineVolume), default=UrineVolume.NONE)

    # Stool tracking
    has_stool = Column(Boolean, default=False)
    stool_consistency = Column(Enum(StoolConsistency), nullable=True)
    stool_color = Column(Enum(StoolColor), nullable=True)

    # Diaper info
    diaper_type = Column(Enum(DiaperType), default=DiaperType.DISPOSABLE)

    notes = Column(Text, nullable=True)

    # Relationships
    baby = relationship("BabyProfile", back_populates="diaper_events")

    def __repr__(self):
        return f"<DiaperEvent(baby_id='{self.baby_id}', timestamp='{self.timestamp}', urine={self.has_urine}, stool={self.has_stool})>"