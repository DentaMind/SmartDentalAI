---
title: 🚨 Database Health Check - Issues Detected
labels: bug, high-priority, database
assignees: '@database-team'
---

## ⚠️ Database Health Issues Detected

**Environment**: `{{ env.DB_ENV }}`  
**Time**: `{{ date | date('YYYY-MM-DD HH:mm:ss') }}`  
**Workflow Run**: [View Details](https://github.com/{{ github.repository }}/actions/runs/{{ github.run_id }})

### Issues Summary

{% if env.RESULTS_FILE != '' %}
{% assign results = env.RESULTS_FILE | readFile | fromJson %}

**Status**: `{{ results.status | upcase }}`

**Issues Detected**:
{% for issue in results.issues %}
- {{ issue }}
{% endfor %}

### Detailed Results

{% if results.tables.missing_tables.size > 0 %}
#### 🔴 Missing Tables ({{ results.tables.missing_tables.size }})
{% for table in results.tables.missing_tables %}
- `{{ table }}`
{% endfor %}
{% endif %}

{% if results.foreign_keys.broken_foreign_keys.size > 0 %}
#### 🔴 Broken Foreign Keys ({{ results.foreign_keys.broken_foreign_keys.size }})
{% for fk in results.foreign_keys.broken_foreign_keys %}
- `{{ fk.table }}.{{ fk.column }}` → `{{ fk.ref_table }}.{{ fk.ref_column }}`: {{ fk.issue }}
{% endfor %}
{% endif %}

{% if results.indexes.missing_indexes.size > 0 %}
#### 🟠 Missing Indexes ({{ results.indexes.missing_indexes.size }})
{% for idx in results.indexes.missing_indexes %}
- `{{ idx.table }}.{{ idx.column }}`
{% endfor %}
{% endif %}

{% else %}
Health check results file not found or not readable.
{% endif %}

## 🔨 Action Required

1. **Resolve the issues listed above** before they impact application stability
2. **Run the database health check locally** to verify fixes: 
   ```
   python scripts/db_health_check.py
   ```
3. **Consider adding missing migrations** if needed
4. **Close this issue** when resolved

## 📊 Database Health Dashboard

View the database health dashboard in the admin panel:
[Admin Dashboard - Database Health](https://dentamind.com/admin/dashboard?tab=database) 