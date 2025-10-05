from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.health import HealthEvent
from app.schemas.health import HealthEventCreate, HealthEventUpdate, HealthEventResponse

router = APIRouter()


@router.post("/", response_model=HealthEventResponse, status_code=status.HTTP_201_CREATED)
def create_health_event(
    health: HealthEventCreate,
    db: Session = Depends(get_db)
) -> HealthEvent:
    """Create a new health event."""
    db_health = HealthEvent(**health.model_dump())
    db.add(db_health)
    db.commit()
    db.refresh(db_health)
    return db_health


@router.get("/", response_model=List[HealthEventResponse])
def list_health_events(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[HealthEvent]:
    """List all health events with optional filtering."""
    query = db.query(HealthEvent)

    if baby_id:
        query = query.filter(HealthEvent.baby_id == baby_id)

    # Order by most recent first
    events = query.order_by(HealthEvent.event_date.desc()).offset(skip).limit(limit).all()
    return events


@router.get("/{health_id}", response_model=HealthEventResponse)
def get_health_event(
    health_id: UUID,
    db: Session = Depends(get_db)
) -> HealthEvent:
    """Get a specific health event by ID."""
    health = db.query(HealthEvent).filter(HealthEvent.id == health_id).first()

    if not health:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health event with id {health_id} not found"
        )

    return health


@router.put("/{health_id}", response_model=HealthEventResponse)
def update_health_event(
    health_id: UUID,
    health_update: HealthEventUpdate,
    db: Session = Depends(get_db)
) -> HealthEvent:
    """Update a health event."""
    health = db.query(HealthEvent).filter(HealthEvent.id == health_id).first()

    if not health:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health event with id {health_id} not found"
        )

    # Update only provided fields
    update_data = health_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(health, field, value)

    db.commit()
    db.refresh(health)
    return health


@router.delete("/{health_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_event(
    health_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a health event."""
    health = db.query(HealthEvent).filter(HealthEvent.id == health_id).first()

    if not health:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health event with id {health_id} not found"
        )

    db.delete(health)
    db.commit()
