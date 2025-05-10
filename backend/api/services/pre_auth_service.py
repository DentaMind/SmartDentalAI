from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass, asdict
import json
import os
import logging

class PreAuthStatus(str, Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"

@dataclass
class PreAuthHistoryEntry:
    date: str
    status: PreAuthStatus
    notes: Optional[str] = None

@dataclass
class PreAuthRequest:
    id: str
    treatment_plan_id: str
    procedure_code: str
    status: PreAuthStatus
    submitted_date: str
    response_date: Optional[str] = None
    insurance_provider: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    history: List[PreAuthHistoryEntry]

class PreAuthService:
    def __init__(self):
        self.requests: Dict[str, PreAuthRequest] = {}
        self.storage_file = "pre_auth_requests.json"
        self.load_requests()

    def load_requests(self) -> None:
        """Load pre-authorization requests from storage file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    for req_id, req_data in data.items():
                        history = [
                            PreAuthHistoryEntry(**entry)
                            for entry in req_data['history']
                        ]
                        self.requests[req_id] = PreAuthRequest(
                            **{k: v for k, v in req_data.items() if k != 'history'},
                            history=history
                        )
        except Exception as e:
            logging.error(f"Error loading pre-auth requests: {e}")

    def save_requests(self) -> None:
        """Save pre-authorization requests to storage file."""
        try:
            data = {
                req_id: {
                    **asdict(req),
                    'history': [asdict(entry) for entry in req.history]
                }
                for req_id, req in self.requests.items()
            }
            with open(self.storage_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving pre-auth requests: {e}")

    def create_request(
        self,
        treatment_plan_id: str,
        procedure_code: str,
        insurance_provider: str,
        notes: Optional[str] = None
    ) -> PreAuthRequest:
        """Create a new pre-authorization request."""
        request_id = str(len(self.requests) + 1)
        now = datetime.now().isoformat()
        
        request = PreAuthRequest(
            id=request_id,
            treatment_plan_id=treatment_plan_id,
            procedure_code=procedure_code,
            status=PreAuthStatus.PENDING,
            submitted_date=now,
            insurance_provider=insurance_provider,
            notes=notes,
            history=[
                PreAuthHistoryEntry(
                    date=now,
                    status=PreAuthStatus.PENDING,
                    notes=notes
                )
            ]
        )
        
        self.requests[request_id] = request
        self.save_requests()
        return request

    def get_request(self, request_id: str) -> Optional[PreAuthRequest]:
        """Get a pre-authorization request by ID."""
        return self.requests.get(request_id)

    def get_requests_by_treatment_plan(self, treatment_plan_id: str) -> List[PreAuthRequest]:
        """Get all pre-authorization requests for a treatment plan."""
        return [
            req for req in self.requests.values()
            if req.treatment_plan_id == treatment_plan_id
        ]

    def update_status(
        self,
        request_id: str,
        new_status: PreAuthStatus,
        notes: Optional[str] = None
    ) -> Optional[PreAuthRequest]:
        """Update the status of a pre-authorization request."""
        request = self.requests.get(request_id)
        if not request:
            return None

        now = datetime.now().isoformat()
        request.status = new_status
        request.response_date = now
        request.history.append(
            PreAuthHistoryEntry(
                date=now,
                status=new_status,
                notes=notes
            )
        )

        self.save_requests()
        return request

    def get_all_requests(self) -> List[PreAuthRequest]:
        """Get all pre-authorization requests."""
        return list(self.requests.values())

    def get_requests_by_status(self, status: PreAuthStatus) -> List[PreAuthRequest]:
        """Get all pre-authorization requests with a specific status."""
        return [
            req for req in self.requests.values()
            if req.status == status
        ]

    def get_requests_by_insurance_provider(self, provider: str) -> List[PreAuthRequest]:
        """Get all pre-authorization requests for a specific insurance provider."""
        return [
            req for req in self.requests.values()
            if req.insurance_provider == provider
        ]

# Create a singleton instance
pre_auth_service = PreAuthService() 