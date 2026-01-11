import React, { useState } from 'react';
import api from '../services/api';
import './Login.css';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { username });
      setMessage('If an account exists, you will receive password reset instructions.');
    } catch (err) {
      console.error('Forgot password error', err);
      setError('Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>E-Auction Platform</h1>
        <h2>Forgot Password</h2>

        {error && <div className="error-message">{error}</div>}
        {message && <div style={{ background: '#d4edda', color: '#155724', padding: 10, borderRadius: 4, marginBottom: 20 }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" value={username} onChange={e => setUsername(e.target.value)} required disabled={loading} />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset instructions'}</button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
