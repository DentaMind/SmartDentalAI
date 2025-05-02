import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

from sqlalchemy.orm import Session

from ..models.patient import Patient
from ..models.image_diagnosis import ImageDiagnosis
from ..models.treatment_plan import TreatmentPlan, TreatmentProcedure
from ..models.medical_history import MedicalHistory, Medication
from ..models.restorative_chart import RestorativeChart, Restoration

from .insurance_verification_service import get_insurance_verification_service
from .eprescription_service import get_eprescription_service

# If we need LabResult, import it from an appropriate module or create a mock class
# Mocking LabResult for now to avoid import errors
class LabResult:
    """Temporary mock class for LabResult until proper implementation"""
    pass

logger = logging.getLogger(__name__)

class ASAClassification:
    """ASA Physical Status Classification System"""
    ASA_I = "ASA I"    # Normal healthy patient
    ASA_II = "ASA II"  # Patient with mild systemic disease
    ASA_III = "ASA III"  # Patient with severe systemic disease
    ASA_IV = "ASA IV"  # Patient with severe systemic disease that is a constant threat to life
    ASA_V = "ASA V"    # Moribund patient who is not expected to survive without the operation
    ASA_VI = "ASA VI"  # Declared brain-dead patient whose organs are being removed for donor purposes
    
    @staticmethod
    def get_description(asa_class: str) -> str:
        """Get the description for an ASA class"""
        descriptions = {
            ASAClassification.ASA_I: "Normal healthy patient",
            ASAClassification.ASA_II: "Patient with mild systemic disease",
            ASAClassification.ASA_III: "Patient with severe systemic disease",
            ASAClassification.ASA_IV: "Patient with severe systemic disease that is a constant threat to life",
            ASAClassification.ASA_V: "Moribund patient who is not expected to survive without the operation",
            ASAClassification.ASA_VI: "Declared brain-dead patient whose organs are being removed for donor purposes",
        }
        return descriptions.get(asa_class, "Unknown ASA classification")

class PatientWorkflowService:
    """
    Service to manage the comprehensive patient care workflow, from 
    intake to diagnosis, treatment planning, and clinical documentation.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.insurance_service = get_insurance_verification_service(db)
        self.eprescription_service = get_eprescription_service(db)
    
    async def process_new_patient(self, patient_data: Dict[str, Any]) -> Patient:
        """
        Process a new patient intake, creating patient record and medical history.
        Returns the created patient object.
        """
        # Create patient record
        patient = Patient(
            id=str(uuid.uuid4()),
            first_name=patient_data.get("first_name"),
            last_name=patient_data.get("last_name"),
            date_of_birth=patient_data.get("date_of_birth"),
            gender=patient_data.get("gender"),
            email=patient_data.get("email"),
            phone=patient_data.get("phone"),
            address=patient_data.get("address"),
            created_at=datetime.now()
        )
        
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        
        # Create medical history
        medical_data = patient_data.get("medical_history", {})
        medical_history = MedicalHistory(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            allergies=medical_data.get("allergies", []),
            conditions=medical_data.get("conditions", []),
            surgeries=medical_data.get("surgeries", []),
            pregnancy_status=medical_data.get("pregnancy_status", False),
            smoking_status=medical_data.get("smoking_status", "never"),
            alcohol_consumption=medical_data.get("alcohol_consumption", "none"),
            asa_classification=self._determine_asa_class(medical_data),
            created_at=datetime.now()
        )
        
        self.db.add(medical_history)
        
        # Add medications
        for med_data in medical_data.get("medications", []):
            medication = Medication(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                name=med_data.get("name"),
                dosage=med_data.get("dosage"),
                frequency=med_data.get("frequency"),
                reason=med_data.get("reason"),
                start_date=med_data.get("start_date"),
                created_at=datetime.now()
            )
            self.db.add(medication)
        
        # Add lab results if available
        for lab_data in medical_data.get("lab_results", []):
            lab_result = LabResult(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                test_name=lab_data.get("test_name"),
                result=lab_data.get("result"),
                reference_range=lab_data.get("reference_range"),
                test_date=lab_data.get("test_date"),
                created_at=datetime.now()
            )
            self.db.add(lab_result)
        
        self.db.commit()
        
        logger.info(f"Processed new patient: {patient.first_name} {patient.last_name} (ID: {patient.id})")
        return patient
    
    async def process_xray_findings(self, patient_id: str, xray_findings: Dict[str, Any]) -> None:
        """
        Process X-ray findings from AI analysis, updating the restorative chart
        and adding to patient notes.
        """
        if not xray_findings.get("findings"):
            logger.warning(f"No findings in X-ray analysis for patient {patient_id}")
            return
        
        # Get the patient's restorative chart (or create if it doesn't exist)
        chart = self.db.query(RestorativeChart).filter(
            RestorativeChart.patient_id == patient_id
        ).first()
        
        if not chart:
            chart = RestorativeChart(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                created_at=datetime.now()
            )
            self.db.add(chart)
            self.db.commit()
        
        # Process each finding
        for finding in xray_findings.get("findings", []):
            tooth_number = finding.get("tooth")
            finding_type = finding.get("type")
            
            # Update restorative chart based on finding type
            if "crown" in finding_type.lower():
                # Add crown to restorative chart
                restoration = Restoration(
                    id=str(uuid.uuid4()),
                    chart_id=chart.id,
                    tooth_number=tooth_number,
                    restoration_type="crown",
                    surfaces=[],  # Crowns cover all surfaces
                    status="existing" if "existing" in finding_type.lower() else "needed",
                    notes=finding.get("description", ""),
                    created_at=datetime.now()
                )
                self.db.add(restoration)
            
            elif "filling" in finding_type.lower() or "caries" in finding_type.lower():
                # Add restoration for caries/filling
                surfaces = []
                if finding.get("location") and finding.get("location").get("surface"):
                    surfaces = [s.strip() for s in finding.get("location").get("surface").split(",")]
                
                restoration = Restoration(
                    id=str(uuid.uuid4()),
                    chart_id=chart.id,
                    tooth_number=tooth_number,
                    restoration_type="composite" if "composite" in finding_type.lower() else "amalgam",
                    surfaces=surfaces,
                    status="existing" if "existing" in finding_type.lower() else "needed",
                    notes=finding.get("description", ""),
                    created_at=datetime.now()
                )
                self.db.add(restoration)
        
        self.db.commit()
        logger.info(f"Processed X-ray findings for patient {patient_id}")
    
    async def generate_treatment_plan(self, patient_id: str, diagnosis_id: str) -> TreatmentPlan:
        """
        Generate a comprehensive treatment plan based on diagnosis, 
        medical history, and patient preferences.
        """
        # Get the patient's medical history
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient_id
        ).first()
        
        # Get patient medications
        medications = self.db.query(Medication).filter(
            Medication.patient_id == patient_id
        ).all()
        
        # Get lab results if available
        lab_results = self.db.query(LabResult).filter(
            LabResult.patient_id == patient_id
        ).all()
        
        # Get the diagnosis
        diagnosis = self.db.query(ImageDiagnosis).filter(
            ImageDiagnosis.id == diagnosis_id
        ).first()
        
        if not diagnosis:
            logger.error(f"Diagnosis {diagnosis_id} not found for patient {patient_id}")
            raise ValueError(f"Diagnosis not found")
        
        # Create a new treatment plan
        treatment_plan = TreatmentPlan(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            diagnosis_id=diagnosis_id,
            status="draft",
            created_at=datetime.now()
        )
        
        self.db.add(treatment_plan)
        self.db.commit()
        self.db.refresh(treatment_plan)
        
        # Process findings and create procedures
        findings = diagnosis.findings.get("findings", [])
        
        # Check for medical contraindications
        contraindications = self._check_medical_contraindications(
            medical_history, 
            medications, 
            lab_results
        )
        
        treatment_notes = []
        
        for finding in findings:
            procedure = await self._create_procedure_for_finding(
                finding, 
                treatment_plan.id,
                contraindications
            )
            
            if procedure:
                self.db.add(procedure)
                
                # Add treatment notes
                if procedure.notes:
                    treatment_notes.append(procedure.notes)
        
        # Add medical alerts to the treatment plan
        if contraindications:
            treatment_plan.medical_alerts = contraindications
            treatment_notes.append("MEDICAL ALERT: " + ", ".join(contraindications))
        
        # Update treatment plan notes
        treatment_plan.notes = "\n".join(treatment_notes)
        
        self.db.commit()
        
        # Verify insurance coverage for the treatment plan
        try:
            insurance_verification = await self.insurance_service.verify_treatment_plan(treatment_plan.id)
            
            # Update treatment plan with insurance information
            treatment_plan.insurance_verified = True
            treatment_plan.total_fee = insurance_verification.get("total_fee", 0)
            treatment_plan.insurance_portion = insurance_verification.get("insurance_portion", 0)
            treatment_plan.patient_portion = insurance_verification.get("patient_portion", 0)
            treatment_plan.insurance_notes = "Insurance verification completed. "
            
            if insurance_verification.get("has_insurance", False):
                treatment_plan.insurance_notes += f"Verified with {insurance_verification.get('insurance_company')} (Policy: {insurance_verification.get('policy_number')}). "
                
                if insurance_verification.get("deductible_applied", 0) > 0:
                    treatment_plan.insurance_notes += f"Deductible applied: ${insurance_verification.get('deductible_applied'):.2f}. "
                
                treatment_plan.insurance_notes += f"Insurance pays: ${insurance_verification.get('insurance_portion'):.2f}, Patient pays: ${insurance_verification.get('patient_portion'):.2f}."
            else:
                treatment_plan.insurance_notes += "No active insurance found. Patient is responsible for the full fee."
            
            # Generate financial options
            financial_options = await self.insurance_service.generate_financial_options(treatment_plan.id)
            treatment_plan.financial_options = financial_options
            
            self.db.commit()
        except Exception as e:
            logger.error(f"Error verifying insurance for treatment plan {treatment_plan.id}: {str(e)}")
            # Don't fail the entire process if insurance verification fails
            treatment_plan.insurance_verified = False
            treatment_plan.insurance_notes = f"Could not verify insurance: {str(e)}"
            self.db.commit()
        
        logger.info(f"Generated treatment plan {treatment_plan.id} for patient {patient_id}")
        return treatment_plan
    
    async def upload_external_xray(self, patient_id: str, xray_data: Dict[str, Any]) -> str:
        """
        Process an externally uploaded X-ray, sending it to Roboflow for analysis
        and updating the patient record.
        """
        # In a real implementation, this would upload the image to storage
        # and send it to Roboflow for analysis
        
        # For now, we'll simulate the process
        xray_id = str(uuid.uuid4())
        
        # Create a record of the X-ray
        xray_record = {
            "id": xray_id,
            "patient_id": patient_id,
            "source": "external",
            "date_taken": xray_data.get("date_taken", datetime.now().isoformat()),
            "type": xray_data.get("type", "panoramic"),
            "filename": xray_data.get("filename", f"{xray_id}.jpg"),
            "status": "processing"
        }
        
        # Note: This would typically be stored in the database
        
        logger.info(f"Uploaded external X-ray for patient {patient_id}")
        
        # This would be an async task in a real implementation
        # For now, we'll just return the ID
        return xray_id
    
    def _determine_asa_class(self, medical_data: Dict[str, Any]) -> str:
        """
        Determine the ASA classification based on medical history.
        """
        conditions = medical_data.get("conditions", [])
        
        # Default to healthy
        asa_class = ASAClassification.ASA_I
        
        # Check for systemic diseases
        systemic_diseases = [
            "diabetes", "hypertension", "asthma", "copd", "arthritis", 
            "hypothyroidism", "hyperthyroidism"
        ]
        
        severe_diseases = [
            "heart failure", "coronary artery disease", "renal failure",
            "liver disease", "copd", "severe asthma", "cancer"
        ]
        
        life_threatening = [
            "unstable angina", "recent myocardial infarction", "severe valve disease",
            "sepsis", "respiratory failure", "severe trauma", "acute stroke"
        ]
        
        # Check conditions against disease lists
        has_mild_disease = any(disease in " ".join(conditions).lower() for disease in systemic_diseases)
        has_severe_disease = any(disease in " ".join(conditions).lower() for disease in severe_diseases)
        has_life_threat = any(disease in " ".join(conditions).lower() for disease in life_threatening)
        
        # Determine ASA class based on medical conditions
        if has_life_threat:
            asa_class = ASAClassification.ASA_IV
        elif has_severe_disease:
            asa_class = ASAClassification.ASA_III
        elif has_mild_disease:
            asa_class = ASAClassification.ASA_II
        
        return asa_class
    
    def _check_medical_contraindications(
        self, 
        medical_history: Optional[MedicalHistory],
        medications: List[Medication],
        lab_results: List[LabResult]
    ) -> List[str]:
        """
        Check for medical contraindications that might affect treatment.
        Returns a list of alerts/contraindications.
        """
        contraindications = []
        
        if not medical_history:
            contraindications.append("No medical history available")
            return contraindications
        
        # Check pregnancy status
        if medical_history.pregnancy_status:
            contraindications.append("Patient is pregnant - avoid certain medications and radiation")
        
        # Check for allergies
        if medical_history.allergies:
            contraindications.append(f"Allergies: {', '.join(medical_history.allergies)}")
        
        # Check for conditions that may affect treatment
        condition_alerts = {
            "diabetes": "Monitor blood glucose levels; consider antibiotics",
            "hypertension": "Monitor blood pressure; avoid epinephrine if uncontrolled",
            "heart disease": "Consider antibiotic prophylaxis; limit epinephrine",
            "liver disease": "Check for bleeding disorders; medication adjustments needed",
            "kidney disease": "Medication adjustments needed; avoid nephrotoxic drugs",
            "bleeding disorder": "Extended hemostasis measures required",
            "immunocompromised": "Consider antibiotic prophylaxis",
            "cancer": "Consult with oncologist before invasive procedures"
        }
        
        for condition in medical_history.conditions:
            for key, alert in condition_alerts.items():
                if key.lower() in condition.lower():
                    contraindications.append(alert)
        
        # Check medications for potential interactions
        anticoagulants = ["warfarin", "coumadin", "rivaroxaban", "xarelto", "apixaban", "eliquis"]
        immunosuppressants = ["prednisone", "methotrexate", "azathioprine", "cyclosporine"]
        
        for med in medications:
            med_name = med.name.lower()
            
            if any(drug in med_name for drug in anticoagulants):
                contraindications.append("Patient on anticoagulant - bleeding risk")
            
            if any(drug in med_name for drug in immunosuppressants):
                contraindications.append("Patient on immunosuppressant - infection risk")
        
        # Check lab results for abnormalities
        for lab in lab_results:
            if "inr" in lab.test_name.lower() and float(lab.result) > 3.0:
                contraindications.append("INR elevated - significant bleeding risk")
            
            if "platelet" in lab.test_name.lower() and float(lab.result) < 50:
                contraindications.append("Low platelet count - bleeding risk")
            
            if "wbc" in lab.test_name.lower() and float(lab.result) < 3.0:
                contraindications.append("Low WBC count - infection risk")
        
        # ASA classification alerts
        if medical_history.asa_classification in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            contraindications.append(
                f"{medical_history.asa_classification} patient - Consider medical consultation before treatment"
            )
        
        return contraindications
    
    async def _create_procedure_for_finding(
        self, 
        finding: Dict[str, Any], 
        treatment_plan_id: str,
        contraindications: List[str]
    ) -> Optional[TreatmentProcedure]:
        """
        Create a treatment procedure based on a diagnosis finding,
        considering medical contraindications.
        """
        tooth_number = finding.get("tooth")
        finding_type = finding.get("type", "").lower()
        
        # Default values
        cdt_code = None
        procedure_name = None
        treatment_notes = []
        
        # Map finding types to procedures
        if "caries" in finding_type:
            if "small" in finding_type or "early" in finding_type:
                cdt_code = "D2391"  # Resin-based composite - 1 surface, posterior
                procedure_name = "Composite Filling"
            else:
                cdt_code = "D2393"  # Resin-based composite - 3 surface, posterior
                procedure_name = "Composite Filling (Multi-surface)"
            
            treatment_notes.append(f"Caries detected on tooth #{tooth_number}")
        
        elif "crown" in finding_type or "fracture" in finding_type:
            cdt_code = "D2750"  # Crown - porcelain fused to high noble metal
            procedure_name = "Crown"
            treatment_notes.append(f"Crown recommended for tooth #{tooth_number}")
        
        elif "periapical" in finding_type or "abscess" in finding_type:
            cdt_code = "D3330"  # Root canal - molar
            procedure_name = "Root Canal Therapy"
            treatment_notes.append(f"Root canal therapy recommended for tooth #{tooth_number}")
        
        elif "impacted" in finding_type:
            cdt_code = "D7240"  # Removal of impacted tooth - completely bony
            procedure_name = "Surgical Extraction"
            treatment_notes.append(f"Surgical extraction recommended for impacted tooth #{tooth_number}")
        
        # If we couldn't determine a procedure, return None
        if not cdt_code or not procedure_name:
            return None
        
        # Check for medical contraindications specific to this procedure
        procedure_specific_notes = []
        
        # Check if we need to modify treatment based on contraindications
        for contraindication in contraindications:
            if "bleeding risk" in contraindication and ("extraction" in procedure_name.lower() or "surgery" in procedure_name.lower()):
                procedure_specific_notes.append("CAUTION: Bleeding risk - Extended hemostasis measures required")
                
            if "infection risk" in contraindication:
                procedure_specific_notes.append("CAUTION: Infection risk - Antibiotic prophylaxis recommended")
        
        # Add reasoning for the treatment
        reasoning = f"Treatment indicated based on {finding_type} detected on imaging"
        
        if finding.get("confidence"):
            reasoning += f" (AI confidence: {finding.get('confidence')*100:.1f}%)"
        
        # Create the procedure
        procedure = TreatmentProcedure(
            id=str(uuid.uuid4()),
            treatment_plan_id=treatment_plan_id,
            tooth_number=tooth_number,
            cdt_code=cdt_code,
            procedure_name=procedure_name,
            description=finding.get("description", ""),
            status="recommended",
            priority="high" if "pain" in finding.get("description", "").lower() else "medium",
            notes="\n".join(treatment_notes + procedure_specific_notes),
            reasoning=reasoning,
            ai_suggested=True,
            doctor_approved=False,
            created_at=datetime.now()
        )
        
        # Try to get procedure insurance coverage
        try:
            treatment_plan = self.db.query(TreatmentPlan).filter(
                TreatmentPlan.id == treatment_plan_id
            ).first()
            
            if treatment_plan:
                patient_id = treatment_plan.patient_id
                coverage = await self.insurance_service.verify_procedure_coverage(
                    patient_id, 
                    cdt_code, 
                    tooth_number
                )
                
                if coverage and coverage.get("status") == "covered":
                    procedure.insurance_coverage = coverage.get("coverage_percentage", 0)
                    procedure.insurance_coverage_note = coverage.get("notes", "")
                    
                    if coverage.get("waiting_period", False):
                        procedure.insurance_coverage_note += " Waiting period may apply."
                    
                    if coverage.get("frequency_limitation"):
                        procedure.insurance_coverage_note += f" Frequency limitation: {coverage.get('frequency_limitation')}."
        except Exception as e:
            logger.error(f"Error getting insurance coverage for procedure {cdt_code}: {str(e)}")
            # Don't fail if we can't get coverage info, just continue without it
        
        return procedure
    
    async def approve_treatment_plan(
        self, 
        treatment_plan_id: str, 
        provider_id: str,
        generate_prescriptions: bool = True,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Approve a treatment plan, optionally generating prescriptions.
        """
        # Get the treatment plan
        treatment_plan = self.db.query(TreatmentPlan).filter(
            TreatmentPlan.id == treatment_plan_id
        ).first()
        
        if not treatment_plan:
            raise ValueError(f"Treatment plan {treatment_plan_id} not found")
        
        # Update treatment plan status
        treatment_plan.status = "approved"
        treatment_plan.approved_by = provider_id
        treatment_plan.approved_at = datetime.now()
        
        if notes:
            if treatment_plan.notes:
                treatment_plan.notes += f"\n\nApproval Notes: {notes}"
            else:
                treatment_plan.notes = f"Approval Notes: {notes}"
        
        self.db.commit()
        
        result = {
            "status": "success",
            "message": "Treatment plan approved",
            "treatment_plan_id": str(treatment_plan.id),
            "prescriptions_generated": False,
            "prescription_ids": []
        }
        
        # Generate prescriptions if requested
        if generate_prescriptions:
            try:
                # Use the e-prescription service to generate prescriptions
                prescriptions = await self.eprescription_service.generate_prescriptions_from_treatment_plan(
                    treatment_plan_id=treatment_plan_id,
                    provider_id=provider_id
                )
                
                # Update the result with prescription information
                result["prescriptions_generated"] = True
                result["prescription_ids"] = [str(p.id) for p in prescriptions]
                result["prescription_count"] = len(prescriptions)
                
                # Validate each prescription for safety
                prescription_warnings = []
                for prescription in prescriptions:
                    is_safe, warnings = await self.eprescription_service.validate_prescription_safety(
                        prescription_id=str(prescription.id)
                    )
                    
                    if warnings:
                        prescription_warnings.append({
                            "prescription_id": str(prescription.id),
                            "is_safe": is_safe,
                            "warnings": warnings
                        })
                
                if prescription_warnings:
                    result["prescription_warnings"] = prescription_warnings
                
            except Exception as e:
                logger.error(f"Error generating prescriptions for treatment plan {treatment_plan_id}: {str(e)}")
                result["prescription_error"] = str(e)
        
        logger.info(f"Treatment plan {treatment_plan_id} approved by provider {provider_id}")
        
        return result
    
    async def complete_treatment_procedure(
        self,
        procedure_id: str,
        provider_id: str,
        completion_notes: Optional[str] = None,
        vital_signs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Mark a treatment procedure as completed and update patient records.
        """
        # Get the procedure
        procedure = self.db.query(TreatmentProcedure).filter(
            TreatmentProcedure.id == procedure_id
        ).first()
        
        if not procedure:
            raise ValueError(f"Procedure {procedure_id} not found")
        
        # Get the treatment plan
        treatment_plan = self.db.query(TreatmentPlan).filter(
            TreatmentPlan.id == procedure.treatment_plan_id
        ).first()
        
        if not treatment_plan:
            raise ValueError(f"Treatment plan for procedure {procedure_id} not found")
        
        # Update procedure status
        procedure.status = "completed"
        procedure.completed_at = datetime.now()
        
        # Add completion notes if provided
        if completion_notes:
            if procedure.notes:
                procedure.notes += f"\n\nCompletion Notes: {completion_notes}"
            else:
                procedure.notes = f"Completion Notes: {completion_notes}"
        
        # Add vital signs if provided
        if vital_signs:
            vital_notes = "\nVital Signs:\n"
            for key, value in vital_signs.items():
                vital_notes += f"- {key}: {value}\n"
            
            if procedure.notes:
                procedure.notes += vital_notes
            else:
                procedure.notes = vital_notes
        
        self.db.commit()
        
        # Check if all procedures in the treatment plan are completed
        all_procedures = self.db.query(TreatmentProcedure).filter(
            TreatmentProcedure.treatment_plan_id == treatment_plan.id
        ).all()
        
        all_completed = all(p.status == "completed" for p in all_procedures)
        
        # If all procedures are completed, update the treatment plan status
        if all_completed:
            treatment_plan.status = "completed"
            treatment_plan.completed_at = datetime.now()
            self.db.commit()
        
        # Update restorative chart based on the procedure
        await self._update_restorative_chart_from_procedure(procedure)
        
        logger.info(f"Procedure {procedure_id} completed by provider {provider_id}")
        
        return {
            "status": "success",
            "message": "Procedure marked as completed",
            "procedure_id": str(procedure.id),
            "treatment_plan_id": str(treatment_plan.id),
            "treatment_plan_status": treatment_plan.status,
            "all_procedures_completed": all_completed
        }
    
    async def _update_restorative_chart_from_procedure(self, procedure: TreatmentProcedure) -> None:
        """
        Update the patient's restorative chart based on a completed procedure.
        """
        if not procedure.tooth_number:
            return  # Can't update chart without a tooth number
        
        # Get the patient ID from the treatment plan
        treatment_plan = self.db.query(TreatmentPlan).filter(
            TreatmentPlan.id == procedure.treatment_plan_id
        ).first()
        
        if not treatment_plan:
            return
        
        patient_id = treatment_plan.patient_id
        
        # Get or create the restorative chart
        chart = self.db.query(RestorativeChart).filter(
            RestorativeChart.patient_id == patient_id
        ).first()
        
        if not chart:
            chart = RestorativeChart(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                created_at=datetime.now()
            )
            self.db.add(chart)
            self.db.commit()
        
        # Determine restoration type based on procedure
        restoration_type = None
        surfaces = []
        
        proc_name = procedure.procedure_name.lower()
        
        if "crown" in proc_name:
            restoration_type = "crown"
        elif "filling" in proc_name or "composite" in proc_name:
            restoration_type = "composite"
            # Try to extract surfaces from procedure description
            if "occlusal" in proc_name:
                surfaces.append("O")
            if "buccal" in proc_name:
                surfaces.append("B")
            if "lingual" in proc_name:
                surfaces.append("L")
            if "mesial" in proc_name:
                surfaces.append("M")
            if "distal" in proc_name:
                surfaces.append("D")
        elif "implant" in proc_name:
            restoration_type = "implant"
        elif "extraction" in proc_name:
            restoration_type = "missing"
        elif "root canal" in proc_name:
            restoration_type = "endodontic"
        
        # If we determined a restoration type, add it to the chart
        if restoration_type:
            # Check if restoration already exists for this tooth
            existing_restoration = self.db.query(Restoration).filter(
                Restoration.chart_id == chart.id,
                Restoration.tooth_number == procedure.tooth_number,
                Restoration.restoration_type == restoration_type
            ).first()
            
            if existing_restoration:
                # Update existing restoration
                existing_restoration.status = "existing"
                existing_restoration.updated_at = datetime.now()
                existing_restoration.notes = f"Updated from completed procedure: {procedure.procedure_name}"
            else:
                # Create new restoration
                restoration = Restoration(
                    id=str(uuid.uuid4()),
                    chart_id=chart.id,
                    tooth_number=procedure.tooth_number,
                    restoration_type=restoration_type,
                    surfaces=surfaces,
                    status="existing",
                    notes=f"Added from completed procedure: {procedure.procedure_name}",
                    created_at=datetime.now()
                )
                self.db.add(restoration)
            
            self.db.commit()


# Function to get a service instance
def get_patient_workflow_service(db: Session) -> PatientWorkflowService:
    """Get a patient workflow service instance"""
    return PatientWorkflowService(db) 