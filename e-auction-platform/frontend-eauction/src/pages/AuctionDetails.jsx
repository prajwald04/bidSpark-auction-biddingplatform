import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import websocketService from '../services/websocket';
import AuctionCard from '../components/AuctionCard';
import Notification from '../components/Notification';
import './AuctionDetails.css';
import BidHistory from '../components/BidHistory';

function AuctionDetails() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    setUserRole(role);

    fetchAuction();

    // Connect to WebSocket for real-time updates
    websocketService.connect(
      () => {
        console.log('WebSocket connected for auction details');
        // Subscribe to auction updates
        websocketService.subscribeToAuction(parseInt(id), handleAuctionUpdate);
        // Subscribe to notifications
        if (userId) {
          websocketService.subscribeToNotifications(userId, handleNotification);
        }
      },
      (error) => {
        console.error('WebSocket connection failed:', error);
      }
    );

    return () => {
      websocketService.disconnect();
    };
  }, [id]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/auctions/${id}`);
      setAuction(response.data);
    } catch (err) {
      setError('Failed to load auction details');
      console.error('Error fetching auction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionUpdate = (update) => {
    setAuction(prevAuction => ({
      ...prevAuction,
      currentBid: update.currentBid,
      bidCount: update.bidCount
    }));
  };

  const handleBid = async (auctionId, bidAmount) => {
    try {
      await api.post(`/api/bid/${auctionId}`, { amount: bidAmount });
      addNotification('Bid placed successfully!', 'success');
    } catch (err) {
      if (err.response?.status === 400) {
        addNotification('Bid failed – higher bid exists', 'error');
      } else {
        addNotification('Failed to place bid', 'error');
      }
      console.error('Error placing bid:', err);
    }
  };

  const handleNotification = (notification) => {
    addNotification(notification.message, notification.type || 'info');
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type
    };
    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return <div className="loading">Loading auction details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!auction) {
    return <div className="error-message">Auction not found</div>;
  }

  return (
    <div className="auction-details">
      <div className="notifications-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      <div className="auction-details-header">
        <h1>Auction Details</h1>
        <button
          className="back-btn"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </div>

      <div className="auction-details-content">
        <AuctionCard
          auction={auction}
          onBid={handleBid}
          isLive={true}
          userRole={userRole}
        />

        <div className="auction-stats">
          <h3>Auction Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Current Bid:</span>
              <span className="stat-value">${auction.currentBid || auction.startingPrice}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Starting Price:</span>
              <span className="stat-value">${auction.startingPrice}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Bids:</span>
              <span className="stat-value">{auction.bidCount || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Highest Bidder:</span>
              <span className="stat-value">{auction.highestBidder?.username || '—'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status:</span>
              <span className={`stat-value status-${getStatusClass()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
        <BidHistory auctionId={id} />
      </div>
    </div>
  );

  function getStatusText() {
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    if (now < startTime) return 'Upcoming';
    if (now >= startTime && now <= endTime) return 'Live';
    return 'Ended';
  }

  function getStatusClass() {
    const status = getStatusText().toLowerCase();
    return status;
  }
}

export default AuctionDetails;
