import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function Signup() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', role: 'BIDDER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        username: form.username,
        password: form.password,
        role: form.role
      });
      setSuccess('Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      let errorMessage = 'Registration failed. ';
      
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
      } else if (err.response?.status === 400 || err.response?.status === 409) {
        errorMessage = err.response?.data?.message || 'Username already exists or invalid data provided.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      console.error('Signup error', err);
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
        <h2>Sign Up</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div style={{ background: '#d4edda', color: '#155724', padding: 10, borderRadius: 4, marginBottom: 20 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange} disabled={loading}>
              <option value="BIDDER">Bidder</option>
              <option value="SELLER">Seller</option>
            </select>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/login">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
}

export default Signup;
