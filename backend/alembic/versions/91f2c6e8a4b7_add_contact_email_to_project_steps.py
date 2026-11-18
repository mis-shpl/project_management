"""Add User Clearance contact email to project steps.

Revision ID: 91f2c6e8a4b7
Revises: 4f63a90d2e17
Create Date: 2026-11-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "91f2c6e8a4b7"
down_revision: Union[str, Sequence[str], None] = "4f63a90d2e17"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "project_steps",
        sa.Column("contact_email", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("project_steps", "contact_email")
