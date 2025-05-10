#!/usr/bin/env python3
"""
Check Contract Coverage Thresholds

This script checks if the API contract coverage meets the defined thresholds.
It is intended to be used in CI/CD pipelines to ensure adequate coverage.
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("check_coverage_thresholds")


class CoverageThresholds:
    """Coverage thresholds for different categories"""
    def __init__(
        self,
        fully_covered: float = 0.70,  # 70% fully covered
        no_contract: float = 0.10,    # No more than 10% without contracts
        no_tests: float = 0.20,       # No more than 20% without tests
    ):
        self.fully_covered = fully_covered
        self.no_contract = no_contract
        self.no_tests = no_tests


def check_coverage_thresholds(
    report_path: str,
    thresholds: CoverageThresholds = None
) -> bool:
    """
    Check if the coverage report meets the defined thresholds
    
    Args:
        report_path: Path to the JSON coverage report
        thresholds: Coverage thresholds to check against
    
    Returns:
        True if all thresholds are met, False otherwise
    """
    if thresholds is None:
        thresholds = CoverageThresholds()
    
    # Load the coverage report
    try:
        with open(report_path, "r") as f:
            report = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load coverage report: {e}")
        return False
    
    # Check thresholds
    summary = report.get("summary", {})
    total = summary.get("total", 0)
    
    if total == 0:
        logger.warning("No endpoints found in the coverage report")
        return True
    
    # Calculate coverage ratios
    fully_covered_ratio = summary.get("fully_covered", 0) / total
    no_contract_ratio = summary.get("implementation_only", 0) / total
    no_tests_ratio = (summary.get("no_tests", 0) + summary.get("implementation_only", 0)) / total
    
    # Check against thresholds
    failures = []
    
    if fully_covered_ratio < thresholds.fully_covered:
        failures.append(f"Fully covered endpoints below threshold: {fully_covered_ratio:.2%} < {thresholds.fully_covered:.2%}")
    
    if no_contract_ratio > thresholds.no_contract:
        failures.append(f"Endpoints without contracts above threshold: {no_contract_ratio:.2%} > {thresholds.no_contract:.2%}")
    
    if no_tests_ratio > thresholds.no_tests:
        failures.append(f"Endpoints without tests above threshold: {no_tests_ratio:.2%} > {thresholds.no_tests:.2%}")
    
    # Log results
    if failures:
        logger.error("Coverage thresholds not met:")
        for failure in failures:
            logger.error(f"  - {failure}")
        return False
    
    logger.info("All coverage thresholds met:")
    logger.info(f"  - Fully covered endpoints: {fully_covered_ratio:.2%} >= {thresholds.fully_covered:.2%}")
    logger.info(f"  - Endpoints without contracts: {no_contract_ratio:.2%} <= {thresholds.no_contract:.2%}")
    logger.info(f"  - Endpoints without tests: {no_tests_ratio:.2%} <= {thresholds.no_tests:.2%}")
    
    return True


def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(
        description="Check if API contract coverage meets the defined thresholds"
    )
    
    parser.add_argument(
        "--report",
        type=str,
        default="reports/contract-coverage/latest.json",
        help="Path to the JSON coverage report"
    )
    
    parser.add_argument(
        "--fully-covered",
        type=float,
        default=0.70,
        help="Minimum ratio of fully covered endpoints (default: 0.70)"
    )
    
    parser.add_argument(
        "--no-contract",
        type=float,
        default=0.10,
        help="Maximum ratio of endpoints without contracts (default: 0.10)"
    )
    
    parser.add_argument(
        "--no-tests",
        type=float,
        default=0.20,
        help="Maximum ratio of endpoints without tests (default: 0.20)"
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
    
    # Define thresholds
    thresholds = CoverageThresholds(
        fully_covered=args.fully_covered,
        no_contract=args.no_contract,
        no_tests=args.no_tests
    )
    
    # Check thresholds
    success = check_coverage_thresholds(args.report, thresholds)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main()) 