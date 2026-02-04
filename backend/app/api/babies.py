from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.baby import BabyProfile
from app.schemas.baby import BabyProfileCreate, BabyProfileUpdate, BabyProfileResponse
from app.services import baby_service

router = APIRouter()


@router.post("/", response_model=BabyProfileResponse, status_code=status.HTTP_201_CREATED)
def create_baby_profile(
    baby: BabyProfileCreate,
    db: Session = Depends(get_db)
) -> BabyProfile:
    """Create a new baby profile."""
    return baby_service.create(db, obj_in=baby)


@router.get("/", response_model=List[BabyProfileResponse])
def list_baby_profiles(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> List[BabyProfile]:
    """List all baby profiles with optional filtering."""
    return baby_service.get_multi(db, skip=skip, limit=limit, is_active=is_active)


@router.get("/{baby_id}", response_model=BabyProfileResponse)
def get_baby_profile(
    baby_id: UUID,
    db: Session = Depends(get_db)
) -> BabyProfile:
    """Get a specific baby profile by ID."""
    return baby_service.get_or_404(db, baby_id)


@router.put("/{baby_id}", response_model=BabyProfileResponse)
def update_baby_profile(
    baby_id: UUID,
    baby_update: BabyProfileUpdate,
    db: Session = Depends(get_db)
) -> BabyProfile:
    """Update a baby profile."""
    db_baby = baby_service.get_or_404(db, baby_id)
    return baby_service.update(db, db_obj=db_baby, obj_in=baby_update)


@router.delete("/{baby_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_baby_profile(
    baby_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Soft delete a baby profile by setting is_active to False."""
    baby_service.remove(db, id=baby_id)
