-- Insert sample evidence data
INSERT INTO clinical_evidence (
    id, title, authors, publication, publication_date, doi, url,
    evidence_type, evidence_grade, summary, recommendations,
    specialties, conditions, procedures, keywords, version,
    created_at
) VALUES (
    '12345678-1234-5678-1234-567812345678'::uuid, 
    'ADA Clinical Practice Guidelines on Restorative Procedures',
    'American Dental Association',
    'Journal of the American Dental Association',
    '2019-06-15'::timestamp,
    '10.1016/j.adaj.2019.04.005',
    'https://jada.ada.org/article/guidelines/restorative',
    'guideline'::evidence_type,
    'A'::evidence_grade,
    'Guidelines for restorative procedures including recommendations for composite versus amalgam restorations.',
    '[{"condition": "caries", "recommendation": "Composite restorations are recommended for most carious lesions."}]'::jsonb,
    '["general_dentistry", "restorative_dentistry"]'::jsonb,
    '["caries", "fractured_tooth"]'::jsonb,
    '["D2391", "D2392", "D2393"]'::jsonb,
    '["restoration", "composite", "caries"]'::jsonb,
    '2019',
    now()
);

INSERT INTO clinical_evidence (
    id, title, authors, publication, publication_date, doi, url,
    evidence_type, evidence_grade, summary, recommendations,
    specialties, conditions, procedures, keywords, version,
    created_at
) VALUES (
    '23456789-2345-6789-2345-678923456789'::uuid, 
    'AAE Position Statement on Endodontic Treatment',
    'American Association of Endodontists',
    'Journal of Endodontics',
    '2020-03-01'::timestamp,
    '10.1016/j.joen.2020.01.002',
    'https://www.aae.org/specialty/clinical-resources/treatment-guidelines/',
    'guideline'::evidence_type,
    'B'::evidence_grade,
    'Position statement on endodontic treatment protocols and best practices.',
    '[{"condition": "pulpitis", "recommendation": "Root canal therapy is indicated for irreversible pulpitis."}]'::jsonb,
    '["endodontics", "general_dentistry"]'::jsonb,
    '["pulpitis", "periapical_abscess"]'::jsonb,
    '["D3310", "D3320", "D3330"]'::jsonb,
    '["endodontics", "root canal", "pulpitis"]'::jsonb,
    '2020',
    now()
);

INSERT INTO clinical_evidence (
    id, title, authors, publication, publication_date, doi, url,
    evidence_type, evidence_grade, summary, recommendations,
    specialties, conditions, procedures, keywords, version,
    created_at
) VALUES (
    '34567890-3456-7890-3456-789034567890'::uuid, 
    'Systematic Review of Composite Restorations for Posterior Teeth',
    'Johnson K, Smith L, Davis R',
    'Dental Materials Journal',
    '2021-09-23'::timestamp,
    '10.1038/dmj.2021.45',
    'https://www.nature.com/articles/dmj202145',
    'systematic_review'::evidence_type,
    'A'::evidence_grade,
    'Meta-analysis of long-term outcomes for composite restorations in posterior teeth.',
    '[{"condition": "caries", "recommendation": "Composite restorations show excellent long-term durability in posterior teeth."}]'::jsonb,
    '["restorative_dentistry", "general_dentistry"]'::jsonb,
    '["caries"]'::jsonb,
    '["D2391", "D2392", "D2393", "D2394"]'::jsonb,
    '["composite", "posterior", "restoration", "longevity"]'::jsonb,
    '2021',
    now()
);

-- Insert finding associations
INSERT INTO finding_evidence_association (finding_type, evidence_id, relevance_score)
VALUES 
('caries', '12345678-1234-5678-1234-567812345678'::uuid, 0.9),
('fractured_tooth', '12345678-1234-5678-1234-567812345678'::uuid, 0.8),
('pulpitis', '23456789-2345-6789-2345-678923456789'::uuid, 0.95),
('periapical_abscess', '23456789-2345-6789-2345-678923456789'::uuid, 0.9),
('caries', '34567890-3456-7890-3456-789034567890'::uuid, 0.85);

-- Insert treatment associations
INSERT INTO treatment_evidence_association (procedure_code, evidence_id, relevance_score)
VALUES 
('D2391', '12345678-1234-5678-1234-567812345678'::uuid, 0.9),
('D2392', '12345678-1234-5678-1234-567812345678'::uuid, 0.9),
('D2393', '12345678-1234-5678-1234-567812345678'::uuid, 0.9),
('D3310', '23456789-2345-6789-2345-678923456789'::uuid, 0.95),
('D3320', '23456789-2345-6789-2345-678923456789'::uuid, 0.95),
('D3330', '23456789-2345-6789-2345-678923456789'::uuid, 0.95),
('D2391', '34567890-3456-7890-3456-789034567890'::uuid, 0.9),
('D2392', '34567890-3456-7890-3456-789034567890'::uuid, 0.9),
('D2393', '34567890-3456-7890-3456-789034567890'::uuid, 0.9),
('D2394', '34567890-3456-7890-3456-789034567890'::uuid, 0.9); 