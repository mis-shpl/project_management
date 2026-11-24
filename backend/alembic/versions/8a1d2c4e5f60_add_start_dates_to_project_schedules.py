"""Add start dates to project schedules

Revision ID: 8a1d2c4e5f60
Revises: d885c748a09b
Create Date: 2026-11-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '8a1d2c4e5f60'
down_revision: Union[str, Sequence[str], None] = 'd885c748a09b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('project_steps', sa.Column('start_date', sa.Date(), nullable=True))
    op.add_column('step_materials', sa.Column('start_date', sa.Date(), nullable=True))
    op.alter_column('step_materials', 'planned_date',
               existing_type=sa.DATE(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('step_materials', 'planned_date',
               existing_type=sa.DATE(),
               nullable=False)
    op.drop_column('step_materials', 'start_date')
    op.drop_column('project_steps', 'start_date')
