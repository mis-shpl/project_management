"""Add project categories field

Revision ID: 6b2e4f1a8c30
Revises: 8a1d2c4e5f60
Create Date: 2026-11-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6b2e4f1a8c30'
down_revision: Union[str, Sequence[str], None] = '8a1d2c4e5f60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('categories', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'categories')
