# Clinical Staging Documentation

## Periodontal Disease Classification Systems

DentaMind implements two periodontal classification systems to provide comprehensive disease staging:

### 1. AAP/EFP 2018 Classification

The 2018 classification system introduced by the American Academy of Periodontology (AAP) and European Federation of Periodontology (EFP) uses a staging and grading framework.

#### Staging Criteria

| Stage | Bone Loss | Clinical Characteristics | Complexity Factors |
|-------|-----------|-------------------------|-------------------|
| I     | ≤15%      | No tooth loss due to periodontitis | Probing depths ≤4mm |
| II    | 15-33%    | No tooth loss due to periodontitis | Probing depths ≤5mm |
| III   | >33%      | ≤4 teeth lost due to periodontitis | Vertical defects ≥3mm |
| IV    | >33%      | ≥5 teeth lost due to periodontitis | Complex rehabilitation needed |

**References:**
- Tonetti, MS, et al. (2018). J Periodontol. 89(Suppl 1):S159-S172
- Papapanou, PN, et al. (2018). J Periodontol. 89(Suppl 1):S173-S182

### 2. Classic (Pre-2017) Classification

The traditional classification system categorizes periodontal disease based on:

#### Type
- Chronic Periodontitis
- Aggressive Periodontitis

#### Extent
- Localized (<30% of sites)
- Generalized (≥30% of sites)

#### Severity
- Mild (1-2mm clinical attachment loss)
- Moderate (3-4mm clinical attachment loss)
- Severe (≥5mm clinical attachment loss)

**References:**
- Armitage, GC. (1999). Ann Periodontol. 4(1):1-6
- Lang, NP, et al. (1999). J Clin Periodontol. 26(11):674-81

## Caries Risk Assessment

### Risk Levels

1. **Low Risk**
   - Single lesion
   - No recurrent caries
   - No pulpal involvement

2. **Moderate Risk**
   - 2-3 lesions
   - Recurrent caries present
   - No pulpal involvement

3. **High Risk**
   - >3 lesions
   - Severe lesions present
   - Near-pulpal involvement
   - Multiple recurrent lesions

**References:**
- Young, DA, et al. (2015). J Calif Dent Assoc. 43(10):557-65
- Featherstone, JD. (2004). Community Dent Oral Epidemiol. 32(Suppl 1):30-6

## Urgency Level Determination

The system combines periodontal and caries findings to determine treatment urgency:

### Immediate Attention Required
- Stage III/IV periodontitis
- Severe periodontal involvement
- Near-pulpal caries
- Acute symptoms

### Schedule within 2 Weeks
- Stage II periodontitis
- Moderate periodontal involvement
- High caries risk without pulpal involvement

### Routine Follow-up
- Stage I periodontitis
- Mild periodontal involvement
- Low/moderate caries risk

## Implementation Notes

1. **Bone Loss Calculation**
   - Uses average root length of 13mm as reference
   - Converts millimeter measurements to percentages
   - Accounts for radiographic distortion

2. **Fallback Behavior**
   - Defaults to Stage I when insufficient data
   - Assumes chronic type if progression rate unknown
   - Conservative approach to urgency determination

3. **Quality Controls**
   - Validation of measurement inputs
   - Cross-checking between classification systems
   - Automated alerts for severe findings 