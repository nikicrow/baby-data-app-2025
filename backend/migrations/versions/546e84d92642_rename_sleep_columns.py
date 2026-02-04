"""rename_sleep_columns

Revision ID: 546e84d92642
Revises: 749d47acf640
Create Date: 2026-02-02 20:55:10.684964

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '546e84d92642'
down_revision = '749d47acf640'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename columns (preserves existing data)
    op.alter_column('sleep_sessions', 'sleep_start', new_column_name='start_time')
    op.alter_column('sleep_sessions', 'sleep_end', new_column_name='end_time')


def downgrade() -> None:
    # Revert column renames
    op.alter_column('sleep_sessions', 'start_time', new_column_name='sleep_start')
    op.alter_column('sleep_sessions', 'end_time', new_column_name='sleep_end')