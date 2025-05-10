# Clinical Evidence System

The DentaMind Clinical Evidence System provides a structured approach to incorporating evidence-based dentistry into the platform's treatment recommendations. This system maintains a database of clinical evidence citations and associates them with specific findings and treatments, enabling transparent, evidence-based decision support.

## Features

- **Evidence Database**: Structured repository of clinical evidence from various sources
- **Graded Citations**: Evidence quality grading based on standard methodologies (GRADE)
- **Finding & Treatment Associations**: Links evidence to specific findings and treatment procedures
- **Evidence Integration**: Incorporates evidence into AI treatment suggestions
- **Specialty Filtering**: Retrieves evidence relevant to specific dental specialties

## Evidence Structure

The system organizes evidence with the following key attributes:

- **Bibliographic Information**: Title, authors, publication, date, DOI
- **Classification**: Evidence type (guidelines, systematic reviews, trials, etc.)
- **Quality Grading**: Assessment of evidence strength (grades A-D)
- **Clinical Content**: Recommendations, specialties, conditions, procedures
- **Associations**: Relevance to specific findings and treatments

## Evidence Types

Evidence is categorized into the following types:

1. **Clinical Guidelines** (highest tier)
2. **Systematic Reviews & Meta-Analyses**
3. **Randomized Controlled Trials**
4. **Cohort Studies**
5. **Case-Control Studies**
6. **Case Series**
7. **Expert Opinion** (lowest tier)

## Evidence Grading

Evidence is graded according to the GRADE methodology:

- **Grade A**: High quality evidence
- **Grade B**: Moderate quality evidence
- **Grade C**: Low quality evidence
- **Grade D**: Very low quality evidence

## Using Clinical Evidence in the Application

### For Providers

Clinical evidence is integrated into the treatment workflow in several ways:

1. **Treatment Suggestions**: When viewing AI-generated treatment suggestions, providers can see associated evidence.

2. **Evidence Exploration**: Providers can explore the evidence related to specific findings or treatments.

3. **Treatment Plan Documentation**: Treatment plans include references to supporting evidence.

### For Administrators

Administrators can manage the clinical evidence database:

1. **Adding Evidence**: Add new evidence entries to the database.

2. **Associating Evidence**: Link evidence to specific findings and treatments.

3. **Managing Evidence**: Update or remove evidence entries.

4. **Initializing Evidence**: Seed the database with initial evidence data.

## API Endpoints

The clinical evidence system exposes the following API endpoints:

### Base URL

```
/api/clinical-evidence
```

### Provider Endpoints

- `GET /`: Search for clinical evidence
- `GET /{evidence_id}`: Get a specific evidence entry
- `GET /finding/{finding_type}`: Get evidence for a finding
- `GET /treatment/{procedure_code}`: Get evidence for a treatment
- `GET /citations/{finding_type}/{procedure_code}`: Get citations for a suggestion

### Administrator Endpoints

- `POST /`: Create a new evidence entry
- `PUT /{evidence_id}`: Update an evidence entry
- `DELETE /{evidence_id}`: Delete an evidence entry
- `POST /associate/finding`: Associate a finding with evidence
- `POST /associate/treatment`: Associate a treatment with evidence
- `POST /seed`: Seed the database with initial evidence

## Integration with Treatment Planning

The clinical evidence system is tightly integrated with the treatment planning workflow:

1. When AI generates treatment suggestions, it queries the clinical evidence system for relevant evidence.

2. Evidence relevance is determined through the association tables linking findings and treatments.

3. The most relevant evidence (based on relevance scores) is presented alongside treatment suggestions.

4. Providers can review the evidence and its quality before accepting or modifying the suggested treatment.

## Architecture

The clinical evidence system follows a layered architecture:

1. **Database Layer**: SQLAlchemy models and association tables
2. **Repository Layer**: Database access and queries
3. **Service Layer**: Business logic and formatting
4. **API Layer**: FastAPI endpoints

This separation of concerns ensures maintainability and testability of the system.

## Example Workflow

1. A patient is diagnosed with "caries" on tooth #30.
2. The AI suggests a "D2391 - Resin-based composite restoration" procedure.
3. The provider clicks "View Evidence" to see supporting clinical evidence.
4. The system displays relevant guidelines from the ADA with Grade A evidence quality.
5. The provider reviews the evidence and proceeds with confidence in the treatment decision. 