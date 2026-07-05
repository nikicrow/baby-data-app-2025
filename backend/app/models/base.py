"""Base model classes for SQLAlchemy ORM models.

Provides abstract base classes to eliminate duplication across models:
- BaseModel: Common fields (id, created_at, updated_at) for all models
- BabyEventModel: Extends BaseModel with baby_id for event models
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class BaseModel(Base):
    """Abstract base for all models with common fields.

    Provides:
    - id: UUID primary key
    - created_at: Timestamp when record was created
    - updated_at: Timestamp when record was last modified (auto-updates)
    - source: Where the row came from ('app' or 'ingested')
    """

    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    # 'app' = created via the API; 'ingested' = loaded by the dbt-baby-data
    # pipeline, which deletes and reloads only its own rows on each ingest.
    source = Column(String(20), nullable=False, default="app", server_default="app")


class BabyEventModel(BaseModel):
    """Abstract base for all baby-related event models.

    Extends BaseModel with baby_id relationship pattern.

    Note: Subclasses must define:
        baby_id = Column(UUID(as_uuid=True), ForeignKey("baby_profiles.id"), nullable=False)
        baby = relationship("BabyProfile", back_populates="<event_type>")

    The baby_id column and relationship must be defined in subclasses to allow
    unique back_populates values for each event type.
    """

    __abstract__ = True
