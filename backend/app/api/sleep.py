from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.sleep import SleepSession
from app.schemas.sleep import SleepSessionCreate, SleepSessionUpdate, SleepSessionResponse
from app.services import sleep_service

router = APIRouter()


@router.post("/", response_model=SleepSessionResponse, status_code=status.HTTP_201_CREATED)
def create_sleep_session(
    sleep: SleepSessionCreate,
    db: Session = Depends(get_db)
) -> SleepSession:
    """Create a new sleep session."""
    return sleep_service.create(db, obj_in=sleep)


@router.get("/", response_model=List[SleepSessionResponse])
def list_sleep_sessions(
    baby_id: Optional[UUID] = Query(None, description="Filter by baby ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[SleepSession]:
    """List all sleep sessions with optional filtering."""
    return sleep_service.get_multi(
        db, skip=skip, limit=limit, baby_id=baby_id, order_by_field="start_time"
    )


@router.get("/{sleep_id}", response_model=SleepSessionResponse)
def get_sleep_session(
    sleep_id: UUID,
    db: Session = Depends(get_db)
) -> SleepSession:
    """Get a specific sleep session by ID."""
    return sleep_service.get_or_404(db, sleep_id)


@router.put("/{sleep_id}", response_model=SleepSessionResponse)
def update_sleep_session(
    sleep_id: UUID,
    sleep_update: SleepSessionUpdate,
    db: Session = Depends(get_db)
) -> SleepSession:
    """Update a sleep session."""
    db_sleep = sleep_service.get_or_404(db, sleep_id)
    return sleep_service.update(db, db_obj=db_sleep, obj_in=sleep_update)


@router.delete("/{sleep_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep_session(
    sleep_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Delete a sleep session."""
    sleep_service.remove(db, id=sleep_id)
