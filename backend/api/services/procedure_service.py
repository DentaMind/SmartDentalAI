from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from api.models.scheduling import Procedure, ProviderProfile, ProcedureCategory
from api.models.base import Base
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ProcedureService:
    def __init__(self, db: Session):
        self.db = db

    async def get_procedure_by_code(self, code: str) -> Optional[Procedure]:
        """Get a procedure by its ADA code."""
        return self.db.query(Procedure).filter(Procedure.code == code).first()

    async def get_procedure_by_id(self, procedure_id: str) -> Optional[Procedure]:
        """Get a procedure by its UUID."""
        return self.db.query(Procedure).filter(Procedure.id == procedure_id).first()

    async def search_procedures(
        self,
        query: Optional[str] = None,
        category: Optional[ProcedureCategory] = None,
        active_only: bool = True
    ) -> List[Procedure]:
        """Search procedures by name, code, or category."""
        filters = []
        if active_only:
            filters.append(Procedure.is_active == True)
        if query:
            filters.append(
                or_(
                    Procedure.name.ilike(f"%{query}%"),
                    Procedure.code.ilike(f"%{query}%"),
                    Procedure.description.ilike(f"%{query}%")
                )
            )
        if category:
            filters.append(Procedure.category == category)

        return self.db.query(Procedure).filter(and_(*filters)).all()

    async def get_provider_duration(
        self,
        procedure_id: str,
        provider_id: str
    ) -> int:
        """Calculate the expected duration for a provider performing a procedure."""
        # Get the base procedure
        procedure = await self.get_procedure_by_id(procedure_id)
        if not procedure:
            raise ValueError(f"Procedure {procedure_id} not found")

        # Get provider's profile for this procedure
        profile = self.db.query(ProviderProfile).filter(
            ProviderProfile.provider_id == provider_id,
            ProviderProfile.procedure_id == procedure_id,
            ProviderProfile.is_active == True
        ).first()

        if profile:
            # If we have enough data points, use the provider's average
            if profile.total_procedures >= 5 and profile.average_duration_minutes:
                return profile.average_duration_minutes
            # Otherwise, apply their modifier to the default duration
            return int(procedure.default_duration_minutes * profile.duration_modifier)
        
        # If no profile exists, return the default duration
        return procedure.default_duration_minutes

    async def update_provider_duration(
        self,
        procedure_id: str,
        provider_id: str,
        actual_duration: int
    ) -> ProviderProfile:
        """Update a provider's duration tracking for a procedure."""
        profile = self.db.query(ProviderProfile).filter(
            ProviderProfile.provider_id == provider_id,
            ProviderProfile.procedure_id == procedure_id
        ).first()

        if not profile:
            # Create new profile if none exists
            profile = ProviderProfile(
                provider_id=provider_id,
                procedure_id=procedure_id,
                total_procedures=1,
                average_duration_minutes=actual_duration,
                duration_modifier=1.0
            )
            self.db.add(profile)
        else:
            # Update existing profile
            total_duration = (profile.average_duration_minutes or 0) * profile.total_procedures
            profile.total_procedures += 1
            profile.average_duration_minutes = (total_duration + actual_duration) / profile.total_procedures
            profile.duration_modifier = profile.average_duration_minutes / profile.procedure.default_duration_minutes

        self.db.commit()
        return profile

    async def create_procedure(
        self,
        code: str,
        name: str,
        description: str,
        category: ProcedureCategory,
        default_duration_minutes: int
    ) -> Procedure:
        """Create a new procedure."""
        procedure = Procedure(
            code=code,
            name=name,
            description=description,
            category=category,
            default_duration_minutes=default_duration_minutes
        )
        self.db.add(procedure)
        self.db.commit()
        return procedure

    async def update_procedure(
        self,
        procedure_id: str,
        **kwargs
    ) -> Optional[Procedure]:
        """Update an existing procedure."""
        procedure = await self.get_procedure_by_id(procedure_id)
        if not procedure:
            return None

        for key, value in kwargs.items():
            if hasattr(procedure, key):
                setattr(procedure, key, value)

        procedure.updated_at = datetime.utcnow()
        self.db.commit()
        return procedure

    async def deactivate_procedure(self, procedure_id: str) -> bool:
        """Deactivate a procedure (soft delete)."""
        procedure = await self.get_procedure_by_id(procedure_id)
        if not procedure:
            return False

        procedure.is_active = False
        procedure.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    async def get_procedure_requirements(self, procedure_id: str) -> Dict[str, Any]:
        """Get any special requirements for a procedure."""
        procedure = await self.get_procedure_by_id(procedure_id)
        if not procedure:
            return {}

        # Example requirements based on procedure category
        requirements = {
            "pre_operative": [],
            "post_operative": [],
            "equipment": [],
            "staff_requirements": 1,  # Default to 1 staff member
            "room_requirements": ["dental_chair"]
        }

        if procedure.category == ProcedureCategory.SURGICAL:
            requirements["pre_operative"].extend([
                "medical_clearance",
                "pre_operative_instructions"
            ])
            requirements["post_operative"].extend([
                "post_operative_instructions",
                "follow_up_appointment"
            ])
            requirements["equipment"].extend([
                "surgical_tray",
                "sutures"
            ])
            requirements["staff_requirements"] = 2  # Surgeon + assistant

        elif procedure.category == ProcedureCategory.ENDODONTIC:
            requirements["equipment"].extend([
                "endodontic_tray",
                "rubber_dam",
                "apex_locator"
            ])
            requirements["room_requirements"].append("xray_capable")

        return requirements

    async def get_procedure_statistics(self) -> Dict[str, Any]:
        """Get statistics about procedures."""
        total_procedures = self.db.query(Procedure).count()
        active_procedures = self.db.query(Procedure).filter(Procedure.is_active == True).count()
        
        category_counts = {}
        for category in ProcedureCategory:
            count = self.db.query(Procedure).filter(
                Procedure.category == category,
                Procedure.is_active == True
            ).count()
            category_counts[category.value] = count

        return {
            "total_procedures": total_procedures,
            "active_procedures": active_procedures,
            "category_counts": category_counts
        } 