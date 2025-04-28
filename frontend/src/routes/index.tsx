import PatientHealthPage from '../pages/health/PatientHealthPage';

const routes = [
    {
        path: '/patients/:patientId/health',
        element: <PatientHealthPage />,
        roles: ['doctor', 'nurse', 'admin'],
    },
]; 