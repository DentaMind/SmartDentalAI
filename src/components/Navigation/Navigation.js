import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ connected }) => {
  const [messages, setMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // In a real implementation, fetch messages and notifications from API
    setMessages(3);
    setNotifications(5);
  }, []);

  return (
    <aside id="left-panel" className="left-panel" style={{ display: (connected ? 'block' : 'none') }}>
      <nav className="navbar navbar-expand-sm navbar-default">
        <div id="main-menu" className="main-menu collapse navbar-collapse">
          <ul className="nav navbar-nav">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                <i className="menu-icon fa fa-laptop"></i>Dashboard
              </NavLink>
            </li>

            {/* Patients Section */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-user"></i>Patients
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/patients" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    All Patients
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/patients/add" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Add Patient
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/patients/search" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Search
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Appointments Section */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-calendar"></i>Appointments
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/appointments" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Calendar
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/appointments/add" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Schedule
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/appointments/upcoming" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Upcoming
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Clinical Section */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-stethoscope"></i>Clinical
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/treatment-plans" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Treatment Plans
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/perio-chart" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Perio Chart
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/restorative-chart" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Restorative Chart
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/clinical-notes" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Clinical Notes
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Imaging Section */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-image"></i>Imaging
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/xrays" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    X-Rays
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/xrays/upload" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Upload
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/xrays/ai-analysis" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    AI Analysis
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Insurance & Billing */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-usd"></i>Finances
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/billing" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Billing
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/insurance/claims" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Insurance Claims
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/payments" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Payments
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/financial-reports" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Reports
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Prescriptions */}
            <li>
              <NavLink to="/prescriptions" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                <i className="menu-icon fa fa-medkit"></i>Prescriptions
              </NavLink>
            </li>

            {/* Inventory */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-archive"></i>Inventory
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/inventory/supplies" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Supplies
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/inventory/medicaments" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Medicaments
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/inventory/equipment" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Equipment
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Communications */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-comments"></i>Communications
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/messages" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Messages <span className="badge badge-primary">{messages}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/notifications" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Notifications <span className="badge badge-danger">{notifications}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/email-templates" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Email Templates
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Analytics */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-bar-chart"></i>Analytics
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/analytics/practice" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Practice Performance
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/analytics/clinical" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Clinical Outcomes
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/analytics/financial" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Financial
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* AI Hub */}
            <li className="menu-item-has-children dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="menu-icon fa fa-robot"></i>AI Hub
              </a>
              <ul className="sub-menu children dropdown-menu">
                <li>
                  <NavLink to="/ai/diagnosis" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    AI Diagnosis
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/ai/treatment-suggestions" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Treatment Suggestions
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/ai/voice-assistant" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                    Voice Assistant
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Settings */}
            <li>
              <NavLink to="/settings" className={({ isActive }) => isActive ? "activeNavLink" : ""}>
                <i className="menu-icon fa fa-cogs"></i>Settings
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Navigation; 