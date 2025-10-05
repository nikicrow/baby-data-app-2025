from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.baby import BabyProfile
from app.schemas.baby import BabyProfileCreate, BabyProfileUpdate, BabyProfileResponse

router = APIRouter()


@router.post("/", response_model=BabyProfileResponse, status_code=status.HTTP_201_CREATED)
def create_baby_profile(
    baby: BabyProfileCreate,
    db: Session = Depends(get_db)
) -> BabyProfile:
    """Create a new baby profile."""
    db_baby = BabyProfile(**baby.model_dump())
    db.add(db_baby)
    db.commit()
    db.refresh(db_baby)
    return db_baby


@router.get("/", response_model=List[BabyProfileResponse])
def list_baby_profiles(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> List[BabyProfile]:
    """List all baby profiles with optional filtering."""
    query = db.query(BabyProfile)

    if is_active is not None:
        query = query.filter(BabyProfile.is_active == is_active)

    babies = query.offset(skip).limit(limit).all()
    return babies


@router.get("/{baby_id}", response_model=BabyProfileResponse)
def get_baby_profile(
    baby_id: UUID,
    db: Session = Depends(get_db)
) -> BabyProfile:
    """Get a specific baby profile by ID."""
    baby = db.query(BabyProfile).filter(BabyProfile.id == baby_id).first()

    if not baby:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Baby profile with id {baby_id} not found"
        )

    return baby


@router.put("/{baby_id}", response_model=BabyProfileResponse)
def update_baby_profile(
    baby_id: UUID,
    baby_update: BabyProfileUpdate,
    db: Session = Depends(get_db)
) -> BabyProfile:
    """Update a baby profile."""
    baby = db.query(BabyProfile).filter(BabyProfile.id == baby_id).first()

    if not baby:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Baby profile with id {baby_id} not found"
        )

    # Update only provided fields
    update_data = baby_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(baby, field, value)

    db.commit()
    db.refresh(baby)
    return baby


@router.delete("/{baby_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_baby_profile(
    baby_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """Soft delete a baby profile by setting is_active to False."""
    baby = db.query(BabyProfile).filter(BabyProfile.id == baby_id).first()

    if not baby:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Baby profile with id {baby_id} not found"
        )

    # Soft delete
    baby.is_active = False
    db.commit()
