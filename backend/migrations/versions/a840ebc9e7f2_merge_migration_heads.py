"""Merge migration heads

Revision ID: a840ebc9e7f2
Revises: 5a046ac452ec, a4f2d7f9e8b2
Create Date: 2025-05-07 23:09:34.386974

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a840ebc9e7f2'
down_revision: Union[str, None] = ('5a046ac452ec', 'a4f2d7f9e8b2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
