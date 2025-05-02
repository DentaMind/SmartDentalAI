import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import uuid
import json

from sqlalchemy.orm import Session

from ..models.patient import Patient
from ..models.insurance import InsurancePolicy, BenefitSummary, InsuranceCompany
from ..models.treatment_plan import TreatmentPlan, TreatmentProcedure
from ..models.insurance_verification import VerificationRequest, VerificationResponse

logger = logging.getLogger(__name__)

class InsuranceVerificationService:
    """Service to handle insurance verification and benefits determination"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # Cache of insurance coverage by company and code
        self._coverage_cache = {}
        
        # Load insurance company policies
        self._load_insurance_companies()
    
    def _load_insurance_companies(self):
        """Load insurance companies from the database"""
        companies = self.db.query(InsuranceCompany).all()
        logger.info(f"Loaded {len(companies)} insurance companies")
    
    async def verify_patient_insurance(self, patient_id: str) -> Dict[str, Any]:
        """
        Verify that a patient has active insurance coverage.
        Returns policy details if active, or error information if not.
        """
        # Get the patient's insurance policy
        policy = self.db.query(InsurancePolicy).filter(
            InsurancePolicy.patient_id == patient_id,
            InsurancePolicy.status == "active"
        ).first()
        
        if not policy:
            return {
                "status": "inactive",
                "message": "No active insurance policy found for this patient",
                "patient_id": patient_id
            }
        
        # Get policy benefit summary
        benefits = self.db.query(BenefitSummary).filter(
            BenefitSummary.policy_id == policy.id
        ).first()
        
        # Check insurance expiration
        if policy.expiration_date and policy.expiration_date < datetime.now().date():
            return {
                "status": "expired",
                "message": f"Insurance policy expired on {policy.expiration_date.isoformat()}",
                "patient_id": patient_id,
                "policy_id": policy.id,
                "policy_number": policy.policy_number,
                "insurance_company": policy.company_name
            }
        
        # Create verification record
        verification = VerificationRequest(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            policy_id=policy.id,
            request_date=datetime.now(),
            status="completed",
            request_type="eligibility"
        )
        
        self.db.add(verification)
        self.db.commit()
        
        return {
            "status": "active",
            "message": "Patient has active insurance coverage",
            "patient_id": patient_id,
            "policy_id": policy.id,
            "policy_number": policy.policy_number,
            "group_number": policy.group_number,
            "insurance_company": policy.company_name,
            "plan_type": policy.plan_type,
            "effective_date": policy.effective_date.isoformat() if policy.effective_date else None,
            "expiration_date": policy.expiration_date.isoformat() if policy.expiration_date else None,
            "benefits": {
                "annual_maximum": benefits.annual_maximum if benefits else None,
                "remaining_benefit": benefits.remaining_benefit if benefits else None,
                "deductible": benefits.deductible if benefits else None,
                "deductible_met": benefits.deductible_met if benefits else None,
                "preventive_coverage": benefits.preventive_coverage if benefits else None,
                "basic_coverage": benefits.basic_coverage if benefits else None,
                "major_coverage": benefits.major_coverage if benefits else None,
                "waiting_periods": benefits.waiting_periods if benefits else None,
                "last_verification_date": benefits.last_verification_date.isoformat() if benefits and benefits.last_verification_date else None
            },
            "verification_id": verification.id
        }
    
    async def verify_procedure_coverage(
        self, 
        patient_id: str, 
        cdt_code: str, 
        tooth_number: Optional[str] = None,
        surfaces: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Verify coverage for a specific dental procedure.
        Returns coverage details including patient portion and coverage percentage.
        """
        # Get the patient's insurance policy
        policy = self.db.query(InsurancePolicy).filter(
            InsurancePolicy.patient_id == patient_id,
            InsurancePolicy.status == "active"
        ).first()
        
        if not policy:
            return {
                "status": "not_covered",
                "message": "No active insurance policy found for this patient",
                "patient_id": patient_id,
                "cdt_code": cdt_code,
                "tooth_number": tooth_number,
                "coverage_percentage": 0,
                "patient_pays": 100,
                "insurance_pays": 0,
                "notes": "Patient has no active insurance",
                "waiting_period": False
            }
        
        # Get coverage information for this procedure code
        coverage_info = await self._get_procedure_coverage(
            policy.company_id, 
            policy.plan_type, 
            cdt_code
        )
        
        # Get benefit utilization
        benefits = self.db.query(BenefitSummary).filter(
            BenefitSummary.policy_id == policy.id
        ).first()
        
        annual_max_remaining = benefits.remaining_benefit if benefits else 0
        
        # Create verification record
        verification = VerificationRequest(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            policy_id=policy.id,
            request_date=datetime.now(),
            status="completed",
            request_type="procedure_coverage",
            procedure_code=cdt_code,
            tooth_number=tooth_number,
            surfaces=surfaces,
            response_data=coverage_info
        )
        
        self.db.add(verification)
        self.db.commit()
        
        # Create response object
        response = VerificationResponse(
            id=str(uuid.uuid4()),
            verification_id=verification.id,
            response_date=datetime.now(),
            coverage_percentage=coverage_info["coverage_percentage"],
            patient_pays_percentage=100 - coverage_info["coverage_percentage"],
            deductible_applies=coverage_info["deductible_applies"],
            waiting_period_applies=coverage_info["waiting_period_applies"],
            waiting_period_end=coverage_info.get("waiting_period_end"),
            annual_max_applied=coverage_info["annual_max_applies"],
            max_remaining=annual_max_remaining,
            status="completed",
            notes=coverage_info.get("notes", "")
        )
        
        self.db.add(response)
        self.db.commit()
        
        return {
            "status": "covered" if coverage_info["coverage_percentage"] > 0 else "not_covered",
            "message": "Coverage verified",
            "patient_id": patient_id,
            "cdt_code": cdt_code,
            "tooth_number": tooth_number,
            "surfaces": surfaces,
            "coverage_percentage": coverage_info["coverage_percentage"],
            "patient_pays": 100 - coverage_info["coverage_percentage"],
            "insurance_pays": coverage_info["coverage_percentage"],
            "deductible_applies": coverage_info["deductible_applies"],
            "annual_max_applies": coverage_info["annual_max_applies"],
            "waiting_period": coverage_info["waiting_period_applies"],
            "waiting_period_end": coverage_info.get("waiting_period_end"),
            "frequency_limitation": coverage_info.get("frequency_limitation"),
            "notes": coverage_info.get("notes", ""),
            "verification_id": verification.id,
            "response_id": response.id
        }
    
    async def verify_treatment_plan(self, treatment_plan_id: str) -> Dict[str, Any]:
        """
        Verify insurance coverage for an entire treatment plan.
        Returns comprehensive coverage information for all procedures.
        """
        # Get the treatment plan and procedures
        treatment_plan = self.db.query(TreatmentPlan).filter(
            TreatmentPlan.id == treatment_plan_id
        ).first()
        
        if not treatment_plan:
            raise ValueError(f"Treatment plan {treatment_plan_id} not found")
        
        procedures = self.db.query(TreatmentProcedure).filter(
            TreatmentProcedure.treatment_plan_id == treatment_plan_id
        ).all()
        
        if not procedures:
            return {
                "status": "no_procedures",
                "message": "No procedures found in treatment plan",
                "treatment_plan_id": treatment_plan_id,
                "procedures": [],
                "total_fee": 0,
                "patient_portion": 0,
                "insurance_portion": 0
            }
        
        # Get the patient's insurance policy
        patient_id = treatment_plan.patient_id
        policy = self.db.query(InsurancePolicy).filter(
            InsurancePolicy.patient_id == patient_id,
            InsurancePolicy.status == "active"
        ).first()
        
        # Get benefit utilization
        benefits = self.db.query(BenefitSummary).filter(
            BenefitSummary.policy_id == policy.id if policy else None
        ).first()
        
        annual_max_remaining = benefits.remaining_benefit if benefits and benefits.remaining_benefit else 0
        deductible_remaining = benefits.deductible - benefits.deductible_met if benefits else 0
        deductible_remaining = max(0, deductible_remaining)
        
        # Process each procedure
        procedure_results = []
        total_fee = 0
        patient_portion = 0
        insurance_portion = 0
        deductible_applied = 0
        
        for procedure in procedures:
            # Get standard fee for this procedure
            fee = await self._get_procedure_fee(procedure.cdt_code)
            
            # Skip procedures without a valid CDT code or fee
            if not procedure.cdt_code or fee <= 0:
                continue
            
            total_fee += fee
            
            # If no insurance, patient pays full fee
            if not policy:
                procedure_results.append({
                    "procedure_id": procedure.id,
                    "cdt_code": procedure.cdt_code,
                    "tooth_number": procedure.tooth_number,
                    "procedure_name": procedure.procedure_name,
                    "fee": fee,
                    "coverage_percentage": 0,
                    "patient_pays": fee,
                    "insurance_pays": 0,
                    "deductible_applied": 0,
                    "notes": "No active insurance",
                    "status": "not_covered"
                })
                patient_portion += fee
                continue
            
            # Get coverage info for this procedure
            coverage_info = await self._get_procedure_coverage(
                policy.company_id, 
                policy.plan_type, 
                procedure.cdt_code
            )
            
            # Calculate financial breakdown
            coverage_percentage = coverage_info["coverage_percentage"]
            current_deductible_applied = 0
            
            # Apply deductible if it exists and applies to this procedure
            if deductible_remaining > 0 and coverage_info["deductible_applies"]:
                current_deductible_applied = min(fee, deductible_remaining)
                deductible_remaining -= current_deductible_applied
                deductible_applied += current_deductible_applied
            
            # Calculate insurance and patient portions
            procedure_insurance_pays = 0
            procedure_patient_pays = fee
            
            if coverage_percentage > 0:
                # Fee minus deductible
                eligible_amount = fee - current_deductible_applied
                procedure_insurance_pays = (eligible_amount * coverage_percentage) / 100
                procedure_patient_pays = fee - procedure_insurance_pays
                
                # Check annual maximum
                if coverage_info["annual_max_applies"] and annual_max_remaining < procedure_insurance_pays:
                    # Insurance only pays up to remaining annual maximum
                    overage = procedure_insurance_pays - annual_max_remaining
                    procedure_insurance_pays = annual_max_remaining
                    procedure_patient_pays += overage
                    annual_max_remaining = 0
                else:
                    annual_max_remaining -= procedure_insurance_pays
            
            # Add to totals
            insurance_portion += procedure_insurance_pays
            patient_portion += procedure_patient_pays
            
            # Add result for this procedure
            procedure_results.append({
                "procedure_id": procedure.id,
                "cdt_code": procedure.cdt_code,
                "tooth_number": procedure.tooth_number,
                "procedure_name": procedure.procedure_name,
                "fee": fee,
                "coverage_percentage": coverage_percentage,
                "patient_pays": procedure_patient_pays,
                "insurance_pays": procedure_insurance_pays,
                "deductible_applied": current_deductible_applied,
                "waiting_period": coverage_info["waiting_period_applies"],
                "frequency_limitation": coverage_info.get("frequency_limitation"),
                "notes": coverage_info.get("notes", ""),
                "status": "covered" if coverage_percentage > 0 else "not_covered"
            })
        
        # Create a verification record for the full plan
        verification = VerificationRequest(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            policy_id=policy.id if policy else None,
            request_date=datetime.now(),
            status="completed",
            request_type="treatment_plan",
            treatment_plan_id=treatment_plan_id
        )
        
        self.db.add(verification)
        self.db.commit()
        
        return {
            "status": "completed",
            "message": "Treatment plan coverage verified",
            "treatment_plan_id": treatment_plan_id,
            "patient_id": patient_id,
            "has_insurance": policy is not None,
            "insurance_company": policy.company_name if policy else None,
            "policy_number": policy.policy_number if policy else None,
            "procedures": procedure_results,
            "total_fee": total_fee,
            "patient_portion": patient_portion,
            "insurance_portion": insurance_portion,
            "deductible_applied": deductible_applied,
            "original_annual_max": benefits.annual_maximum if benefits else 0,
            "remaining_annual_max": annual_max_remaining,
            "verification_id": verification.id
        }
    
    async def generate_financial_options(
        self, 
        treatment_plan_id: str,
        include_payment_plans: bool = True
    ) -> Dict[str, Any]:
        """
        Generate financial options for a treatment plan, including
        insurance coverage and potential payment plans.
        """
        # First, verify the treatment plan coverage
        coverage_result = await self.verify_treatment_plan(treatment_plan_id)
        
        # Get the treatment plan
        treatment_plan = self.db.query(TreatmentPlan).filter(
            TreatmentPlan.id == treatment_plan_id
        ).first()
        
        if not treatment_plan:
            raise ValueError(f"Treatment plan {treatment_plan_id} not found")
        
        # Get patient info
        patient = self.db.query(Patient).filter(
            Patient.id == treatment_plan.patient_id
        ).first()
        
        # Base financial information
        financial_options = {
            "treatment_plan_id": treatment_plan_id,
            "patient_id": treatment_plan.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient",
            "total_treatment_cost": coverage_result["total_fee"],
            "insurance_coverage": {
                "has_insurance": coverage_result["has_insurance"],
                "insurance_company": coverage_result["insurance_company"],
                "policy_number": coverage_result["policy_number"],
                "insurance_portion": coverage_result["insurance_portion"],
                "patient_portion": coverage_result["patient_portion"],
                "deductible_applied": coverage_result["deductible_applied"]
            },
            "payment_options": []
        }
        
        # If insurance doesn't cover everything and patient portion is significant, offer payment plans
        if include_payment_plans and coverage_result["patient_portion"] > 200:
            patient_portion = coverage_result["patient_portion"]
            
            # Add standard payment plans
            financial_options["payment_options"] = [
                {
                    "name": "Pay in Full - 5% Discount",
                    "description": "Pay the entire amount upfront and receive a 5% discount",
                    "total_patient_pays": round(patient_portion * 0.95, 2),
                    "savings": round(patient_portion * 0.05, 2),
                    "duration_months": 1,
                    "monthly_payment": round(patient_portion * 0.95, 2),
                    "interest_rate": 0,
                    "discount_rate": 5
                },
                {
                    "name": "3-Month Payment Plan",
                    "description": "Divide your payment into 3 equal monthly installments with no interest",
                    "total_patient_pays": patient_portion,
                    "savings": 0,
                    "duration_months": 3,
                    "monthly_payment": round(patient_portion / 3, 2),
                    "interest_rate": 0,
                    "discount_rate": 0
                }
            ]
            
            # For larger amounts, offer longer payment plans
            if patient_portion > 1000:
                financial_options["payment_options"].append({
                    "name": "6-Month Payment Plan",
                    "description": "Divide your payment into 6 equal monthly installments",
                    "total_patient_pays": patient_portion,
                    "savings": 0,
                    "duration_months": 6,
                    "monthly_payment": round(patient_portion / 6, 2),
                    "interest_rate": 0,
                    "discount_rate": 0
                })
            
            # For even larger amounts, offer financing options
            if patient_portion > 2500:
                # Calculate financing with interest
                interest_rate = 9.9
                duration_months = 12
                monthly_rate = interest_rate / 100 / 12
                monthly_payment = (patient_portion * monthly_rate) / (1 - (1 + monthly_rate)**(-duration_months))
                total_paid = monthly_payment * duration_months
                
                financial_options["payment_options"].append({
                    "name": "12-Month Financing",
                    "description": f"Finance your treatment with {interest_rate}% APR for 12 months",
                    "total_patient_pays": round(total_paid, 2),
                    "savings": 0,
                    "duration_months": duration_months,
                    "monthly_payment": round(monthly_payment, 2),
                    "interest_rate": interest_rate,
                    "discount_rate": 0,
                    "requires_credit_approval": True
                })
        
        return financial_options
    
    async def _get_procedure_fee(self, cdt_code: str) -> float:
        """Get the standard fee for a procedure code"""
        # In a real implementation, this would look up the fee schedule
        # from the database based on the practice's fee schedule
        
        # For demonstration, we'll use a simple lookup table
        fee_schedule = {
            # Diagnostic
            "D0120": 50.00,  # Periodic oral evaluation
            "D0150": 100.00,  # Comprehensive oral evaluation
            "D0210": 125.00,  # Intraoral - complete series of radiographic images
            "D0220": 35.00,   # Intraoral - periapical first radiographic image
            "D0230": 25.00,   # Intraoral - periapical each additional radiographic image
            "D0274": 75.00,   # Bitewings - four radiographic images
            
            # Preventive
            "D1110": 95.00,   # Prophylaxis - adult
            "D1120": 75.00,   # Prophylaxis - child
            "D1351": 55.00,   # Sealant - per tooth
            "D1354": 40.00,   # Interim caries arresting medicament application
            
            # Restorative
            "D2140": 150.00,  # Amalgam - one surface, primary or permanent
            "D2150": 175.00,  # Amalgam - two surfaces, primary or permanent
            "D2160": 200.00,  # Amalgam - three surfaces, primary or permanent
            "D2161": 250.00,  # Amalgam - four or more surfaces, primary or permanent
            "D2330": 175.00,  # Resin-based composite - one surface, anterior
            "D2331": 200.00,  # Resin-based composite - two surfaces, anterior
            "D2332": 250.00,  # Resin-based composite - three surfaces, anterior
            "D2335": 300.00,  # Resin-based composite - four or more surfaces, anterior
            "D2391": 175.00,  # Resin-based composite - one surface, posterior
            "D2392": 225.00,  # Resin-based composite - two surfaces, posterior
            "D2393": 275.00,  # Resin-based composite - three surfaces, posterior
            "D2394": 325.00,  # Resin-based composite - four or more surfaces, posterior
            
            # Crowns
            "D2740": 1200.00, # Crown - porcelain/ceramic substrate
            "D2750": 1100.00, # Crown - porcelain fused to high noble metal
            "D2752": 1050.00, # Crown - porcelain fused to noble metal
            "D2790": 1100.00, # Crown - full cast high noble metal
            "D2950": 250.00,  # Core buildup, including any pins when required
            "D2954": 300.00,  # Prefabricated post and core in addition to crown
            
            # Endodontics
            "D3310": 700.00,  # Endodontic therapy, anterior tooth
            "D3320": 850.00,  # Endodontic therapy, premolar tooth
            "D3330": 1000.00, # Endodontic therapy, molar tooth
            
            # Periodontics
            "D4341": 225.00,  # Periodontal scaling and root planing - four or more teeth per quadrant
            "D4910": 120.00,  # Periodontal maintenance
            
            # Prosthodontics (removable)
            "D5110": 1500.00, # Complete denture - maxillary
            "D5120": 1500.00, # Complete denture - mandibular
            "D5213": 1700.00, # Maxillary partial denture - cast metal framework with resin denture bases
            "D5214": 1700.00, # Mandibular partial denture - cast metal framework with resin denture bases
            
            # Implants
            "D6010": 2000.00, # Surgical placement of implant body: endosteal implant
            "D6056": 500.00,  # Prefabricated abutment
            "D6058": 1400.00, # Abutment supported porcelain/ceramic crown
            "D6059": 1350.00, # Abutment supported porcelain fused to metal crown (high noble metal)
            
            # Oral Surgery
            "D7140": 175.00,  # Extraction, erupted tooth or exposed root
            "D7210": 250.00,  # Extraction, erupted tooth requiring removal of bone and/or sectioning of tooth
            "D7220": 300.00,  # Removal of impacted tooth - soft tissue
            "D7230": 375.00,  # Removal of impacted tooth - partially bony
            "D7240": 450.00,  # Removal of impacted tooth - completely bony
        }
        
        return fee_schedule.get(cdt_code, 0.0)
    
    async def _get_procedure_coverage(
        self, 
        company_id: str, 
        plan_type: str, 
        cdt_code: str
    ) -> Dict[str, Any]:
        """
        Get coverage information for a specific procedure code
        from a specific insurance company and plan type.
        """
        # Check cache first
        cache_key = f"{company_id}:{plan_type}:{cdt_code}"
        if cache_key in self._coverage_cache:
            return self._coverage_cache[cache_key]
        
        # In a real implementation, this would query the insurance company API
        # or a comprehensive database of coverage information
        
        # For demonstration, we'll simulate coverage based on code categories
        coverage_info = self._simulate_coverage(cdt_code, plan_type)
        
        # Cache the result
        self._coverage_cache[cache_key] = coverage_info
        
        return coverage_info
    
    def _simulate_coverage(self, cdt_code: str, plan_type: str) -> Dict[str, Any]:
        """Simulate coverage information for demonstration purposes"""
        # Determine procedure category from CDT code
        category = None
        if cdt_code.startswith("D01") or cdt_code.startswith("D02"):
            category = "diagnostic"
        elif cdt_code.startswith("D03") or cdt_code.startswith("D04") or cdt_code.startswith("D05") or cdt_code.startswith("D06"):
            category = "preventive"
        elif cdt_code.startswith("D2"):
            category = "basic" if cdt_code in ["D2140", "D2150", "D2160", "D2161", "D2330", "D2331", "D2332", "D2335", "D2391", "D2392", "D2393", "D2394"] else "major"
        elif cdt_code.startswith("D3"):
            category = "major"  # Endodontics
        elif cdt_code.startswith("D4"):
            category = "major"  # Periodontics
        elif cdt_code.startswith("D5") or cdt_code.startswith("D6"):
            category = "major"  # Prosthodontics
        elif cdt_code.startswith("D7"):
            category = "basic" if cdt_code in ["D7140"] else "major"  # Simple vs. surgical extractions
        elif cdt_code.startswith("D8"):
            category = "orthodontic"
        elif cdt_code.startswith("D9"):
            category = "adjunctive"
        else:
            category = "basic"
        
        # Determine coverage based on plan type and category
        coverage_percentage = 0
        waiting_period_applies = False
        waiting_period_end = None
        frequency_limitation = None
        annual_max_applies = True
        deductible_applies = True
        notes = ""
        
        if plan_type.lower() == "ppo" or plan_type.lower() == "premier":
            if category == "diagnostic" or category == "preventive":
                coverage_percentage = 100
                annual_max_applies = False
                deductible_applies = False
                frequency_limitation = "2 per calendar year" if cdt_code in ["D0120", "D1110"] else None
            elif category == "basic":
                coverage_percentage = 80
            elif category == "major":
                coverage_percentage = 50
                waiting_period_applies = True
                waiting_period_end = "6 months from effective date"
                notes = "Major procedures may be subject to a 6-month waiting period"
            elif category == "orthodontic":
                coverage_percentage = 50
                waiting_period_applies = True
                waiting_period_end = "12 months from effective date"
                annual_max_applies = False  # Usually has a separate lifetime maximum
                notes = "Orthodontic procedures typically have a separate lifetime maximum"
        elif plan_type.lower() == "hmo" or plan_type.lower() == "capitation":
            # HMO plans typically have specific copays rather than percentages
            if category == "diagnostic" or category == "preventive":
                coverage_percentage = 100
                annual_max_applies = False
                deductible_applies = False
            elif category == "basic":
                coverage_percentage = 90
            elif category == "major":
                coverage_percentage = 60
            elif category == "orthodontic":
                coverage_percentage = 50
                annual_max_applies = False
        elif plan_type.lower() == "discount" or plan_type.lower() == "savings":
            # Discount plans offer a percentage off UCR fees
            if category == "diagnostic" or category == "preventive":
                coverage_percentage = 30
            elif category == "basic":
                coverage_percentage = 25
            elif category == "major":
                coverage_percentage = 20
            elif category == "orthodontic":
                coverage_percentage = 15
            annual_max_applies = False
            deductible_applies = False
            notes = "Discount plan - patient receives reduced fees at time of service"
        
        return {
            "coverage_percentage": coverage_percentage,
            "waiting_period_applies": waiting_period_applies,
            "waiting_period_end": waiting_period_end,
            "frequency_limitation": frequency_limitation,
            "annual_max_applies": annual_max_applies,
            "deductible_applies": deductible_applies,
            "category": category,
            "notes": notes
        }


# Function to get a service instance
def get_insurance_verification_service(db: Session) -> InsuranceVerificationService:
    """Get an insurance verification service instance"""
    return InsuranceVerificationService(db) 