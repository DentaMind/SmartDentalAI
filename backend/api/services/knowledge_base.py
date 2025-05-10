"""
Knowledge base service for the DentaMind API.
Provides access to dental knowledge data.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class KnowledgeBase:
    def __init__(self):
        self.entries = {}
        self.categories = [
            "anatomy", "pathology", "treatments", "medications", 
            "procedures", "diagnostics", "materials", "instruments",
            "radiology", "periodontics", "orthodontics", "endodontics",
            "prosthodontics", "oral_surgery", "pediatric_dentistry",
            "implants", "occlusion", "pharmacology"
        ]
        
        # Initialize with some sample entries
        self._init_sample_entries()
    
    def _init_sample_entries(self):
        """Initialize the knowledge base with sample entries"""
        sample_entries = [
            {
                "category": "anatomy",
                "content": "The permanent dentition consists of 32 teeth: 8 incisors, 4 canines, 8 premolars, and 12 molars (including 4 wisdom teeth).",
                "tags": ["teeth", "permanent", "dentition", "anatomy"],
                "source": "Dental Anatomy Textbook",
                "reference": "Chapter 2, Page 45"
            },
            {
                "category": "pathology",
                "content": "Dental caries (tooth decay) is a multifactorial disease caused by bacteria, particularly Streptococcus mutans, that metabolize carbohydrates to produce acid which demineralizes tooth structure.",
                "tags": ["caries", "decay", "bacteria", "streptococcus mutans"],
                "source": "Dental Pathology Journal",
                "reference": "Vol 12, Issue 3, 2020"
            },
            {
                "category": "treatments",
                "content": "Root canal therapy involves removing infected pulp tissue, cleaning and shaping the canal system, and filling the space with gutta-percha.",
                "tags": ["endodontics", "root canal", "pulp", "gutta-percha"],
                "source": "Endodontic Principles and Practice",
                "reference": "Chapter 5, Page 112"
            }
        ]
        
        for entry in sample_entries:
            self.add_entry(
                category=entry["category"],
                content=entry["content"],
                tags=entry["tags"],
                source=entry["source"],
                reference=entry["reference"]
            )
    
    def add_entry(self, category: str, content: str, tags: List[str], 
                  source: Optional[str] = None, reference: Optional[str] = None) -> Dict[str, Any]:
        """Add a new entry to the knowledge base"""
        
        # Validate category
        if category not in self.categories:
            raise ValueError(f"Invalid category: {category}. Must be one of: {', '.join(self.categories)}")
        
        # Create entry
        entry_id = f"k-{uuid.uuid4().hex[:8]}"
        entry = {
            "id": entry_id,
            "category": category,
            "content": content,
            "tags": tags,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        if source:
            entry["source"] = source
        
        if reference:
            entry["reference"] = reference
        
        # Store entry
        self.entries[entry_id] = entry
        
        return entry
    
    def get_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific entry by ID"""
        return self.entries.get(entry_id)
    
    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get all entries in a specific category"""
        
        # Validate category
        if category not in self.categories:
            raise ValueError(f"Invalid category: {category}. Must be one of: {', '.join(self.categories)}")
        
        # Filter entries
        return [entry for entry in self.entries.values() if entry["category"] == category]
    
    def search(self, query: str, category: Optional[str] = None, 
              tags: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Search for entries by query text, optionally filtered by category and tags"""
        
        # Validate category if provided
        if category and category not in self.categories:
            raise ValueError(f"Invalid category: {category}. Must be one of: {', '.join(self.categories)}")
        
        # Basic search implementation
        results = []
        query = query.lower()
        
        for entry in self.entries.values():
            # Check if entry content contains query
            if query in entry["content"].lower():
                # Filter by category if specified
                if category and entry["category"] != category:
                    continue
                
                # Filter by tags if specified
                if tags:
                    has_tag = False
                    for tag in tags:
                        if tag in entry["tags"]:
                            has_tag = True
                            break
                    if not has_tag:
                        continue
                
                results.append(entry)
        
        return results
    
    def update_entry(self, entry_id: str, content: Optional[str] = None, 
                    tags: Optional[List[str]] = None, source: Optional[str] = None, 
                    reference: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update an existing entry"""
        
        # Get the entry
        entry = self.get_entry(entry_id)
        if not entry:
            return None
        
        # Update fields
        if content:
            entry["content"] = content
        
        if tags:
            entry["tags"] = tags
        
        if source:
            entry["source"] = source
        
        if reference:
            entry["reference"] = reference
        
        # Update timestamp
        entry["updated_at"] = datetime.now().isoformat()
        
        return entry
    
    def delete_entry(self, entry_id: str) -> bool:
        """Delete an entry by ID"""
        if entry_id in self.entries:
            del self.entries[entry_id]
            return True
        return False

# Create singleton instance
knowledge_base = KnowledgeBase() 