from typing import List, Dict, Any, Optional
from .knowledge_base import knowledge_base

class QueryService:
    """
    Service for querying the knowledge base and integrating with diagnostic flows
    and treatment planning.
    """
    
    def __init__(self):
        self.knowledge_base = knowledge_base
    
    def query_local_knowledge(self, 
                              query: str, 
                              category: Optional[str] = None,
                              tags: Optional[List[str]] = None,
                              max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Query the local knowledge base
        
        Args:
            query: The search query
            category: Optional category to limit search to
            tags: Optional list of tags to filter by
            max_results: Maximum number of results to return
            
        Returns:
            List of matching knowledge base entries
        """
        results = self.knowledge_base.search(query, category, tags)
        
        # Sort by relevance (simple exact match score)
        def relevance_score(entry):
            content = entry.get("content", "").lower()
            query_lower = query.lower()
            
            # Count occurrences of query in content
            content_score = content.count(query_lower) * 2
            
            # Check if any tags match exactly
            tag_score = sum(1 for tag in entry.get("tags", []) 
                            if query_lower in tag.lower())
            
            # Bonus for category match
            category_score = 3 if category and entry.get("category") == category else 0
            
            return content_score + tag_score + category_score
        
        # Sort results by relevance score
        results.sort(key=relevance_score, reverse=True)
        
        # Limit results
        return results[:max_results]
    
    def get_treatment_guidance(self, condition: str, procedure_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get treatment guidance for a specific dental condition
        
        Args:
            condition: The dental condition
            procedure_code: Optional procedure code
            
        Returns:
            List of relevant knowledge entries with treatment guidance
        """
        # Start with the treatments category
        results = self.query_local_knowledge(
            query=condition,
            category="treatments",
            max_results=3
        )
        
        # Add relevant procedures
        procedure_results = []
        if procedure_code:
            procedure_results = self.query_local_knowledge(
                query=procedure_code,
                category="procedures",
                max_results=2
            )
        
        # Add relevant medications
        medication_results = self.query_local_knowledge(
            query=condition,
            category="medications",
            max_results=2
        )
        
        # Combine results, maintaining priority order
        combined_results = results + procedure_results + medication_results
        
        return combined_results
    
    def get_diagnostic_assistance(self, symptoms: List[str]) -> List[Dict[str, Any]]:
        """
        Get diagnostic assistance based on reported symptoms
        
        Args:
            symptoms: List of reported symptoms
            
        Returns:
            List of relevant knowledge entries for diagnosis
        """
        results = []
        
        # Query each symptom
        for symptom in symptoms:
            symptom_results = self.query_local_knowledge(
                query=symptom,
                category="diagnostics",
                max_results=2
            )
            
            # Add additional results from pathology category
            pathology_results = self.query_local_knowledge(
                query=symptom,
                category="pathology",
                max_results=1
            )
            
            results.extend(symptom_results + pathology_results)
        
        # Remove duplicates
        unique_results = []
        seen_ids = set()
        
        for result in results:
            if result["id"] not in seen_ids:
                seen_ids.add(result["id"])
                unique_results.append(result)
        
        return unique_results
    
    def get_radiographic_guidance(self, finding: str) -> List[Dict[str, Any]]:
        """
        Get interpretation guidance for radiographic findings
        
        Args:
            finding: The radiographic finding
            
        Returns:
            List of relevant knowledge entries for radiographic interpretation
        """
        # Query the radiology category
        radiology_results = self.query_local_knowledge(
            query=finding,
            category="radiology",
            max_results=3
        )
        
        # Add potential pathology matches
        pathology_results = self.query_local_knowledge(
            query=finding,
            category="pathology",
            max_results=2
        )
        
        return radiology_results + pathology_results

# Singleton instance
query_service = QueryService() 