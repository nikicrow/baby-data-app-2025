from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.feeding import FeedingSession
from app.schemas.feeding import FeedingSessionCreate, FeedingSessionUpdate, FeedingSessionResponse
from app.services import feeding_service

router = APIRouter()


@router.post("/", response_model=FeedingSessionResponse, status_code=status.HTTP_201_CREATED)
def create_feeding_session(
    feeding: FeedingSessionCreate,
    db: Session = Depends(get_db)
) -> FeedingSession:
    """Create a new feeding session."""
    return feeding_service.create(db, obj_in=feeding)


@router.get("/", response_model=List[FeedingSessionResponse])
def list_feeding_sessions(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[FeedingSession]:
    """List all feeding sessions with optional filtering."""
    return feeding_service.get_multi(
        db, skip=skip, limit=limit, baby_id=baby_id, order_by_field="start_time"
    )


@router.get("/{feeding_id}", response_model=FeedingSessionResponse)
def get_feeding_session(
    feeding_id: UUID,
    db: Session = Depends(get_db)
) -> FeedingSession:
    """Get a specific feeding session by ID."""
    return feeding_service.get_or_404(db, feeding_id)


@router.put("/{feeding_id}", response_model=FeedingSessionResponse)
def update_feeding_session(
    feeding_id: UUID,
    feeding_update: FeedingSessionUpdate,
    db: Session = Depends(get_db)
) -> FeedingSession:
    """Update a feeding session."""
    db_feeding = feeding_service.get_or_404(db, feeding_id)
    return feeding_service.update(db, db_obj=db_feeding, obj_in=feeding_update)


@router.delete("/{feeding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feeding_session(
    feeding_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a feeding session."""
    feeding_service.remove(db, id=feeding_id)
