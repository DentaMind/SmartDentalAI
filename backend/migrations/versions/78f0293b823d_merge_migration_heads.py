"""Merge migration heads

Revision ID: 78f0293b823d
Revises: a24f8cbd3b7c, bf793ae1d5c1, c7e9f1a02d53
Create Date: 2025-05-07 22:13:17.365368

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78f0293b823d'
down_revision: Union[str, None] = ('a24f8cbd3b7c', 'bf793ae1d5c1', 'c7e9f1a02d53')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
