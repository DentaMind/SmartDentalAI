from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum
from dataclasses import dataclass, field
import json
import logging

class ResearchMode(Enum):
    CLINICAL = "clinical"
    TRAINING = "training"

class SuggestionAction(Enum):
    SHOWN = "shown"
    ACCEPTED = "accepted"
    MODIFIED = "modified"
    REJECTED = "rejected"

@dataclass
class ResearchEncounter:
    encounter_id: str
    doctor_id: str
    patient_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    mode: ResearchMode = ResearchMode.CLINICAL
    ai_suggestions: List[Dict] = field(default_factory=list)
    procedures_suggested: int = 0
    procedures_accepted: int = 0
    procedures_modified: int = 0
    procedures_rejected: int = 0
    total_time_seconds: Optional[int] = None
    patient_acceptance: Optional[bool] = None
    faculty_review: Optional[Dict] = None
    audit_trail: List[Dict] = field(default_factory=list)

@dataclass
class ResearchMetrics:
    doctor_id: str
    total_cases: int = 0
    avg_case_time: float = 0.0
    suggestion_acceptance_rate: float = 0.0
    patient_acceptance_rate: float = 0.0
    accuracy_score: float = 0.0
    efficiency_score: float = 0.0
    last_updated: datetime = field(default_factory=datetime.now)

class ResearchService:
    def __init__(self):
        self.encounters_file = "research_encounters.json"
        self.metrics_file = "research_metrics.json"
        self.encounters: Dict[str, ResearchEncounter] = {}
        self.metrics: Dict[str, ResearchMetrics] = {}
        self.load_data()

    def load_data(self):
        try:
            with open(self.encounters_file, 'r') as f:
                data = json.load(f)
                self.encounters = {
                    k: ResearchEncounter(**v) for k, v in data.items()
                }
        except FileNotFoundError:
            self.encounters = {}

        try:
            with open(self.metrics_file, 'r') as f:
                data = json.load(f)
                self.metrics = {
                    k: ResearchMetrics(**v) for k, v in data.items()
                }
        except FileNotFoundError:
            self.metrics = {}

    def save_data(self):
        with open(self.encounters_file, 'w') as f:
            json.dump(
                {k: v.__dict__ for k, v in self.encounters.items()},
                f,
                default=str
            )
        with open(self.metrics_file, 'w') as f:
            json.dump(
                {k: v.__dict__ for k, v in self.metrics.items()},
                f,
                default=str
            )

    def start_encounter(self, doctor_id: str, patient_id: str, mode: ResearchMode = ResearchMode.CLINICAL) -> str:
        encounter = ResearchEncounter(
            encounter_id=f"enc_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            doctor_id=doctor_id,
            patient_id=patient_id,
            start_time=datetime.now(),
            mode=mode
        )
        self.encounters[encounter.encounter_id] = encounter
        self.save_data()
        return encounter.encounter_id

    def end_encounter(self, encounter_id: str, patient_acceptance: bool):
        if encounter_id not in self.encounters:
            raise ValueError("Encounter not found")
        
        encounter = self.encounters[encounter_id]
        encounter.end_time = datetime.now()
        encounter.patient_acceptance = patient_acceptance
        encounter.total_time_seconds = int((encounter.end_time - encounter.start_time).total_seconds())
        
        self.update_metrics(encounter)
        self.save_data()

    def record_suggestion(self, encounter_id: str, suggestion_type: str, action: SuggestionAction):
        if encounter_id not in self.encounters:
            raise ValueError("Encounter not found")
        
        encounter = self.encounters[encounter_id]
        suggestion = {
            "type": suggestion_type,
            "action": action,
            "timestamp": datetime.now().isoformat()
        }
        encounter.ai_suggestions.append(suggestion)
        
        if action == SuggestionAction.SHOWN:
            encounter.procedures_suggested += 1
        elif action == SuggestionAction.ACCEPTED:
            encounter.procedures_accepted += 1
        elif action == SuggestionAction.MODIFIED:
            encounter.procedures_modified += 1
        elif action == SuggestionAction.REJECTED:
            encounter.procedures_rejected += 1
        
        self.save_data()

    def add_audit_trail(self, encounter_id: str, action: str, details: Dict):
        if encounter_id not in self.encounters:
            raise ValueError("Encounter not found")
        
        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details
        }
        self.encounters[encounter_id].audit_trail.append(audit_entry)
        self.save_data()

    def update_metrics(self, encounter: ResearchEncounter):
        if encounter.doctor_id not in self.metrics:
            self.metrics[encounter.doctor_id] = ResearchMetrics(doctor_id=encounter.doctor_id)
        
        metrics = self.metrics[encounter.doctor_id]
        metrics.total_cases += 1
        
        # Update average case time
        if encounter.total_time_seconds:
            total_time = metrics.avg_case_time * (metrics.total_cases - 1)
            metrics.avg_case_time = (total_time + encounter.total_time_seconds) / metrics.total_cases
        
        # Update suggestion acceptance rate
        total_suggestions = encounter.procedures_suggested
        if total_suggestions > 0:
            accepted = encounter.procedures_accepted
            metrics.suggestion_acceptance_rate = accepted / total_suggestions
        
        # Update patient acceptance rate
        if encounter.patient_acceptance is not None:
            total_acceptances = sum(1 for e in self.encounters.values() 
                                  if e.doctor_id == encounter.doctor_id and e.patient_acceptance is not None)
            accepted = sum(1 for e in self.encounters.values() 
                          if e.doctor_id == encounter.doctor_id and e.patient_acceptance)
            if total_acceptances > 0:
                metrics.patient_acceptance_rate = accepted / total_acceptances
        
        metrics.last_updated = datetime.now()

    def get_doctor_metrics(self, doctor_id: str) -> Optional[ResearchMetrics]:
        return self.metrics.get(doctor_id)

    def get_encounter(self, encounter_id: str) -> Optional[ResearchEncounter]:
        return self.encounters.get(encounter_id)

    def get_doctor_encounters(self, doctor_id: str) -> List[ResearchEncounter]:
        return [e for e in self.encounters.values() if e.doctor_id == doctor_id]

# Singleton instance
research_service = ResearchService() 