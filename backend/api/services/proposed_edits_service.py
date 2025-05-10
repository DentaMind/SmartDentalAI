from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional
import json
import os
import logging

logger = logging.getLogger(__name__)

class EditStatus(Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"

@dataclass
class ProposedEdit:
    id: str
    treatment_plan_id: str
    proposed_by: str
    proposed_at: datetime
    status: EditStatus
    reason: str
    changes: dict
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None

class ProposedEditsService:
    def __init__(self, storage_file: str = "proposed_edits.json"):
        self.storage_file = storage_file
        self.edits: List[ProposedEdit] = []
        self.load_edits()

    def load_edits(self) -> None:
        """Load proposed edits from storage file."""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    self.edits = [
                        ProposedEdit(
                            id=edit['id'],
                            treatment_plan_id=edit['treatment_plan_id'],
                            proposed_by=edit['proposed_by'],
                            proposed_at=datetime.fromisoformat(edit['proposed_at']),
                            status=EditStatus(edit['status']),
                            reason=edit['reason'],
                            changes=edit['changes'],
                            reviewed_by=edit.get('reviewed_by'),
                            reviewed_at=datetime.fromisoformat(edit['reviewed_at']) if edit.get('reviewed_at') else None,
                            review_notes=edit.get('review_notes')
                        )
                        for edit in data
                    ]
            except Exception as e:
                logger.error(f"Error loading proposed edits: {e}")
                self.edits = []

    def save_edits(self) -> None:
        """Save proposed edits to storage file."""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump([
                    {
                        'id': edit.id,
                        'treatment_plan_id': edit.treatment_plan_id,
                        'proposed_by': edit.proposed_by,
                        'proposed_at': edit.proposed_at.isoformat(),
                        'status': edit.status.value,
                        'reason': edit.reason,
                        'changes': edit.changes,
                        'reviewed_by': edit.reviewed_by,
                        'reviewed_at': edit.reviewed_at.isoformat() if edit.reviewed_at else None,
                        'review_notes': edit.review_notes
                    }
                    for edit in self.edits
                ], f, indent=2)
        except Exception as e:
            logger.error(f"Error saving proposed edits: {e}")

    def propose_edit(self, treatment_plan_id: str, proposed_by: str, reason: str, changes: dict) -> ProposedEdit:
        """Create a new proposed edit."""
        edit = ProposedEdit(
            id=f"edit_{len(self.edits) + 1}",
            treatment_plan_id=treatment_plan_id,
            proposed_by=proposed_by,
            proposed_at=datetime.now(),
            status=EditStatus.PENDING_REVIEW,
            reason=reason,
            changes=changes
        )
        self.edits.append(edit)
        self.save_edits()
        return edit

    def get_edits_by_plan(self, treatment_plan_id: str) -> List[ProposedEdit]:
        """Get all proposed edits for a treatment plan."""
        return [edit for edit in self.edits if edit.treatment_plan_id == treatment_plan_id]

    def get_pending_edits(self) -> List[ProposedEdit]:
        """Get all pending edits."""
        return [edit for edit in self.edits if edit.status == EditStatus.PENDING_REVIEW]

    def review_edit(self, edit_id: str, reviewed_by: str, status: EditStatus, review_notes: Optional[str] = None) -> ProposedEdit:
        """Review a proposed edit."""
        for edit in self.edits:
            if edit.id == edit_id:
                edit.status = status
                edit.reviewed_by = reviewed_by
                edit.reviewed_at = datetime.now()
                edit.review_notes = review_notes
                self.save_edits()
                return edit
        raise ValueError(f"Edit {edit_id} not found")

    def get_edit(self, edit_id: str) -> ProposedEdit:
        """Get a specific edit by ID."""
        for edit in self.edits:
            if edit.id == edit_id:
                return edit
        raise ValueError(f"Edit {edit_id} not found") 