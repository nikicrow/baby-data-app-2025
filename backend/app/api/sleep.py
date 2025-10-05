from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.sleep import SleepSession
from app.schemas.sleep import SleepSessionCreate, SleepSessionUpdate, SleepSessionResponse

router = APIRouter()


@router.post("/", response_model=SleepSessionResponse, status_code=status.HTTP_201_CREATED)
def create_sleep_session(
    sleep: SleepSessionCreate,
    db: Session = Depends(get_db)
) -> SleepSession:
    """Create a new sleep session."""
    db_sleep = SleepSession(**sleep.model_dump())
    db.add(db_sleep)
    db.commit()
    db.refresh(db_sleep)
    return db_sleep


@router.get("/", response_model=List[SleepSessionResponse])
def list_sleep_sessions(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[SleepSession]:
    """List all sleep sessions with optional filtering."""
    query = db.query(SleepSession)

    if baby_id:
        query = query.filter(SleepSession.baby_id == baby_id)

    # Order by most recent first
    sleeps = query.order_by(SleepSession.sleep_start.desc()).offset(skip).limit(limit).all()
    return sleeps


@router.get("/{sleep_id}", response_model=SleepSessionResponse)
def get_sleep_session(
    sleep_id: UUID,
    db: Session = Depends(get_db)
) -> SleepSession:
    """Get a specific sleep session by ID."""
    sleep = db.query(SleepSession).filter(SleepSession.id == sleep_id).first()

    if not sleep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sleep session with id {sleep_id} not found"
        )

    return sleep


@router.put("/{sleep_id}", response_model=SleepSessionResponse)
def update_sleep_session(
    sleep_id: UUID,
    sleep_update: SleepSessionUpdate,
    db: Session = Depends(get_db)
) -> SleepSession:
    """Update a sleep session."""
    sleep = db.query(SleepSession).filter(SleepSession.id == sleep_id).first()

    if not sleep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sleep session with id {sleep_id} not found"
        )

    # Update only provided fields
    update_data = sleep_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sleep, field, value)

    db.commit()
    db.refresh(sleep)
    return sleep


@router.delete("/{sleep_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep_session(
    sleep_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a sleep session."""
    sleep = db.query(SleepSession).filter(SleepSession.id == sleep_id).first()

    if not sleep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sleep session with id {sleep_id} not found"
        )

    db.delete(sleep)
    db.commit()
