#!/usr/bin/env python3
"""
Script to run security audit on the DentaMind application.
This can be run from the command line or as part of CI/CD pipelines.
"""

import os
import sys
import argparse
import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add the parent directory to the path to allow importing from the api package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi import FastAPI
from fastapi.routing import APIRoute

try:
    # Import the security audit module
    from api.utils.rbac_audit import RBACSecurityAuditor, scan_directory_for_vulnerabilities
    from api.utils.rbac_html_report import SecurityAuditHTMLReportGenerator
except ImportError as e:
    print(f"Error importing security audit modules: {str(e)}")
    print("Make sure you're running this script from the project root directory.")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join("logs", "security_audit.log"), "a")
    ]
)
logger = logging.getLogger("security_audit")

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)
os.makedirs("reports", exist_ok=True)

def create_mock_app() -> FastAPI:
    """Create a mock FastAPI app for analysis"""
    from api.main import app as main_app
    
    # If there's an exception loading the main app, create a simple mock app
    if not main_app:
        logger.warning("Could not load main app, creating a mock app instead.")
        app = FastAPI(title="DentaMind API")
        return app
    
    return main_app

def run_audit(args: argparse.Namespace) -> int:
    """Run the security audit and generate reports"""
    # Create FastAPI app for scanning
    try:
        logger.info("Loading FastAPI app for security audit...")
        app = create_mock_app()
        logger.info(f"Loaded app with {len(app.routes)} routes")
    except Exception as e:
        logger.error(f"Failed to create app: {str(e)}")
        return 1
    
    # Get the base directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    try:
        # Run the RBAC security audit
        logger.info("Running RBAC security audit...")
        auditor = RBACSecurityAuditor(app, base_dir)
        audit_result = auditor.audit_application()
        
        # Generate statistics
        critical_issues = audit_result.critical_vulnerabilities
        high_issues = audit_result.high_vulnerabilities
        medium_issues = audit_result.medium_vulnerabilities
        low_issues = audit_result.low_vulnerabilities
        total_issues = audit_result.total_vulnerabilities
        
        logger.info(f"Security audit completed. Found {total_issues} issues "
                   f"({critical_issues} critical, {high_issues} high, "
                   f"{medium_issues} medium, {low_issues} low)")
        
        # Generate HTML report
        logger.info("Generating HTML report...")
        report_generator = SecurityAuditHTMLReportGenerator(audit_result)
        report_path = report_generator.generate_report()
        logger.info(f"HTML report generated: {report_path}")
        
        # Output critical issues to a separate file for CI
        if critical_issues > 0 and args.ci:
            with open("reports/critical_issues.txt", "w") as f:
                f.write(f"Found {critical_issues} critical security issues!\n\n")
                for vuln in audit_result.vulnerabilities:
                    if vuln.severity == "Critical":
                        f.write(f"- {vuln.vulnerability_type}: {vuln.description}\n")
                        f.write(f"  Location: {vuln.file_path}:{vuln.line_number}\n")
                        f.write(f"  Remediation: {vuln.remediation}\n\n")
        
        # Output summary to a JSON file
        summary = {
            "timestamp": datetime.now().isoformat(),
            "total_routes": audit_result.total_routes,
            "routes_with_auth": audit_result.routes_with_auth,
            "routes_without_auth": audit_result.routes_without_auth,
            "routes_with_role_checks": audit_result.routes_with_role_checks,
            "total_vulnerabilities": total_issues,
            "critical_vulnerabilities": critical_issues,
            "high_vulnerabilities": high_issues,
            "medium_vulnerabilities": medium_issues,
            "low_vulnerabilities": low_issues,
            "report_path": report_path
        }
        
        with open("reports/summary.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        # Return appropriate exit code based on findings
        if args.fail_on_critical and critical_issues > 0:
            logger.error("Critical security issues found. Returning non-zero exit code.")
            return 1
        
        if args.fail_on_high and (critical_issues > 0 or high_issues > 0):
            logger.error("Critical or high security issues found. Returning non-zero exit code.")
            return 1
        
        logger.info("Security audit completed successfully.")
        return 0
        
    except Exception as e:
        logger.error(f"Error during security audit: {str(e)}", exc_info=True)
        return 1

def scan_files(args: argparse.Namespace) -> int:
    """Scan specific files or directories for vulnerabilities"""
    try:
        logger.info(f"Scanning directory: {args.directory}")
        
        vulnerabilities = scan_directory_for_vulnerabilities(args.directory)
        
        logger.info(f"Found {len(vulnerabilities)} potential vulnerabilities")
        
        # Output results
        output_file = args.output or "reports/file_scan_results.json"
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Convert to serializable format
        results = []
        for vuln in vulnerabilities:
            results.append(vuln.dict())
        
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
            
        logger.info(f"Results saved to {output_file}")
        
        # Count critical and high issues
        critical_count = sum(1 for v in vulnerabilities if v.severity == "Critical")
        high_count = sum(1 for v in vulnerabilities if v.severity == "High")
        
        if args.fail_on_critical and critical_count > 0:
            logger.error(f"Found {critical_count} critical issues. Failing scan.")
            return 1
            
        if args.fail_on_high and (critical_count > 0 or high_count > 0):
            logger.error(f"Found {critical_count} critical and {high_count} high issues. Failing scan.")
            return 1
            
        return 0
        
    except Exception as e:
        logger.error(f"Error during file scan: {str(e)}", exc_info=True)
        return 1

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run security audit on DentaMind application")
    
    subparsers = parser.add_subparsers(title="commands", dest="command")
    
    # Audit command
    audit_parser = subparsers.add_parser("audit", help="Run RBAC security audit")
    audit_parser.add_argument("--ci", action="store_true", help="Run in CI mode (creates files for CI integration)")
    audit_parser.add_argument("--fail-on-critical", action="store_true", help="Return non-zero exit code if critical issues found")
    audit_parser.add_argument("--fail-on-high", action="store_true", help="Return non-zero exit code if critical or high issues found")
    
    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Scan files for security vulnerabilities")
    scan_parser.add_argument("--directory", "-d", required=True, help="Directory to scan")
    scan_parser.add_argument("--recursive", "-r", action="store_true", help="Scan recursively")
    scan_parser.add_argument("--output", "-o", help="Output file path")
    scan_parser.add_argument("--fail-on-critical", action="store_true", help="Return non-zero exit code if critical issues found")
    scan_parser.add_argument("--fail-on-high", action="store_true", help="Return non-zero exit code if critical or high issues found")
    
    args = parser.parse_args()
    
    # Default to audit if no command specified
    if not args.command:
        args.command = "audit"
        args.ci = "--ci" in sys.argv
        args.fail_on_critical = "--fail-on-critical" in sys.argv
        args.fail_on_high = "--fail-on-high" in sys.argv
    
    if args.command == "audit":
        return run_audit(args)
    elif args.command == "scan":
        return scan_files(args)
    else:
        parser.print_help()
        return 1

if __name__ == "__main__":
    sys.exit(main()) 