from sqlalchemy import text, create_engine

# Create connection to the database
conn_str = 'postgresql+psycopg2://postgres:postgres@localhost:5432/dentamind'
engine = create_engine(conn_str)

# List of tables to check
tables = [
    'clinical_evidence',
    'finding_evidence_association',
    'treatment_evidence_association'
]

# Check if each table exists
with engine.connect() as conn:
    for table in tables:
        query = text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")
        result = conn.execute(query)
        exists = result.scalar()
        print(f"Table '{table}' exists: {exists}")

# Check if enums exist
with engine.connect() as conn:
    query = text("""
    SELECT EXISTS (
        SELECT FROM pg_type
        WHERE typname = 'evidence_type'
    )
    """)
    result = conn.execute(query)
    exists = result.scalar()
    print(f"Enum 'evidence_type' exists: {exists}")
    
    query = text("""
    SELECT EXISTS (
        SELECT FROM pg_type
        WHERE typname = 'evidence_grade'
    )
    """)
    result = conn.execute(query)
    exists = result.scalar()
    print(f"Enum 'evidence_grade' exists: {exists}") 