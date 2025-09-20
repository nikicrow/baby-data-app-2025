import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class FeedingType(enum.Enum):
    BREAST = "breast"
    BOTTLE = "bottle"
    SOLID = "solid"


class BreastSide(enum.Enum):
    LEFT = "left"
    RIGHT = "right"


class Appetite(enum.Enum):
    POOR = "poor"
    FAIR = "fair"
    GOOD = "good"
    EXCELLENT = "excellent"


class FeedingSession(Base):
    __tablename__ = "feeding_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    feeding_type = Column(Enum(FeedingType), nullable=False)
    duration_minutes = Column(Integer, nullable=True)  # Calculated field

    # Breastfeeding specific fields
    breast_started = Column(Enum(BreastSide), nullable=True)
    left_breast_duration = Column(Integer, nullable=True)  # minutes
    right_breast_duration = Column(Integer, nullable=True)  # minutes

    # Bottle feeding specific fields
    volume_offered_ml = Column(Integer, nullable=True)
    volume_consumed_ml = Column(Integer, nullable=True)
    formula_type = Column(String(100), nullable=True)

    # Solid food specific fields
    food_items = Column(JSON, nullable=True)  # Array of food items
    appetite = Column(Enum(Appetite), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    baby = relationship("BabyProfile", back_populates="feeding_sessions")

    def calculate_duration(self):
        """Calculate duration if end_time is set"""
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            self.duration_minutes = int(delta.total_seconds() / 60)
        elif self.feeding_type == FeedingType.BREAST:
            # For breastfeeding, sum the breast durations
            left_duration = self.left_breast_duration or 0
            right_duration = self.right_breast_duration or 0
            self.duration_minutes = left_duration + right_duration

    def __repr__(self):
        return f"<FeedingSession(baby_id='{self.baby_id}', type='{self.feeding_type}', start='{self.start_time}')>"