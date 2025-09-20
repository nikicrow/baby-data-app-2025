import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, Date, ForeignKey, Float, String, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class MeasurementContext(enum.Enum):
    HOME = "home"
    DOCTOR_VISIT = "doctor_visit"
    HOSPITAL = "hospital"
    CLINIC = "clinic"


class GrowthMeasurement(Base):
    __tablename__ = "growth_measurements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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
    created_at = Column(DateTime, default=datetime.utcnow)

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