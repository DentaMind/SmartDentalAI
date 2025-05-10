import logging
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, select
import uuid
from datetime import datetime

from ..models.educational_content import (
    EducationalContent, 
    ContentType, 
    ContentCategory, 
    RiskFactor,
    content_risk_factors
)
from ..models.patient import Patient
from ..schemas.educational_content import (
    EducationalContentCreate,
    EducationalContentUpdate,
    ContentFilter,
    EducationalRecommendation,
    EducationalRecommendationsResponse
)

logger = logging.getLogger(__name__)

class EducationalContentService:
    """Service for managing educational content and recommendations"""
    
    async def create_content(
        self, 
        db: Session, 
        content_data: EducationalContentCreate,
        created_by: Optional[str] = None
    ) -> EducationalContent:
        """Create new educational content"""
        try:
            content_id = str(uuid.uuid4())
            new_content = EducationalContent(
                id=content_id,
                title=content_data.title,
                description=content_data.description,
                content_type=content_data.content_type,
                category=content_data.category,
                content_url=content_data.content_url,
                content_text=content_data.content_text,
                thumbnail_url=content_data.thumbnail_url,
                duration=content_data.duration,
                author=content_data.author,
                source=content_data.source,
                priority=content_data.priority,
                is_featured=content_data.is_featured,
                tags=content_data.tags if content_data.tags else []
            )
            
            # Add risk factors
            if content_data.target_risk_factors:
                new_content.target_risk_factors = content_data.target_risk_factors
            
            db.add(new_content)
            db.commit()
            db.refresh(new_content)
            
            logger.info(f"Created educational content {content_id}: {content_data.title}")
            return new_content
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating educational content: {e}")
            raise
    
    async def get_content(self, db: Session, content_id: str) -> Optional[EducationalContent]:
        """Get a specific educational content by ID"""
        return db.query(EducationalContent).filter(EducationalContent.id == content_id).first()
    
    async def update_content(
        self, 
        db: Session, 
        content_id: str, 
        update_data: EducationalContentUpdate
    ) -> Optional[EducationalContent]:
        """Update existing educational content"""
        try:
            content = await self.get_content(db, content_id)
            if not content:
                return None
                
            # Update only provided fields
            update_dict = update_data.dict(exclude_unset=True)
            
            # Special handling for risk factors
            if 'target_risk_factors' in update_dict:
                content.target_risk_factors = update_dict.pop('target_risk_factors')
            
            # Update the rest of fields
            for key, value in update_dict.items():
                setattr(content, key, value)
            
            content.updated_at = datetime.now()
            
            db.commit()
            db.refresh(content)
            logger.info(f"Updated educational content {content_id}")
            return content
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating educational content: {e}")
            raise
    
    async def delete_content(self, db: Session, content_id: str) -> bool:
        """Delete educational content"""
        try:
            content = await self.get_content(db, content_id)
            if not content:
                return False
                
            db.delete(content)
            db.commit()
            logger.info(f"Deleted educational content {content_id}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting educational content: {e}")
            raise
    
    async def search_content(
        self, 
        db: Session, 
        filters: ContentFilter = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[EducationalContent]:
        """Search and filter educational content"""
        query = db.query(EducationalContent)
        
        if filters:
            if filters.content_type:
                query = query.filter(EducationalContent.content_type == filters.content_type)
            
            if filters.category:
                query = query.filter(EducationalContent.category == filters.category)
            
            if filters.is_featured is not None:
                query = query.filter(EducationalContent.is_featured == filters.is_featured)
            
            if filters.search_query:
                search_term = f"%{filters.search_query}%"
                query = query.filter(
                    or_(
                        EducationalContent.title.ilike(search_term),
                        EducationalContent.description.ilike(search_term)
                    )
                )
            
            if filters.tags:
                for tag in filters.tags:
                    query = query.filter(EducationalContent.tags.contains([tag]))
            
            if filters.risk_factors:
                # Filter by risk factors - this requires joining with the association table
                for risk_factor in filters.risk_factors:
                    query = query.filter(
                        EducationalContent.target_risk_factors.any(risk_factor)
                    )
        
        # Order by priority (higher first) and then by created date (newer first)
        query = query.order_by(desc(EducationalContent.priority), desc(EducationalContent.created_at))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        return query.all()
    
    async def increment_view_count(self, db: Session, content_id: str) -> bool:
        """Increment the view count for a content item"""
        try:
            content = await self.get_content(db, content_id)
            if not content:
                return False
            
            content.view_count += 1
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error incrementing view count: {e}")
            return False
    
    async def update_completion_rate(
        self, 
        db: Session, 
        content_id: str, 
        completion_percentage: int
    ) -> bool:
        """Update the completion rate for educational content"""
        try:
            content = await self.get_content(db, content_id)
            if not content:
                return False
            
            # Update based on a moving average
            if content.view_count == 0:
                content.completion_rate = completion_percentage
            else:
                # Simple moving average
                current_total = content.completion_rate * content.view_count
                new_total = current_total + completion_percentage
                content.completion_rate = new_total // (content.view_count + 1)
            
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating completion rate: {e}")
            return False
    
    async def get_patient_risk_factors(self, db: Session, patient_id: str) -> List[RiskFactor]:
        """Extract risk factors from patient data"""
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return []
        
        risk_factors = []
        
        # Extract risk factors from medical history
        medical_history = None
        if hasattr(patient, 'medical_history') and patient.medical_history:
            medical_history = patient.medical_history
        elif hasattr(patient, 'medicalHistory') and patient.medicalHistory:
            try:
                if isinstance(patient.medicalHistory, str):
                    import json
                    medical_history = json.loads(patient.medicalHistory)
                else:
                    medical_history = patient.medicalHistory
            except Exception as e:
                logger.error(f"Error parsing medical history: {e}")
        
        if medical_history:
            # Check for specific risk factors
            if medical_history.get('current_smoker') or medical_history.get('is_smoker'):
                risk_factors.append(RiskFactor.SMOKING)
            
            if medical_history.get('has_diabetes'):
                risk_factors.append(RiskFactor.DIABETES)
            
            if medical_history.get('has_heart_disease'):
                risk_factors.append(RiskFactor.HEART_DISEASE)
            
            if medical_history.get('has_hypertension') or medical_history.get('has_high_blood_pressure'):
                risk_factors.append(RiskFactor.HIGH_BLOOD_PRESSURE)
            
            if medical_history.get('pregnant'):
                risk_factors.append(RiskFactor.PREGNANCY)
        
        # Check dental records for risk factors
        if hasattr(patient, 'dental_records') and patient.dental_records:
            dental_records = patient.dental_records
            
            # Check for periodontal disease
            if dental_records.get('periodontal_status') in ['moderate', 'severe'] or dental_records.get('perio_risk') in ['moderate', 'high']:
                risk_factors.append(RiskFactor.PERIODONTAL_DISEASE)
            
            # Check for caries risk
            if dental_records.get('caries_risk') in ['moderate', 'high']:
                risk_factors.append(RiskFactor.CARIES_RISK)
        
        # If we have appointment history, check for missed appointments as indication of anxiety
        if hasattr(patient, 'appointments') and patient.appointments:
            missed_count = sum(1 for appt in patient.appointments if appt.status == 'missed')
            if missed_count >= 2:
                risk_factors.append(RiskFactor.DENTAL_ANXIETY)
        
        return risk_factors
    
    async def get_recommended_content(
        self, 
        db: Session, 
        patient_id: str, 
        limit: int = 5
    ) -> EducationalRecommendationsResponse:
        """Get personalized educational content recommendations for a patient"""
        # Extract risk factors
        risk_factors = await self.get_patient_risk_factors(db, patient_id)
        
        # If no risk factors found, return general educational content
        if not risk_factors:
            # Get featured general content
            general_content = db.query(EducationalContent)\
                .filter(EducationalContent.is_featured == True)\
                .order_by(desc(EducationalContent.priority))\
                .limit(limit)\
                .all()
            
            recommendations = []
            for content in general_content:
                recommendations.append(
                    EducationalRecommendation(
                        **content.to_dict(),
                        relevance_score=0.5,
                        recommendation_reason="General educational material to improve oral health knowledge"
                    )
                )
            
            return EducationalRecommendationsResponse(
                patient_id=patient_id,
                recommendations=recommendations,
                risk_factors_identified=[]
            )
        
        # For each risk factor, get relevant content
        relevant_content = {}
        risk_factor_names = [rf.value for rf in risk_factors]
        
        for risk_factor in risk_factors:
            # Get content targeting this risk factor
            content_items = db.query(EducationalContent)\
                .filter(EducationalContent.target_risk_factors.any(risk_factor))\
                .order_by(desc(EducationalContent.priority))\
                .all()
            
            for content in content_items:
                if content.id not in relevant_content:
                    # Calculate relevance score based on how many of the patient's risk factors
                    # are targeted by this content
                    content_risk_factors = [rf.value for rf in content.target_risk_factors]
                    matching_factors = set(risk_factor_names).intersection(set(content_risk_factors))
                    relevance_score = len(matching_factors) / len(risk_factor_names)
                    
                    # Get reason for recommendation
                    if risk_factor == RiskFactor.SMOKING:
                        reason = "Recommended due to smoking status to help reduce oral health risks"
                    elif risk_factor == RiskFactor.DIABETES:
                        reason = "Important information for diabetes management and oral health"
                    elif risk_factor == RiskFactor.PERIODONTAL_DISEASE:
                        reason = "Recommended to help manage periodontal disease"
                    elif risk_factor == RiskFactor.CARIES_RISK:
                        reason = "Recommended to reduce cavity risk and improve oral health"
                    else:
                        reason = f"Recommended based on your {risk_factor.value.replace('_', ' ')} risk factor"
                    
                    relevant_content[content.id] = {
                        "content": content,
                        "relevance_score": relevance_score,
                        "recommendation_reason": reason
                    }
        
        # Sort by relevance score and take top results
        sorted_content = sorted(
            relevant_content.values(), 
            key=lambda x: x["relevance_score"], 
            reverse=True
        )[:limit]
        
        # Format recommendations
        recommendations = []
        for item in sorted_content:
            content = item["content"]
            recommendation = EducationalRecommendation(
                **content.to_dict(),
                relevance_score=item["relevance_score"],
                recommendation_reason=item["recommendation_reason"]
            )
            recommendations.append(recommendation)
        
        # If we don't have enough recommendations, add some general content
        if len(recommendations) < limit:
            needed = limit - len(recommendations)
            existing_ids = [r.id for r in recommendations]
            
            general_content = db.query(EducationalContent)\
                .filter(EducationalContent.is_featured == True)\
                .filter(EducationalContent.id.notin_(existing_ids))\
                .order_by(desc(EducationalContent.priority))\
                .limit(needed)\
                .all()
            
            for content in general_content:
                recommendations.append(
                    EducationalRecommendation(
                        **content.to_dict(),
                        relevance_score=0.3,
                        recommendation_reason="General educational material to improve oral health knowledge"
                    )
                )
        
        return EducationalRecommendationsResponse(
            patient_id=patient_id,
            recommendations=recommendations,
            risk_factors_identified=risk_factor_names
        )

# Instantiate the service
educational_content_service = EducationalContentService() 