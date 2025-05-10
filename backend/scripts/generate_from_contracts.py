#!/usr/bin/env python3
"""
Generate FastAPI Routes from TypeScript Contracts

This script generates FastAPI route stubs and models from TypeScript contracts.
It's designed for backend-first workflow, generating scaffolding from the frontend contracts.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Add parent directory to path to import from api
sys.path.append(str(Path(__file__).parent.parent))

from api.utils.ts_contract_generator import generate_route_stubs
from fastapi import FastAPI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("generate_from_contracts")


def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(
        description="Generate FastAPI routes and models from TypeScript contracts"
    )
    
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force regeneration even if files already exist"
    )
    
    parser.add_argument(
        "--tag",
        type=str,
        help="Generate only routes for a specific tag"
    )
    
    parser.add_argument(
        "--output-dir",
        type=str,
        default="api/routers/generated",
        help="Output directory for generated files"
    )
    
    parser.add_argument(
        "--openapi-path",
        type=str,
        default="../docs/openapi/frontend-openapi.json",
        help="Path to the OpenAPI schema generated from TypeScript contracts"
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
    
    logger.info("Generating FastAPI routes from TypeScript contracts")
    
    # Create a mock FastAPI app
    app = FastAPI()
    
    # Override output dir and OpenAPI path
    from api.utils import ts_contract_generator
    if args.output_dir:
        ts_contract_generator.OUTPUT_DIR = Path(args.output_dir)
        logger.info(f"Output directory set to: {args.output_dir}")
    
    if args.openapi_path:
        ts_contract_generator.FRONTEND_OPENAPI_PATH = Path(args.openapi_path)
        logger.info(f"OpenAPI schema path set to: {args.openapi_path}")
    
    # Generate route stubs
    results = generate_route_stubs(app)
    
    # Filter by tag if specified
    if args.tag:
        logger.info(f"Filtering by tag: {args.tag}")
        results = [r for r in results if r["tag"].lower() == args.tag.lower()]
    
    if results:
        logger.info(f"Generated {len(results)} router stubs from frontend contracts:")
        for result in results:
            logger.info(f"  - {result['tag']}: {result['endpoints_count']} endpoints")
            logger.info(f"    Router: {result['router_path']}")
            logger.info(f"    Models: {result['models_path']}")
    else:
        logger.warning("No frontend contracts found for stub generation")
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 