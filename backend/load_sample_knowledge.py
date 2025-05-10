#!/usr/bin/env python3
"""
Script to load sample knowledge entries into the knowledge base.
Run this script to initialize the knowledge base with sample dental educational content.
"""

import os
import json
import sys
from api.services.knowledge_base import knowledge_base

def load_sample_entries():
    """Load sample knowledge entries into the knowledge base"""
    print("Loading sample knowledge entries...")
    
    # Get the path to the sample entries file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_file = os.path.join(script_dir, 'data', 'knowledge', 'sample_entries.json')
    
    # Check if file exists
    if not os.path.exists(sample_file):
        print(f"Error: Sample file not found: {sample_file}")
        return False
    
    try:
        # Load the sample entries
        with open(sample_file, 'r') as f:
            entries = json.load(f)
        
        # Add each entry to the knowledge base
        for entry in entries:
            category = entry.get('category')
            content = entry.get('content')
            tags = entry.get('tags', [])
            source = entry.get('source')
            reference = entry.get('reference')
            
            # Skip if missing required fields
            if not category or not content:
                print(f"Skipping entry with missing required fields: {entry}")
                continue
            
            # Check if category is valid
            if category not in knowledge_base.categories:
                print(f"Skipping entry with invalid category: {category}")
                continue
            
            # Add the entry
            knowledge_base.add_entry(
                category=category,
                content=content,
                tags=tags,
                source=source,
                reference=reference
            )
        
        print(f"Successfully loaded {len(entries)} sample entries")
        
        # Print summary of entries by category
        print("\nKnowledge base summary:")
        for category in knowledge_base.categories:
            count = len(knowledge_base.knowledge_store.get(category, []))
            if count > 0:
                print(f"  {category}: {count} entries")
        
        return True
    
    except Exception as e:
        print(f"Error loading sample entries: {e}")
        return False

if __name__ == "__main__":
    success = load_sample_entries()
    sys.exit(0 if success else 1) 