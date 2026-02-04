import enum
from datetime import date

from sqlalchemy import Column, Date, Enum, Float, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BabyEventModel


class MeasurementContext(enum.Enum):
    HOME = "home"
    DOCTOR_VISIT = "doctor_visit"
    HOSPITAL = "hospital"
    CLINIC = "clinic"


class GrowthMeasurement(BabyEventModel):
    """Growth measurement model tracking weight, length, and head circumference."""

    __tablename__ = "growth_measurements"

    baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
    measurement_date = Column(Date, nullable=False, default=date.today)

    # Physical measurements
    weight_kg = Column(Float, nullable=True)
    length_cm = Column(Float, nullable=True)
    head_circumference_cm = Column(Float, nullable=True)

    # Context
    measurement_context = Column(Enum(MeasurementContext), default=MeasurementContext.HOME)
    measured_by = Column(String(100), nullable=True)  # Doctor name, parent, etc.

    # Calculated percentiles (stored as JSON for flexibility)
    percentiles = Column(JSON, nullable=True)  # {"weight": 45, "length": 50, "head": 55}

    notes = Column(Text, nullable=True)

    # Relationships
    baby = relationship("BabyProfile", back_populates="growth_measurements")

    def calculate_percentiles(self, baby_age_days: int, baby_gender: str):
        """
        Calculate percentiles based on baby's age and gender.
        This would use WHO growth charts or similar reference data.
        For now, this is a placeholder for the calculation logic.
        """
        # TODO: Implement actual percentile calculation using WHO growth charts
        # This would involve comparing the measurements against reference data
        # based on the baby's age in days and gender
        percentiles = {}
        
        if self.weight_kg:
            # Placeholder calculation - replace with actual WHO chart lookup
            percentiles["weight"] = 50  # Default to 50th percentile as placeholder
            
        if self.length_cm:
            percentiles["length"] = 50
            
        if self.head_circumference_cm:
            percentiles["head_circumference"] = 50
            
        self.percentiles = percentiles

    def __repr__(self):
        return f"<GrowthMeasurement(baby_id='{self.baby_id}', date='{self.measurement_date}', weight={self.weight_kg}kg)>"