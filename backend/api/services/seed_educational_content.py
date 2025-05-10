"""
Seed script to populate the educational content database with initial content examples
targeting common risk factors like smoking, diabetes, and poor oral hygiene.
"""

import logging
import asyncio
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError

from ..database import engine, SessionLocal
from ..models.educational_content import (
    EducationalContent,
    ContentType,
    ContentCategory,
    RiskFactor
)
from ..schemas.educational_content import EducationalContentCreate
from ..services.educational_content_service import educational_content_service

logger = logging.getLogger(__name__)

# Demo educational content targeting different risk factors
SEED_CONTENT = [
    # Smoking-related content
    {
        "title": "How Smoking Affects Your Oral Health",
        "description": "Learn about the significant impacts of smoking on oral health, including periodontal disease, tooth loss, and oral cancer risks.",
        "content_type": ContentType.ARTICLE,
        "category": ContentCategory.SMOKING_CESSATION,
        "content_url": None,
        "content_text": """
        <h2>Smoking and Your Oral Health</h2>
        <p>Smoking has immediate and long-term effects on your oral health:</p>
        <ul>
            <li>Doubles the risk for gum disease</li>
            <li>Makes dental treatments less successful</li>
            <li>Slows healing after dental procedures</li>
            <li>Increases risk of oral cancer by 6 times</li>
            <li>Causes chronic bad breath and tooth discoloration</li>
        </ul>
        <p>Quitting smoking can reverse many of these effects and significantly improve treatment outcomes.</p>
        """,
        "thumbnail_url": "/images/education/smoking-effects.jpg",
        "duration": "5 min read",
        "author": "Dr. Sarah Johnson, DDS",
        "source": "American Dental Association",
        "priority": 10,
        "is_featured": True,
        "tags": ["smoking", "periodontal disease", "oral cancer", "gum disease"],
        "target_risk_factors": [RiskFactor.SMOKING, RiskFactor.PERIODONTAL_DISEASE]
    },
    {
        "title": "Smoking Cessation Strategies for Dental Patients",
        "description": "Practical approaches to quit smoking that can be integrated with your dental care plan.",
        "content_type": ContentType.VIDEO,
        "category": ContentCategory.SMOKING_CESSATION,
        "content_url": "https://example.com/videos/smoking-cessation.mp4",
        "content_text": None,
        "thumbnail_url": "/images/education/quit-smoking.jpg",
        "duration": "7:45",
        "author": "Dr. Michael Chen, DDS, PhD",
        "source": "Dental Health Foundation",
        "priority": 8,
        "is_featured": True,
        "tags": ["smoking cessation", "quitting strategies", "nicotine replacement"],
        "target_risk_factors": [RiskFactor.SMOKING]
    },
    
    # Diabetes-related content
    {
        "title": "Diabetes and Periodontal Disease: The Two-Way Connection",
        "description": "Understanding how diabetes and gum disease affect each other, and steps to manage both conditions effectively.",
        "content_type": ContentType.ARTICLE,
        "category": ContentCategory.PERIODONTAL,
        "content_url": None,
        "content_text": """
        <h2>The Connection Between Diabetes and Periodontal Disease</h2>
        <p>Diabetes and periodontal disease share a bidirectional relationship where each condition can worsen the other:</p>
        <ul>
            <li>People with uncontrolled diabetes are 3 times more likely to develop severe gum disease</li>
            <li>Periodontal infection can make diabetes harder to control by increasing insulin resistance</li>
            <li>Treating gum disease can improve blood glucose control by approximately 0.4% (HbA1c)</li>
            <li>Both conditions involve inflammatory processes that can amplify each other</li>
        </ul>
        <p>Managing both conditions requires coordinated care between your dentist and physician.</p>
        """,
        "thumbnail_url": "/images/education/diabetes-perio.jpg",
        "duration": "6 min read",
        "author": "Dr. Lisa Wong, Periodontist",
        "source": "Journal of Periodontology",
        "priority": 9,
        "is_featured": True,
        "tags": ["diabetes", "periodontal disease", "inflammation", "blood glucose"],
        "target_risk_factors": [RiskFactor.DIABETES, RiskFactor.PERIODONTAL_DISEASE]
    },
    {
        "title": "Oral Hygiene Guidelines for Patients with Diabetes",
        "description": "Special considerations and hygiene practices for those with diabetes to maintain optimal oral health.",
        "content_type": ContentType.PDF,
        "category": ContentCategory.DIABETES,
        "content_url": "https://example.com/resources/diabetes-oral-care.pdf",
        "content_text": None,
        "thumbnail_url": "/images/education/diabetes-care.jpg",
        "duration": "4 pages",
        "author": "American Diabetes Association & American Dental Association",
        "source": "Joint Publication",
        "priority": 7,
        "is_featured": False,
        "tags": ["diabetes", "oral hygiene", "prevention", "home care"],
        "target_risk_factors": [RiskFactor.DIABETES, RiskFactor.POOR_HYGIENE]
    },
    
    # Poor oral hygiene content
    {
        "title": "Mastering the Proper Brushing Technique",
        "description": "Step-by-step video guide to effective toothbrushing that removes plaque while protecting enamel and gums.",
        "content_type": ContentType.VIDEO,
        "category": ContentCategory.ORAL_HYGIENE,
        "content_url": "https://example.com/videos/proper-brushing.mp4",
        "content_text": None,
        "thumbnail_url": "/images/education/brushing-technique.jpg",
        "duration": "4:30",
        "author": "Dr. Robert Taylor, DDS",
        "source": "DentaMind Educational Series",
        "priority": 10,
        "is_featured": True,
        "tags": ["brushing", "plaque removal", "technique", "oral hygiene"],
        "target_risk_factors": [RiskFactor.POOR_HYGIENE, RiskFactor.CARIES_RISK]
    },
    {
        "title": "Flossing: Essential Techniques for Gum Health",
        "description": "Learn why flossing is critical for preventing gum disease and the proper techniques for different dental situations.",
        "content_type": ContentType.INFOGRAPHIC,
        "category": ContentCategory.ORAL_HYGIENE,
        "content_url": "https://example.com/resources/flossing-guide.jpg",
        "content_text": None,
        "thumbnail_url": "/images/education/flossing.jpg",
        "duration": "Visual guide",
        "author": "Dental Hygienists Association",
        "source": "Preventive Dental Care Initiative",
        "priority": 9,
        "is_featured": True,
        "tags": ["flossing", "interdental cleaning", "gum disease", "plaque"],
        "target_risk_factors": [RiskFactor.POOR_HYGIENE, RiskFactor.PERIODONTAL_DISEASE]
    },
    
    # Periodontal disease content
    {
        "title": "Understanding Periodontal Maintenance: Why It's Different from Regular Cleanings",
        "description": "Learn the importance of specialized periodontal maintenance for managing gum disease and preventing tooth loss.",
        "content_type": ContentType.ARTICLE,
        "category": ContentCategory.PERIODONTAL,
        "content_url": None,
        "content_text": """
        <h2>The Critical Importance of Periodontal Maintenance</h2>
        <p>Periodontal maintenance is not the same as a regular dental cleaning. Here's why it's essential:</p>
        <ul>
            <li>Targets bacteria in deeper pockets that regular cleanings can't reach</li>
            <li>Prevents recolonization of harmful bacteria after scaling and root planing</li>
            <li>Allows monitoring of pocket depths and inflammation over time</li>
            <li>Customized to your specific needs and risk factors</li>
            <li>Typically needed every 3-4 months rather than every 6 months</li>
        </ul>
        <p>Missing periodontal maintenance appointments can lead to disease progression and tooth loss even after successful initial treatment.</p>
        """,
        "thumbnail_url": "/images/education/perio-maintenance.jpg",
        "duration": "5 min read",
        "author": "Dr. James Rodriguez, Periodontist",
        "source": "American Academy of Periodontology",
        "priority": 8,
        "is_featured": False,
        "tags": ["periodontal maintenance", "gum disease", "cleanings", "prevention"],
        "target_risk_factors": [RiskFactor.PERIODONTAL_DISEASE]
    },
    
    # Heart disease content
    {
        "title": "The Oral-Systemic Connection: How Your Mouth Affects Your Heart",
        "description": "Evidence-based information on the connection between periodontal disease and cardiovascular health.",
        "content_type": ContentType.ARTICLE,
        "category": ContentCategory.GENERAL,
        "content_url": None,
        "content_text": """
        <h2>The Mouth-Heart Connection</h2>
        <p>Research has established important links between oral health and heart health:</p>
        <ul>
            <li>People with gum disease are 2-3 times more likely to have a heart attack, stroke, or other serious cardiovascular event</li>
            <li>Oral bacteria can enter the bloodstream through inflamed gums</li>
            <li>These bacteria can contribute to arterial plaque formation</li>
            <li>The inflammation from gum disease may increase systemic inflammation, a risk factor for heart disease</li>
        </ul>
        <p>Maintaining excellent oral health is an important part of protecting your cardiovascular system.</p>
        """,
        "thumbnail_url": "/images/education/heart-mouth.jpg",
        "duration": "6 min read",
        "author": "Dr. Emily Parker, DDS, and Dr. John Wilson, MD",
        "source": "Cardiovascular Health Initiative",
        "priority": 7,
        "is_featured": False,
        "tags": ["heart disease", "oral-systemic health", "inflammation"],
        "target_risk_factors": [RiskFactor.HEART_DISEASE, RiskFactor.PERIODONTAL_DISEASE]
    },
    
    # Dental anxiety content
    {
        "title": "Overcoming Dental Anxiety: Techniques and Options",
        "description": "Strategies and modern solutions to help manage dental anxiety and get the care you need comfortably.",
        "content_type": ContentType.VIDEO,
        "category": ContentCategory.GENERAL,
        "content_url": "https://example.com/videos/dental-anxiety.mp4",
        "content_text": None,
        "thumbnail_url": "/images/education/dental-anxiety.jpg",
        "duration": "8:15",
        "author": "Dr. Susan Martinez, DDS",
        "source": "Dental Comfort Institute",
        "priority": 6,
        "is_featured": False,
        "tags": ["dental anxiety", "fear", "sedation", "comfort"],
        "target_risk_factors": [RiskFactor.DENTAL_ANXIETY]
    }
]

async def seed_educational_content():
    """Populate the educational content table with initial examples"""
    db = SessionLocal()
    try:
        # Check if content already exists
        existing_count = db.query(EducationalContent).count()
        if existing_count > 0:
            logger.info(f"Found {existing_count} existing educational content items - skipping seed")
            return True
        
        logger.info("Seeding educational content...")
        for content_data in SEED_CONTENT:
            # Convert to Pydantic model
            content_create = EducationalContentCreate(**content_data)
            
            # Create content
            await educational_content_service.create_content(
                db=db,
                content_data=content_create,
                created_by="system"
            )
            
        logger.info(f"Successfully seeded {len(SEED_CONTENT)} educational content items")
        return True
    
    except Exception as e:
        logger.error(f"Error seeding educational content: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_educational_content()) 