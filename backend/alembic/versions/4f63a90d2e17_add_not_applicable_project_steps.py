"""Add not-applicable status to project steps.

Revision ID: 4f63a90d2e17
Revises: d885c748a09b
Create Date: 2026-11-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4f63a90d2e17"
down_revision: Union[str, Sequence[str], None] = "d885c748a09b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "project_steps",
        sa.Column("is_na", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column(
        "project_steps",
        "planned_date",
        existing_type=sa.Date(),
        nullable=True,
    )
    op.alter_column(
        "step_revision_log",
        "old_planned_date",
        existing_type=sa.Date(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "step_revision_log",
        "old_planned_date",
        existing_type=sa.Date(),
        nullable=False,
    )
    op.alter_column(
        "project_steps",
        "planned_date",
        existing_type=sa.Date(),
        nullable=False,
    )
    op.drop_column("project_steps", "is_na")
