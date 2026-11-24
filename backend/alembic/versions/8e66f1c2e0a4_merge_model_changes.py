"""merge model changes

Revision ID: 8e66f1c2e0a4
Revises: 6b2e4f1a8c30, 91f2c6e8a4b7
Create Date: 2026-11-21 13:06:17.021396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e66f1c2e0a4'
down_revision: Union[str, Sequence[str], None] = ('6b2e4f1a8c30', '91f2c6e8a4b7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
