#!/usr/bin/env python3
"""
Security Audit Runner Script

This script runs a security audit on the DentaMind API,
generating an HTML report of RBAC security issues.

Usage:
    python run_security_audit.py

The script will output the location of the HTML report,
which can be opened in a web browser.
"""

import os
import sys
import importlib.util
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("security-audit")

def import_from_path(module_path, module_name):
    """Import a module from a specific path"""
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def find_main_app():
    """Find and import the main FastAPI application"""
    # Common locations for the main app
    potential_paths = [
        Path("backend/api/main.py"),
        Path("backend/main.py"),
        Path("main.py"),
        Path("app.py"),
        Path("dentamind_server.py")
    ]
    
    for path in potential_paths:
        if path.exists():
            try:
                logger.info(f"Found main app at {path}")
                module_name = path.stem
                main_module = import_from_path(path, module_name)
                
                # Look for FastAPI app instance
                for attr_name in dir(main_module):
                    attr = getattr(main_module, attr_name)
                    
                    # Try to determine if it's a FastAPI app
                    if hasattr(attr, 'include_router') and hasattr(attr, 'routes'):
                        logger.info(f"Found FastAPI app instance: {attr_name}")
                        return attr
                
                logger.warning(f"No FastAPI app found in {path}")
            except Exception as e:
                logger.error(f"Error importing {path}: {str(e)}")
    
    # Fallback: create a minimal app for demo
    logger.warning("No app found, creating a mock app for demonstration")
    from fastapi import FastAPI
    app = FastAPI(title="Mock DentaMind API")
    return app

def main():
    """Run the security audit and generate a report"""
    try:
        # Find the main FastAPI app
        app = find_main_app()
        
        # Import the RBAC auditor
        sys.path.append(os.getcwd())
        
        try:
            from backend.api.utils.rbac_audit import RBACSecurityAudit
        except ImportError:
            try: 
                from api.utils.rbac_audit import RBACSecurityAudit
            except ImportError:
                logger.error("Could not import RBACSecurityAudit")
                return 1
        
        # Run the audit
        auditor = RBACSecurityAudit(app)
        issues = auditor.run_audit()
        
        # Generate HTML report
        html_report = auditor.generate_html_report()
        
        # Save report to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_dir = Path("security_reports")
        report_dir.mkdir(exist_ok=True)
        
        report_path = report_dir / f"rbac_audit_{timestamp}.html"
        with open(report_path, "w") as f:
            f.write(html_report)
        
        logger.info(f"Audit complete. Found {len(issues)} issues.")
        logger.info(f"Report saved to {report_path.absolute()}")
        
        # Print summary to console
        summary = auditor.get_summary()
        print("\n========= SECURITY AUDIT SUMMARY =========")
        print(f"Total issues: {summary['total_issues']}")
        print("\nIssues by severity:")
        for level, count in summary["by_level"].items():
            print(f"  {level.upper()}: {count}")
        
        print("\nIssues by type:")
        for status, count in summary["by_status"].items():
            status_name = status.replace("_", " ").title()
            print(f"  {status_name}: {count}")
        
        print(f"\nReport saved to: {report_path.absolute()}")
        print("Open this file in a web browser to view the detailed report.")
        
        return 0
    
    except Exception as e:
        logger.error(f"Error running security audit: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 