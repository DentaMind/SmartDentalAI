"""
HTML Report Generator for RBAC Security Audit

This module generates a visually appealing HTML report from RBAC audit results
including charts, tables, and filtering capabilities.
"""

import json
from typing import List, Dict, Any
import os
import datetime
from .rbac_audit import SecurityAuditResult, RouteSecurityInfo, RBACVulnerability

def generate_html_report(issues: List[Dict[str, Any]], summary: Dict[str, Any]) -> str:
    """
    Generate an HTML report from RBAC audit results
    
    Args:
        issues: List of security issues found during audit
        summary: Summary statistics of the audit
        
    Returns:
        HTML string for the report
    """
    # Prepare data for JavaScript
    issues_json = json.dumps(issues)
    summary_json = json.dumps(summary)
    
    # Define color schemes for different security levels
    level_colors = {
        "critical": "#dc3545",  # red
        "high": "#fd7e14",      # orange
        "medium": "#ffc107",    # yellow
        "low": "#20c997",       # teal
        "info": "#0dcaf0"       # light blue
    }
    
    # Define icons for different security statuses
    status_icons = {
        "unauthorized": "🔓",
        "auth_missing_rbac": "🔒❓",
        "inconsistent_rbac": "⚠️",
        "potential_data_leak": "🔍",
        "authorized": "✅"
    }
    
    # The HTML template
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DentaMind RBAC Security Audit</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
        <style>
            .dashboard-container {{
                padding: 20px;
            }}
            .summary-box {{
                border-radius: 5px;
                padding: 20px;
                margin-bottom: 20px;
                background-color: #f8f9fa;
                border-left: 5px solid #0d6efd;
            }}
            .chart-container {{
                height: 250px;
                margin-bottom: 20px;
            }}
            .issue-level-critical {{
                border-left: 5px solid {level_colors["critical"]};
            }}
            .issue-level-high {{
                border-left: 5px solid {level_colors["high"]};
            }}
            .issue-level-medium {{
                border-left: 5px solid {level_colors["medium"]};
            }}
            .issue-level-low {{
                border-left: 5px solid {level_colors["low"]};
            }}
            .issue-level-info {{
                border-left: 5px solid {level_colors["info"]};
            }}
            .level-badge-critical {{
                background-color: {level_colors["critical"]};
                color: white;
            }}
            .level-badge-high {{
                background-color: {level_colors["high"]};
                color: white;
            }}
            .level-badge-medium {{
                background-color: {level_colors["medium"]};
                color: black;
            }}
            .level-badge-low {{
                background-color: {level_colors["low"]};
                color: black;
            }}
            .level-badge-info {{
                background-color: {level_colors["info"]};
                color: black;
            }}
            .hipaa-warning {{
                background-color: #f8d7da;
                color: #721c24;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
            }}
            .security-definition {{
                border-left: 3px solid #6c757d;
                padding-left: 10px;
                margin-bottom: 10px;
            }}
            tr.critical-row {{
                background-color: rgba(220, 53, 69, 0.1);
            }}
            tr.high-row {{
                background-color: rgba(253, 126, 20, 0.1);
            }}
        </style>
    </head>
    <body>
        <div class="dashboard-container">
            <h1 class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-shield-lock me-2" viewBox="0 0 16 16">
                    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
                    <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415z"/>
                </svg>
                DentaMind RBAC Security Audit
            </h1>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="summary-box shadow-sm">
                        <h3>Audit Summary</h3>
                        <p class="text-muted">Security issues found across API endpoints</p>
                        <div class="row">
                            <div class="col">
                                <h4 id="total-issues" class="display-4 text-primary">0</h4>
                                <p>Total Issues</p>
                            </div>
                            <div class="col">
                                <div id="critical-issues" class="h5">
                                    <span class="badge level-badge-critical">0</span> Critical
                                </div>
                                <div id="high-issues" class="h5">
                                    <span class="badge level-badge-high">0</span> High
                                </div>
                                <div id="medium-issues" class="h5">
                                    <span class="badge level-badge-medium">0</span> Medium
                                </div>
                            </div>
                        </div>
                        
                        <div class="hipaa-warning mt-3">
                            <strong>HIPAA Compliance Warning:</strong> Unprotected endpoints handling patient data may violate HIPAA regulations. Address critical and high severity issues immediately.
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="summary-box shadow-sm">
                        <h3>Security Level Definitions</h3>
                        <div class="security-definitions">
                            <div class="security-definition">
                                <strong style="color: {level_colors['critical']}">Critical:</strong> 
                                <span id="critical-definition"></span>
                            </div>
                            <div class="security-definition">
                                <strong style="color: {level_colors['high']}">High:</strong>
                                <span id="high-definition"></span>
                            </div>
                            <div class="security-definition">
                                <strong style="color: {level_colors['medium']}">Medium:</strong>
                                <span id="medium-definition"></span>
                            </div>
                            <div class="security-definition">
                                <strong style="color: {level_colors['low']}">Low:</strong>
                                <span id="low-definition"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header">
                            Issues by Security Level
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="issuesByLevelChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header">
                            Issues by Security Status
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="issuesByStatusChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card shadow-sm mb-4">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">Security Issues</h3>
                        <div>
                            <div class="input-group">
                                <input type="text" id="searchInput" class="form-control" placeholder="Search endpoints...">
                                <select id="levelFilter" class="form-select">
                                    <option value="all">All Levels</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                    <option value="info">Info</option>
                                </select>
                                <select id="statusFilter" class="form-select">
                                    <option value="all">All Statuses</option>
                                    <option value="unauthorized">Unauthorized</option>
                                    <option value="auth_missing_rbac">Auth Missing RBAC</option>
                                    <option value="inconsistent_rbac">Inconsistent RBAC</option>
                                    <option value="potential_data_leak">Potential Data Leak</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Endpoint</th>
                                    <th>Method</th>
                                    <th>Level</th>
                                    <th>Status</th>
                                    <th>Description</th>
                                    <th>Suggestion</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody id="issuesTableBody">
                                <!-- Will be populated by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <footer class="mt-5 mb-3 text-muted text-center">
                <p>DentaMind RBAC Security Audit | Generated on <span id="reportDate"></span></p>
            </footer>
        </div>
        
        <script>
            // Raw data from Python
            const issues = {issues_json};
            const summary = {summary_json};
            
            // Update the report date
            document.getElementById('reportDate').textContent = new Date().toLocaleString();
            
            // Update summary numbers
            document.getElementById('total-issues').textContent = summary.total_issues;
            document.getElementById('critical-issues').querySelector('.badge').textContent = summary.by_level.critical;
            document.getElementById('high-issues').querySelector('.badge').textContent = summary.by_level.high;
            document.getElementById('medium-issues').querySelector('.badge').textContent = summary.by_level.medium;
            
            // Update security level definitions
            document.getElementById('critical-definition').textContent = summary.security_levels.critical;
            document.getElementById('high-definition').textContent = summary.security_levels.high;
            document.getElementById('medium-definition').textContent = summary.security_levels.medium;
            document.getElementById('low-definition').textContent = summary.security_levels.low;
            
            // Chart for issues by level
            const levelCtx = document.getElementById('issuesByLevelChart').getContext('2d');
            const levelChart = new Chart(levelCtx, {{
                type: 'bar',
                data: {{
                    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
                    datasets: [{{
                        label: 'Number of Issues',
                        data: [
                            summary.by_level.critical,
                            summary.by_level.high,
                            summary.by_level.medium,
                            summary.by_level.low,
                            summary.by_level.info
                        ],
                        backgroundColor: [
                            '{level_colors["critical"]}',
                            '{level_colors["high"]}',
                            '{level_colors["medium"]}',
                            '{level_colors["low"]}',
                            '{level_colors["info"]}'
                        ]
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            title: {{
                                display: true,
                                text: 'Number of Issues'
                            }}
                        }}
                    }}
                }}
            }});
            
            // Chart for issues by status
            const statusCtx = document.getElementById('issuesByStatusChart').getContext('2d');
            const statusLabels = {{
                'unauthorized': 'Unauthorized',
                'auth_missing_rbac': 'Auth Missing RBAC',
                'inconsistent_rbac': 'Inconsistent RBAC',
                'potential_data_leak': 'Potential Data Leak',
                'authorized': 'Authorized'
            }};
            
            const statusChart = new Chart(statusCtx, {{
                type: 'pie',
                data: {{
                    labels: Object.keys(summary.by_status).map(key => statusLabels[key] || key),
                    datasets: [{{
                        data: Object.values(summary.by_status),
                        backgroundColor: [
                            '#dc3545',  // red - unauthorized
                            '#fd7e14',  // orange - auth_missing_rbac
                            '#ffc107',  // yellow - inconsistent_rbac
                            '#0dcaf0',  // cyan - potential_data_leak
                            '#198754'   // green - authorized
                        ]
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{
                        legend: {{
                            position: 'right'
                        }}
                    }}
                }}
            }});
            
            // Populate the issues table
            function populateIssuesTable(filteredIssues = issues) {{
                const tableBody = document.getElementById('issuesTableBody');
                tableBody.innerHTML = '';
                
                filteredIssues.forEach(issue => {{
                    const row = document.createElement('tr');
                    if (issue.level === 'critical') {{
                        row.classList.add('critical-row');
                    }} else if (issue.level === 'high') {{
                        row.classList.add('high-row');
                    }}
                    
                    // Format the status for display
                    const formattedStatus = issue.status
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    const statusIcon = '{status_icons["unauthorized"]}';
                    if (issue.status === 'unauthorized') {{
                        statusIcon = '{status_icons["unauthorized"]}';
                    }} else if (issue.status === 'auth_missing_rbac') {{
                        statusIcon = '{status_icons["auth_missing_rbac"]}';
                    }} else if (issue.status === 'inconsistent_rbac') {{
                        statusIcon = '{status_icons["inconsistent_rbac"]}';
                    }} else if (issue.status === 'potential_data_leak') {{
                        statusIcon = '{status_icons["potential_data_leak"]}';
                    }}
                    
                    row.innerHTML = `
                        <td><code>\${{issue.endpoint}}</code></td>
                        <td><span class="badge bg-secondary">\${{issue.method}}</span></td>
                        <td><span class="badge level-badge-\${{issue.level}}">\${{issue.level.toUpperCase()}}</span></td>
                        <td>\${{statusIcon}} \${{formattedStatus}}</td>
                        <td>\${{issue.description}}</td>
                        <td>\${{issue.suggestion}}</td>
                        <td><small><code>\${{issue.code_location}}</code></small></td>
                    `;
                    
                    tableBody.appendChild(row);
                }});
            }}
            
            // Initial table population
            populateIssuesTable();
            
            // Set up search and filters
            const searchInput = document.getElementById('searchInput');
            const levelFilter = document.getElementById('levelFilter');
            const statusFilter = document.getElementById('statusFilter');
            
            function applyFilters() {{
                const searchTerm = searchInput.value.toLowerCase();
                const levelValue = levelFilter.value;
                const statusValue = statusFilter.value;
                
                const filteredIssues = issues.filter(issue => {{
                    const matchesSearch = 
                        issue.endpoint.toLowerCase().includes(searchTerm) ||
                        issue.description.toLowerCase().includes(searchTerm);
                    
                    const matchesLevel = levelValue === 'all' || issue.level === levelValue;
                    const matchesStatus = statusValue === 'all' || issue.status === statusValue;
                    
                    return matchesSearch && matchesLevel && matchesStatus;
                }});
                
                populateIssuesTable(filteredIssues);
            }}
            
            searchInput.addEventListener('input', applyFilters);
            levelFilter.addEventListener('change', applyFilters);
            statusFilter.addEventListener('change', applyFilters);
        </script>
    </body>
    </html>
    """
    
    return html 

class SecurityAuditHTMLReportGenerator:
    """Generates HTML reports for security audit results"""
    
    def __init__(self, audit_result: SecurityAuditResult, app_name: str = "DentaMind"):
        self.audit_result = audit_result
        self.app_name = app_name
        self.report_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    def generate_report(self, output_dir: str = "reports") -> str:
        """Generate a comprehensive HTML report"""
        os.makedirs(output_dir, exist_ok=True)
        
        report_filename = f"{output_dir}/security_audit_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
        html_content = self._generate_html()
        
        with open(report_filename, "w") as f:
            f.write(html_content)
            
        return report_filename
    
    def _generate_html(self) -> str:
        """Generate the HTML content for the report"""
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{self.app_name} Security Audit Report</title>
            <style>
                :root {{
                    --primary-color: #2563eb;
                    --secondary-color: #3b82f6;
                    --danger-color: #ef4444;
                    --warning-color: #f59e0b;
                    --success-color: #10b981;
                    --info-color: #3b82f6;
                    --bg-color: #f9fafb;
                    --text-color: #1f2937;
                    --light-gray: #f3f4f6;
                    --border-color: #e5e7eb;
                }}
                
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: var(--text-color);
                    background-color: var(--bg-color);
                    margin: 0;
                    padding: 0;
                }}
                
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                
                header {{
                    background-color: var(--primary-color);
                    color: white;
                    padding: 20px;
                    margin-bottom: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }}
                
                h1, h2, h3, h4 {{
                    margin-top: 0;
                    font-weight: 600;
                }}
                
                .summary-stats {{
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                
                .stat-card {{
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    padding: 20px;
                    text-align: center;
                }}
                
                .stat-title {{
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 10px;
                }}
                
                .stat-value {{
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0;
                }}
                
                .stat-context {{
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-top: 5px;
                }}
                
                .stat-card.critical {{
                    border-top: 4px solid var(--danger-color);
                }}
                
                .stat-card.high {{
                    border-top: 4px solid var(--warning-color);
                }}
                
                .stat-card.medium {{
                    border-top: 4px solid var(--info-color);
                }}
                
                .stat-card.low {{
                    border-top: 4px solid var(--success-color);
                }}
                
                .section {{
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    padding: 20px;
                    margin-bottom: 30px;
                }}
                
                .table-responsive {{
                    overflow-x: auto;
                    margin-bottom: 20px;
                }}
                
                table {{
                    width: 100%;
                    border-collapse: collapse;
                }}
                
                th {{
                    background-color: var(--light-gray);
                    text-align: left;
                    padding: 12px 15px;
                    font-weight: 600;
                    border-bottom: 2px solid var(--border-color);
                }}
                
                td {{
                    padding: 10px 15px;
                    border-bottom: 1px solid var(--border-color);
                }}
                
                tbody tr:hover {{
                    background-color: var(--light-gray);
                }}
                
                .tag {{
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-right: 5px;
                    margin-bottom: 5px;
                }}
                
                .tag.critical {{
                    background-color: #fee2e2;
                    color: #b91c1c;
                }}
                
                .tag.high {{
                    background-color: #fef3c7;
                    color: #b45309;
                }}
                
                .tag.medium {{
                    background-color: #dbeafe;
                    color: #1e40af;
                }}
                
                .tag.low {{
                    background-color: #d1fae5;
                    color: #065f46;
                }}
                
                .code-block {{
                    background-color: #282c34;
                    color: #abb2bf;
                    padding: 15px;
                    border-radius: 6px;
                    overflow-x: auto;
                    margin-top: 10px;
                    font-family: monospace;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }}
                
                .collapsible {{
                    cursor: pointer;
                    padding: 10px 15px;
                    background-color: var(--light-gray);
                    border: none;
                    text-align: left;
                    outline: none;
                    font-size: 1rem;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                
                .collapsible:after {{
                    content: '\\002B';
                    font-weight: bold;
                    margin-left: 5px;
                }}
                
                .active:after {{
                    content: "\\2212";
                }}
                
                .content {{
                    padding: 0 15px;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.2s ease-out;
                    background-color: white;
                }}
                
                .auth-yes {{
                    color: var(--success-color);
                    font-weight: 600;
                }}
                
                .auth-no {{
                    color: var(--danger-color);
                    font-weight: 600;
                }}
                
                .progress-container {{
                    background-color: var(--light-gray);
                    border-radius: 4px;
                    height: 10px;
                    width: 100%;
                    margin-top: 5px;
                }}
                
                .progress-bar {{
                    height: 10px;
                    border-radius: 4px;
                }}
                
                .progress-good {{
                    background-color: var(--success-color);
                }}
                
                .progress-medium {{
                    background-color: var(--warning-color);
                }}
                
                .progress-bad {{
                    background-color: var(--danger-color);
                }}
                
                .donut-chart {{
                    width: 100%;
                    max-width: 250px;
                    margin: 0 auto;
                }}
                
                .chart-container {{
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                
                @media (max-width: 768px) {{
                    .summary-stats {{
                        grid-template-columns: 1fr;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>{self.app_name} Security Audit Report</h1>
                    <p>Generated on {self.report_date}</p>
                </header>
                
                <div class="section">
                    <h2>Executive Summary</h2>
                    <p>This report provides an overview of the security audit performed on the {self.app_name} API routes, 
                    focusing on authentication, authorization, and data protection mechanisms.</p>
                    
                    <div class="summary-stats">
                        <div class="stat-card">
                            <div class="stat-title">Total Routes</div>
                            <div class="stat-value">{self.audit_result.total_routes}</div>
                            <div class="stat-context">API endpoints analyzed</div>
                        </div>
                        
                        <div class="stat-card {self._get_auth_coverage_class()}">
                            <div class="stat-title">Authentication Coverage</div>
                            <div class="stat-value">{self._get_auth_coverage_percentage()}%</div>
                            <div class="stat-context">{self.audit_result.routes_with_auth} of {self.audit_result.total_routes} routes</div>
                        </div>
                        
                        <div class="stat-card {self._get_role_coverage_class()}">
                            <div class="stat-title">Role Verification</div>
                            <div class="stat-value">{self._get_role_coverage_percentage()}%</div>
                            <div class="stat-context">{self.audit_result.routes_with_role_checks} of {self.audit_result.total_routes} routes</div>
                        </div>
                        
                        <div class="stat-card critical">
                            <div class="stat-title">Critical Vulnerabilities</div>
                            <div class="stat-value">{self.audit_result.critical_vulnerabilities}</div>
                        </div>
                        
                        <div class="stat-card high">
                            <div class="stat-title">High Vulnerabilities</div>
                            <div class="stat-value">{self.audit_result.high_vulnerabilities}</div>
                        </div>
                        
                        <div class="stat-card medium">
                            <div class="stat-title">Medium Vulnerabilities</div>
                            <div class="stat-value">{self.audit_result.medium_vulnerabilities}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Vulnerabilities Section -->
                <div class="section">
                    <h2>Security Vulnerabilities</h2>
                    <p>The following security issues were identified during the audit:</p>
                    
                    {self._generate_vulnerabilities_html()}
                </div>
                
                <!-- Vulnerable Routes Section -->
                <div class="section">
                    <h2>Vulnerable Routes</h2>
                    <p>API endpoints with security concerns:</p>
                    
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Path</th>
                                    <th>Methods</th>
                                    <th>Risk Level</th>
                                    <th>Authentication</th>
                                    <th>Role Check</th>
                                    <th>Security Score</th>
                                    <th>File Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {self._generate_vulnerable_routes_html()}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <script>
                    // JavaScript for collapsible sections
                    document.addEventListener('DOMContentLoaded', function() {{
                        var coll = document.getElementsByClassName("collapsible");
                        for (var i = 0; i < coll.length; i++) {{
                            coll[i].addEventListener("click", function() {{
                                this.classList.toggle("active");
                                var content = this.nextElementSibling;
                                if (content.style.maxHeight) {{
                                    content.style.maxHeight = null;
                                }} else {{
                                    content.style.maxHeight = content.scrollHeight + "px";
                                }}
                            }});
                        }}
                    }});
                </script>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _generate_vulnerabilities_html(self) -> str:
        """Generate HTML for vulnerabilities section"""
        if not self.audit_result.vulnerabilities:
            return "<p>No vulnerabilities were found.</p>"
        
        html = ""
        for i, vuln in enumerate(self.audit_result.vulnerabilities):
            severity_class = vuln.severity.lower()
            
            html += f"""
            <button class="collapsible">
                <span><span class="tag {severity_class}">{vuln.severity}</span> {vuln.vulnerability_type}</span>
            </button>
            <div class="content">
                <p><strong>Description:</strong> {vuln.description}</p>
                <p><strong>Location:</strong> {vuln.file_path}, Line {vuln.line_number}</p>
                <p><strong>Remediation:</strong> {vuln.remediation}</p>
                
                <h4>Affected Endpoints:</h4>
                <ul>
            """
            
            for endpoint in vuln.endpoints_affected:
                html += f"<li>{endpoint}</li>"
            
            html += f"""
                </ul>
                
                <h4>Code Snippet:</h4>
                <div class="code-block">{vuln.code_snippet}</div>
            </div>
            """
        
        return html
    
    def _generate_vulnerable_routes_html(self) -> str:
        """Generate HTML for vulnerable routes table"""
        if not self.audit_result.vulnerable_routes:
            return "<tr><td colspan='7'>No vulnerable routes were found.</td></tr>"
        
        html = ""
        for route in self.audit_result.vulnerable_routes:
            methods = ", ".join(route.methods)
            
            # Determine progress bar class
            progress_class = "progress-good"
            if route.security_score < 50:
                progress_class = "progress-bad"
            elif route.security_score < 80:
                progress_class = "progress-medium"
            
            html += f"""
            <tr>
                <td>{route.path}</td>
                <td>{methods}</td>
                <td><span class="tag {route.risk_level.lower()}">{route.risk_level}</span></td>
                <td class="{'auth-yes' if route.has_auth_dependency else 'auth-no'}">{'Yes' if route.has_auth_dependency else 'No'}</td>
                <td class="{'auth-yes' if route.has_role_check else 'auth-no'}">{'Yes' if route.has_role_check else 'No'}</td>
                <td>
                    <div>{route.security_score}/100</div>
                    <div class="progress-container">
                        <div class="progress-bar {progress_class}" style="width: {route.security_score}%"></div>
                    </div>
                </td>
                <td>{route.file_path}:{route.line_number}</td>
            </tr>
            """
        
        return html
    
    def _get_auth_coverage_percentage(self) -> int:
        """Calculate the percentage of routes with authentication"""
        if self.audit_result.total_routes == 0:
            return 0
        return round((self.audit_result.routes_with_auth / self.audit_result.total_routes) * 100)
    
    def _get_role_coverage_percentage(self) -> int:
        """Calculate the percentage of routes with role checks"""
        if self.audit_result.total_routes == 0:
            return 0
        return round((self.audit_result.routes_with_role_checks / self.audit_result.total_routes) * 100)
    
    def _get_auth_coverage_class(self) -> str:
        """Get the CSS class for auth coverage based on percentage"""
        percentage = self._get_auth_coverage_percentage()
        if percentage >= 90:
            return "low"  # Low risk (good)
        elif percentage >= 70:
            return "medium"
        else:
            return "critical"
    
    def _get_role_coverage_class(self) -> str:
        """Get the CSS class for role coverage based on percentage"""
        percentage = self._get_role_coverage_percentage()
        if percentage >= 75:
            return "low"  # Low risk (good)
        elif percentage >= 50:
            return "medium"
        else:
            return "high" 