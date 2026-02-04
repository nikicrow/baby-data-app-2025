"""Service layer for CRUD operations.

Provides pre-configured service instances for each model type.
"""

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.services.base import CRUDBase
from app.models import (
    BabyProfile,
    DiaperEvent,
    FeedingSession,
    SleepSession,
    GrowthMeasurement,
    HealthEvent,
)
from app.schemas import (
    BabyProfileCreate,
    BabyProfileUpdate,
    DiaperEventCreate,
    DiaperEventUpdate,
    FeedingSessionCreate,
    FeedingSessionUpdate,
    SleepSessionCreate,
    SleepSessionUpdate,
    GrowthMeasurementCreate,
    GrowthMeasurementUpdate,
    HealthEventCreate,
    HealthEventUpdate,
)


class BabyCRUD(CRUDBase[BabyProfile, BabyProfileCreate, BabyProfileUpdate]):
    """Custom CRUD for BabyProfile with soft-delete support."""

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        is_active: bool = True,
        **kwargs
    ) -> List[BabyProfile]:
        """Get babies with optional active filter, ordered by name.

        Args:
            db: Database session.
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            is_active: Filter by active status (default True).

        Returns:
            List of baby profiles matching the criteria.
        """
        query = db.query(self.model)
        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)
        return query.order_by(self.model.name).offset(skip).limit(limit).all()

    def remove(self, db: Session, *, id: UUID) -> BabyProfile:
        """Soft-delete by setting is_active=False.

        Args:
            db: Database session.
            id: Baby profile UUID.

        Returns:
            The soft-deleted baby profile.

        Raises:
            HTTPException: 404 if baby not found.
        """
        obj = self.get_or_404(db, id)
        obj.is_active = False
        db.commit()
        db.refresh(obj)
        return obj


# Service instances - one per model type
baby_service = BabyCRUD(BabyProfile)
diaper_service = CRUDBase[DiaperEvent, DiaperEventCreate, DiaperEventUpdate](DiaperEvent)
feeding_service = CRUDBase[FeedingSession, FeedingSessionCreate, FeedingSessionUpdate](FeedingSession)
sleep_service = CRUDBase[SleepSession, SleepSessionCreate, SleepSessionUpdate](SleepSession)
growth_service = CRUDBase[GrowthMeasurement, GrowthMeasurementCreate, GrowthMeasurementUpdate](GrowthMeasurement)
health_service = CRUDBase[HealthEvent, HealthEventCreate, HealthEventUpdate](HealthEvent)

__all__ = [
    "CRUDBase",
    "BabyCRUD",
    "baby_service",
    "diaper_service",
    "feeding_service",
    "sleep_service",
    "growth_service",
    "health_service",
]
