# Contract Coverage Reporting

This guide explains how to use DentaMind's contract coverage reporting system, which provides visibility into the implementation status of API contracts.

## Overview

The contract coverage reporting system gives you a comprehensive view of your API's implementation status:

1. **Contract Coverage**: Which endpoints have TypeScript contracts defined
2. **Implementation Coverage**: Which endpoints are implemented in FastAPI
3. **Test Coverage**: Which endpoints have test coverage

This visibility helps identify gaps in your API's implementation, ensuring full type safety and reliable operation.

## Using the Coverage Dashboard

### Web Interface

The easiest way to view coverage information is through the HTML report:

1. Start the development server:
   ```bash
   cd backend
   python -m uvicorn api.main:app --reload
   ```

2. Open the HTML coverage report:
   ```
   http://localhost:8000/api/_dev/coverage/report/html
   ```

This provides an interactive dashboard with:

- A summary of coverage metrics
- A searchable table of all endpoints
- Filters to focus on specific coverage status
- Status badges for each endpoint

### JSON API

For programmatic use, you can also access the coverage data as JSON:

```
http://localhost:8000/api/_dev/coverage/report
```

This returns a JSON representation of the coverage report, suitable for:

- Integration with CI/CD pipelines
- Custom dashboards
- Automated monitoring

## Understanding Coverage Status

Each endpoint in the system falls into one of these coverage categories:

| Status | Description | Action Required |
|--------|-------------|----------------|
| **Fully Covered** | Has contract, implementation, and tests | ✅ None |
| **Missing Tests** | Has contract and implementation, but no tests | Add tests for the endpoint |
| **Contract Only** | Has contract but no implementation | Implement the endpoint |
| **Implementation Only** | Has implementation but no contract | Add contract definition |
| **Unknown** | Coverage status cannot be determined | Investigate and resolve |

## CI/CD Integration

To integrate contract coverage reporting into your CI/CD pipeline:

1. **Add coverage check to CI**:
   ```yaml
   # .github/workflows/api-coverage.yml
   jobs:
     check-coverage:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Python
           uses: actions/setup-python@v4
           with:
             python-version: '3.11'
         - name: Install dependencies
           run: pip install -r backend/requirements.txt
         - name: Generate coverage report
           run: python backend/scripts/generate_coverage_report.py
         - name: Upload coverage report
           uses: actions/upload-artifact@v3
           with:
             name: coverage-report
             path: reports/contract-coverage/
   ```

2. **Add coverage thresholds**:
   ```python
   # backend/scripts/check_coverage_thresholds.py
   import json
   import sys
   
   # Load coverage report
   with open('reports/contract-coverage/latest.json') as f:
       report = json.load(f)
   
   # Check thresholds
   min_fully_covered = 0.80  # 80%
   fully_covered_ratio = report['summary']['fully_covered'] / report['summary']['total']
   
   if fully_covered_ratio < min_fully_covered:
       print(f"Coverage below threshold: {fully_covered_ratio:.2%} < {min_fully_covered:.2%}")
       sys.exit(1)
   
   print(f"Coverage meets threshold: {fully_covered_ratio:.2%} >= {min_fully_covered:.2%}")
   sys.exit(0)
   ```

## Best Practices

1. **Generate Coverage Reports Regularly**  
   Make it part of your development workflow to check coverage regularly.

2. **Add Coverage Checks to CI/CD**  
   Automate coverage verification in your CI/CD pipeline.

3. **Track Coverage Metrics Over Time**  
   Record and chart coverage metrics to see trends.

4. **Prioritize Gaps Based on Risk**  
   Focus first on contract-only endpoints (unimplemented APIs).

5. **Review Implementation-Only Endpoints**  
   Undocumented APIs are a risk to API stability.

## Command-Line Tool

You can also generate coverage reports from the command line:

```bash
cd backend
python scripts/generate_coverage_report.py --output reports/contract-coverage/latest.json
```

This command generates both JSON and HTML reports:
- `reports/contract-coverage/latest.json`: Machine-readable report
- `reports/contract-coverage/latest.html`: Human-readable report

## HIPAA Compliance Considerations

For healthcare applications like DentaMind, contract coverage is particularly important for HIPAA compliance:

1. **Documentation**: Ensures all APIs are properly documented
2. **Validation**: Verifies that all data access points are properly validated
3. **Testing**: Confirms that sensitive data handling is tested
4. **Audit Trail**: Provides evidence of API specification adherence

Maintaining high contract coverage helps ensure that all data access paths are properly specified, implemented, and tested, reducing the risk of security vulnerabilities or data exposure. 