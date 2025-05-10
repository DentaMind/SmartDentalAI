-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE evidence_type AS ENUM (
    'guideline', 
    'systematic_review', 
    'clinical_trial', 
    'cohort_study', 
    'case_control', 
    'case_series', 
    'expert_opinion'
);

CREATE TYPE evidence_grade AS ENUM (
    'A', 
    'B', 
    'C', 
    'D'
);

-- Create clinical evidence table
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
);

-- Create index on DOI
CREATE INDEX ix_clinical_evidence_doi ON clinical_evidence (doi);

-- Create finding-evidence association table
CREATE TABLE finding_evidence_association (
    finding_type TEXT NOT NULL,
    evidence_id UUID NOT NULL REFERENCES clinical_evidence(id),
    relevance_score FLOAT
);

-- Create treatment-evidence association table
CREATE TABLE treatment_evidence_association (
    procedure_code TEXT NOT NULL,
    evidence_id UUID NOT NULL REFERENCES clinical_evidence(id),
    relevance_score FLOAT
);

-- Create indexes for finding_type and procedure_code
CREATE INDEX ix_finding_evidence_finding_type ON finding_evidence_association (finding_type);
CREATE INDEX ix_treatment_evidence_procedure_code ON treatment_evidence_association (procedure_code);

-- Create unique compound indexes
CREATE UNIQUE INDEX ix_finding_evidence_compound ON finding_evidence_association (finding_type, evidence_id);
CREATE UNIQUE INDEX ix_treatment_evidence_compound ON treatment_evidence_association (procedure_code, evidence_id); 