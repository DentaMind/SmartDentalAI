from typing import List, Optional, Dict
from datetime import datetime
import json
import logging
from enum import Enum
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

class ResearchMode(str, Enum):
    CLINICAL = "clinical"
    TRAINING = "training"

class SuggestionAction(str, Enum):
    ACCEPTED = "accepted"
    MODIFIED = "modified"
    REJECTED = "rejected"
    PENDING = "pending"

@dataclass
class AISuggestion:
    type: str
    action: SuggestionAction
    timestamp: str

@dataclass
class ResearchEncounter:
    encounter_id: str
    patient_id: str
    doctor_id: str
    mode: ResearchMode
    start_time: str
    end_time: Optional[str] = None
    procedures_suggested: int = 0
    procedures_accepted: int = 0
    procedures_modified: int = 0
    procedures_rejected: int = 0
    ai_suggestions: List[AISuggestion] = None
    patient_acceptance: Optional[bool] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None

class ResearchService:
    def __init__(self):
        self.encounters_file = "research_encounters.json"
        self.encounters = self._load_encounters()

    def _load_encounters(self) -> List[ResearchEncounter]:
        try:
            with open(self.encounters_file, 'r') as f:
                data = json.load(f)
                return [ResearchEncounter(**encounter) for encounter in data]
        except FileNotFoundError:
            return []
        except Exception as e:
            logger.error(f"Error loading encounters: {e}")
            return []

    def _save_encounters(self):
        try:
            with open(self.encounters_file, 'w') as f:
                json.dump([asdict(encounter) for encounter in self.encounters], f)
        except Exception as e:
            logger.error(f"Error saving encounters: {e}")

    def start_encounter(self, patient_id: str, doctor_id: str, mode: ResearchMode) -> ResearchEncounter:
        encounter = ResearchEncounter(
            encounter_id=f"enc_{datetime.now().timestamp()}",
            patient_id=patient_id,
            doctor_id=doctor_id,
            mode=mode,
            start_time=datetime.now().isoformat(),
            ai_suggestions=[]
        )
        self.encounters.append(encounter)
        self._save_encounters()
        return encounter

    def end_encounter(self, encounter_id: str, patient_acceptance: bool) -> Optional[ResearchEncounter]:
        for encounter in self.encounters:
            if encounter.encounter_id == encounter_id:
                encounter.end_time = datetime.now().isoformat()
                encounter.patient_acceptance = patient_acceptance
                self._save_encounters()
                return encounter
        return None

    def submit_diagnosis(self, encounter_id: str, diagnosis: str, treatment_plan: str, 
                        confidence: float, notes: Optional[str] = None) -> Optional[ResearchEncounter]:
        for encounter in self.encounters:
            if encounter.encounter_id == encounter_id:
                encounter.diagnosis = diagnosis
                encounter.treatment_plan = treatment_plan
                encounter.confidence = confidence
                encounter.notes = notes
                self._save_encounters()
                return encounter
        return None

    def add_ai_suggestion(self, encounter_id: str, suggestion_type: str, 
                         action: SuggestionAction) -> Optional[ResearchEncounter]:
        for encounter in self.encounters:
            if encounter.encounter_id == encounter_id:
                suggestion = AISuggestion(
                    type=suggestion_type,
                    action=action,
                    timestamp=datetime.now().isoformat()
                )
                encounter.ai_suggestions.append(suggestion)
                self._save_encounters()
                return encounter
        return None

    def get_doctor_encounters(self, doctor_id: str) -> List[ResearchEncounter]:
        return [enc for enc in self.encounters if enc.doctor_id == doctor_id]

    def get_all_encounters(self) -> List[ResearchEncounter]:
        return self.encounters

    def get_research_metrics(self, doctor_id: str) -> Dict:
        doctor_encounters = self.get_doctor_encounters(doctor_id)
        total_cases = len(doctor_encounters)
        completed_cases = len([enc for enc in doctor_encounters if enc.end_time])
        
        total_suggestions = sum(enc.procedures_suggested for enc in doctor_encounters)
        accepted_suggestions = sum(enc.procedures_accepted for enc in doctor_encounters)
        
        return {
            "total_cases": total_cases,
            "completed_cases": completed_cases,
            "suggestion_acceptance_rate": (
                accepted_suggestions / total_suggestions if total_suggestions > 0 else 0
            ),
            "average_case_time": self._calculate_average_case_time(doctor_encounters),
            "patient_acceptance_rate": self._calculate_patient_acceptance_rate(doctor_encounters)
        }

    def _calculate_average_case_time(self, encounters: List[ResearchEncounter]) -> float:
        completed_cases = [enc for enc in encounters if enc.end_time]
        if not completed_cases:
            return 0
        
        total_time = sum(
            (datetime.fromisoformat(enc.end_time) - datetime.fromisoformat(enc.start_time)).total_seconds()
            for enc in completed_cases
        )
        return total_time / len(completed_cases)

    def _calculate_patient_acceptance_rate(self, encounters: List[ResearchEncounter]) -> float:
        completed_cases = [enc for enc in encounters if enc.patient_acceptance is not None]
        if not completed_cases:
            return 0
        
        accepted_cases = sum(1 for enc in completed_cases if enc.patient_acceptance)
        return accepted_cases / len(completed_cases)

# Singleton instance
research_service = ResearchService() 