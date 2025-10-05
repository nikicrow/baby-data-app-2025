from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.growth import GrowthMeasurement
from app.schemas.growth import GrowthMeasurementCreate, GrowthMeasurementUpdate, GrowthMeasurementResponse

router = APIRouter()


@router.post("/", response_model=GrowthMeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_growth_measurement(
    growth: GrowthMeasurementCreate,
    db: Session = Depends(get_db)
) -> GrowthMeasurement:
    """Create a new growth measurement."""
    db_growth = GrowthMeasurement(**growth.model_dump())
    db.add(db_growth)
    db.commit()
    db.refresh(db_growth)
    return db_growth


@router.get("/", response_model=List[GrowthMeasurementResponse])
def list_growth_measurements(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[GrowthMeasurement]:
    """List all growth measurements with optional filtering."""
    query = db.query(GrowthMeasurement)

    if baby_id:
        query = query.filter(GrowthMeasurement.baby_id == baby_id)

    # Order by most recent first
    measurements = query.order_by(GrowthMeasurement.measurement_date.desc()).offset(skip).limit(limit).all()
    return measurements


@router.get("/{growth_id}", response_model=GrowthMeasurementResponse)
def get_growth_measurement(
    growth_id: UUID,
    db: Session = Depends(get_db)
) -> GrowthMeasurement:
    """Get a specific growth measurement by ID."""
    growth = db.query(GrowthMeasurement).filter(GrowthMeasurement.id == growth_id).first()

    if not growth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth measurement with id {growth_id} not found"
        )

    return growth


@router.put("/{growth_id}", response_model=GrowthMeasurementResponse)
def update_growth_measurement(
    growth_id: UUID,
    growth_update: GrowthMeasurementUpdate,
    db: Session = Depends(get_db)
) -> GrowthMeasurement:
    """Update a growth measurement."""
    growth = db.query(GrowthMeasurement).filter(GrowthMeasurement.id == growth_id).first()

    if not growth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth measurement with id {growth_id} not found"
        )

    # Update only provided fields
    update_data = growth_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(growth, field, value)

    db.commit()
    db.refresh(growth)
    return growth


@router.delete("/{growth_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_growth_measurement(
    growth_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a growth measurement."""
    growth = db.query(GrowthMeasurement).filter(GrowthMeasurement.id == growth_id).first()

    if not growth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth measurement with id {growth_id} not found"
        )

    db.delete(growth)
    db.commit()
