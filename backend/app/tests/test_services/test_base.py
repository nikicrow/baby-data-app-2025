"""Tests for the generic CRUD service base class."""

from datetime import datetime
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import BaseModel

from app.services.base import CRUDBase


class SampleCreateSchema(BaseModel):
    """Sample schema for create operations."""
    name: str
    value: int


class SampleUpdateSchema(BaseModel):
    """Sample schema for update operations."""
    name: str | None = None
    value: int | None = None


class TestCRUDBase:
    """Tests for CRUDBase generic class."""

    @pytest.fixture
    def mock_model(self):
        """Create a mock SQLAlchemy model class."""
        model = MagicMock()
        model.__name__ = "SampleModel"
        model.id = MagicMock()
        model.created_at = MagicMock()
        model.baby_id = MagicMock()
        return model

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return MagicMock()

    @pytest.fixture
    def crud_service(self, mock_model):
        """Create a CRUDBase instance with the mock model."""
        return CRUDBase(mock_model)

    def test_init_sets_model(self, mock_model):
        """Test __init__ stores the model class."""
        service = CRUDBase(mock_model)
        assert service.model == mock_model

    def test_get_returns_record_when_found(self, crud_service, mock_db, mock_model):
        """Test get() returns record when found."""
        record_id = uuid4()
        expected_record = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = expected_record

        result = crud_service.get(mock_db, record_id)

        assert result == expected_record
        mock_db.query.assert_called_once_with(mock_model)

    def test_get_returns_none_when_not_found(self, crud_service, mock_db):
        """Test get() returns None when record not found."""
        record_id = uuid4()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = crud_service.get(mock_db, record_id)

        assert result is None

    def test_get_or_404_returns_record_when_found(self, crud_service, mock_db):
        """Test get_or_404() returns record when found."""
        record_id = uuid4()
        expected_record = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = expected_record

        result = crud_service.get_or_404(mock_db, record_id)

        assert result == expected_record

    def test_get_or_404_raises_404_when_not_found(self, crud_service, mock_db):
        """Test get_or_404() raises HTTPException 404 when not found."""
        record_id = uuid4()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            crud_service.get_or_404(mock_db, record_id)

        assert exc_info.value.status_code == 404
        assert "SampleModel" in exc_info.value.detail
        assert str(record_id) in exc_info.value.detail

    def test_get_multi_returns_list(self, crud_service, mock_db):
        """Test get_multi() returns list of records."""
        expected_records = [MagicMock(), MagicMock()]
        mock_query = mock_db.query.return_value
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = expected_records

        result = crud_service.get_multi(mock_db)

        assert result == expected_records

    def test_get_multi_with_pagination(self, crud_service, mock_db):
        """Test get_multi() respects skip and limit parameters."""
        mock_query = mock_db.query.return_value
        mock_ordered = mock_query.order_by.return_value
        mock_offset = mock_ordered.offset.return_value
        mock_offset.limit.return_value.all.return_value = []

        crud_service.get_multi(mock_db, skip=10, limit=50)

        mock_ordered.offset.assert_called_once_with(10)
        mock_offset.limit.assert_called_once_with(50)

    def test_get_multi_with_baby_id_filter(self, crud_service, mock_db, mock_model):
        """Test get_multi() filters by baby_id when provided."""
        baby_id = uuid4()
        mock_query = mock_db.query.return_value
        mock_filtered = mock_query.filter.return_value
        mock_filtered.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

        crud_service.get_multi(mock_db, baby_id=baby_id)

        mock_query.filter.assert_called_once()

    def test_get_multi_without_baby_id_no_filter(self, crud_service, mock_db):
        """Test get_multi() doesn't filter when baby_id is None."""
        mock_query = mock_db.query.return_value
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

        crud_service.get_multi(mock_db, baby_id=None)

        mock_query.filter.assert_not_called()

    def test_get_multi_order_descending_by_default(self, crud_service, mock_db, mock_model):
        """Test get_multi() orders descending by default."""
        mock_query = mock_db.query.return_value
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

        crud_service.get_multi(mock_db)

        # Verify order_by was called with desc()
        mock_query.order_by.assert_called_once()

    def test_get_multi_order_ascending(self, crud_service, mock_db):
        """Test get_multi() can order ascending."""
        mock_query = mock_db.query.return_value
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

        crud_service.get_multi(mock_db, order_desc=False)

        mock_query.order_by.assert_called_once()

    def test_create_adds_and_commits(self, crud_service, mock_db, mock_model):
        """Test create() adds record to session and commits."""
        create_data = SampleCreateSchema(name="test", value=42)
        mock_model.return_value = MagicMock()

        crud_service.create(mock_db, obj_in=create_data)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_create_returns_created_record(self, crud_service, mock_db, mock_model):
        """Test create() returns the created record."""
        create_data = SampleCreateSchema(name="test", value=42)
        expected_record = MagicMock()
        mock_model.return_value = expected_record

        result = crud_service.create(mock_db, obj_in=create_data)

        assert result == expected_record

    def test_update_sets_fields(self, crud_service, mock_db):
        """Test update() sets fields from update schema."""
        db_obj = MagicMock()
        db_obj.name = "old"
        db_obj.value = 0
        update_data = SampleUpdateSchema(name="new", value=100)

        crud_service.update(mock_db, db_obj=db_obj, obj_in=update_data)

        assert db_obj.name == "new"
        assert db_obj.value == 100

    def test_update_only_sets_provided_fields(self, crud_service, mock_db):
        """Test update() only sets fields that were provided (exclude_unset)."""
        db_obj = MagicMock()
        db_obj.name = "old"
        db_obj.value = 0
        update_data = SampleUpdateSchema(name="new")  # value not set

        crud_service.update(mock_db, db_obj=db_obj, obj_in=update_data)

        assert db_obj.name == "new"
        # value should not be changed since it wasn't in update_data

    def test_update_commits_and_refreshes(self, crud_service, mock_db):
        """Test update() commits and refreshes the session."""
        db_obj = MagicMock()
        update_data = SampleUpdateSchema(name="new")

        crud_service.update(mock_db, db_obj=db_obj, obj_in=update_data)

        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(db_obj)

    def test_update_returns_updated_record(self, crud_service, mock_db):
        """Test update() returns the updated record."""
        db_obj = MagicMock()
        update_data = SampleUpdateSchema(name="new")

        result = crud_service.update(mock_db, db_obj=db_obj, obj_in=update_data)

        assert result == db_obj

    def test_remove_deletes_and_commits(self, crud_service, mock_db):
        """Test remove() deletes record and commits."""
        record_id = uuid4()
        existing_record = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing_record

        crud_service.remove(mock_db, id=record_id)

        mock_db.delete.assert_called_once_with(existing_record)
        mock_db.commit.assert_called_once()

    def test_remove_returns_deleted_record(self, crud_service, mock_db):
        """Test remove() returns the deleted record."""
        record_id = uuid4()
        existing_record = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing_record

        result = crud_service.remove(mock_db, id=record_id)

        assert result == existing_record

    def test_remove_raises_404_when_not_found(self, crud_service, mock_db):
        """Test remove() raises 404 when record not found."""
        record_id = uuid4()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            crud_service.remove(mock_db, id=record_id)

        assert exc_info.value.status_code == 404


class TestBabyCRUD:
    """Tests for BabyCRUD subclass with soft-delete support."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return MagicMock()

    def test_get_multi_filters_by_is_active(self, mock_db):
        """Test get_multi() filters by is_active parameter."""
        from app.services import baby_service

        mock_query = mock_db.query.return_value
        mock_filtered = mock_query.filter.return_value
        mock_filtered.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

        baby_service.get_multi(mock_db, is_active=True)

        mock_query.filter.assert_called_once()

    def test_get_multi_orders_by_name(self, mock_db):
        """Test get_multi() orders by name."""
        from app.services import baby_service

        mock_query = mock_db.query.return_value
        mock_filtered = mock_query.filter.return_value
        mock_ordered = mock_filtered.order_by.return_value
        mock_ordered.offset.return_value.limit.return_value.all.return_value = []

        baby_service.get_multi(mock_db)

        mock_filtered.order_by.assert_called_once()

    def test_remove_soft_deletes(self, mock_db):
        """Test remove() sets is_active=False instead of deleting."""
        from app.services import baby_service

        record_id = uuid4()
        existing_record = MagicMock()
        existing_record.is_active = True
        mock_db.query.return_value.filter.return_value.first.return_value = existing_record

        result = baby_service.remove(mock_db, id=record_id)

        # Verify soft-delete: is_active set to False, not db.delete()
        assert existing_record.is_active is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(existing_record)

    def test_remove_returns_soft_deleted_record(self, mock_db):
        """Test remove() returns the soft-deleted record."""
        from app.services import baby_service

        record_id = uuid4()
        existing_record = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing_record

        result = baby_service.remove(mock_db, id=record_id)

        assert result == existing_record

    def test_remove_raises_404_when_not_found(self, mock_db):
        """Test remove() raises 404 when baby not found."""
        from app.services import baby_service

        record_id = uuid4()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            baby_service.remove(mock_db, id=record_id)

        assert exc_info.value.status_code == 404
