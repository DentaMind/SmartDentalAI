from datetime import datetime, timedelta
from typing import Dict, Any
from backend.models.medical_history import ASAClassification

TEST_MEDICAL_HISTORY: Dict[str, Any] = {
    "patient_id": "test123",
    "conditions": [
        {
            "name": "Hypertension",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Medication and monitoring"
        }
    ],
    "medications": [
        {
            "name": "Lisinopril",
            "dosage": "10mg",
            "frequency": "daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "ACE inhibitor",
            "dental_considerations": ["Monitor blood pressure before procedures"]
        }
    ],
    "bloodwork": [
        {
            "test_name": "CBC",
            "value": 5.0,
            "unit": "x10^9/L",
            "reference_range": "4.0-11.0",
            "is_abnormal": False,
            "clinical_significance": "Within normal limits"
        }
    ],
    "dental_history": {
        "last_cleaning": (datetime.now() - timedelta(days=400)).isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": ["filling", "cleaning"],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

HEALTHY_PATIENT_HISTORY: Dict[str, Any] = {
    "patient_id": "healthy123",
    "conditions": [],
    "medications": [],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": ["cleaning"],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

SEVERE_CONDITIONS_HISTORY: Dict[str, Any] = {
    "patient_id": "severe123",
    "conditions": [
        {
            "name": "Diabetes",
            "severity": "severe",
            "is_controlled": False,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Insulin therapy"
        },
        {
            "name": "Heart Disease",
            "severity": "severe",
            "is_controlled": False,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Multiple medications"
        }
    ],
    "medications": [
        {
            "name": "Insulin",
            "dosage": "Variable",
            "frequency": "As needed",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "antidiabetic",
            "dental_considerations": ["Monitor blood sugar before procedures"]
        }
    ],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": ["cleaning"],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

HIGH_RISK_HISTORY: Dict[str, Any] = {
    "patient_id": "highrisk123",
    "conditions": [
        {
            "name": "Uncontrolled Hypertension",
            "severity": "severe",
            "is_controlled": False,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Multiple medications"
        },
        {
            "name": "Type 2 Diabetes",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Oral medications"
        }
    ],
    "medications": [
        {
            "name": "Warfarin",
            "dosage": "5mg",
            "frequency": "daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "anticoagulant",
            "dental_considerations": ["Bleeding risk"]
        }
    ],
    "bloodwork": [
        {
            "test_name": "INR",
            "value": 2.5,
            "unit": "ratio",
            "reference_range": "0.8-1.2",
            "is_abnormal": True,
            "clinical_significance": "Elevated"
        }
    ],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

LOW_RISK_HISTORY: Dict[str, Any] = {
    "patient_id": "lowrisk123",
    "conditions": [
        {
            "name": "Allergic Rhinitis",
            "severity": "mild",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Antihistamines"
        }
    ],
    "medications": [
        {
            "name": "Loratadine",
            "dosage": "10mg",
            "frequency": "daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "antihistamine",
            "dental_considerations": []
        }
    ],
    "bloodwork": [
        {
            "test_name": "INR",
            "value": 1.0,
            "unit": "ratio",
            "reference_range": "0.8-1.2",
            "is_abnormal": False,
            "clinical_significance": "Normal"
        }
    ],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

BETA_BLOCKER_HISTORY: Dict[str, Any] = {
    "patient_id": "betablocker123",
    "conditions": [
        {
            "name": "Hypertension",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Beta blocker therapy"
        }
    ],
    "medications": [
        {
            "name": "Metoprolol",
            "dosage": "50mg",
            "frequency": "twice daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "beta blocker",
            "dental_considerations": ["May interact with epinephrine"]
        }
    ],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

ANTICOAGULANT_HISTORY: Dict[str, Any] = {
    "patient_id": "anticoag123",
    "conditions": [
        {
            "name": "Atrial Fibrillation",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Anticoagulation therapy"
        }
    ],
    "medications": [
        {
            "name": "Warfarin",
            "dosage": "5mg",
            "frequency": "daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "anticoagulant",
            "dental_considerations": ["Bleeding risk"]
        }
    ],
    "bloodwork": [
        {
            "test_name": "INR",
            "value": 2.5,
            "unit": "ratio",
            "reference_range": "0.8-1.2",
            "is_abnormal": True,
            "clinical_significance": "Elevated"
        }
    ],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

IMMUNOSUPPRESSANT_HISTORY: Dict[str, Any] = {
    "patient_id": "immuno123",
    "conditions": [
        {
            "name": "Rheumatoid Arthritis",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Immunosuppressive therapy"
        }
    ],
    "medications": [
        {
            "name": "Methotrexate",
            "dosage": "15mg",
            "frequency": "weekly",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "immunosuppressant",
            "dental_considerations": ["Increased infection risk"]
        }
    ],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

MULTIPLE_CONDITIONS_HISTORY: Dict[str, Any] = {
    "patient_id": "multiple123",
    "conditions": [
        {
            "name": "Hypertension",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "ACE inhibitor therapy"
        },
        {
            "name": "Type 2 Diabetes",
            "severity": "moderate",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Oral medications"
        },
        {
            "name": "Asthma",
            "severity": "mild",
            "is_controlled": True,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Inhaler therapy"
        }
    ],
    "medications": [
        {
            "name": "Lisinopril",
            "dosage": "10mg",
            "frequency": "daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "ACE inhibitor",
            "dental_considerations": ["Monitor blood pressure"]
        },
        {
            "name": "Metformin",
            "dosage": "1000mg",
            "frequency": "twice daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "antidiabetic",
            "dental_considerations": ["Monitor blood sugar"]
        },
        {
            "name": "Albuterol",
            "dosage": "2 puffs",
            "frequency": "as needed",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "bronchodilator",
            "dental_considerations": ["May need rescue inhaler"]
        }
    ],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

EMPTY_HISTORY: Dict[str, Any] = {
    "patient_id": "empty123",
    "conditions": [],
    "medications": [],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": None,
        "last_xrays": None,
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

EPINEPHRINE_CONTRAINDICATIONS: Dict[str, Any] = {
    "patient_id": "epi123",
    "conditions": [
        {
            "name": "Uncontrolled Hypertension",
            "severity": "severe",
            "is_controlled": False,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Multiple medications"
        },
        {
            "name": "Recent Myocardial Infarction",
            "severity": "severe",
            "is_controlled": False,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Cardiac monitoring"
        }
    ],
    "medications": [
        {
            "name": "Propranolol",
            "dosage": "40mg",
            "frequency": "twice daily",
            "start_date": datetime.now().isoformat(),
            "is_active": True,
            "drug_class": "beta blocker",
            "dental_considerations": ["Contraindicated with epinephrine"]
        }
    ],
    "bloodwork": [],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

BLOODWORK_ABNORMALITIES: Dict[str, Any] = {
    "patient_id": "blood123",
    "conditions": [],
    "medications": [],
    "bloodwork": [
        {
            "test_name": "INR",
            "value": 3.0,
            "unit": "ratio",
            "reference_range": "0.8-1.2",
            "is_abnormal": True,
            "clinical_significance": "Elevated"
        },
        {
            "test_name": "Platelets",
            "value": 80000,
            "unit": "cells/μL",
            "reference_range": "150000-450000",
            "is_abnormal": True,
            "clinical_significance": "Low"
        },
        {
            "test_name": "WBC",
            "value": 12000,
            "unit": "cells/μL",
            "reference_range": "4000-11000",
            "is_abnormal": True,
            "clinical_significance": "Elevated"
        }
    ],
    "dental_history": {
        "last_cleaning": datetime.now().isoformat(),
        "last_xrays": datetime.now().isoformat(),
        "previous_treatments": [],
        "allergies": [],
        "complications": []
    },
    "risk_factors": [],
    "asa_classification": None
}

ABNORMAL_BLOODWORK_HISTORY: Dict[str, Any] = {
    "patient_id": "bloodwork123",
    "conditions": [],
    "medications": [],
    "bloodwork": [
        {
            "test_name": "CBC",
            "value": 15.0,
            "unit": "x10^9/L",
            "reference_range": "4.0-11.0",
            "is_abnormal": True,
            "clinical_significance": "Elevated"
        }
    ],
    "dental_history": None,
    "risk_factors": [],
    "asa_classification": None
}

EPINEPHRINE_CONTRAINDICATED_HISTORY: Dict[str, Any] = {
    "patient_id": "epi123",
    "conditions": [
        {
            "name": "Heart Disease",
            "severity": "severe",
            "is_controlled": False,
            "last_exacerbation": datetime.now().isoformat(),
            "treatment_plan": "Multiple medications"
        }
    ],
    "medications": [],
    "bloodwork": [],
    "dental_history": None,
    "risk_factors": [],
    "asa_classification": None
} 