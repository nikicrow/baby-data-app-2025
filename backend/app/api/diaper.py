from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.diaper import DiaperEvent
from app.schemas.diaper import DiaperEventCreate, DiaperEventUpdate, DiaperEventResponse
from app.services import diaper_service

router = APIRouter()


@router.post("/", response_model=DiaperEventResponse, status_code=status.HTTP_201_CREATED)
def create_diaper_event(
    diaper: DiaperEventCreate,
    db: Session = Depends(get_db)
) -> DiaperEvent:
    """Create a new diaper event."""
    return diaper_service.create(db, obj_in=diaper)


@router.get("/", response_model=List[DiaperEventResponse])
def list_diaper_events(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[DiaperEvent]:
    """List all diaper events with optional filtering."""
    return diaper_service.get_multi(
        db, skip=skip, limit=limit, baby_id=baby_id, order_by_field="timestamp"
    )


@router.get("/{diaper_id}", response_model=DiaperEventResponse)
def get_diaper_event(
    diaper_id: UUID,
    db: Session = Depends(get_db)
) -> DiaperEvent:
    """Get a specific diaper event by ID."""
    return diaper_service.get_or_404(db, diaper_id)


@router.put("/{diaper_id}", response_model=DiaperEventResponse)
def update_diaper_event(
    diaper_id: UUID,
    diaper_update: DiaperEventUpdate,
    db: Session = Depends(get_db)
) -> DiaperEvent:
    """Update a diaper event."""
    db_diaper = diaper_service.get_or_404(db, diaper_id)
    return diaper_service.update(db, db_obj=db_diaper, obj_in=diaper_update)


@router.delete("/{diaper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diaper_event(
    diaper_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a diaper event."""
    diaper_service.remove(db, id=diaper_id)
