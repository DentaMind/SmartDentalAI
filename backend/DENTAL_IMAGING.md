# DentaMind Dental Imaging Analysis System

## Overview

The DentaMind Dental Imaging Analysis System provides advanced diagnostic capabilities for dental radiographs, including Full Mouth X-ray (FMX) series, Panoramic X-rays, and CBCT scans. The system uses artificial intelligence to automatically detect and analyze dental conditions, producing clinically relevant reports.

## Features

- **Multi-modal imaging support**: FMX, Panoramic, and CBCT
- **Clinical organization by quadrant**: Findings organized in standard dental quadrants (UR, UL, LL, LR)
- **G.V. Black classification**: Caries classified according to G.V. Black's system
- **Bone level measurements**: Quantitative analysis of bone levels and periodontal condition
- **Endodontic status tracking**: RCT evaluation and periapical lesion detection
- **TMJ analysis**: Wilkes classification integration for TMJ disorders
- **Implant planning**: Site assessment with bone density in Hounsfield units
- **Treatment recommendations**: Clinically prioritized treatment suggestions

## System Components

### 1. Clinical Analyzer (`clinical_analyzer.py`)

The main component for analyzing Full Mouth X-ray (FMX) series with:
- Individual tooth-level findings
- Quadrant organization
- Caries detection with Black's classification
- Periapical lesion measurements
- Periodontal bone measurements

### 2. Panoramic Analyzer (`panoramic_analyzer.py`)

Specialized for panoramic radiograph analysis with:
- Full dentition overview
- TMJ assessment (Wilkes classification)
- Sinus evaluation
- Orthognathic profile analysis
- Growth and development assessment

### 3. CBCT Analyzer (`cbct_analyzer.py`)

3D-specific analysis capabilities:
- Bone volume measurements
- Bone density in Hounsfield units
- Implant site planning
- Sinus proximity evaluation
- Nerve location identification

### 4. Unified Analyzer (`dental_imaging_analyzer.py`)

Main entry point that can:
- Run all analyzers in sequence
- Merge results into a comprehensive report
- Generate consolidated clinical recommendations
- Provide a unified patient analysis

## System Architecture

```
┌─────────────────────────────────────────┐
│           dental_imaging_analyzer        │
└───────────────────┬─────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼───────┐ ┌─▼────────┐ ┌▼───────────┐
│clinical_analyzer│ │panoramic_│ │cbct_analyzer│
└───────┬───────┘ │ analyzer │ └─────┬───────┘
        │         └──────────┘       │
        │                            │
┌───────▼────────────────────────────▼───────┐
│              debug_routes_alt               │
│           (Backend API Server)              │
└────────────────────┬─────────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  AI Diagnostics  │
            │     Engine       │
            └──────────────────┘
```

## Getting Started

### Prerequisites

- Python 3.7 or newer
- Required Python packages: requests, tabulate, numpy, pillow

### Installation

1. Clone the repository or download the source code
2. Run the setup script:
   ```bash
   cd backend
   ./setup_dental_imaging.sh
   ```
3. Follow the prompts to complete the setup

### Usage

1. Make sure the debug server is running on port 8092:
   ```bash
   python debug_routes_alt.py
   ```

2. Place your dental X-ray images in the appropriate directories:
   - FMX images in `imaging_test/fmx/`
   - Panoramic X-rays in `imaging_test/panoramic/`
   - CBCT scans in `imaging_test/cbct/`

3. Run the unified analyzer:
   ```bash
   python dental_imaging_analyzer.py
   ```

4. Or run individual analyzers:
   ```bash
   # For FMX analysis
   python clinical_analyzer.py
   
   # For Panoramic analysis
   python panoramic_analyzer.py
   
   # For CBCT analysis
   python cbct_analyzer.py
   ```

## Naming Conventions

To ensure proper analysis, use these file naming conventions:

- **FMX Periapical**: `PA_[tooth-number].jpg` (e.g., `PA_13.jpg`)
- **FMX Bitewing**: `BW_[quadrant].jpg` (e.g., `BW_UR.jpg`)
- **Panoramic**: `PANO_[date].jpg` (e.g., `PANO_20230501.jpg`)
- **CBCT**: `CBCT_[region]_[date].dcm` (e.g., `CBCT_UR_20230501.dcm`)

## Clinical Report Structure

The system generates several report files:

- `clinical_analysis_report.json`: FMX findings by quadrant
- `panoramic_analysis_report.json`: Panoramic findings and measurements
- `cbct_analysis_report.json`: 3D findings and implant planning
- `comprehensive_dental_analysis_[patient-id].json`: Merged comprehensive report

## Advanced Usage

### Command-Line Arguments

The unified analyzer accepts these arguments:

```bash
python dental_imaging_analyzer.py --api-url http://localhost:8092 --patient-id PATIENT_123 --analysis all --confidence 0.75 --generate-treatment
```

- `--api-url`: Server URL (default: http://localhost:8092)
- `--patient-id`: Patient identifier (default: COMPREHENSIVE_DENTAL_ANALYSIS)
- `--base-dir`: Root directory for images (default: imaging_test)
- `--analysis`: Analysis type: all, clinical, panoramic, cbct (default: all)
- `--confidence`: Confidence threshold (0.0-1.0) (default: 0.65)
- `--generate-treatment`: Generate treatment plan
- `--setup-only`: Only create directories without analysis

## Need Help?

For more detailed information about each analyzer's options:

```bash
python [analyzer_script].py --help
```

## Clinical Integration Notes

- Integrate the comprehensive report with the patient's electronic dental record
- Review AI-detected findings before finalizing diagnoses
- Use the treatment recommendations as a starting point for treatment planning
- Consult appropriate specialists for complex cases 