"""seed office settings

Revision ID: f6c5b4a3d2e1
Revises: e7f6c5b4a3d2
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import json
from datetime import datetime
import uuid
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f6c5b4a3d2e1'
down_revision = 'e7f6c5b4a3d2'
branch_labels = None
depends_on = None

def upgrade():
    # Default business hours
    business_hours = {
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"},
        "wednesday": {"start": "09:00", "end": "17:00"},
        "thursday": {"start": "09:00", "end": "17:00"},
        "friday": {"start": "09:00", "end": "15:00"},
        "saturday": {"start": "09:00", "end": "13:00"},
        "sunday": None
    }

    # Default settings metadata
    settings_metadata = {
        "version": "1.0",
        "last_updated_by": "system",
        "features": {
            "online_scheduling": True,
            "patient_portal": True,
            "automated_reminders": True
        }
    }

    # Insert default office settings
    op.execute(f"""
        INSERT INTO office_settings (
            id,
            office_name,
            office_email,
            office_phone,
            address,
            city,
            state,
            zip_code,
            timezone,
            business_hours,
            settings_metadata,
            created_at,
            updated_at
        ) VALUES (
            '{str(uuid.uuid4())}',
            'Demo Dental Clinic',
            'info@demodental.com',
            '555-123-4567',
            '123 Smile Street',
            'Toothville',
            'NY',
            '10001',
            'America/New_York',
            '{json.dumps(business_hours)}',
            '{json.dumps(settings_metadata)}',
            '{datetime.utcnow().isoformat()}',
            '{datetime.utcnow().isoformat()}'
        )
    """)

def downgrade():
    # Remove the seeded office settings
    op.execute("DELETE FROM office_settings WHERE office_name = 'Demo Dental Clinic'") 