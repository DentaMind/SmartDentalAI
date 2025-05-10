"""
Contract Coverage Reporting

This module provides utilities to generate comprehensive reports on API contract coverage,
showing which endpoints are implemented, which are covered by contracts, and which
have test coverage.
"""

import json
import os
import re
import importlib
import inspect
import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple, NamedTuple

from fastapi import FastAPI, APIRouter
from fastapi.routing import APIRoute
import pytest

from .contract_sync import load_frontend_schema, extract_endpoint_schemas


class CoverageStatus(str, Enum):
    """Status of endpoint coverage"""
    FULLY_COVERED = "fully_covered"  # Has contract, implementation, and tests
    CONTRACT_ONLY = "contract_only"  # Has contract but no implementation
    IMPL_ONLY = "implementation_only"  # Has implementation but no contract
    NO_TESTS = "no_tests"  # Has contract and implementation but no tests
    UNKNOWN = "unknown"  # Status cannot be determined


class EndpointCoverage(NamedTuple):
    """Coverage information for an endpoint"""
    path: str
    method: str
    has_contract: bool
    has_implementation: bool
    has_tests: bool
    status: CoverageStatus
    tags: List[str]
    summary: str = ""
    description: str = ""
    route_name: str = ""
    test_file: str = ""


class CoverageReport:
    """Contract coverage report"""
    def __init__(self):
        self.endpoints: List[EndpointCoverage] = []
        self.timestamp: str = datetime.datetime.now().isoformat()
        self.summary: Dict[str, int] = {
            "total": 0,
            "fully_covered": 0,
            "contract_only": 0,
            "implementation_only": 0,
            "no_tests": 0,
            "unknown": 0,
        }
    
    def add_endpoint(self, endpoint: EndpointCoverage):
        """Add an endpoint to the report"""
        self.endpoints.append(endpoint)
        self.summary["total"] += 1
        self.summary[endpoint.status] += 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary"""
        return {
            "timestamp": self.timestamp,
            "summary": self.summary,
            "endpoints": [
                {
                    "path": ep.path,
                    "method": ep.method,
                    "has_contract": ep.has_contract,
                    "has_implementation": ep.has_implementation,
                    "has_tests": ep.has_tests,
                    "status": ep.status,
                    "tags": ep.tags,
                    "summary": ep.summary,
                    "description": ep.description,
                    "route_name": ep.route_name,
                    "test_file": ep.test_file,
                }
                for ep in self.endpoints
            ]
        }


def get_endpoint_status(
    has_contract: bool, has_implementation: bool, has_tests: bool
) -> CoverageStatus:
    """Determine the coverage status of an endpoint"""
    if has_contract and has_implementation and has_tests:
        return CoverageStatus.FULLY_COVERED
    elif has_contract and has_implementation:
        return CoverageStatus.NO_TESTS
    elif has_contract:
        return CoverageStatus.CONTRACT_ONLY
    elif has_implementation:
        return CoverageStatus.IMPL_ONLY
    else:
        return CoverageStatus.UNKNOWN


def collect_implementation_endpoints(app: FastAPI) -> Dict[str, Dict[str, Dict[str, Any]]]:
    """Collect all implemented endpoints from the FastAPI app"""
    implemented_endpoints = {}
    
    # Check each route in the FastAPI app
    for route in app.routes:
        if isinstance(route, APIRoute):
            path = route.path
            
            # Skip internal endpoints
            if path.startswith("/openapi") or path.startswith("/docs") or path.startswith("/redoc"):
                continue
            
            # Initialize path entry
            if path not in implemented_endpoints:
                implemented_endpoints[path] = {}
            
            # Add method
            for method in route.methods:
                # Skip HEAD and OPTIONS
                if method in ("HEAD", "OPTIONS"):
                    continue
                
                # Extract details about the endpoint
                endpoint_details = {
                    "route_name": route.name,
                    "tags": getattr(route, "tags", []),
                    "summary": getattr(route, "summary", ""),
                    "description": getattr(route, "description", ""),
                }
                
                implemented_endpoints[path][method] = endpoint_details
    
    return implemented_endpoints


def collect_test_coverage() -> Dict[str, List[str]]:
    """Collect endpoints covered by tests"""
    test_coverage = {}
    
    # Check for pytest existence
    try:
        # Find test files
        tests_dir = Path("tests")
        if not tests_dir.exists():
            return test_coverage
        
        # Look for test files
        test_files = list(tests_dir.glob("**/*_test.py")) + list(tests_dir.glob("**/test_*.py"))
        
        # Collect endpoints from test files
        for test_file in test_files:
            # Extract endpoint patterns from test file
            with open(test_file, "r") as f:
                content = f.read()
                
                # Look for HTTP method patterns (GET, POST, etc.)
                for method in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                    # Find patterns like "GET /api/patients" or similar
                    matches = re.findall(rf'(?:\.{method.lower()}\(|"{method}".*?|{method}["\s]+)(["\'])(\/[^"\']+)\1', content)
                    for _, path in matches:
                        if path not in test_coverage:
                            test_coverage[path] = []
                        
                        if method not in test_coverage[path]:
                            test_coverage[path].append(method)
    except Exception as e:
        print(f"Error collecting test coverage: {e}")
    
    return test_coverage


def generate_coverage_report(app: FastAPI) -> CoverageReport:
    """Generate a comprehensive coverage report"""
    report = CoverageReport()
    
    # 1. Collect implemented endpoints
    implemented_endpoints = collect_implementation_endpoints(app)
    
    # 2. Collect contract endpoints
    frontend_schema = load_frontend_schema()
    contract_endpoints = {}
    
    if frontend_schema:
        contract_endpoints = extract_endpoint_schemas(frontend_schema)
    
    # 3. Collect test coverage
    test_coverage = collect_test_coverage()
    
    # 4. Combine all endpoints from contracts and implementation
    all_paths = set(implemented_endpoints.keys()) | set(contract_endpoints.keys())
    
    # 5. Generate report for each endpoint
    for path in all_paths:
        # Get all methods from both sources
        impl_methods = set(implemented_endpoints.get(path, {}).keys())
        contract_methods = set(contract_endpoints.get(path, {}).keys())
        all_methods = impl_methods | contract_methods
        
        for method in all_methods:
            # Determine coverage
            has_contract = method in contract_methods
            has_implementation = method in impl_methods
            has_tests = path in test_coverage and method in test_coverage[path]
            
            # Get status
            status = get_endpoint_status(has_contract, has_implementation, has_tests)
            
            # Get additional details
            tags = []
            summary = ""
            description = ""
            route_name = ""
            test_file = ""
            
            # From implementation
            if has_implementation:
                endpoint_details = implemented_endpoints[path][method]
                tags = endpoint_details.get("tags", [])
                summary = endpoint_details.get("summary", "")
                description = endpoint_details.get("description", "")
                route_name = endpoint_details.get("route_name", "")
            
            # From contract
            elif has_contract:
                contract_schema = contract_endpoints[path][method]
                # Extract tags and description from contract
                operation_details = frontend_schema.get("paths", {}).get(path, {}).get(method.lower(), {})
                tags = operation_details.get("tags", [])
                summary = operation_details.get("summary", "")
                description = operation_details.get("description", "")
            
            # Add to report
            endpoint_coverage = EndpointCoverage(
                path=path,
                method=method,
                has_contract=has_contract,
                has_implementation=has_implementation,
                has_tests=has_tests,
                status=status,
                tags=tags,
                summary=summary,
                description=description,
                route_name=route_name,
                test_file=test_file
            )
            
            report.add_endpoint(endpoint_coverage)
    
    return report


def generate_coverage_html(report: CoverageReport, output_path: Optional[str] = None) -> str:
    """Generate HTML report from coverage data"""
    template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DentaMind API Contract Coverage Report</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            h1, h2, h3 {
                color: #2c3e50;
            }
            .summary {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 30px;
                gap: 15px;
            }
            .summary-card {
                flex: 1;
                min-width: 150px;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                text-align: center;
            }
            .summary-card h3 {
                margin-top: 0;
                font-size: 16px;
            }
            .summary-card p {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }
            .fully-covered { background-color: #d4edda; color: #155724; }
            .contract-only { background-color: #fff3cd; color: #856404; }
            .implementation-only { background-color: #f8d7da; color: #721c24; }
            .no-tests { background-color: #cce5ff; color: #004085; }
            .unknown { background-color: #e2e3e5; color: #383d41; }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                box-shadow: 0 2px 3px rgba(0,0,0,0.1);
            }
            th, td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            th {
                background-color: #f8f9fa;
                font-weight: 600;
            }
            tbody tr:hover {
                background-color: #f5f5f5;
            }
            .endpoint-method {
                display: inline-block;
                padding: 3px 6px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                min-width: 60px;
                text-align: center;
            }
            .get { background-color: #d1ecf1; color: #0c5460; }
            .post { background-color: #d4edda; color: #155724; }
            .put { background-color: #fff3cd; color: #856404; }
            .delete { background-color: #f8d7da; color: #721c24; }
            .patch { background-color: #cce5ff; color: #004085; }
            
            .status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            .search-container {
                margin: 20px 0;
            }
            #endpointSearch {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 16px;
            }
            .tag {
                display: inline-block;
                background-color: #e9ecef;
                color: #495057;
                padding: 2px 8px;
                border-radius: 12px;
                margin-right: 5px;
                font-size: 12px;
            }
            .filter-section {
                margin: 20px 0;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .filter-btn {
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            .filter-btn.active {
                background-color: #007bff;
                color: white;
                border-color: #007bff;
            }
            .timestamp {
                color: #6c757d;
                font-size: 14px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <h1>DentaMind API Contract Coverage Report</h1>
        <p class="timestamp">Generated on: {{ timestamp }}</p>
        
        <div class="summary">
            <div class="summary-card fully-covered">
                <h3>Fully Covered</h3>
                <p>{{ summary.fully_covered }}</p>
            </div>
            <div class="summary-card no-tests">
                <h3>Missing Tests</h3>
                <p>{{ summary.no_tests }}</p>
            </div>
            <div class="summary-card contract-only">
                <h3>Contract Only</h3>
                <p>{{ summary.contract_only }}</p>
            </div>
            <div class="summary-card implementation-only">
                <h3>Implementation Only</h3>
                <p>{{ summary.implementation_only }}</p>
            </div>
            <div class="summary-card">
                <h3>Total Endpoints</h3>
                <p>{{ summary.total }}</p>
            </div>
        </div>
        
        <div class="search-container">
            <input type="text" id="endpointSearch" placeholder="Search endpoints...">
        </div>
        
        <div class="filter-section">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="fully_covered">Fully Covered</button>
            <button class="filter-btn" data-filter="no_tests">Missing Tests</button>
            <button class="filter-btn" data-filter="contract_only">Contract Only</button>
            <button class="filter-btn" data-filter="implementation_only">Implementation Only</button>
        </div>
        
        <table id="coverageTable">
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Contract</th>
                    <th>Implementation</th>
                    <th>Tests</th>
                    <th>Tags</th>
                </tr>
            </thead>
            <tbody>
                {% for endpoint in endpoints %}
                <tr data-status="{{ endpoint.status }}">
                    <td>
                        <span class="endpoint-method {{ endpoint.method.lower() }}">{{ endpoint.method }}</span>
                        {{ endpoint.path }}
                        {% if endpoint.summary %}
                        <br><small>{{ endpoint.summary }}</small>
                        {% endif %}
                    </td>
                    <td>
                        <span class="status-badge {{ endpoint.status }}">
                            {% if endpoint.status == "fully_covered" %}
                                ✓ Fully Covered
                            {% elif endpoint.status == "no_tests" %}
                                ⚠ Missing Tests
                            {% elif endpoint.status == "contract_only" %}
                                ⚠ Contract Only
                            {% elif endpoint.status == "implementation_only" %}
                                ⚠ Implementation Only
                            {% else %}
                                ? Unknown
                            {% endif %}
                        </span>
                    </td>
                    <td>{{ "✓" if endpoint.has_contract else "✗" }}</td>
                    <td>{{ "✓" if endpoint.has_implementation else "✗" }}</td>
                    <td>{{ "✓" if endpoint.has_tests else "✗" }}</td>
                    <td>
                        {% for tag in endpoint.tags %}
                        <span class="tag">{{ tag }}</span>
                        {% endfor %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        
        <script>
            // Search functionality
            document.getElementById('endpointSearch').addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#coverageTable tbody tr');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
            
            // Filter buttons
            document.querySelectorAll('.filter-btn').forEach(button => {
                button.addEventListener('click', function() {
                    // Toggle active state
                    document.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    const filter = this.getAttribute('data-filter');
                    const rows = document.querySelectorAll('#coverageTable tbody tr');
                    
                    rows.forEach(row => {
                        if (filter === 'all' || row.getAttribute('data-status') === filter) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                });
            });
        </script>
    </body>
    </html>
    """
    
    # Simple template rendering (using string replacement)
    html = template
    
    # Replace timestamp
    html = html.replace("{{ timestamp }}", report.timestamp)
    
    # Replace summary stats
    for key, value in report.summary.items():
        html = html.replace(f"{{ summary.{key} }}", str(value))
    
    # Replace endpoints
    endpoints_html = ""
    for endpoint in report.endpoints:
        row_html = f"""
        <tr data-status="{endpoint.status}">
            <td>
                <span class="endpoint-method {endpoint.method.lower()}">{endpoint.method}</span>
                {endpoint.path}
                {'<br><small>' + endpoint.summary + '</small>' if endpoint.summary else ''}
            </td>
            <td>
                <span class="status-badge {endpoint.status}">
                    {'✓ Fully Covered' if endpoint.status == 'fully_covered' else
                     '⚠ Missing Tests' if endpoint.status == 'no_tests' else
                     '⚠ Contract Only' if endpoint.status == 'contract_only' else
                     '⚠ Implementation Only' if endpoint.status == 'implementation_only' else
                     '? Unknown'}
                </span>
            </td>
            <td>{{ "✓" if endpoint.has_contract else "✗" }}</td>
            <td>{{ "✓" if endpoint.has_implementation else "✗" }}</td>
            <td>{{ "✓" if endpoint.has_tests else "✗" }}</td>
            <td>
                {''.join([f'<span class="tag">{tag}</span>' for tag in endpoint.tags])}
            </td>
        </tr>
        """
        endpoints_html += row_html
    
    html = html.replace("{% for endpoint in endpoints %}\n                <tr data-status=\"{{ endpoint.status }}\">\n                    <td>\n                        <span class=\"endpoint-method {{ endpoint.method.lower() }}\">{{ endpoint.method }}</span>\n                        {{ endpoint.path }}\n                        {% if endpoint.summary %}\n                        <br><small>{{ endpoint.summary }}</small>\n                        {% endif %}\n                    </td>\n                    <td>\n                        <span class=\"status-badge {{ endpoint.status }}\">\n                            {% if endpoint.status == \"fully_covered\" %}\n                                ✓ Fully Covered\n                            {% elif endpoint.status == \"no_tests\" %}\n                                ⚠ Missing Tests\n                            {% elif endpoint.status == \"contract_only\" %}\n                                ⚠ Contract Only\n                            {% elif endpoint.status == \"implementation_only\" %}\n                                ⚠ Implementation Only\n                            {% else %}\n                                ? Unknown\n                            {% endif %}\n                        </span>\n                    </td>\n                    <td>{{ \"✓\" if endpoint.has_contract else \"✗\" }}</td>\n                    <td>{{ \"✓\" if endpoint.has_implementation else \"✗\" }}</td>\n                    <td>{{ \"✓\" if endpoint.has_tests else \"✗\" }}</td>\n                    <td>\n                        {% for tag in endpoint.tags %}\n                        <span class=\"tag\">{{ tag }}</span>\n                        {% endfor %}\n                    </td>\n                </tr>\n                {% endfor %}", endpoints_html)
    
    # Write to file if output path provided
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            f.write(html)
    
    return html


def setup_coverage_reporting(app: FastAPI) -> None:
    """Set up contract coverage reporting"""
    # Add coverage report generation endpoint
    from fastapi import APIRouter
    
    # Only enable in development mode
    if os.getenv("DENTAMIND_ENV", "development").lower() != "development":
        return
    
    coverage_router = APIRouter(prefix="/api/_dev/coverage", tags=["Development"])
    
    @coverage_router.get("/report")
    async def get_coverage_report():
        """Generate and return coverage report"""
        report = generate_coverage_report(app)
        return report.to_dict()
    
    @coverage_router.get("/report/html")
    async def get_coverage_report_html():
        """Generate and return HTML coverage report"""
        from fastapi.responses import HTMLResponse
        
        report = generate_coverage_report(app)
        html = generate_coverage_html(report)
        
        return HTMLResponse(content=html)
    
    # Register the router
    app.include_router(coverage_router) 