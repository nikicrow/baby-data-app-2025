from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.diaper import DiaperEvent
from app.schemas.diaper import DiaperEventCreate, DiaperEventUpdate, DiaperEventResponse

router = APIRouter()


@router.post("/", response_model=DiaperEventResponse, status_code=status.HTTP_201_CREATED)
def create_diaper_event(
    diaper: DiaperEventCreate,
    db: Session = Depends(get_db)
) -> DiaperEvent:
    """Create a new diaper event."""
    db_diaper = DiaperEvent(**diaper.model_dump())
    db.add(db_diaper)
    db.commit()
    db.refresh(db_diaper)
    return db_diaper


@router.get("/", response_model=List[DiaperEventResponse])
def list_diaper_events(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[DiaperEvent]:
    """List all diaper events with optional filtering."""
    query = db.query(DiaperEvent)

    if baby_id:
        query = query.filter(DiaperEvent.baby_id == baby_id)

    # Order by most recent first
    diapers = query.order_by(DiaperEvent.timestamp.desc()).offset(skip).limit(limit).all()
    return diapers


@router.get("/{diaper_id}", response_model=DiaperEventResponse)
def get_diaper_event(
    diaper_id: UUID,
    db: Session = Depends(get_db)
) -> DiaperEvent:
    """Get a specific diaper event by ID."""
    diaper = db.query(DiaperEvent).filter(DiaperEvent.id == diaper_id).first()

    if not diaper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diaper event with id {diaper_id} not found"
        )

    return diaper


@router.put("/{diaper_id}", response_model=DiaperEventResponse)
def update_diaper_event(
    diaper_id: UUID,
    diaper_update: DiaperEventUpdate,
    db: Session = Depends(get_db)
) -> DiaperEvent:
    """Update a diaper event."""
    diaper = db.query(DiaperEvent).filter(DiaperEvent.id == diaper_id).first()

    if not diaper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diaper event with id {diaper_id} not found"
        )

    # Update only provided fields
    update_data = diaper_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(diaper, field, value)

    db.commit()
    db.refresh(diaper)
    return diaper


@router.delete("/{diaper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diaper_event(
    diaper_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a diaper event."""
    diaper = db.query(DiaperEvent).filter(DiaperEvent.id == diaper_id).first()

    if not diaper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diaper event with id {diaper_id} not found"
        )

    db.delete(diaper)
    db.commit()
