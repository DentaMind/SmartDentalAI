from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..services.knowledge_base import knowledge_base
from datetime import datetime

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the knowledge router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "knowledge module healthy"
    }

@router.get("/categories")
async def get_categories():
    """Get all available knowledge categories"""
    return {"categories": knowledge_base.categories}

@router.get("/search")
async def search_knowledge(
    query: str,
    category: Optional[str] = None,
    tags: Optional[str] = None
):
    """
    Search the knowledge base
    
    Args:
        query: Search term
        category: Optional category to limit search to
        tags: Optional comma-separated list of tags to filter by
    """
    try:
        # Parse tags if provided
        tag_list = tags.split(",") if tags else None
        
        # Perform search
        results = knowledge_base.search(query, category, tag_list)
        
        return {
            "query": query,
            "category": category,
            "tags": tag_list,
            "count": len(results),
            "results": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/category/{category}")
async def get_category_entries(category: str):
    """Get all entries in a specific category"""
    try:
        entries = knowledge_base.get_by_category(category)
        return {
            "category": category,
            "count": len(entries),
            "entries": entries
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/entry/{entry_id}")
async def get_entry(entry_id: str):
    """Get a specific knowledge entry by ID"""
    entry = knowledge_base.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Entry {entry_id} not found")
    return entry

@router.post("/entry")
async def add_entry(
    category: str,
    content: str,
    tags: str,
    source: Optional[str] = None,
    reference: Optional[str] = None
):
    """
    Add a new knowledge entry
    
    Args:
        category: One of the predefined knowledge categories
        content: The actual knowledge content/text
        tags: Comma-separated list of tags for searchability
        source: Optional source of the information (textbook, course, etc.)
        reference: Optional reference citation
    """
    try:
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Add entry
        entry = knowledge_base.add_entry(
            category=category,
            content=content,
            tags=tag_list,
            source=source,
            reference=reference
        )
        
        return {
            "message": "Entry added successfully",
            "entry": entry
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/entry/{entry_id}")
async def update_entry(
    entry_id: str,
    content: Optional[str] = None,
    tags: Optional[str] = None,
    source: Optional[str] = None,
    reference: Optional[str] = None
):
    """
    Update an existing knowledge entry
    
    Args:
        entry_id: ID of the entry to update
        content: Optional new content
        tags: Optional comma-separated list of new tags
        source: Optional new source
        reference: Optional new reference
    """
    try:
        # Parse tags if provided
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else None
        
        # Update entry
        entry = knowledge_base.update_entry(
            entry_id=entry_id,
            content=content,
            tags=tag_list,
            source=source,
            reference=reference
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail=f"Entry {entry_id} not found")
            
        return {
            "message": "Entry updated successfully",
            "entry": entry
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/entry/{entry_id}")
async def delete_entry(entry_id: str):
    """Delete a knowledge entry"""
    success = knowledge_base.delete_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Entry {entry_id} not found")
        
    return {"message": f"Entry {entry_id} deleted successfully"} 