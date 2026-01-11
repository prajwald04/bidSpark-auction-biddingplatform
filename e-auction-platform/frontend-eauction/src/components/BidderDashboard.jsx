import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { getLiveAuctions, getMyBidAuctions } from '../services/auction';
import { connectNotifications, disconnectNotifications, subscribeUserNotifications, subscribeAuctionUpdates, unsubscribe, getMyNotifications, markNotificationRead } from '../services/notification';
import AuctionCard from './AuctionCard';
import NotificationsPanel from './NotificationsPanel';
import './BidderDashboard.css';

function BidderDashboard() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const subsRef = useRef(new Set());
  const endedRef = useRef(new Set());
  const [myBidAuctions, setMyBidAuctions] = useState([]);
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [timeMaxMinutes, setTimeMaxMinutes] = useState('');
  const location = useLocation();
  const section = location.pathname.startsWith('/bidder/bids')
    ? 'bids'
    : location.pathname.startsWith('/bidder/notifications')
    ? 'notifications'
    : 'live';

  useEffect(() => {
    // Get user ID from localStorage (assuming it's stored during login)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }

    fetchAuctions();
    // Load persisted notifications
    (async () => {
      try {
        const list = await getMyNotifications();
        setNotifications(Array.isArray(list) ? list.map(n => ({ id: n.id, message: n.message, type: n.type || 'info', time: n.createdAt ? new Date(n.createdAt).toLocaleString() : '', read: !!n.read })) : []);
      } catch {}
    })();

    // Connect to WebSocket
    connectNotifications(
      () => {
        if (storedUserId) {
          subscribeUserNotifications(parseInt(storedUserId), handleNotification);
        }
        subscribeAllToTopics();
      },
      (error) => {
        console.error('WebSocket connection failed:', error);
      }
    );

    // Refresh immediately when seller creates a new auction
    const handleAuctionCreated = () => {
      fetchAuctions();
    };
    window.addEventListener('auctionCreated', handleAuctionCreated);

    return () => {
      subsRef.current.forEach((id) => {
        unsubscribe(`/topic/auction/${id}`);
      });
      subsRef.current.clear();
      disconnectNotifications();
      window.removeEventListener('auctionCreated', handleAuctionCreated);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAuctions();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await getLiveAuctions();
      const data = Array.isArray(response) ? response : [];
      setAuctions(data);
    } catch (err) {
      setError('Failed to load auctions');
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      const response = await getMyBidAuctions();
      const data = Array.isArray(response) ? response : [];
      setMyBidAuctions(data);
    } catch (err) {
      setError('Failed to load my bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (section === 'bids') {
      fetchMyBids();
    }
  }, [section]);

  // Subscribe to all auction topics
  const subscribeAllToTopics = () => {
    const ids = (auctions || []).map((a) => a.id).filter(Boolean);
    ids.forEach((id) => {
      if (!subsRef.current.has(id)) {
        subscribeAuctionUpdates(id, (update) => {
          if (update) {
            setAuctions((prev) =>
              prev.map((a) =>
                a.id === id
                  ? {
                      ...a,
                      currentBid: typeof update.currentBid !== 'undefined' ? update.currentBid : a.currentBid,
                      bidCount: typeof update.bidCount !== 'undefined' ? update.bidCount : a.bidCount,
                      lastBidAt: update.bidTime || a.lastBidAt || new Date().toISOString(),
                      endTime: update.endTime ? update.endTime : a.endTime,
                      status: update.status ? update.status : a.status,
                      highestBidder: update.highestBidderId ? { ...(a.highestBidder || {}), id: update.highestBidderId } : a.highestBidder,
                    }
                  : a
              )
            );
            if (typeof update.currentBid !== 'undefined') {
              addNotification('New highest bid placed', 'info');
            }
            if (update.status && String(update.status).toUpperCase() === 'ENDED') {
              const won = update.highestBidderId && userId && update.highestBidderId === userId;
              addNotification(won ? 'You won this auction' : 'Auction ended', won ? 'success' : 'warning');
            }
          }
        });
        subsRef.current.add(id);
      }
    });
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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      (auctions || []).forEach((a) => {
        const end = new Date(a.endTime).getTime();
        if (end <= now && !endedRef.current.has(a.id)) {
          endedRef.current.add(a.id);
          addNotification(`Auction ended: ${a.productName}`, 'warning');
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auctions]);

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString()
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

  const filteredAuctions = (() => {
    const now = Date.now();
    let list = auctions || [];
    if (category !== 'All') {
      list = list.filter((a) => (a.category || 'Uncategorized') === category);
    }
    if (condition !== 'All') {
      list = list.filter((a) => (a.condition || 'Unknown') === condition);
    }
    if (priceMin) {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) list = list.filter((a) => (a.currentBid ?? a.startingPrice) >= min);
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) list = list.filter((a) => (a.currentBid ?? a.startingPrice) <= max);
    }
    if (timeMaxMinutes) {
      const maxMs = parseInt(timeMaxMinutes, 10) * 60 * 1000;
      if (!isNaN(maxMs)) {
        list = list.filter((a) => Math.max(0, new Date(a.endTime).getTime() - now) <= maxMs);
      }
    }
    return list;
  })();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="bidder-dashboard">
      <h1>{section === 'live' ? 'Live Auctions' : section === 'bids' ? 'My Bids' : 'Notifications'}</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {[...new Set((auctions || []).map((a) => a.category || 'Uncategorized'))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option>All</option>
            {['New', 'Used', 'Refurbished', 'Unknown'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Min price" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          <input type="number" placeholder="Max price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          <input type="number" placeholder="Max time (min)" value={timeMaxMinutes} onChange={(e) => setTimeMaxMinutes(e.target.value)} />
        </div>
      </div>

      {section === 'notifications' && (
        <NotificationsPanel
          notifications={notifications}
          onMarkRead={async (id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            if (id && typeof id === 'number') {
              try { await markNotificationRead(id, true); } catch {}
            }
          }}
          onClose={(id) => removeNotification(id)}
        />
      )}

      {section === 'live' && (
        <div className="auctions-section">
          {filteredAuctions.length === 0 ? (
            <p className="no-auctions">No live auctions available at the moment.</p>
          ) : (
            <div className="auctions-grid">
              {filteredAuctions.map(auction => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  onBid={handleBid}
                  isLive={true}
                  userRole="BIDDER"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'bids' && (
        <div className="auctions-section">
          {myBidAuctions.length === 0 ? (
            <p className="no-auctions">You haven’t placed any bids yet.</p>
          ) : (
            <div className="auctions-grid">
              {myBidAuctions.map(a => {
                const ended = String(a.status || '').toUpperCase() === 'ENDED';
                const won = ended && a.highestBidder && userId && a.highestBidder.id === userId;
                return (
                  <div key={a.id} style={{ display: 'grid', gap: 8 }}>
                    <AuctionCard
                      auction={a}
                      onBid={handleBid}
                      isLive={!ended}
                      userRole="BIDDER"
                    />
                    <div style={{ fontWeight: 600, color: won ? '#16a34a' : ended ? '#dc2626' : '#2563eb' }}>
                      {won ? 'You won this auction' : ended ? 'Auction ended' : 'Active'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BidderDashboard;
