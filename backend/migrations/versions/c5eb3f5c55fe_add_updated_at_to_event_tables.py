"""add_updated_at_to_event_tables

Revision ID: c5eb3f5c55fe
Revises: 546e84d92642
Create Date: 2026-02-02

Adds updated_at column to all event tables:
- diaper_events
- feeding_sessions
- sleep_sessions
- growth_measurements
- health_events

Backfills existing rows with created_at value.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c5eb3f5c55fe'
down_revision = '546e84d92642'
branch_labels = None
depends_on = None

# Tables that need the updated_at column
EVENT_TABLES = [
    'diaper_events',
    'feeding_sessions',
    'sleep_sessions',
    'growth_measurements',
    'health_events',
]


def upgrade() -> None:
    for table_name in EVENT_TABLES:
        # Add updated_at column, initially nullable
        op.add_column(
            table_name,
            sa.Column('updated_at', sa.DateTime(), nullable=True)
        )

        # Backfill with created_at value
        op.execute(f"UPDATE {table_name} SET updated_at = created_at WHERE updated_at IS NULL")

        # Make non-nullable after backfill
        op.alter_column(table_name, 'updated_at', nullable=False)


def downgrade() -> None:
    for table_name in EVENT_TABLES:
        op.drop_column(table_name, 'updated_at')
