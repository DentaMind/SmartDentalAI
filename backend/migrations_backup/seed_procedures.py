"""seed procedures

Revision ID: a3d2e1f0c9b8
Revises: b4a3d2e1f0c9
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'a3d2e1f0c9b8'
down_revision = 'b4a3d2e1f0c9'
branch_labels = None
depends_on = None

def upgrade():
    # Common dental procedures with their default durations
    procedures = [
        {
            'id': str(uuid.uuid4()),
            'code': 'D1110',
            'name': 'Adult Prophylaxis',
            'description': 'Adult dental cleaning',
            'category': 'preventive',
            'default_duration_minutes': 60
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D2391',
            'name': 'Resin Composite - One Surface',
            'description': 'One surface composite filling',
            'category': 'restorative',
            'default_duration_minutes': 45
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D2392',
            'name': 'Resin Composite - Two Surfaces',
            'description': 'Two surface composite filling',
            'category': 'restorative',
            'default_duration_minutes': 60
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D2393',
            'name': 'Resin Composite - Three Surfaces',
            'description': 'Three surface composite filling',
            'category': 'restorative',
            'default_duration_minutes': 75
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D3310',
            'name': 'Endodontic Therapy - Anterior',
            'description': 'Root canal treatment on anterior tooth',
            'category': 'endodontic',
            'default_duration_minutes': 90
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D3320',
            'name': 'Endodontic Therapy - Bicuspid',
            'description': 'Root canal treatment on bicuspid',
            'category': 'endodontic',
            'default_duration_minutes': 120
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D3330',
            'name': 'Endodontic Therapy - Molar',
            'description': 'Root canal treatment on molar',
            'category': 'endodontic',
            'default_duration_minutes': 150
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D4341',
            'name': 'Periodontal Scaling and Root Planing - Quadrant',
            'description': 'Deep cleaning of one quadrant',
            'category': 'periodontal',
            'default_duration_minutes': 90
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D2740',
            'name': 'Crown - Porcelain/Ceramic',
            'description': 'Porcelain/ceramic crown',
            'category': 'prosthodontic',
            'default_duration_minutes': 120
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D7140',
            'name': 'Extraction - Simple',
            'description': 'Simple tooth extraction',
            'category': 'surgical',
            'default_duration_minutes': 30
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D7210',
            'name': 'Extraction - Surgical',
            'description': 'Surgical tooth extraction',
            'category': 'surgical',
            'default_duration_minutes': 60
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'D8080',
            'name': 'Comprehensive Orthodontic Treatment',
            'description': 'Full orthodontic treatment',
            'category': 'orthodontic',
            'default_duration_minutes': 30
        }
    ]
    
    # Insert procedures
    for procedure in procedures:
        op.execute(f"""
            INSERT INTO procedures (id, code, name, description, category, default_duration_minutes)
            VALUES (
                '{procedure['id']}',
                '{procedure['code']}',
                '{procedure['name']}',
                '{procedure['description']}',
                '{procedure['category']}',
                {procedure['default_duration_minutes']}
            )
        """)

def downgrade():
    # Delete all seeded procedures
    op.execute("DELETE FROM procedures") 