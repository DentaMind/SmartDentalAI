import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

const Header = ({ connected, handleClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // In a real implementation, this would fetch notifications from the API
    setNotifications([
      { id: 1, message: 'New appointment request from John Doe', time: '10 min ago', read: false },
      { id: 2, message: 'Lab results ready for patient Sarah Smith', time: '1 hour ago', read: false },
      { id: 3, message: 'Reminder: Team meeting at 2 PM', time: '2 hours ago', read: true },
    ]);
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/result/${searchTerm}`);
    }
  };
  
  const handleLogout = () => {
    logout();
    handleClick(false);
  };
  
  const handleNotificationClick = (id) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header id="header" className="header" style={{ display: (connected ? 'block' : 'none') }}>
      <div className="top-left">
        <div className="navbar-header">
          <Link className="navbar-brand" to="/dashboard">
            <span style={{ fontWeight: 'bold', color: '#4285f4' }}>Denta</span>
            <span style={{ fontWeight: 'bold', color: '#34a853' }}>Mind</span>
          </Link>
          <Link className="navbar-brand hidden" to="/">
            <span style={{ fontWeight: 'bold', color: '#4285f4' }}>DM</span>
          </Link>
          <button 
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#main-menu"
            aria-controls="main-menu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="fa fa-bars"></i>
          </button>
        </div>
      </div>
      
      <div className="top-right">
        <div className="header-menu">
          <div className="header-left">
            <button className="search-trigger">
              <i className="fa fa-search"></i>
            </button>
            <div className="form-inline">
              <form className="search-form" onSubmit={handleSearch}>
                <input 
                  className="form-control mr-sm-2" 
                  type="text" 
                  placeholder="Search patients..." 
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-close" type="submit">
                  <i className="fa fa-close"></i>
                </button>
              </form>
            </div>
            
            <div className="dropdown for-notification">
              <button 
                className="btn btn-secondary dropdown-toggle" 
                type="button" 
                id="notification" 
                data-toggle="dropdown" 
                aria-haspopup="true" 
                aria-expanded="false"
              >
                <i className="fa fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="count bg-danger">{unreadCount}</span>
                )}
              </button>
              <div className="dropdown-menu" aria-labelledby="notification">
                <p className="red">You have {unreadCount} notifications</p>
                {notifications.map(notif => (
                  <Link 
                    key={notif.id}
                    className={`dropdown-item media ${!notif.read ? 'bg-light' : ''}`}
                    to="#"
                    onClick={() => handleNotificationClick(notif.id)}
                  >
                    <i className="fa fa-info"></i>
                    <p>{notif.message}</p>
                    <span className="text-muted small">{notif.time}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="dropdown for-message">
              <button 
                className="btn btn-secondary dropdown-toggle" 
                type="button" id="message" 
                data-toggle="dropdown" 
                aria-haspopup="true" 
                aria-expanded="false"
              >
                <i className="fa fa-envelope"></i>
                <span className="count bg-primary">4</span>
              </button>
              <div className="dropdown-menu" aria-labelledby="message">
                <p className="red">You have 4 messages</p>
                <Link className="dropdown-item media" to="#">
                  <div className="message-media">
                    <span className="photo media-left">
                      <img alt="avatar" src="https://ui-avatars.com/api/?name=John+Doe&background=4285f4&color=fff" />
                    </span>
                    <div className="message-body">
                      <span className="name float-left">Jonathan Smith</span>
                      <span className="time float-right">Just now</span>
                      <p>Treatment plan question</p>
                    </div>
                  </div>
                </Link>
                <Link className="dropdown-item media" to="#">
                  <div className="message-media">
                    <span className="photo media-left">
                      <img alt="avatar" src="https://ui-avatars.com/api/?name=Jane+Smith&background=34a853&color=fff" />
                    </span>
                    <div className="message-body">
                      <span className="name float-left">Jane Smith</span>
                      <span className="time float-right">5 minutes ago</span>
                      <p>Appointment confirmation</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="user-area dropdown float-right">
            <button 
              className="dropdown-toggle active" 
              type="button"
              aria-haspopup="true" 
              aria-expanded="false"
            >
              <img 
                className="user-avatar rounded-circle" 
                src={user?.avatar || "https://ui-avatars.com/api/?name=DentaMind+User&background=4285f4&color=fff"} 
                alt="User Avatar" 
              />
            </button>
            <div className="user-menu dropdown-menu">
              <Link className="nav-link" to="/profile">
                <i className="fa fa-user"></i>My Profile
              </Link>
              <Link className="nav-link" to="/notifications">
                <i className="fa fa-bell"></i>Notifications <span className="count">{unreadCount}</span>
              </Link>
              <Link className="nav-link" to="/settings">
                <i className="fa fa-cog"></i>Settings
              </Link>
              <button className="nav-link" onClick={handleLogout}>
                <i className="fa fa-power-off"></i>Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 