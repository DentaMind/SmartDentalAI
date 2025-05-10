#!/usr/bin/env python3
"""
Reset and reseed clinical evidence tables
This script will:
1. Drop all clinical evidence related tables
2. Recreate tables with proper schema
3. Seed with sample data for testing
"""

import os
import sys
import uuid
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to Python path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not installed. Environment variables should be set manually.")

# Database connection
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "dentamind")

conn_str = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def reset_tables(engine):
    """Drop and recreate all clinical evidence related tables"""
    print("Dropping existing clinical evidence tables...")
    
    # Drop association tables first (because of foreign keys)
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS finding_evidence_association"))
        conn.execute(text("DROP TABLE IF EXISTS treatment_evidence_association"))
        conn.execute(text("DROP TABLE IF EXISTS clinical_evidence"))
    
    print("Dropping enum types...")
    with engine.begin() as conn:
        # Drop enum types (need to use CASCADE in case they're in use)
        conn.execute(text("DROP TYPE IF EXISTS evidence_grade CASCADE"))
        conn.execute(text("DROP TYPE IF EXISTS evidence_type CASCADE"))
    
    print("Creating enum types...")
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TYPE evidence_type AS ENUM (
                'guideline', 
                'systematic_review', 
                'clinical_trial', 
                'cohort_study', 
                'case_control', 
                'case_series', 
                'expert_opinion'
            )
        """))
        
        conn.execute(text("""
            CREATE TYPE evidence_grade AS ENUM (
                'A', 
                'B', 
                'C', 
                'D'
            )
        """))
    
    print("Creating clinical evidence tables...")
    with engine.begin() as conn:
        # Create clinical evidence table
        conn.execute(text("""
            CREATE TABLE clinical_evidence (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title TEXT NOT NULL,
                authors TEXT,
                publication TEXT,
                publication_date TIMESTAMP,
                doi TEXT,
                url TEXT,
                evidence_type evidence_type NOT NULL,
                evidence_grade evidence_grade NOT NULL,
                summary TEXT,
                recommendations JSONB,
                specialties JSONB,
                conditions JSONB,
                procedures JSONB,
                keywords JSONB,
                version TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # Create index on DOI
        conn.execute(text("CREATE INDEX ix_clinical_evidence_doi ON clinical_evidence (doi)"))
        
        # Create finding-evidence association table
        conn.execute(text("""
            CREATE TABLE finding_evidence_association (
                finding_type TEXT NOT NULL,
                evidence_id UUID NOT NULL REFERENCES clinical_evidence(id) ON DELETE CASCADE,
                relevance_score FLOAT
            )
        """))
        
        # Create treatment-evidence association table
        conn.execute(text("""
            CREATE TABLE treatment_evidence_association (
                procedure_code TEXT NOT NULL,
                evidence_id UUID NOT NULL REFERENCES clinical_evidence(id) ON DELETE CASCADE,
                relevance_score FLOAT
            )
        """))
        
        # Create indexes for efficient querying
        conn.execute(text("CREATE INDEX ix_finding_evidence_finding_type ON finding_evidence_association (finding_type)"))
        conn.execute(text("CREATE INDEX ix_treatment_evidence_procedure_code ON treatment_evidence_association (procedure_code)"))
        conn.execute(text("CREATE UNIQUE INDEX ix_finding_evidence_compound ON finding_evidence_association (finding_type, evidence_id)"))
        conn.execute(text("CREATE UNIQUE INDEX ix_treatment_evidence_compound ON treatment_evidence_association (procedure_code, evidence_id)"))
    
    print("Tables created successfully.")

def seed_sample_data(engine):
    """Seed tables with sample data for testing"""
    print("Seeding sample data...")
    
    # Sample evidence data
    evidence_data = [
        {
            "id": "12345678-1234-5678-1234-567812345678",
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
            "id": "23456789-2345-6789-2345-678923456789",
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
            "id": "34567890-3456-7890-3456-789034567890",
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
        },
        {
            "id": "45678901-4567-8901-4567-890145678901",
            "title": "Randomized Clinical Trial of MTA vs. Calcium Hydroxide for Pulp Capping",
            "authors": "Smith J, Garcia P, Williams R",
            "publication": "Journal of Endodontic Research",
            "publication_date": "2022-11-15",
            "doi": "10.1016/j.jendores.2022.08.012",
            "url": "https://example.org/pulp-capping-trial",
            "evidence_type": "clinical_trial",
            "evidence_grade": "B",
            "summary": "Comparison of MTA and calcium hydroxide for direct pulp capping, showing superior outcomes with MTA.",
            "recommendations": json.dumps([
                {"condition": "pulp_exposure", "recommendation": "MTA is recommended over calcium hydroxide for direct pulp capping."}
            ]),
            "specialties": json.dumps(["endodontics", "general_dentistry"]),
            "conditions": json.dumps(["pulp_exposure", "reversible_pulpitis"]),
            "procedures": json.dumps(["D3110"]),
            "keywords": json.dumps(["pulp capping", "MTA", "calcium hydroxide", "vital pulp therapy"]),
            "version": "2022"
        },
        {
            "id": "56789012-5678-9012-5678-901256789012",
            "title": "AAPD Guidelines for Pediatric Dental Sealants",
            "authors": "American Academy of Pediatric Dentistry",
            "publication": "Pediatric Dentistry Journal",
            "publication_date": "2023-01-30",
            "doi": "10.1016/j.pediadent.2023.01.005",
            "url": "https://www.aapd.org/guidelines/sealants",
            "evidence_type": "guideline",
            "evidence_grade": "A",
            "summary": "Evidence-based guidelines for the use of dental sealants in pediatric patients.",
            "recommendations": json.dumps([
                {"condition": "high_caries_risk", "recommendation": "Resin-based sealants are recommended for all permanent molars in children with high caries risk."}
            ]),
            "specialties": json.dumps(["pediatric_dentistry", "general_dentistry"]),
            "conditions": json.dumps(["high_caries_risk", "deep_fissures"]),
            "procedures": json.dumps(["D1351"]),
            "keywords": json.dumps(["sealants", "pediatric", "prevention", "caries risk"]),
            "version": "2023"
        }
    ]
    
    # Finding-evidence associations
    finding_assocs = [
        {"finding_type": "caries", "evidence_id": "12345678-1234-5678-1234-567812345678", "relevance_score": 0.95},
        {"finding_type": "fractured_tooth", "evidence_id": "12345678-1234-5678-1234-567812345678", "relevance_score": 0.8},
        {"finding_type": "pulpitis", "evidence_id": "23456789-2345-6789-2345-678923456789", "relevance_score": 0.9},
        {"finding_type": "periapical_abscess", "evidence_id": "23456789-2345-6789-2345-678923456789", "relevance_score": 0.95},
        {"finding_type": "caries", "evidence_id": "34567890-3456-7890-3456-789034567890", "relevance_score": 0.85},
        {"finding_type": "pulp_exposure", "evidence_id": "45678901-4567-8901-4567-890145678901", "relevance_score": 0.92},
        {"finding_type": "reversible_pulpitis", "evidence_id": "45678901-4567-8901-4567-890145678901", "relevance_score": 0.85},
        {"finding_type": "high_caries_risk", "evidence_id": "56789012-5678-9012-5678-901256789012", "relevance_score": 0.95},
        {"finding_type": "deep_fissures", "evidence_id": "56789012-5678-9012-5678-901256789012", "relevance_score": 0.9}
    ]
    
    # Treatment-evidence associations
    treatment_assocs = [
        {"procedure_code": "D2391", "evidence_id": "12345678-1234-5678-1234-567812345678", "relevance_score": 0.9},
        {"procedure_code": "D2392", "evidence_id": "12345678-1234-5678-1234-567812345678", "relevance_score": 0.9},
        {"procedure_code": "D2393", "evidence_id": "12345678-1234-5678-1234-567812345678", "relevance_score": 0.9},
        {"procedure_code": "D3310", "evidence_id": "23456789-2345-6789-2345-678923456789", "relevance_score": 0.95},
        {"procedure_code": "D3320", "evidence_id": "23456789-2345-6789-2345-678923456789", "relevance_score": 0.95},
        {"procedure_code": "D3330", "evidence_id": "23456789-2345-6789-2345-678923456789", "relevance_score": 0.95},
        {"procedure_code": "D2391", "evidence_id": "34567890-3456-7890-3456-789034567890", "relevance_score": 0.9},
        {"procedure_code": "D2392", "evidence_id": "34567890-3456-7890-3456-789034567890", "relevance_score": 0.9},
        {"procedure_code": "D2393", "evidence_id": "34567890-3456-7890-3456-789034567890", "relevance_score": 0.9},
        {"procedure_code": "D2394", "evidence_id": "34567890-3456-7890-3456-789034567890", "relevance_score": 0.9},
        {"procedure_code": "D3110", "evidence_id": "45678901-4567-8901-4567-890145678901", "relevance_score": 0.95},
        {"procedure_code": "D1351", "evidence_id": "56789012-5678-9012-5678-901256789012", "relevance_score": 0.95}
    ]
    
    try:
        with engine.begin() as conn:
            # Insert evidence records
            for data in evidence_data:
                # Format publication date properly
                if "publication_date" in data and data["publication_date"]:
                    data["publication_date"] = datetime.strptime(data["publication_date"], "%Y-%m-%d")
                
                conn.execute(text("""
                    INSERT INTO clinical_evidence (
                        id, title, authors, publication, publication_date, doi, url,
                        evidence_type, evidence_grade, summary, recommendations,
                        specialties, conditions, procedures, keywords, version,
                        created_at
                    ) VALUES (
                        :id::uuid, :title, :authors, :publication, :publication_date::timestamp, :doi, :url,
                        :evidence_type::evidence_type, :evidence_grade::evidence_grade, :summary, :recommendations::jsonb,
                        :specialties::jsonb, :conditions::jsonb, :procedures::jsonb, :keywords::jsonb, :version,
                        now()
                    )
                """), data)
            
            # Insert finding associations
            for assoc in finding_assocs:
                conn.execute(text("""
                    INSERT INTO finding_evidence_association (finding_type, evidence_id, relevance_score)
                    VALUES (:finding_type, :evidence_id::uuid, :relevance_score)
                """), assoc)
            
            # Insert treatment associations
            for assoc in treatment_assocs:
                conn.execute(text("""
                    INSERT INTO treatment_evidence_association (procedure_code, evidence_id, relevance_score)
                    VALUES (:procedure_code, :evidence_id::uuid, :relevance_score)
                """), assoc)
        
        print("Sample data seeded successfully.")
        
        # Verify the data
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM clinical_evidence"))
            evidence_count = result.scalar()
            
            result = conn.execute(text("SELECT COUNT(*) FROM finding_evidence_association"))
            finding_count = result.scalar()
            
            result = conn.execute(text("SELECT COUNT(*) FROM treatment_evidence_association"))
            treatment_count = result.scalar()
            
            print(f"Inserted {evidence_count} evidence records")
            print(f"Inserted {finding_count} finding associations")
            print(f"Inserted {treatment_count} treatment associations")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        raise

def main():
    """Main function to reset and reseed database"""
    print(f"Connecting to database: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    
    try:
        engine = create_engine(conn_str)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            if result.scalar() != 1:
                raise Exception("Database connection test failed")
            
            # Verify extension
            result = conn.execute(text("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')"))
            if not result.scalar():
                print("Creating uuid-ossp extension...")
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""))
        
        # Process
        reset_tables(engine)
        seed_sample_data(engine)
        
        print("Clinical evidence database reset and reseeded successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 