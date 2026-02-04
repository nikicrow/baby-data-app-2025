# Backend DRY Refactoring Plan

## Goal
Apply OOP best practices (DRY, Single Responsibility) across the backend by:
1. Creating schema base classes with shared validation
2. Creating SQLAlchemy model base classes to eliminate duplication
3. Creating a generic CRUD service to consolidate API boilerplate
4. Adding consistent `updated_at` timestamps to all models

## Issues Found

### Schema Issues

| Issue | Affected Files |
|-------|----------------|
| No `max_length` on notes fields | All 6 schemas |
| No future timestamp validation | sleep.py, feeding.py, diaper.py, health.py, growth.py |
| No `end_time > start_time` validation | sleep.py, feeding.py |
| Duplicate response boilerplate (`id`, `baby_id`, `created_at`, `Config`) | 5 schemas |
| Inconsistent field naming (`start_time` vs `sleep_start`) | feeding.py, sleep.py |
| `updated_at` only in BabyProfileResponse | Inconsistent audit trail |

### Model Issues

| Issue | Affected Files |
|-------|----------------|
| No base model class - `id`, `created_at` duplicated | All 6 models |
| `baby_id` + FK duplicated across event models | 5 event models |
| `updated_at` missing from event models | diaper.py, feeding.py, sleep.py, growth.py, health.py |
| `__repr__` patterns duplicated | All 6 models |

### API Route Issues

| Issue | Occurrences |
|-------|-------------|
| Get by ID + 404 check pattern duplicated | 18 times |
| Create + commit + refresh pattern duplicated | 6 times |
| Update with `model_dump(exclude_unset=True)` duplicated | 6 times |
| List with baby_id filter + pagination duplicated | 5 times |
| **Total estimated boilerplate** | **~65-70% of API code**

## User Decision
**Standardize field naming**: Rename `sleep_start`/`sleep_end` to `start_time`/`end_time` for consistency. This is a breaking change requiring DB migration.

## Implementation Plan

### Phase 1: Schema Refactoring ✅ COMPLETED

#### Step 1.1: Create `backend/app/schemas/base.py` ✅

Created with:
- `NOTES_MAX_LENGTH = 2000` constant
- `NotesMixin` - notes field with max length validation
- `TimestampValidatorMixin` - helper methods for timestamp validation
- `TimedSessionMixin` - start_time/end_time with future + ordering validation
- `BabyEventResponseBase` - common response fields (id, baby_id, created_at)

#### Step 1.2: Refactor Each Schema ✅

All 6 schemas refactored:
- **sleep.py** - Inherits `TimedSessionMixin, NotesMixin`, renamed `sleep_start`→`start_time`, `sleep_end`→`end_time`
- **feeding.py** - Inherits `TimedSessionMixin, NotesMixin`, kept existing validators
- **diaper.py** - Inherits `NotesMixin`, added future timestamp validation
- **health.py** - Inherits `NotesMixin`, added future timestamp validation
- **growth.py** - Inherits `NotesMixin`, added future date validation
- **baby.py** - Inherits `NotesMixin`, kept existing DOB validation

#### Step 1.3: Update `backend/app/schemas/__init__.py` ✅

Exports base classes: `NOTES_MAX_LENGTH`, `NotesMixin`, `TimedSessionMixin`, `BabyEventResponseBase`

#### Step 1.4: Add Schema Unit Tests ✅

Created `backend/app/tests/test_schemas/`:
- **test_base.py** - 16 tests for base mixins
- **test_sleep.py** - 15 tests for sleep validation
- **test_feeding.py** - 24 tests for feeding validation
- **test_diaper.py** - 10 tests for diaper validation

**Results:** 65 tests passed

#### Step 1.5: Database Migration ✅

- Model updated: `sleep_start`→`start_time`, `sleep_end`→`end_time`
- API route updated: `order_by` uses `start_time`
- Migration `546e84d92642_rename_sleep_columns.py` applied successfully

---

### Phase 2: Model Base Class + `updated_at` ✅ COMPLETED

#### Step 2.1: Create `backend/app/models/base.py` ✅

New file with abstract base classes:

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class BaseModel(Base):
    """Abstract base for all models with common fields."""
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class BabyEventModel(BaseModel):
    """Abstract base for all baby-related event models."""
    __abstract__ = True

    # Declared here but column created in subclass to allow relationship back_populates
    # Subclasses must define:
    #   baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
    #   baby = relationship("BabyProfile", back_populates="<event_type>")
```

#### Step 2.2: Refactor Each Model ✅

All 6 models refactored:
- **baby.py** - Inherits `BaseModel`, removed duplicated `id`, `created_at`, `updated_at` columns
- **diaper.py** - Inherits `BabyEventModel`, removed duplicated `id`, `created_at`, gains `updated_at`
- **feeding.py** - Inherits `BabyEventModel`, removed duplicated `id`, `created_at`, gains `updated_at`
- **sleep.py** - Inherits `BabyEventModel`, removed duplicated `id`, `created_at`, gains `updated_at`
- **growth.py** - Inherits `BabyEventModel`, removed duplicated `id`, `created_at`, gains `updated_at`
- **health.py** - Inherits `BabyEventModel`, removed duplicated `id`, `created_at`, gains `updated_at`

**baby.py:**
- Inherit `BabyProfile` from `BaseModel`
- Remove duplicated `id`, `created_at`, `updated_at` columns
- Keep `is_active` and relationships

**diaper.py:**
- Inherit `DiaperEvent` from `BabyEventModel`
- Remove duplicated `id`, `created_at` columns
- Gains `updated_at` automatically

**feeding.py:**
- Inherit `FeedingSession` from `BabyEventModel`
- Remove duplicated `id`, `created_at` columns
- Gains `updated_at` automatically

**sleep.py:**
- Inherit `SleepSession` from `BabyEventModel`
- Remove duplicated `id`, `created_at` columns
- Gains `updated_at` automatically

**growth.py:**
- Inherit `GrowthMeasurement` from `BabyEventModel`
- Remove duplicated `id`, `created_at` columns
- Gains `updated_at` automatically

**health.py:**
- Inherit `HealthEvent` from `BabyEventModel`
- Remove duplicated `id`, `created_at` columns
- Gains `updated_at` automatically

#### Step 2.3: Update Schema Response Classes ✅

Updated `BabyEventResponseBase` in `schemas/base.py` to include `updated_at`.

#### Step 2.4: Create Migration for `updated_at` ✅

Created migration `c5eb3f5c55fe_add_updated_at_to_event_tables.py` to add `updated_at` column to all 5 event tables:
- `diaper_events`
- `feeding_sessions`
- `sleep_sessions`
- `growth_measurements`
- `health_events`

Backfills existing rows with `created_at` value. **Migration applied successfully.**

#### Step 2.5: Update Tests ✅

Updated test files to include `updated_at` in response schema tests:
- `test_base.py` - Updated `TestBabyEventResponseBase`
- `test_diaper.py` - Updated `TestDiaperEventResponse`
- `test_sleep.py` - Updated `TestSleepSessionResponse`
- `test_feeding.py` - Updated `TestFeedingSessionResponse`

**Results:** 65 tests passed

---

### Phase 3: Generic CRUD Service

#### Step 3.1: Create `backend/app/services/base.py`

New file with generic CRUD operations:

```python
from typing import Generic, TypeVar, Type, Optional, List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel as PydanticBaseModel

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=PydanticBaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=PydanticBaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Generic CRUD operations for SQLAlchemy models."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: UUID) -> Optional[ModelType]:
        """Get a single record by ID."""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_or_404(self, db: Session, id: UUID) -> ModelType:
        """Get a single record by ID or raise 404."""
        obj = self.get(db, id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.model.__name__} with id {id} not found"
            )
        return obj

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        baby_id: Optional[UUID] = None,
        order_by_field: str = "created_at"
    ) -> List[ModelType]:
        """Get multiple records with optional filtering and pagination."""
        query = db.query(self.model)
        if baby_id and hasattr(self.model, "baby_id"):
            query = query.filter(self.model.baby_id == baby_id)
        order_col = getattr(self.model, order_by_field, self.model.created_at)
        return query.order_by(order_col.desc()).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update an existing record."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: UUID) -> ModelType:
        """Delete a record by ID."""
        obj = self.get_or_404(db, id)
        db.delete(obj)
        db.commit()
        return obj
```

#### Step 3.2: Create Service Instances

Create `backend/app/services/__init__.py`:

```python
from app.services.base import CRUDBase
from app.models.diaper import DiaperEvent
from app.models.feeding import FeedingSession
from app.models.sleep import SleepSession
from app.models.growth import GrowthMeasurement
from app.models.health import HealthEvent
from app.models.baby import BabyProfile
from app.schemas.diaper import DiaperEventCreate, DiaperEventUpdate
# ... other imports

diaper_service = CRUDBase[DiaperEvent, DiaperEventCreate, DiaperEventUpdate](DiaperEvent)
feeding_service = CRUDBase[FeedingSession, FeedingSessionCreate, FeedingSessionUpdate](FeedingSession)
sleep_service = CRUDBase[SleepSession, SleepSessionCreate, SleepSessionUpdate](SleepSession)
growth_service = CRUDBase[GrowthMeasurement, GrowthMeasurementCreate, GrowthMeasurementUpdate](GrowthMeasurement)
health_service = CRUDBase[HealthEvent, HealthEventCreate, HealthEventUpdate](HealthEvent)
# BabyProfile needs custom service for soft-delete
```

#### Step 3.3: Create `BabyCRUD` Subclass

`BabyProfile` has unique behavior (soft-delete with `is_active`), so extend `CRUDBase`:

```python
class BabyCRUD(CRUDBase[BabyProfile, BabyProfileCreate, BabyProfileUpdate]):
    """Custom CRUD for BabyProfile with soft-delete support."""

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[BabyProfile]:
        """Get only active babies."""
        return db.query(self.model).filter(
            self.model.is_active == True
        ).order_by(self.model.name).offset(skip).limit(limit).all()

    def remove(self, db: Session, *, id: UUID) -> BabyProfile:
        """Soft-delete by setting is_active=False."""
        obj = self.get_or_404(db, id)
        obj.is_active = False
        db.commit()
        db.refresh(obj)
        return obj

baby_service = BabyCRUD(BabyProfile)
```

#### Step 3.4: Refactor API Routes

Refactor each API router to use the service layer.

**Before (diaper.py - 102 lines):**
```python
@router.post("/", response_model=DiaperEventResponse, status_code=status.HTTP_201_CREATED)
def create_diaper_event(diaper: DiaperEventCreate, db: Session = Depends(get_db)) -> DiaperEvent:
    db_diaper = DiaperEvent(**diaper.model_dump())
    db.add(db_diaper)
    db.commit()
    db.refresh(db_diaper)
    return db_diaper
```

**After (diaper.py - ~40 lines):**
```python
from app.services import diaper_service

@router.post("/", response_model=DiaperEventResponse, status_code=status.HTTP_201_CREATED)
def create_diaper_event(diaper: DiaperEventCreate, db: Session = Depends(get_db)) -> DiaperEvent:
    return diaper_service.create(db, obj_in=diaper)

@router.get("/", response_model=List[DiaperEventResponse])
def list_diaper_events(
    baby_id: Optional[UUID] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[DiaperEvent]:
    return diaper_service.get_multi(db, skip=skip, limit=limit, baby_id=baby_id, order_by_field="timestamp")

@router.get("/{diaper_id}", response_model=DiaperEventResponse)
def get_diaper_event(diaper_id: UUID, db: Session = Depends(get_db)) -> DiaperEvent:
    return diaper_service.get_or_404(db, diaper_id)

@router.put("/{diaper_id}", response_model=DiaperEventResponse)
def update_diaper_event(diaper_id: UUID, diaper_update: DiaperEventUpdate, db: Session = Depends(get_db)) -> DiaperEvent:
    db_diaper = diaper_service.get_or_404(db, diaper_id)
    return diaper_service.update(db, db_obj=db_diaper, obj_in=diaper_update)

@router.delete("/{diaper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diaper_event(diaper_id: UUID, db: Session = Depends(get_db)) -> None:
    diaper_service.remove(db, id=diaper_id)
```

**Estimated code reduction per API file: ~60%**

---

## Files to Modify

### Phase 1: Schema Refactoring ✅ COMPLETED

| File | Action | Status |
|------|--------|--------|
| `backend/app/schemas/base.py` | **CREATE** - Mixins and base response class | ✅ |
| `backend/app/schemas/sleep.py` | Refactor + rename fields | ✅ |
| `backend/app/schemas/feeding.py` | Refactor | ✅ |
| `backend/app/schemas/diaper.py` | Refactor | ✅ |
| `backend/app/schemas/health.py` | Refactor | ✅ |
| `backend/app/schemas/growth.py` | Refactor | ✅ |
| `backend/app/schemas/baby.py` | Minor refactor | ✅ |
| `backend/app/schemas/__init__.py` | Update exports | ✅ |
| `backend/app/models/sleep.py` | Rename columns `sleep_start`→`start_time`, `sleep_end`→`end_time` | ✅ |
| `backend/app/api/sleep.py` | Update `order_by` to use new column name | ✅ |
| `backend/migrations/versions/546e84d92642_rename_sleep_columns.py` | **CREATE** - DB migration | ✅ |
| `backend/app/tests/test_schemas/test_base.py` | **CREATE** | ✅ |
| `backend/app/tests/test_schemas/test_sleep.py` | **CREATE** | ✅ |
| `backend/app/tests/test_schemas/test_feeding.py` | **CREATE** | ✅ |
| `backend/app/tests/test_schemas/test_diaper.py` | **CREATE** | ✅ |

### Phase 2: Model Base Class + `updated_at`

| File | Action |
|------|--------|
| `backend/app/models/base.py` | **CREATE** - `BaseModel` and `BabyEventModel` |
| `backend/app/models/baby.py` | Inherit from `BaseModel`, remove duplicated columns |
| `backend/app/models/diaper.py` | Inherit from `BabyEventModel`, remove duplicated columns |
| `backend/app/models/feeding.py` | Inherit from `BabyEventModel`, remove duplicated columns |
| `backend/app/models/sleep.py` | Inherit from `BabyEventModel`, remove duplicated columns |
| `backend/app/models/growth.py` | Inherit from `BabyEventModel`, remove duplicated columns |
| `backend/app/models/health.py` | Inherit from `BabyEventModel`, remove duplicated columns |
| `backend/app/models/__init__.py` | Export base classes |
| `backend/app/schemas/base.py` | Add `updated_at` to `BabyEventResponseBase` |
| `backend/alembic/versions/xxx_add_updated_at.py` | **CREATE** - Add `updated_at` to 5 event tables |

### Phase 3: Generic CRUD Service

| File | Action |
|------|--------|
| `backend/app/services/base.py` | **CREATE** - `CRUDBase` generic class |
| `backend/app/services/__init__.py` | **CREATE** - Service instances |
| `backend/app/api/diaper.py` | Refactor to use `diaper_service` |
| `backend/app/api/feeding.py` | Refactor to use `feeding_service` |
| `backend/app/api/sleep.py` | Refactor to use `sleep_service` |
| `backend/app/api/growth.py` | Refactor to use `growth_service` |
| `backend/app/api/health.py` | Refactor to use `health_service` |
| `backend/app/api/babies.py` | Refactor to use `baby_service` |
| `backend/app/tests/test_services/test_base.py` | **CREATE** - Unit tests for CRUD service |

## Design Decisions

### Phase 1 Decisions
1. **Standardize to `start_time`/`end_time`** - User chose consistency over backward compatibility
2. **Validators in Update schemas too** - Partial updates should still validate
3. **`max_length=2000` for notes** - Reasonable limit, prevents abuse
4. **DB migration required** - Rename columns in `sleep_sessions` table

### Phase 2 Decisions
5. **Abstract base classes** - Use `__abstract__ = True` to prevent SQLAlchemy creating tables for base classes
6. **`updated_at` with `onupdate`** - Automatically tracks modification time at DB level
7. **Backfill strategy** - Set `updated_at = created_at` for existing rows via migration

### Phase 3 Decisions
8. **Generic CRUD with TypeVars** - Full type safety with `Generic[ModelType, CreateSchemaType, UpdateSchemaType]`
9. **`get_or_404` pattern** - Consolidates the most repeated pattern (18 occurrences → 1)
10. **Custom `BabyCRUD` subclass** - Handles soft-delete behavior for `BabyProfile`
11. **Service instances as singletons** - One instance per model type, imported where needed

## Breaking Changes (Intentional)

**API changes:**
- Sleep schema: `sleep_start` → `start_time`, `sleep_end` → `end_time`
- All event responses now include `updated_at` field (additive, non-breaking)

**Validation changes (will reject previously-accepted invalid data):**
- Future timestamps on all event types
- `end_time` before `start_time` on sleep/feeding
- Notes exceeding 2000 characters

**Internal changes (no API impact):**
- Model inheritance hierarchy changed
- API route implementations refactored to use service layer

## Verification

### After Each Phase

1. Run `alembic upgrade head` to apply DB migrations
2. Run `pytest` from `backend/` directory
3. Run `mypy app/` for type checking
4. Run `black app/ && isort app/` for formatting
5. Start server: `py -m uvicorn app.main:app --reload`

### Phase 1 Verification (Schemas) ✅ COMPLETED

- ✅ 65 unit tests passed
- ✅ Migration applied successfully
- ✅ Sleep fields renamed to `start_time`/`end_time`

**Minor warnings (non-blocking):**
- Pydantic `class Config` deprecation (will be fixed in Phase 2)
- SQLAlchemy `declarative_base()` deprecation (will be fixed in Phase 2)

### Phase 2 Verification (Models)

- Verify all GET responses now include `updated_at` field
- Update any record → verify `updated_at` changes automatically
- Check existing records have `updated_at` backfilled from `created_at`

### Phase 3 Verification (CRUD Service)

- All CRUD operations still work identically (no functional changes)
- 404 error messages are consistent across all endpoints
- API response times unchanged or improved

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Schema base classes | 0 | 3 (`NotesMixin`, `TimedSessionMixin`, `BabyEventResponseBase`) |
| Model base classes | 0 | 2 (`BaseModel`, `BabyEventModel`) |
| Service classes | 0 | 2 (`CRUDBase`, `BabyCRUD`) |
| Duplicated CRUD code | ~65-70% | ~10% |
| Models with `updated_at` | 1 | 6 |
| Lines of code (estimated) | ~2,200 | ~1,400 |
