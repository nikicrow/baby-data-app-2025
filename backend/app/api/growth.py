from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.growth import GrowthMeasurement
from app.schemas.growth import GrowthMeasurementCreate, GrowthMeasurementUpdate, GrowthMeasurementResponse
from app.services import growth_service

router = APIRouter()


@router.post("/", response_model=GrowthMeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_growth_measurement(
    growth: GrowthMeasurementCreate,
    db: Session = Depends(get_db)
) -> GrowthMeasurement:
    """Create a new growth measurement."""
    return growth_service.create(db, obj_in=growth)


@router.get("/", response_model=List[GrowthMeasurementResponse])
def list_growth_measurements(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[GrowthMeasurement]:
    """List all growth measurements with optional filtering."""
    return growth_service.get_multi(
        db, skip=skip, limit=limit, baby_id=baby_id, order_by_field="measurement_date"
    )


@router.get("/{growth_id}", response_model=GrowthMeasurementResponse)
def get_growth_measurement(
    growth_id: UUID,
    db: Session = Depends(get_db)
) -> GrowthMeasurement:
    """Get a specific growth measurement by ID."""
    return growth_service.get_or_404(db, growth_id)


@router.put("/{growth_id}", response_model=GrowthMeasurementResponse)
def update_growth_measurement(
    growth_id: UUID,
    growth_update: GrowthMeasurementUpdate,
    db: Session = Depends(get_db)
) -> GrowthMeasurement:
    """Update a growth measurement."""
    db_growth = growth_service.get_or_404(db, growth_id)
    return growth_service.update(db, db_obj=db_growth, obj_in=growth_update)


@router.delete("/{growth_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_growth_measurement(
    growth_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a growth measurement."""
    growth_service.remove(db, id=growth_id)
