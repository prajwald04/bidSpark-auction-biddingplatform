import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar({ isAuthenticated: isAuthenticatedProp, role: roleProp, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!isAuthenticatedProp);
  const [role, setRole] = useState(roleProp || '');

  useEffect(() => {
    setIsAuthenticated(!!isAuthenticatedProp);
    setRole(roleProp || '');
  }, [isAuthenticatedProp, roleProp]);

  const logout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      window.location.href = '/home';
    }
  };

  const sellerLinks = [
    { to: '/seller', label: 'Dashboard' },
    { to: '/seller/create', label: 'Create Listing' },
    { to: '/seller/listings', label: 'My Listings' },
    { to: '/seller/notifications', label: 'Notifications' },
    { to: '/home', label: 'Profile' },
  ];
  const bidderLinks = [
    { to: '/home', label: 'Home' },
    { to: '/bidder/live', label: 'Live Auctions' },
    { to: '/bidder/bids', label: 'My Bids' },
    { to: '/bidder/notifications', label: 'Notifications' },
    { to: '/home', label: 'Profile' },
  ];

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink className="brand" to="/home">Bidspark</NavLink>
        <div className="links">
          {!isAuthenticated && <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''}>Explore</NavLink>}
          {isAuthenticated && role === 'ADMIN' && <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>}
          {isAuthenticated && role === 'SELLER' && sellerLinks.map((l) => (
            <NavLink key={`${l.to}-${l.label}`} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>
          ))}
          {isAuthenticated && role === 'BIDDER' && bidderLinks.map((l) => (
            <NavLink key={`${l.to}-${l.label}`} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>
          ))}
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
              <NavLink to="/signup" className="accent">Sign Up</NavLink>
            </>
          )}
          {isAuthenticated && (
            <>
              <button className="logout" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
