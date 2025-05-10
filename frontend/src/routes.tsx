import { RouteObject } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import AuditLogViewer from './components/AuditLogViewer';
import TreatmentPlansPage from './pages/TreatmentPlansPage';
import TreatmentPlanDetailPage from './pages/TreatmentPlanDetailPage';
import { UserRole } from './types/user';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/patients',
    element: <Patients />,
  },
  {
    path: '/appointments',
    element: <Appointments />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/audit-logs',
    element: <AuditLogViewer />,
    // Only allow admin users to access audit logs
    loader: async () => {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== UserRole.ADMIN) {
        throw new Error('Unauthorized');
      }
      return null;
    },
  },
  {
    path: '/treatment-plans',
    element: <TreatmentPlansPage />,
  },
  {
    path: '/treatment-plans/:planId',
    element: <TreatmentPlanDetailPage />,
  },
]; 