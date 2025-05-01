"""consent fields

Revision ID: 2e1f0c9b8a7d
Revises: 3d2e1f0c9b8a
Create Date: 2024-03-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2e1f0c9b8a7d'
down_revision: Union[str, None] = '3d2e1f0c9b8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add consent-related fields to treatment_plans table
    op.add_column('treatment_plans',
        sa.Column('consent_signed_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column('treatment_plans',
        sa.Column('consent_signed_by', sa.String(length=255), nullable=True)
    )
    op.add_column('treatment_plans',
        sa.Column('consent_signature_data', sa.Text(), nullable=True)
    )
    op.add_column('treatment_plans',
        sa.Column('consent_ip_address', sa.String(length=45), nullable=True)
    )
    
    # Add a new status for consent
    op.execute("ALTER TYPE treatmentstatus ADD VALUE IF NOT EXISTS 'CONSENT_SIGNED' AFTER 'PLANNED'")

def downgrade() -> None:
    # Remove consent-related fields from treatment_plans table
    op.drop_column('treatment_plans', 'consent_signed_at')
    op.drop_column('treatment_plans', 'consent_signed_by')
    op.drop_column('treatment_plans', 'consent_signature_data')
    op.drop_column('treatment_plans', 'consent_ip_address')
    
    # Note: We cannot remove enum values in PostgreSQL, so we don't handle that in downgrade 