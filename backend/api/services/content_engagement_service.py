import logging
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, select, text
import uuid
from datetime import datetime, timedelta

from ..models.content_engagement import ContentEngagement
from ..models.educational_content import EducationalContent, patient_saved_content
from ..models.patient import Patient
from ..schemas.content_engagement import (
    ContentEngagementCreate,
    ContentEngagementUpdate,
    EngagementAnalytics
)

logger = logging.getLogger(__name__)

class ContentEngagementService:
    """Service for tracking and analyzing content engagement"""
    
    async def record_view(
        self,
        db: Session,
        content_id: str,
        patient_id: Optional[str] = None,
        staff_id: Optional[str] = None,
        device_info: Optional[Dict[str, Any]] = None
    ) -> ContentEngagement:
        """Record a content view"""
        try:
            # Create engagement record
            engagement_id = str(uuid.uuid4())
            new_engagement = ContentEngagement(
                id=engagement_id,
                content_id=content_id,
                patient_id=patient_id,
                staff_id=staff_id,
                view_date=datetime.now(),
                device_type=device_info.get("device_type") if device_info else None,
                browser=device_info.get("browser") if device_info else None,
                ip_address=device_info.get("ip_address") if device_info else None,
                session_id=device_info.get("session_id") if device_info else None
            )
            
            db.add(new_engagement)
            
            # Update content view count
            content = db.query(EducationalContent).filter(EducationalContent.id == content_id).first()
            if content:
                content.view_count += 1
            
            db.commit()
            db.refresh(new_engagement)
            
            logger.info(f"Recorded content view: content_id={content_id}, patient_id={patient_id}")
            return new_engagement
        except Exception as e:
            db.rollback()
            logger.error(f"Error recording content view: {e}")
            raise
    
    async def update_engagement(
        self,
        db: Session,
        engagement_id: str,
        update_data: ContentEngagementUpdate
    ) -> Optional[ContentEngagement]:
        """Update an existing engagement record with completion metrics"""
        try:
            engagement = db.query(ContentEngagement).filter(ContentEngagement.id == engagement_id).first()
            if not engagement:
                return None
            
            # Update fields from update_data
            update_dict = update_data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(engagement, key, value)
            
            # If completion percentage is provided, update the completed flag
            if 'completion_percentage' in update_dict:
                engagement.completed = update_dict['completion_percentage'] >= 90
                
                # Update the content completion rate
                await self.update_content_completion_rate(db, engagement.content_id)
            
            db.commit()
            db.refresh(engagement)
            
            logger.info(f"Updated engagement: id={engagement_id}")
            return engagement
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating engagement: {e}")
            raise
    
    async def update_content_completion_rate(self, db: Session, content_id: str) -> None:
        """Update the average completion rate for a content item"""
        try:
            # Get average completion rate from all engagement records
            avg_completion = db.query(func.avg(ContentEngagement.completion_percentage))\
                .filter(ContentEngagement.content_id == content_id)\
                .scalar()
            
            if avg_completion is not None:
                # Update the content completion rate
                content = db.query(EducationalContent)\
                    .filter(EducationalContent.id == content_id)\
                    .first()
                
                if content:
                    content.completion_rate = int(avg_completion)
                    db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating content completion rate: {e}")
            raise
    
    async def save_content_for_patient(
        self,
        db: Session,
        content_id: str,
        patient_id: str
    ) -> bool:
        """Save/bookmark content for a patient"""
        try:
            # Check if already saved
            existing = db.execute(
                select([patient_saved_content])
                .where(
                    and_(
                        patient_saved_content.c.patient_id == patient_id,
                        patient_saved_content.c.content_id == content_id
                    )
                )
            ).fetchone()
            
            if existing:
                return True  # Already saved
            
            # Insert into association table
            db.execute(
                patient_saved_content.insert().values(
                    patient_id=patient_id,
                    content_id=content_id,
                    saved_at=datetime.now()
                )
            )
            
            db.commit()
            logger.info(f"Saved content for patient: content_id={content_id}, patient_id={patient_id}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving content for patient: {e}")
            return False
    
    async def unsave_content_for_patient(
        self,
        db: Session,
        content_id: str,
        patient_id: str
    ) -> bool:
        """Remove saved/bookmarked content for a patient"""
        try:
            # Delete from association table
            db.execute(
                patient_saved_content.delete().where(
                    and_(
                        patient_saved_content.c.patient_id == patient_id,
                        patient_saved_content.c.content_id == content_id
                    )
                )
            )
            
            db.commit()
            logger.info(f"Unsaved content for patient: content_id={content_id}, patient_id={patient_id}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error unsaving content for patient: {e}")
            return False
    
    async def get_patient_saved_content(
        self,
        db: Session,
        patient_id: str
    ) -> List[EducationalContent]:
        """Get all saved/bookmarked content for a patient"""
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient:
                return []
            
            return patient.saved_content
        except Exception as e:
            logger.error(f"Error getting patient saved content: {e}")
            return []
    
    async def is_content_saved_by_patient(
        self,
        db: Session,
        content_id: str,
        patient_id: str
    ) -> bool:
        """Check if content is saved/bookmarked by a patient"""
        try:
            result = db.execute(
                select([patient_saved_content])
                .where(
                    and_(
                        patient_saved_content.c.patient_id == patient_id,
                        patient_saved_content.c.content_id == content_id
                    )
                )
            ).fetchone()
            
            return result is not None
        except Exception as e:
            logger.error(f"Error checking if content is saved: {e}")
            return False
    
    async def get_content_analytics(
        self,
        db: Session,
        time_range_days: Optional[int] = None
    ) -> EngagementAnalytics:
        """Get analytics data for educational content"""
        try:
            query_filter = True  # No filter by default
            
            # Apply time range filter if specified
            if time_range_days:
                start_date = datetime.now() - timedelta(days=time_range_days)
                query_filter = ContentEngagement.view_date >= start_date
            
            # Total views
            total_views = db.query(func.count(ContentEngagement.id))\
                .filter(query_filter)\
                .scalar() or 0
            
            # Total completed views
            total_completed = db.query(func.count(ContentEngagement.id))\
                .filter(query_filter)\
                .filter(ContentEngagement.completed == True)\
                .scalar() or 0
            
            # Total content
            total_content = db.query(func.count(EducationalContent.id)).scalar() or 0
            
            # Average completion rate
            avg_completion = db.query(func.avg(ContentEngagement.completion_percentage))\
                .filter(query_filter)\
                .scalar() or 0
            
            # Views by date
            views_by_date_query = """
                SELECT DATE(view_date) as date, COUNT(*) as count
                FROM content_engagement
                WHERE view_date >= :start_date
                GROUP BY DATE(view_date)
                ORDER BY date ASC
            """
            
            views_by_date_result = db.execute(
                text(views_by_date_query),
                {"start_date": (datetime.now() - timedelta(days=30)).isoformat() if not time_range_days else (datetime.now() - timedelta(days=time_range_days)).isoformat()}
            ).fetchall()
            
            views_by_date = [
                {"date": str(row[0]), "count": row[1]}
                for row in views_by_date_result
            ]
            
            # Views by content type
            views_by_content_type_query = """
                SELECT ec.content_type, COUNT(ce.id) as count
                FROM content_engagement ce
                JOIN educational_content ec ON ce.content_id = ec.id
                WHERE ce.view_date >= :start_date
                GROUP BY ec.content_type
                ORDER BY count DESC
            """
            
            views_by_content_type_result = db.execute(
                text(views_by_content_type_query),
                {"start_date": (datetime.now() - timedelta(days=30)).isoformat() if not time_range_days else (datetime.now() - timedelta(days=time_range_days)).isoformat()}
            ).fetchall()
            
            views_by_content_type = [
                {"content_type": row[0], "count": row[1]}
                for row in views_by_content_type_result
            ]
            
            # Views by risk factor
            views_by_risk_factor_query = """
                SELECT crf.risk_factor, COUNT(ce.id) as count
                FROM content_engagement ce
                JOIN content_risk_factors crf ON ce.content_id = crf.content_id
                WHERE ce.view_date >= :start_date
                GROUP BY crf.risk_factor
                ORDER BY count DESC
            """
            
            views_by_risk_factor_result = db.execute(
                text(views_by_risk_factor_query),
                {"start_date": (datetime.now() - timedelta(days=30)).isoformat() if not time_range_days else (datetime.now() - timedelta(days=time_range_days)).isoformat()}
            ).fetchall()
            
            views_by_risk_factor = [
                {"risk_factor": row[0], "count": row[1]}
                for row in views_by_risk_factor_result
            ]
            
            # Top content
            top_content_query = """
                SELECT 
                    ec.id, 
                    ec.title, 
                    ec.content_type, 
                    COUNT(ce.id) as view_count,
                    AVG(ce.completion_percentage) as completion_rate,
                    AVG(ce.view_duration_seconds) as average_view_time
                FROM content_engagement ce
                JOIN educational_content ec ON ce.content_id = ec.id
                WHERE ce.view_date >= :start_date
                GROUP BY ec.id, ec.title, ec.content_type
                ORDER BY view_count DESC
                LIMIT 5
            """
            
            top_content_result = db.execute(
                text(top_content_query),
                {"start_date": (datetime.now() - timedelta(days=30)).isoformat() if not time_range_days else (datetime.now() - timedelta(days=time_range_days)).isoformat()}
            ).fetchall()
            
            top_content = []
            for row in top_content_result:
                # Get risk factors for this content
                risk_factors_query = """
                    SELECT risk_factor
                    FROM content_risk_factors
                    WHERE content_id = :content_id
                """
                
                risk_factors_result = db.execute(
                    text(risk_factors_query),
                    {"content_id": row[0]}
                ).fetchall()
                
                risk_factors = [rf[0] for rf in risk_factors_result]
                
                top_content.append({
                    "id": row[0],
                    "title": row[1],
                    "content_type": row[2],
                    "view_count": row[3],
                    "completion_rate": round(row[4]) if row[4] else 0,
                    "average_view_time": round(row[5]) if row[5] else 0,
                    "risk_factors": risk_factors
                })
            
            # Risk factor stats
            risk_factor_stats_query = """
                WITH risk_factor_content AS (
                    SELECT 
                        crf.risk_factor,
                        COUNT(DISTINCT crf.content_id) as content_count
                    FROM content_risk_factors crf
                    GROUP BY crf.risk_factor
                ),
                risk_factor_views AS (
                    SELECT 
                        crf.risk_factor,
                        COUNT(ce.id) as total_views,
                        AVG(ce.completion_percentage) as avg_completion
                    FROM content_engagement ce
                    JOIN content_risk_factors crf ON ce.content_id = crf.content_id
                    WHERE ce.view_date >= :start_date
                    GROUP BY crf.risk_factor
                )
                SELECT 
                    rfc.risk_factor,
                    rfc.content_count,
                    COALESCE(rfv.total_views, 0) as total_views,
                    COALESCE(rfv.avg_completion, 0) as avg_completion
                FROM risk_factor_content rfc
                LEFT JOIN risk_factor_views rfv ON rfc.risk_factor = rfv.risk_factor
                ORDER BY total_views DESC
            """
            
            risk_factor_stats_result = db.execute(
                text(risk_factor_stats_query),
                {"start_date": (datetime.now() - timedelta(days=30)).isoformat() if not time_range_days else (datetime.now() - timedelta(days=time_range_days)).isoformat()}
            ).fetchall()
            
            risk_factor_stats = [
                {
                    "risk_factor": row[0],
                    "content_count": row[1],
                    "total_views": row[2],
                    "avg_completion": round(row[3], 1) if row[3] else 0
                }
                for row in risk_factor_stats_result
            ]
            
            return {
                "total_views": total_views,
                "total_content": total_content,
                "total_completed": total_completed,
                "avg_completion_rate": round(avg_completion, 1) if avg_completion else 0,
                "views_by_date": views_by_date,
                "views_by_content_type": views_by_content_type,
                "views_by_risk_factor": views_by_risk_factor,
                "top_content": top_content,
                "risk_factor_stats": risk_factor_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting content analytics: {e}")
            raise

# Instantiate the service
content_engagement_service = ContentEngagementService() 