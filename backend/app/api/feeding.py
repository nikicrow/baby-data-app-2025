from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.feeding import FeedingSession
from app.schemas.feeding import FeedingSessionCreate, FeedingSessionUpdate, FeedingSessionResponse

router = APIRouter()


@router.post("/", response_model=FeedingSessionResponse, status_code=status.HTTP_201_CREATED)
def create_feeding_session(
    feeding: FeedingSessionCreate,
    db: Session = Depends(get_db)
) -> FeedingSession:
    """Create a new feeding session."""
    db_feeding = FeedingSession(**feeding.model_dump())
    db.add(db_feeding)
    db.commit()
    db.refresh(db_feeding)
    return db_feeding


@router.get("/", response_model=List[FeedingSessionResponse])
def list_feeding_sessions(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[FeedingSession]:
    """List all feeding sessions with optional filtering."""
    query = db.query(FeedingSession)

    if baby_id:
        query = query.filter(FeedingSession.baby_id == baby_id)

    # Order by most recent first
    feedings = query.order_by(FeedingSession.start_time.desc()).offset(skip).limit(limit).all()
    return feedings


@router.get("/{feeding_id}", response_model=FeedingSessionResponse)
def get_feeding_session(
    feeding_id: UUID,
    db: Session = Depends(get_db)
) -> FeedingSession:
    """Get a specific feeding session by ID."""
    feeding = db.query(FeedingSession).filter(FeedingSession.id == feeding_id).first()

    if not feeding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feeding session with id {feeding_id} not found"
        )

    return feeding


@router.put("/{feeding_id}", response_model=FeedingSessionResponse)
def update_feeding_session(
    feeding_id: UUID,
    feeding_update: FeedingSessionUpdate,
    db: Session = Depends(get_db)
) -> FeedingSession:
    """Update a feeding session."""
    feeding = db.query(FeedingSession).filter(FeedingSession.id == feeding_id).first()

    if not feeding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feeding session with id {feeding_id} not found"
        )

    # Update only provided fields
    update_data = feeding_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(feeding, field, value)

    db.commit()
    db.refresh(feeding)
    return feeding


@router.delete("/{feeding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feeding_session(
    feeding_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a feeding session."""
    feeding = db.query(FeedingSession).filter(FeedingSession.id == feeding_id).first()

    if not feeding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feeding session with id {feeding_id} not found"
        )

    db.delete(feeding)
    db.commit()
