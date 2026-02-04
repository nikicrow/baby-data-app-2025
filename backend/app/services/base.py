"""Generic CRUD service base class for SQLAlchemy models."""

from typing import Generic, TypeVar, Type, Optional, List, Any
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=PydanticBaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=PydanticBaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Generic CRUD operations for SQLAlchemy models.

    Provides standard Create, Read, Update, Delete operations with:
    - Automatic 404 handling
    - Pagination support
    - Optional baby_id filtering for event models
    - Configurable ordering
    """

    def __init__(self, model: Type[ModelType]):
        """Initialize with SQLAlchemy model class.

        Args:
            model: The SQLAlchemy model class to operate on.
        """
        self.model = model

    def get(self, db: Session, id: UUID) -> Optional[ModelType]:
        """Get a single record by ID.

        Args:
            db: Database session.
            id: Record UUID.

        Returns:
            The record if found, None otherwise.
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_or_404(self, db: Session, id: UUID) -> ModelType:
        """Get a single record by ID or raise 404.

        Args:
            db: Database session.
            id: Record UUID.

        Returns:
            The record if found.

        Raises:
            HTTPException: 404 if record not found.
        """
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
        order_by_field: str = "created_at",
        order_desc: bool = True
    ) -> List[ModelType]:
        """Get multiple records with optional filtering and pagination.

        Args:
            db: Database session.
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.
            baby_id: Optional filter by baby_id (for event models).
            order_by_field: Field name to order by.
            order_desc: If True, order descending; otherwise ascending.

        Returns:
            List of records matching the criteria.
        """
        query = db.query(self.model)

        if baby_id is not None and hasattr(self.model, "baby_id"):
            query = query.filter(self.model.baby_id == baby_id)

        order_col = getattr(self.model, order_by_field, self.model.created_at)
        if order_desc:
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record.

        Args:
            db: Database session.
            obj_in: Pydantic schema with creation data.

        Returns:
            The created record.
        """
        db_obj = self.model(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update an existing record.

        Args:
            db: Database session.
            db_obj: The existing database object to update.
            obj_in: Pydantic schema with update data (only set fields are applied).

        Returns:
            The updated record.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: UUID) -> ModelType:
        """Delete a record by ID.

        Args:
            db: Database session.
            id: Record UUID.

        Returns:
            The deleted record.

        Raises:
            HTTPException: 404 if record not found.
        """
        obj = self.get_or_404(db, id)
        db.delete(obj)
        db.commit()
        return obj
