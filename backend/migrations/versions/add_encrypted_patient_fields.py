"""Add encrypted fields to patients table

Revision ID: fe9874a5c3b2
Revises: a840ebc9e7f2
Create Date: 2025-05-08 00:10:00.000000
# env: development,staging,production

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fe9874a5c3b2'
down_revision = 'a840ebc9e7f2'
branch_labels = None
depends_on = None


def upgrade():
    # Add encrypted fields to patients table
    op.add_column('patients', sa.Column('first_name_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('last_name_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('date_of_birth_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('ssn_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('address_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('insurance_id_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('emergency_contact_name_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('emergency_contact_phone_encrypted', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('clinical_notes_encrypted', sa.Text(), nullable=True))
    
    # Create index for ssn_encrypted
    op.create_index(op.f('ix_patients_ssn_encrypted'), 'patients', ['ssn_encrypted'], unique=False)


def downgrade():
    # Drop encrypted columns
    op.drop_index(op.f('ix_patients_ssn_encrypted'), table_name='patients')
    op.drop_column('patients', 'clinical_notes_encrypted')
    op.drop_column('patients', 'emergency_contact_phone_encrypted')
    op.drop_column('patients', 'emergency_contact_name_encrypted')
    op.drop_column('patients', 'insurance_id_encrypted')
    op.drop_column('patients', 'address_encrypted')
    op.drop_column('patients', 'ssn_encrypted')
    op.drop_column('patients', 'date_of_birth_encrypted')
    op.drop_column('patients', 'last_name_encrypted')
    op.drop_column('patients', 'first_name_encrypted') 