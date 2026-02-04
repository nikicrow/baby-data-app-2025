from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.health import HealthEvent
from app.schemas.health import HealthEventCreate, HealthEventUpdate, HealthEventResponse
from app.services import health_service

router = APIRouter()


@router.post("/", response_model=HealthEventResponse, status_code=status.HTTP_201_CREATED)
def create_health_event(
    health: HealthEventCreate,
    db: Session = Depends(get_db)
) -> HealthEvent:
    """Create a new health event."""
    return health_service.create(db, obj_in=health)


@router.get("/", response_model=List[HealthEventResponse])
def list_health_events(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[HealthEvent]:
    """List all health events with optional filtering."""
    return health_service.get_multi(
        db, skip=skip, limit=limit, baby_id=baby_id, order_by_field="event_date"
    )


@router.get("/{health_id}", response_model=HealthEventResponse)
def get_health_event(
    health_id: UUID,
    db: Session = Depends(get_db)
) -> HealthEvent:
    """Get a specific health event by ID."""
    return health_service.get_or_404(db, health_id)


@router.put("/{health_id}", response_model=HealthEventResponse)
def update_health_event(
    health_id: UUID,
    health_update: HealthEventUpdate,
    db: Session = Depends(get_db)
) -> HealthEvent:
    """Update a health event."""
    db_health = health_service.get_or_404(db, health_id)
    return health_service.update(db, db_obj=db_health, obj_in=health_update)


@router.delete("/{health_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_event(
    health_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a health event."""
    health_service.remove(db, id=health_id)
