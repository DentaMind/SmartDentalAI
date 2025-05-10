#!/usr/bin/env python3
"""
Generate Contract Coverage Report

This script generates a comprehensive report of API contract coverage,
showing which endpoints are implemented, which are covered by contracts, and which
have test coverage.
"""

import os
import sys
import argparse
import logging
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import from api
sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI
from api.utils.contract_coverage import generate_coverage_report, generate_coverage_html

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("generate_coverage_report")


def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(
        description="Generate a comprehensive report of API contract coverage"
    )
    
    parser.add_argument(
        "--output",
        type=str,
        default="reports/contract-coverage/latest.json",
        help="Output file path for the JSON report"
    )
    
    parser.add_argument(
        "--html",
        type=str,
        default="reports/contract-coverage/latest.html",
        help="Output file path for the HTML report"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    # Set up logging level
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    logger.info("Generating API contract coverage report")
    
    # Create a mock FastAPI app for report generation
    app = create_mock_app()
    
    # Generate coverage report
    report = generate_coverage_report(app)
    
    # Save JSON report
    output_path = args.output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(report.to_dict(), f, indent=2)
    
    logger.info(f"Saved JSON report to: {output_path}")
    
    # Save HTML report
    html_path = args.html
    os.makedirs(os.path.dirname(html_path), exist_ok=True)
    
    html = generate_coverage_html(report, html_path)
    logger.info(f"Saved HTML report to: {html_path}")
    
    # Print summary
    print("\nCoverage Summary:")
    print(f"Total Endpoints: {report.summary['total']}")
    print(f"Fully Covered: {report.summary['fully_covered']} ({report.summary['fully_covered'] / max(1, report.summary['total']) * 100:.1f}%)")
    print(f"Missing Tests: {report.summary['no_tests']} ({report.summary['no_tests'] / max(1, report.summary['total']) * 100:.1f}%)")
    print(f"Contract Only: {report.summary['contract_only']} ({report.summary['contract_only'] / max(1, report.summary['total']) * 100:.1f}%)")
    print(f"Implementation Only: {report.summary['implementation_only']} ({report.summary['implementation_only'] / max(1, report.summary['total']) * 100:.1f}%)")
    
    return 0


def create_mock_app():
    """Create a mock FastAPI app that includes all the real routes"""
    # Import here to avoid early initialization
    from api.main import app as real_app
    
    # Create a new FastAPI app with the same routes
    app = FastAPI()
    app.routes = real_app.routes
    
    return app


if __name__ == "__main__":
    sys.exit(main()) 