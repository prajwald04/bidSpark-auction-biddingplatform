import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', credentials);

      // Store authentication data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('userId', response.data.userId);

      // Redirect based on role
      switch (response.data.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'SELLER':
          navigate('/seller/create');
          break;
        case 'BIDDER':
          navigate('/bidder');
          break;
        default:
          setError('Invalid user role');
      }
    } catch (err) {
      let errorMessage = 'Login failed. ';
      
      // Check for network errors
      if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
        if (err.userMessage) {
          errorMessage = err.userMessage;
        } else if (process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost' && !process.env.REACT_APP_API_URL) {
          errorMessage = 'Backend server is not configured. The API URL environment variable is missing.';
        } else {
          errorMessage = `Cannot connect to backend server. Please check if the server is running at ${process.env.REACT_APP_API_URL || 'http://localhost:8080'}`;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid username or password.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
      console.error('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8080');
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        response: err.response,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>E-Auction Platform</h1>
        <h2>Login</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Demo Accounts:</h3>
          <div className="account-info">
            <strong>Admin:</strong> admin / admin123<br/>
            <strong>Seller:</strong> seller / seller123<br/>
            <strong>Bidder:</strong> bidder / bidder123
          </div>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/signup">Create an account</a> | <a href="/forgot-password">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
