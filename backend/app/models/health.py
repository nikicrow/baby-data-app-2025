import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BabyEventModel


class HealthEventType(enum.Enum):
    VACCINATION = "vaccination"
    ILLNESS = "illness"
    MEDICATION = "medication"
    MILESTONE = "milestone"
    DOCTOR_VISIT = "doctor_visit"
    ALLERGY = "allergy"
    OTHER = "other"


class HealthEvent(BabyEventModel):
    """Health event model for tracking medical events, vaccinations, and milestones."""

    __tablename__ = "health_events"

    baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
    event_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    event_type = Column(Enum(HealthEventType), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Health metrics
    temperature_celsius = Column(Float, nullable=True)
    symptoms = Column(JSON, nullable=True)  # Array of symptoms
    treatment = Column(Text, nullable=True)

    # Provider information
    healthcare_provider = Column(String(200), nullable=True)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime, nullable=True)

    # Attachments (photos, documents)
    attachments = Column(JSON, nullable=True)  # Array of file paths/URLs

    notes = Column(Text, nullable=True)

    # Relationships
    baby = relationship("BabyProfile", back_populates="health_events")

    def __repr__(self):
        return f"<HealthEvent(baby_id='{self.baby_id}', type='{self.event_type}', title='{self.title}', date='{self.event_date}')>"