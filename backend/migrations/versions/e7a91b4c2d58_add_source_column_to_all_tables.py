"""add_source_column_to_all_tables

Revision ID: e7a91b4c2d58
Revises: c5eb3f5c55fe
Create Date: 2026-07-05

Adds a source column ('app' | 'ingested') to every table so the
dbt-baby-data pipeline can delete and reload only its own rows,
leaving app-created data untouched.

Backfills baby_profiles and the three pipeline-fed event tables to
'ingested' — every existing row in them came from the last ingest.
growth_measurements and health_events keep the 'app' default since
the pipeline has no data source for them.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e7a91b4c2d58'
down_revision = 'c5eb3f5c55fe'
branch_labels = None
depends_on = None

ALL_TABLES = [
    'baby_profiles',
    'diaper_events',
    'feeding_sessions',
    'sleep_sessions',
    'growth_measurements',
    'health_events',
]

PIPELINE_TABLES = [
    'baby_profiles',
    'diaper_events',
    'feeding_sessions',
    'sleep_sessions',
]


def upgrade() -> None:
    for table_name in ALL_TABLES:
        op.add_column(
            table_name,
            sa.Column('source', sa.String(20), nullable=False, server_default='app')
        )

    for table_name in PIPELINE_TABLES:
        op.execute(f"UPDATE {table_name} SET source = 'ingested'")


def downgrade() -> None:
    for table_name in ALL_TABLES:
        op.drop_column(table_name, 'source')
