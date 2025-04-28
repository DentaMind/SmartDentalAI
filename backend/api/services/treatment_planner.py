from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging
import json
import os
from ..services.patient_service import PatientService

class TreatmentStatus(Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TreatmentPriority(Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class TreatmentProcedure:
    code: str  # CDT code
    description: str
    tooth_numbers: List[str]
    surfaces: List[str]
    priority: TreatmentPriority
    estimated_duration: int  # in minutes
    estimated_cost: float
    insurance_coverage: Optional[float] = None
    notes: Optional[str] = None

@dataclass
class TreatmentPlan:
    id: str
    patient_id: str
    created_by: str
    created_at: datetime
    status: TreatmentStatus
    procedures: List[TreatmentProcedure]
    total_cost: float
    insurance_estimate: float
    patient_portion: float
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class TreatmentPlanner:
    def __init__(self, patient_service: PatientService):
        self.patient_service = patient_service
        self.logger = logging.getLogger(__name__)
        self.treatment_plans: Dict[str, TreatmentPlan] = {}
        self._load_state()
    
    def _load_state(self):
        try:
            if os.path.exists('treatment_plans.json'):
                with open('treatment_plans.json', 'r') as f:
                    plans = json.load(f)
                    self.treatment_plans = {
                        plan_id: TreatmentPlan(
                            id=plan['id'],
                            patient_id=plan['patient_id'],
                            created_by=plan['created_by'],
                            created_at=datetime.fromisoformat(plan['created_at']),
                            status=TreatmentStatus(plan['status']),
                            procedures=[
                                TreatmentProcedure(
                                    code=p['code'],
                                    description=p['description'],
                                    tooth_numbers=p['tooth_numbers'],
                                    surfaces=p['surfaces'],
                                    priority=TreatmentPriority(p['priority']),
                                    estimated_duration=p['estimated_duration'],
                                    estimated_cost=p['estimated_cost'],
                                    insurance_coverage=p.get('insurance_coverage'),
                                    notes=p.get('notes')
                                )
                                for p in plan['procedures']
                            ],
                            total_cost=plan['total_cost'],
                            insurance_estimate=plan['insurance_estimate'],
                            patient_portion=plan['patient_portion'],
                            notes=plan.get('notes'),
                            approved_by=plan.get('approved_by'),
                            approved_at=datetime.fromisoformat(plan['approved_at']) if plan.get('approved_at') else None,
                            completed_at=datetime.fromisoformat(plan['completed_at']) if plan.get('completed_at') else None
                        )
                        for plan_id, plan in plans.items()
                    }
        except Exception as e:
            self.logger.error(f"Error loading treatment plans: {e}")
    
    def _save_state(self):
        try:
            plans = {
                plan_id: {
                    'id': plan.id,
                    'patient_id': plan.patient_id,
                    'created_by': plan.created_by,
                    'created_at': plan.created_at.isoformat(),
                    'status': plan.status.value,
                    'procedures': [
                        {
                            'code': p.code,
                            'description': p.description,
                            'tooth_numbers': p.tooth_numbers,
                            'surfaces': p.surfaces,
                            'priority': p.priority.value,
                            'estimated_duration': p.estimated_duration,
                            'estimated_cost': p.estimated_cost,
                            'insurance_coverage': p.insurance_coverage,
                            'notes': p.notes
                        }
                        for p in plan.procedures
                    ],
                    'total_cost': plan.total_cost,
                    'insurance_estimate': plan.insurance_estimate,
                    'patient_portion': plan.patient_portion,
                    'notes': plan.notes,
                    'approved_by': plan.approved_by,
                    'approved_at': plan.approved_at.isoformat() if plan.approved_at else None,
                    'completed_at': plan.completed_at.isoformat() if plan.completed_at else None
                }
                for plan_id, plan in self.treatment_plans.items()
            }
            with open('treatment_plans.json', 'w') as f:
                json.dump(plans, f)
        except Exception as e:
            self.logger.error(f"Error saving treatment plans: {e}")
    
    def create_treatment_plan(
        self,
        patient_id: str,
        created_by: str,
        procedures: List[TreatmentProcedure],
        notes: Optional[str] = None
    ) -> TreatmentPlan:
        # Get patient's insurance information
        patient = self.patient_service.get_patient(patient_id)
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")
        
        # Calculate costs and insurance estimates
        total_cost = sum(p.estimated_cost for p in procedures)
        insurance_estimate = sum(p.insurance_coverage or 0 for p in procedures)
        patient_portion = total_cost - insurance_estimate
        
        plan = TreatmentPlan(
            id=f"TP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            patient_id=patient_id,
            created_by=created_by,
            created_at=datetime.now(),
            status=TreatmentStatus.DRAFT,
            procedures=procedures,
            total_cost=total_cost,
            insurance_estimate=insurance_estimate,
            patient_portion=patient_portion,
            notes=notes
        )
        
        self.treatment_plans[plan.id] = plan
        self._save_state()
        return plan
    
    def get_treatment_plan(self, plan_id: str) -> Optional[TreatmentPlan]:
        return self.treatment_plans.get(plan_id)
    
    def get_patient_treatment_plans(self, patient_id: str) -> List[TreatmentPlan]:
        return [
            plan for plan in self.treatment_plans.values()
            if plan.patient_id == patient_id
        ]
    
    def update_treatment_plan(
        self,
        plan_id: str,
        procedures: Optional[List[TreatmentProcedure]] = None,
        status: Optional[TreatmentStatus] = None,
        notes: Optional[str] = None,
        approved_by: Optional[str] = None
    ) -> Optional[TreatmentPlan]:
        plan = self.treatment_plans.get(plan_id)
        if not plan:
            return None
        
        if procedures is not None:
            plan.procedures = procedures
            # Recalculate costs
            plan.total_cost = sum(p.estimated_cost for p in procedures)
            plan.insurance_estimate = sum(p.insurance_coverage or 0 for p in procedures)
            plan.patient_portion = plan.total_cost - plan.insurance_estimate
        
        if status is not None:
            plan.status = status
            if status == TreatmentStatus.APPROVED:
                plan.approved_by = approved_by
                plan.approved_at = datetime.now()
            elif status == TreatmentStatus.COMPLETED:
                plan.completed_at = datetime.now()
        
        if notes is not None:
            plan.notes = notes
        
        self._save_state()
        return plan
    
    def delete_treatment_plan(self, plan_id: str) -> bool:
        if plan_id in self.treatment_plans:
            del self.treatment_plans[plan_id]
            self._save_state()
            return True
        return False

# Singleton instance
treatment_planner = TreatmentPlanner(PatientService()) 