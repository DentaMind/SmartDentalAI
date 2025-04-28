from fastapi import APIRouter, HTTPException, status, Body
from pydantic import ValidationError
from typing import List, Optional, Dict, Any
from backend.models.medical_history import MedicalHistoryRequest, RiskAssessment, ASAClassification
from backend.services.medical_history_service import MedicalHistoryService

router = APIRouter()

@router.post("/evaluate", response_model=RiskAssessment)
async def evaluate_risk(request: Dict[str, Any] = Body(...)) -> RiskAssessment:
    """
    Evaluate medical history and generate comprehensive risk assessment
    """
    # For empty request body
    if not request or not isinstance(request, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one condition or medication must be provided"
        )
        
    # Parse request into model
    try:
        medical_history = MedicalHistoryRequest(**request)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
        
    # Check for required fields
    if not medical_history.patient_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one condition or medication must be provided"
        )
        
    # Check for empty history vs healthy patient
    if not medical_history.conditions and not medical_history.medications and not medical_history.bloodwork:
        # For healthy patient, require valid dental history
        if not medical_history.dental_history or (
            not medical_history.dental_history.last_cleaning and 
            not medical_history.dental_history.last_xrays and 
            not medical_history.dental_history.previous_treatments
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one condition or medication must be provided"
            )
            
        # Valid healthy patient case
        return RiskAssessment(
            patient_id=medical_history.patient_id,
            risk_level="low",
            asa_classification=ASAClassification.ASA_I,
            risk_factors=[],
            medication_interactions=[],
            bloodwork_concerns=[],
            epinephrine_risk="green",
            requires_medical_clearance=False,
            treatment_modifications=[],
            recommendations=[],
            concerns=[]
        )
        
    try:
        # Initialize service
        service = MedicalHistoryService()
        
        # Create risk assessment
        risk_assessment = RiskAssessment(
            patient_id=medical_history.patient_id,
            risk_level="low",
            asa_classification=ASAClassification.ASA_I,
            risk_factors=[],
            medication_interactions=[],
            bloodwork_concerns=[],
            epinephrine_risk="green",
            requires_medical_clearance=False,
            treatment_modifications=[],
            recommendations=[],
            concerns=[]
        )
            
        # Determine ASA classification
        asa_class = service._determine_asa_classification(
            medical_history.conditions,
            medical_history.medications,
            medical_history.bloodwork
        )
        risk_assessment.asa_classification = asa_class
        
        # Set risk level based on ASA classification and conditions
        if asa_class in [ASAClassification.ASA_IV, ASAClassification.ASA_V]:
            risk_assessment.risk_level = "high"
        elif asa_class == ASAClassification.ASA_III:
            risk_assessment.risk_level = "high"
        elif any(c.severity == "severe" for c in medical_history.conditions):
            risk_assessment.risk_level = "high"
        elif len(medical_history.conditions) >= 2 and all(c.severity in ["moderate", "severe"] for c in medical_history.conditions):
            risk_assessment.risk_level = "high"
            risk_assessment.asa_classification = ASAClassification.ASA_III  # Update ASA for multiple moderate/severe conditions
        elif len(medical_history.conditions) >= 3:  # Multiple conditions scenario
            risk_assessment.risk_level = "high"
            risk_assessment.asa_classification = ASAClassification.ASA_III  # Update ASA for multiple conditions
        else:
            risk_assessment.risk_level = "low"
            
        # Add concerns based on conditions
        concerns = []
        if any(c.severity == "severe" and c.name.lower() in ["heart disease", "hypertension"] for c in medical_history.conditions):
            concerns.append("epinephrine_warning")
                
        # Add concerns based on medications
        for med in medical_history.medications:
            drug_class = med.drug_class.lower()
            if drug_class == "beta blocker":
                concerns.append("epinephrine_warning")
            elif drug_class == "anticoagulant":
                concerns.append("bleeding_risk")
            elif drug_class == "immunosuppressant":
                concerns.append("infection_risk")
                
        # Add concerns based on bloodwork
        if any(test.is_abnormal for test in medical_history.bloodwork):
            concerns.append("lab_concerns")
            
        risk_assessment.concerns = list(set(concerns))  # Remove duplicates
        
        # Generate recommendations
        recommendations = []
        if "bleeding_risk" in concerns:
            recommendations.extend([
                "Obtain recent INR/PT results",
                "Have hemostatic agents available",
                "Consider suturing all surgical sites"
            ])
        if "infection_risk" in concerns:
            recommendations.extend([
                "Prophylactic antibiotics may be required",
                "Use strict aseptic technique",
                "Monitor for post-operative infection"
            ])
        if "epinephrine_warning" in concerns:
            recommendations.append("Use reduced epinephrine concentration")
            
        risk_assessment.recommendations = recommendations
            
        return risk_assessment
        
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error: {str(e)}")

@router.post("/epinephrine-check")
async def check_epinephrine_safety(request: MedicalHistoryRequest):
    """
    Check if epinephrine is safe to use based on medical history
    """
    try:
        service = MedicalHistoryService()
        
        # Check for severe cardiovascular conditions
        has_severe_cardio = any(
            c.severity == "severe" and c.name.lower() in ["heart disease", "hypertension"]
            for c in request.conditions
        )
        
        # Check for beta blockers
        on_beta_blockers = any(
            med.drug_class.lower() == "beta blocker"
            for med in request.medications
        )
        
        # Determine risk level
        risk_level = "red" if has_severe_cardio else "yellow" if on_beta_blockers else "green"
        max_dose = 0.0 if risk_level == "red" else 0.02 if risk_level == "yellow" else 0.04
        
        reasoning = []
        if risk_level == "red":
            reasoning.extend([
                "Contraindicated due to severe cardiovascular conditions",
                "High risk of adverse reactions",
                "Consider alternative anesthetic options"
            ])
        elif risk_level == "yellow":
            reasoning.extend([
                "Use with caution",
                "Monitor vital signs closely",
                "Consider reduced concentration"
            ])
        else:
            reasoning.extend([
                "Safe to use with standard protocol",
                "No contraindications identified"
            ])
            
        return {
            "is_safe": risk_level != "red",
            "risk_level": risk_level,
            "max_dose": max_dose,
            "recommendations": [
                "Avoid epinephrine use" if risk_level == "red"
                else "Use reduced epinephrine concentration" if risk_level == "yellow"
                else "Standard epinephrine protocol acceptable"
            ],
            "reasoning": reasoning,
            "epinephrine_warning": risk_level in ["red", "yellow"]
        }
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error: {str(e)}")

@router.post("/asa-classification")
async def get_asa_classification(request: MedicalHistoryRequest):
    """
    Get ASA classification and reasoning based on medical history
    """
    try:
        if not request:
            raise ValidationError("Request body is required")
            
        service = MedicalHistoryService()
        asa_class = service._determine_asa_classification(
            request.conditions,
            request.medications,
            request.bloodwork
        )
        
        risk_factors = service._identify_risk_factors(
            request.conditions,
            request.medications,
            request.bloodwork
        )
        
        requires_clearance = service._check_medical_clearance_requirement(
            asa_class,
            request.conditions,
            request.medications,
            service._analyze_bloodwork(request.bloodwork)
        )
        
        # Generate reasoning based on ASA class and risk factors
        reasoning = []
        if asa_class == "ASA I":
            reasoning.append("Healthy patient with no systemic disease")
        elif asa_class == "ASA II":
            reasoning.append("Mild systemic disease with no functional limitations")
        elif asa_class == "ASA III":
            reasoning.append("Severe systemic disease with functional limitations")
        elif asa_class == "ASA IV":
            reasoning.append("Severe systemic disease that is a constant threat to life")
        elif asa_class == "ASA V":
            reasoning.append("Moribund patient not expected to survive without surgery")
            
        if risk_factors:
            reasoning.append(f"Risk factors identified: {', '.join(risk_factors)}")
        if requires_clearance:
            reasoning.append("Medical clearance is required")
        
        return {
            "classification": asa_class,
            "risk_factors": risk_factors,
            "requires_clearance": requires_clearance,
            "reasoning": reasoning
        }
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/medications")
async def check_medication_concerns(request: MedicalHistoryRequest):
    """
    Check for medication concerns based on medical history
    """
    try:
        if not request:
            raise ValidationError("Request body is required")
            
        service = MedicalHistoryService()
        interactions = service._check_medication_interactions(request.medications)
        
        high_risk_meds = [
            med.name for med in request.medications
            if med.drug_class.lower() in {
                "anticoagulant",
                "immunosuppressant",
                "chemotherapy",
                "antipsychotic",
                "antiarrhythmic"
            }
        ]
        
        concerns = []
        if any(med.drug_class.lower() == "anticoagulant" for med in request.medications):
            concerns.append("bleeding_risk")
        if any(med.drug_class.lower() == "immunosuppressant" for med in request.medications):
            concerns.append("infection_risk")
        if interactions:
            concerns.append("drug_interactions")
            
        recommendations = []
        if "bleeding_risk" in concerns:
            recommendations.extend([
                "Obtain recent INR/PT results",
                "Have hemostatic agents available",
                "Consider suturing all surgical sites"
            ])
        if "infection_risk" in concerns:
            recommendations.extend([
                "Prophylactic antibiotics may be required",
                "Use strict aseptic technique",
                "Monitor for post-operative infection"
            ])
        if interactions:
            recommendations.append("Review medication timing with physician")
        if high_risk_meds:
            recommendations.append("Consider medical clearance")
        
        return {
            "interactions": interactions,
            "high_risk_medications": high_risk_meds,
            "recommendations": recommendations,
            "concerns": concerns
        }
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 