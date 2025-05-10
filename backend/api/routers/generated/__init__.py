"""
Generated Routers Package

This package contains router modules that are generated from frontend TypeScript contracts.
The routers are generated using the contract generator utility.
"""

import os
import importlib
import logging
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)

def load_generated_routers() -> List[Dict[str, Any]]:
    """
    Load all generated routers from this package
    
    Returns:
        List of router information dictionaries with keys:
        - router: The APIRouter instance
        - tags: List of tags for the router
        - name: Name of the router
    """
    routers = []
    
    # Get the directory of this package
    package_dir = Path(__file__).parent
    
    # Skip if no router files exist yet
    if not package_dir.exists() or not any(package_dir.glob("*_router.py")):
        return []
    
    # Get all router files in the package
    router_files = list(package_dir.glob("*_router.py"))
    
    for router_file in router_files:
        # Get the module name without extension
        module_name = router_file.stem
        
        # Skip __init__.py and any other non-router files
        if not module_name.endswith("_router"):
            continue
        
        try:
            # Import the module
            module = importlib.import_module(f".{module_name}", package=__name__)
            
            # Get the router from the module
            if hasattr(module, "router") and isinstance(module.router, APIRouter):
                # Extract tag from module name
                tag = module_name.replace("_router", "").replace("_", " ").title()
                
                # Get router info
                routers.append({
                    "router": module.router,
                    "tags": [tag],
                    "name": module_name
                })
                logger.info(f"Loaded generated router: {module_name}")
        except Exception as e:
            logger.error(f"Failed to load generated router {module_name}: {str(e)}")
    
    return routers 