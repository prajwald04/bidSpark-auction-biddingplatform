import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, auctionsResponse] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/auctions')
      ]);
      setUsers(usersResponse.data);
      setAuctions(auctionsResponse.data);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuctionStatus = async (auctionId, currentStatus) => {
    try {
      await api.put(`/api/auctions/${auctionId}/status`, {
        enabled: !currentStatus
      });
      // Refresh auctions data
      const response = await api.get('/api/auctions');
      setAuctions(response.data);
    } catch (err) {
      setError('Failed to update auction status');
      console.error('Error updating auction:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-section">
        <h2>Users Management</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`status ${user.enabled ? 'active' : 'inactive'}`}>
                      {user.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Auctions Management</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Starting Price</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(auction => (
                <tr key={auction.id}>
                  <td>{auction.id}</td>
                  <td>{auction.productName}</td>
                  <td>${auction.startingPrice}</td>
                  <td>{new Date(auction.startTime).toLocaleString()}</td>
                  <td>{new Date(auction.endTime).toLocaleString()}</td>
                  <td>
                    <span className={`status ${auction.enabled ? 'active' : 'inactive'}`}>
                      {auction.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`action-btn ${auction.enabled ? 'disable' : 'enable'}`}
                      onClick={() => toggleAuctionStatus(auction.id, auction.enabled)}
                    >
                      {auction.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;