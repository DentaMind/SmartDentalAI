import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Menu, 
  Settings, 
  LogOut, 
  Calendar, 
  FileText, 
  Pill,
  ChevronDown
} from 'lucide-react';
import { PatientNotificationCenter } from './PatientNotificationCenter';

interface PatientPortalHeaderProps {
  patientId: string;
  patientName: string;
  profileImageUrl?: string;
}

export const PatientPortalHeader: React.FC<PatientPortalHeaderProps> = ({
  patientId,
  patientName,
  profileImageUrl
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  
  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };
  
  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center">
          <Link to="/patient/dashboard" className="flex items-center">
            <img 
              src="/assets/branding/logo.svg" 
              alt="DentaMind" 
              className="h-8 w-auto mr-3" 
            />
            <span className="text-lg font-semibold">DentaMind Patient Portal</span>
          </Link>
        </div>
        
        {/* Main Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link 
            to="/patient/dashboard" 
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Dashboard
          </Link>
          <Link 
            to="/patient/appointments" 
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Appointments
            </span>
          </Link>
          <Link 
            to="/patient/records" 
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Records
            </span>
          </Link>
          <Link 
            to="/patient/prescriptions" 
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span className="flex items-center">
              <Pill className="h-4 w-4 mr-1" />
              Prescriptions
            </span>
          </Link>
        </nav>
        
        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notification Center */}
          <PatientNotificationCenter patientId={patientId} />
          
          {/* Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="flex items-center">
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt={patientName} 
                    className="h-8 w-8 rounded-full object-cover border dark:border-gray-700" 
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <span className="ml-2 hidden md:block text-sm font-medium">{patientName}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </div>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700">
                <Link 
                  to="/patient/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>Your Profile</span>
                  </div>
                </Link>
                <Link 
                  to="/patient/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </div>
                </Link>
                <Link 
                  to="/patient/notifications/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <Menu className="h-4 w-4 mr-2" />
                    <span>Notification Settings</span>
                  </div>
                </Link>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 