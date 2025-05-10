import json
import uuid
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import UUID, JSONB

# Database connection
conn_str = 'postgresql+psycopg2://postgres:postgres@localhost:5432/dentamind'
engine = create_engine(conn_str)

# Sample evidence data
evidence_data = [
    {
        "id": str(uuid.uuid4()),
        "title": "ADA Clinical Practice Guidelines on Restorative Procedures",
        "authors": "American Dental Association",
        "publication": "Journal of the American Dental Association",
        "publication_date": "2019-06-15",
        "doi": "10.1016/j.adaj.2019.04.005",
        "url": "https://jada.ada.org/article/guidelines/restorative",
        "evidence_type": "guideline",
        "evidence_grade": "A",
        "summary": "Guidelines for restorative procedures including recommendations for composite versus amalgam restorations.",
        "recommendations": json.dumps([
            {"condition": "caries", "recommendation": "Composite restorations are recommended for most carious lesions."}
        ]),
        "specialties": json.dumps(["general_dentistry", "restorative_dentistry"]),
        "conditions": json.dumps(["caries", "fractured_tooth"]),
        "procedures": json.dumps(["D2391", "D2392", "D2393"]),
        "keywords": json.dumps(["restoration", "composite", "caries"]),
        "version": "2019"
    },
    {
        "id": str(uuid.uuid4()),
        "title": "AAE Position Statement on Endodontic Treatment",
        "authors": "American Association of Endodontists",
        "publication": "Journal of Endodontics",
        "publication_date": "2020-03-01",
        "doi": "10.1016/j.joen.2020.01.002",
        "url": "https://www.aae.org/specialty/clinical-resources/treatment-guidelines/",
        "evidence_type": "guideline",
        "evidence_grade": "B",
        "summary": "Position statement on endodontic treatment protocols and best practices.",
        "recommendations": json.dumps([
            {"condition": "pulpitis", "recommendation": "Root canal therapy is indicated for irreversible pulpitis."}
        ]),
        "specialties": json.dumps(["endodontics", "general_dentistry"]),
        "conditions": json.dumps(["pulpitis", "periapical_abscess"]),
        "procedures": json.dumps(["D3310", "D3320", "D3330"]),
        "keywords": json.dumps(["endodontics", "root canal", "pulpitis"]),
        "version": "2020"
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Systematic Review of Composite Restorations for Posterior Teeth",
        "authors": "Johnson K, Smith L, Davis R",
        "publication": "Dental Materials Journal",
        "publication_date": "2021-09-23",
        "doi": "10.1038/dmj.2021.45",
        "url": "https://www.nature.com/articles/dmj202145",
        "evidence_type": "systematic_review",
        "evidence_grade": "A",
        "summary": "Meta-analysis of long-term outcomes for composite restorations in posterior teeth.",
        "recommendations": json.dumps([
            {"condition": "caries", "recommendation": "Composite restorations show excellent long-term durability in posterior teeth."}
        ]),
        "specialties": json.dumps(["restorative_dentistry", "general_dentistry"]),
        "conditions": json.dumps(["caries"]),
        "procedures": json.dumps(["D2391", "D2392", "D2393", "D2394"]),
        "keywords": json.dumps(["composite", "posterior", "restoration", "longevity"]),
        "version": "2021"
    }
]

try:
    # Insert evidence records
    for data in evidence_data:
        # Insert directly with psycopg2 style parameters
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO clinical_evidence (
                    id, title, authors, publication, publication_date, doi, url,
                    evidence_type, evidence_grade, summary, recommendations,
                    specialties, conditions, procedures, keywords, version,
                    created_at
                ) VALUES (
                    %(id)s::uuid, %(title)s, %(authors)s, %(publication)s, %(publication_date)s::timestamp, %(doi)s, %(url)s,
                    %(evidence_type)s::evidence_type, %(evidence_grade)s::evidence_grade, %(summary)s, %(recommendations)s::jsonb,
                    %(specialties)s::jsonb, %(conditions)s::jsonb, %(procedures)s::jsonb, %(keywords)s::jsonb, %(version)s,
                    now()
                )
            """), data)
            
            # Insert finding associations
            for finding in json.loads(data["conditions"]):
                conn.execute(text("""
                    INSERT INTO finding_evidence_association (finding_type, evidence_id, relevance_score)
                    VALUES (%(finding_type)s, %(evidence_id)s::uuid, %(relevance_score)s)
                """), {
                    "finding_type": finding,
                    "evidence_id": data["id"],
                    "relevance_score": 0.85
                })
            
            # Insert treatment associations
            for procedure in json.loads(data["procedures"]):
                conn.execute(text("""
                    INSERT INTO treatment_evidence_association (procedure_code, evidence_id, relevance_score)
                    VALUES (%(procedure_code)s, %(evidence_id)s::uuid, %(relevance_score)s)
                """), {
                    "procedure_code": procedure,
                    "evidence_id": data["id"],
                    "relevance_score": 0.9
                })
    
    print("Clinical evidence data seeded successfully!")
    
    # Verify the data
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM clinical_evidence"))
        evidence_count = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM finding_evidence_association"))
        finding_assoc_count = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM treatment_evidence_association"))
        treatment_assoc_count = result.scalar()
        
        print(f"Inserted {evidence_count} evidence records")
        print(f"Inserted {finding_assoc_count} finding associations")
        print(f"Inserted {treatment_assoc_count} treatment associations")

except Exception as e:
    print(f"Error: {e}") 