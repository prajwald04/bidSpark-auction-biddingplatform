import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';
import BidderDashboard from './components/BidderDashboard';
import Login from './pages/Login';
import AuctionDetails from './pages/AuctionDetails';
import './App.css';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Watchlist from './pages/Watchlist';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    switch (role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      case 'SELLER':
        return <Navigate to="/seller" replace />;
      case 'BIDDER':
        return <Navigate to="/bidder" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}

// App Content Component (to use useNavigate)
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserRole('');
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserRole('');
    navigate('/login');
  };

  return (
    <div className="app">
      <Navbar isAuthenticated={isAuthenticated} role={userRole} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="app-main">
        <Routes>
          {/* Public Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/watchlist" element={<ProtectedRoute allowedRoles={['ADMIN','SELLER','BIDDER']}><Watchlist /></ProtectedRoute>} />

          {/* Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <ProtectedRoute allowedRoles={['SELLER']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/create"
            element={
              <ProtectedRoute allowedRoles={['SELLER']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/listings"
            element={
              <ProtectedRoute allowedRoles={['SELLER']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/notifications"
            element={
              <ProtectedRoute allowedRoles={['SELLER']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bidder"
            element={
              <ProtectedRoute allowedRoles={['BIDDER']}>
                <BidderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bidder/live"
            element={
              <ProtectedRoute allowedRoles={['BIDDER']}>
                <BidderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bidder/bids"
            element={
              <ProtectedRoute allowedRoles={['BIDDER']}>
                <BidderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bidder/notifications"
            element={
              <ProtectedRoute allowedRoles={['BIDDER']}>
                <BidderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auction/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'BIDDER']}>
                <AuctionDetails />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    userRole === 'ADMIN' ? '/admin' :
                    userRole === 'SELLER' ? '/seller' : '/bidder'
                  }
                  replace
                />
              ) : (
                <Navigate to="/home" replace />
              )
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
