# Pydantic Schema Refactoring Plan

## Goal
Apply OOP best practices (DRY, Single Responsibility) to `backend/app/schemas/` by creating parent classes for common patterns and adding validation.

## Issues Found

| Issue | Affected Files |
|-------|----------------|
| No `max_length` on notes fields | All 6 schemas |
| No future timestamp validation | sleep.py, feeding.py, diaper.py, health.py, growth.py |
| No `end_time > start_time` validation | sleep.py, feeding.py |
| Duplicate response boilerplate (`id`, `baby_id`, `created_at`, `Config`) | 5 schemas |
| Inconsistent field naming (`start_time` vs `sleep_start`) | feeding.py, sleep.py |
| `updated_at` only in BabyProfileResponse | Inconsistent audit trail |

## User Decision
**Standardize field naming**: Rename `sleep_start`/`sleep_end` to `start_time`/`end_time` for consistency. This is a breaking change requiring DB migration.

## Implementation Plan

### Step 1: Create `backend/app/schemas/base.py`

New file with base classes:

```python
# Core constants
NOTES_MAX_LENGTH = 2000

# Mixins
class NotesMixin(BaseModel):
    notes: Optional[str] = Field(None, max_length=NOTES_MAX_LENGTH)

class TimedSessionMixin(BaseModel):
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    # Validators: start_time not future, end_time > start_time

# Base response for baby events (5/6 schemas use this pattern)
class BabyEventResponseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    baby_id: UUID
    created_at: datetime
```

### Step 2: Refactor Each Schema

**sleep.py:**
- Inherit `SleepSessionBase` from `TimedSessionMixin, NotesMixin`
- Rename `sleep_start` → `start_time`, `sleep_end` → `end_time`
- Gets future validation and end > start from `TimedSessionMixin`
- `SleepSessionResponse` inherits from `SleepSessionBase, BabyEventResponseBase`

**feeding.py:**
- Inherit `FeedingSessionBase` from `TimedSessionMixin, NotesMixin`
- Gets future validation and end > start from mixin
- Keep existing breastfeeding/bottle validators
- `FeedingSessionResponse` inherits from `FeedingSessionBase, BabyEventResponseBase`

**diaper.py:**
- Inherit `DiaperEventBase` from `NotesMixin`
- Add `@field_validator('timestamp')` - reject future
- `DiaperEventResponse` inherits from `DiaperEventBase, BabyEventResponseBase`

**health.py:**
- Inherit `HealthEventBase` from `NotesMixin`
- Add `@field_validator('event_date')` - reject future
- `HealthEventResponse` inherits from `HealthEventBase, BabyEventResponseBase`

**growth.py:**
- Inherit `GrowthMeasurementBase` from `NotesMixin`
- Add `@field_validator('measurement_date')` - reject future
- `GrowthMeasurementResponse` inherits from `GrowthMeasurementBase, BabyEventResponseBase`

**baby.py:**
- Inherit `BabyProfileBase` from `NotesMixin`
- Keep existing `date_of_birth` validation
- Response stays unique (has `updated_at`, no `baby_id`)

### Step 3: Update `__init__.py`

Export base classes for extensibility:
```python
from .base import NotesMixin, BabyEventResponseBase, TimedSessionMixin, NOTES_MAX_LENGTH
```

### Step 4: Add Unit Tests

**Framework:** `pytest` (already in dev dependencies)

**Testing patterns:**
- Use `pytest.mark.parametrize` for testing multiple input variations
- Use `unittest.mock` (or `pytest-mock`) for mocking `datetime.utcnow()` in time-based validators
- Test Pydantic schemas directly by instantiating with valid/invalid data
- Assert `pydantic.ValidationError` is raised for invalid inputs

Create `backend/app/tests/test_schemas/`:

**test_base.py** - Test base class validations:
```python
@pytest.mark.parametrize("notes,should_pass", [
    (None, True),
    ("valid note", True),
    ("x" * 2000, True),
    ("x" * 2001, False),
])
def test_notes_mixin_max_length(notes, should_pass): ...
```
- `NotesMixin`: accepts None, valid strings, rejects >2000 chars
- `TimedSessionMixin`: rejects future start_time, rejects end < start
- Mock `datetime.utcnow()` to test future timestamp validation reliably

**test_sleep.py** - Test sleep-specific validations:
- Future `start_time` rejected (mock datetime)
- `end_time < start_time` rejected
- `duration_minutes` computed correctly with parametrized test cases

**test_feeding.py** - Test feeding validations:
- Future `start_time` rejected (mock datetime)
- `end_time < start_time` rejected
- Existing validators still work (breast duration, bottle volume)
- Use parametrize for different feeding types (BREAST, BOTTLE, SOLID)

## Files to Modify

| File | Action |
|------|--------|
| `backend/app/schemas/base.py` | **CREATE** |
| `backend/app/schemas/sleep.py` | Refactor + rename fields |
| `backend/app/schemas/feeding.py` | Refactor |
| `backend/app/schemas/diaper.py` | Refactor |
| `backend/app/schemas/health.py` | Refactor |
| `backend/app/schemas/growth.py` | Refactor |
| `backend/app/schemas/baby.py` | Minor refactor |
| `backend/app/schemas/__init__.py` | Update exports |
| `backend/app/models/sleep.py` | Rename columns `sleep_start`→`start_time`, `sleep_end`→`end_time` |
| `backend/app/api/sleep.py` | Update `order_by` to use new column name |
| `backend/alembic/versions/xxx_rename_sleep_columns.py` | **CREATE** - DB migration |
| `backend/app/tests/test_schemas/test_base.py` | **CREATE** |
| `backend/app/tests/test_schemas/test_sleep.py` | **CREATE** |
| `backend/app/tests/test_schemas/test_feeding.py` | **CREATE** |

## Design Decisions

1. **Standardize to `start_time`/`end_time`** - User chose consistency over backward compatibility
2. **Validators in Update schemas too** - Partial updates should still validate
3. **`max_length=2000` for notes** - Reasonable limit, prevents abuse
4. **DB migration required** - Rename columns in `sleep_sessions` table

## Breaking Changes (Intentional)

**API changes:**
- Sleep schema: `sleep_start` → `start_time`, `sleep_end` → `end_time`

**Validation changes (will reject previously-accepted invalid data):**
- Future timestamps on all event types
- `end_time` before `start_time` on sleep/feeding
- Notes exceeding 2000 characters

## Verification

1. Run `alembic upgrade head` to apply DB migration
2. Run `pytest` from `backend/` directory
3. Run `mypy app/` for type checking
4. Run `black app/ && isort app/` for formatting
5. Start server: `py -m uvicorn app.main:app --reload`
6. Test via http://localhost:8000/docs:
   - Create sleep session with `start_time` (verify renamed field works)
   - Try future `start_time` → expect 422 validation error
   - Try `end_time` before `start_time` → expect 422 validation error
   - Try notes with >2000 chars → expect 422 validation error
