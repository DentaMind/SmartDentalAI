from typing import List, Optional, Dict
from datetime import datetime
import json
import logging
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class CaseStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

@dataclass
class AIAnalysis:
    diagnosis: str
    confidence: float
    suggestions: List[str]
    timestamp: str

@dataclass
class DoctorAnalysis:
    diagnosis: str
    treatment_plan: str
    notes: Optional[str] = None
    timestamp: str

@dataclass
class Case:
    id: str
    patient_id: str
    title: str
    description: str
    assigned_doctor: str
    status: CaseStatus
    ai_analysis: Optional[AIAnalysis] = None
    doctor_analysis: Optional[DoctorAnalysis] = None
    created_at: str
    updated_at: str

class CaseService:
    def __init__(self):
        self.cases_file = "cases.json"
        self.cases = self._load_cases()

    def _load_cases(self) -> List[Case]:
        try:
            with open(self.cases_file, 'r') as f:
                data = json.load(f)
                return [Case(**case) for case in data]
        except FileNotFoundError:
            return []
        except Exception as e:
            logger.error(f"Error loading cases: {e}")
            return []

    def _save_cases(self):
        try:
            with open(self.cases_file, 'w') as f:
                json.dump([asdict(case) for case in self.cases], f)
        except Exception as e:
            logger.error(f"Error saving cases: {e}")

    def create_case(self, patient_id: str, title: str, description: str, doctor_id: str) -> Case:
        case = Case(
            id=f"case_{datetime.now().timestamp()}",
            patient_id=patient_id,
            title=title,
            description=description,
            assigned_doctor=doctor_id,
            status=CaseStatus.PENDING,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        self.cases.append(case)
        self._save_cases()
        return case

    def start_ai_analysis(self, case_id: str) -> Optional[Case]:
        for case in self.cases:
            if case.id == case_id:
                case.status = CaseStatus.IN_PROGRESS
                case.updated_at = datetime.now().isoformat()
                self._save_cases()
                return case
        return None

    def update_ai_analysis(self, case_id: str, diagnosis: str, confidence: float, suggestions: List[str]) -> Optional[Case]:
        for case in self.cases:
            if case.id == case_id:
                case.ai_analysis = AIAnalysis(
                    diagnosis=diagnosis,
                    confidence=confidence,
                    suggestions=suggestions,
                    timestamp=datetime.now().isoformat()
                )
                case.updated_at = datetime.now().isoformat()
                self._save_cases()
                return case
        return None

    def submit_doctor_analysis(self, case_id: str, diagnosis: str, treatment_plan: str, notes: Optional[str] = None) -> Optional[Case]:
        for case in self.cases:
            if case.id == case_id:
                case.doctor_analysis = DoctorAnalysis(
                    diagnosis=diagnosis,
                    treatment_plan=treatment_plan,
                    notes=notes,
                    timestamp=datetime.now().isoformat()
                )
                case.status = CaseStatus.COMPLETED
                case.updated_at = datetime.now().isoformat()
                self._save_cases()
                return case
        return None

    def get_case(self, case_id: str) -> Optional[Case]:
        for case in self.cases:
            if case.id == case_id:
                return case
        return None

    def get_doctor_cases(self, doctor_id: str) -> List[Case]:
        return [case for case in self.cases if case.assigned_doctor == doctor_id]

    def get_all_cases(self) -> List[Case]:
        return self.cases

# Singleton instance
case_service = CaseService() 