import React, { useState, useEffect } from 'react';
import { FaCheckSquare, FaRegSquare, FaShieldAlt, FaKey, FaLock, FaLockOpen, FaUserShield, FaCodeBranch, FaClipboardCheck, FaSearch, FaRocket, FaSyncAlt, FaChartBar, FaExclamationTriangle, FaLifeRing, FaFileMedical } from 'react-icons/fa';
import axios from 'axios';

interface SecurityMetrics {
  lastAuditDate: string;
  criticalIssues: number;
  highIssues: number;
  totalIssues: number;
  coveragePercent: number;
}

interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
}

const SecurityChecklistDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    lastAuditDate: 'Never',
    criticalIssues: 0,
    highIssues: 0,
    totalIssues: 0,
    coveragePercent: 0,
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // Try to fetch metrics from the security audit API
        const response = await axios.get('/api/security/audit/rbac');
        
        if (response.data && response.data.summary) {
          const summary = response.data.summary;
          setMetrics({
            lastAuditDate: new Date().toLocaleDateString(),
            criticalIssues: summary.by_level.critical || 0,
            highIssues: summary.by_level.high || 0,
            totalIssues: summary.total_issues || 0,
            coveragePercent: 100 - (summary.total_issues > 0 ? 
              (summary.by_level.critical * 20 + summary.by_level.high * 10) / summary.total_issues : 0),
          });
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch security metrics');
        setLoading(false);
        console.error('Error fetching security metrics:', err);
      }
    };
    
    fetchMetrics();
  }, []);
  
  const sections: ChecklistSection[] = [
    {
      title: 'Initial Setup',
      icon: <FaKey className="text-blue-500 text-xl" />,
      items: [
        { text: 'Run ./setup-security-checks.sh to install pre-commit hooks', checked: false },
        { text: 'Read the full Security Documentation', checked: false },
        { text: 'Ensure your development branch is protected with required status checks', checked: false }
      ]
    },
    {
      title: 'When Creating New Endpoints',
      icon: <FaLock className="text-blue-500 text-xl" />,
      items: [
        { text: 'Authentication: Include current_user: User = Depends(get_current_user)', checked: false },
        { text: 'Role Validation: Check current_user.role against allowed roles', checked: false },
        { text: 'Patient Data: Verify user has access to the specific patient', checked: false },
        { text: 'Consistency: Use the same security patterns as similar endpoints', checked: false }
      ]
    },
    {
      title: 'Before Committing Code',
      icon: <FaCodeBranch className="text-blue-500 text-xl" />,
      items: [
        { text: 'Run python backend/run_security_audit.py if making significant API changes', checked: false },
        { text: 'Address any high-severity issues identified by the pre-commit hook', checked: false },
        { text: 'Consider medium-severity issues for future improvements', checked: false },
        { text: 'Check that all patient-related endpoints have proper role validation', checked: false }
      ]
    },
    {
      title: 'During Code Reviews',
      icon: <FaSearch className="text-blue-500 text-xl" />,
      items: [
        { text: 'Verify the GitHub Actions security audit passed on the PR', checked: false },
        { text: 'Check that new endpoints follow security best practices', checked: false },
        { text: 'Ensure consistent security patterns across similar endpoints', checked: false },
        { text: 'Look for proper handling of patient data', checked: false }
      ]
    },
    {
      title: 'Before Deployment',
      icon: <FaRocket className="text-blue-500 text-xl" />,
      items: [
        { text: 'Run a comprehensive security audit', checked: false },
        { text: 'Ensure no critical or high security issues remain', checked: false },
        { text: 'Verify security logs are properly configured', checked: false },
        { text: 'Test API endpoints with various user roles', checked: false }
      ]
    },
    {
      title: 'Regular Maintenance',
      icon: <FaSyncAlt className="text-blue-500 text-xl" />,
      items: [
        { text: 'Run security audits at least monthly', checked: false },
        { text: 'Update dependencies to address security vulnerabilities', checked: false },
        { text: 'Review and update role permissions as needed', checked: false },
        { text: 'Check for any unauthorized routes that might have been added', checked: false }
      ]
    },
    {
      title: 'HIPAA Compliance Reminders',
      icon: <FaFileMedical className="text-blue-500 text-xl" />,
      items: [
        { text: 'PHI Access: Always verify authentication and authorization before accessing PHI', checked: false },
        { text: 'Minimum Necessary: Only access the minimum patient data necessary for the task', checked: false },
        { text: 'Audit Trails: Ensure all PHI access is logged with user, timestamp, and reason', checked: false },
        { text: 'Data Security: Encrypt PHI in transit and at rest', checked: false }
      ]
    }
  ];
  
  const toggleCheck = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items[itemIndex].checked = !newSections[sectionIndex].items[itemIndex].checked;
    // In a real app, you would save this state to the backend or localStorage
  };
  
  const runSecurityAudit = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/security/audit/rbac');
      
      if (response.data && response.data.summary) {
        const summary = response.data.summary;
        setMetrics({
          lastAuditDate: new Date().toLocaleDateString(),
          criticalIssues: summary.by_level.critical || 0,
          highIssues: summary.by_level.high || 0,
          totalIssues: summary.total_issues || 0,
          coveragePercent: 100 - (summary.total_issues > 0 ? 
            (summary.by_level.critical * 20 + summary.by_level.high * 10) / summary.total_issues : 0),
        });
      }
      
      setLoading(false);
      window.open('/api/security/audit/rbac/report', '_blank');
    } catch (err) {
      setError('Failed to run security audit');
      setLoading(false);
      console.error('Error running security audit:', err);
    }
  };
  
  const getSecurityStatus = () => {
    if (metrics.criticalIssues > 0) {
      return { text: 'Critical Issues Found', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (metrics.highIssues > 0) {
      return { text: 'High Issues Found', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else if (metrics.totalIssues > 0) {
      return { text: 'Some Issues Found', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    } else {
      return { text: 'All Secure', color: 'text-green-600', bg: 'bg-green-100' };
    }
  };
  
  const securityStatus = getSecurityStatus();
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <FaShieldAlt className="mr-2 text-blue-600" />
          Security Checklist Dashboard
        </h1>
        <button
          onClick={runSecurityAudit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <FaUserShield className="mr-2" />
          {loading ? 'Running Audit...' : 'Run Security Audit'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm text-blue-600 font-semibold">Last Audit</div>
          <div className="text-xl mt-1">{metrics.lastAuditDate}</div>
        </div>
        
        <div className={`${securityStatus.bg} p-4 rounded-lg shadow-sm`}>
          <div className={`text-sm ${securityStatus.color} font-semibold`}>Status</div>
          <div className={`text-xl mt-1 ${securityStatus.color}`}>{securityStatus.text}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 font-semibold">Issues</div>
          <div className="text-xl mt-1">
            <span className="text-red-600 mr-2">{metrics.criticalIssues} Critical</span>
            <span className="text-yellow-600">{metrics.highIssues} High</span>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm text-green-600 font-semibold">Security Score</div>
          <div className="text-xl mt-1">{Math.round(metrics.coveragePercent)}%</div>
        </div>
      </div>
      
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className="border rounded-md p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              {section.icon}
              <span className="ml-2">{section.title}</span>
            </h2>
            <ul className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <li 
                  key={itemIndex} 
                  className="flex items-start cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                  onClick={() => toggleCheck(sectionIndex, itemIndex)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.checked ? (
                      <FaCheckSquare className="text-green-600" />
                    ) : (
                      <FaRegSquare className="text-gray-400" />
                    )}
                  </div>
                  <span className={`ml-2 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaExclamationTriangle className="text-yellow-500 mr-2" />
          Common Security Issues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 p-3 rounded-md">
            <h3 className="font-medium text-red-700">Unauthorized Endpoint</h3>
            <p className="text-sm text-gray-700">Missing authentication dependency</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <h3 className="font-medium text-yellow-700">Missing RBAC</h3>
            <p className="text-sm text-gray-700">Has authentication but no role checks</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <h3 className="font-medium text-yellow-700">Inconsistent Security</h3>
            <p className="text-sm text-gray-700">Different patterns than similar endpoints</p>
          </div>
          <div className="bg-red-50 p-3 rounded-md">
            <h3 className="font-medium text-red-700">Potential Data Leak</h3>
            <p className="text-sm text-gray-700">Patient data without proper checks</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>For detailed guidance, see the <a href="/docs/SECURITY.md" className="text-blue-600 hover:underline">Security Documentation</a></p>
      </div>
    </div>
  );
};

export default SecurityChecklistDashboard; 