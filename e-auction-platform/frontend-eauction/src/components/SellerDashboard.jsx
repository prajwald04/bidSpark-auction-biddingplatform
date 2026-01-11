import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getMyAuctions, updateAuctionStatus, declareWinner } from '../services/auction';
import { subscribeAuctionUpdates, connectNotifications, disconnectNotifications, subscribeUserNotifications, getMyNotifications, markNotificationRead } from '../services/notification';
import { getAuctionBidAnalytics } from '../services/analytics';
import AuctionForm from './AuctionForm';
import SellerAuctionTable from './SellerAuctionTable';
import './SellerDashboard.css';
import NotificationsPanel from './NotificationsPanel';

function SellerDashboard() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editItem, setEditItem] = useState(null);
  const subsRef = useRef({});
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const location = useLocation();
  const section = location.pathname.startsWith('/seller/create')
    ? 'create'
    : location.pathname.startsWith('/seller/listings')
    ? 'listings'
    : location.pathname.startsWith('/seller/notifications')
    ? 'notifications'
    : 'dashboard';

  // Fetch seller's auctions
  async function fetchAuctions() {
    try {
      setLoading(true);
      setError('');
      const response = await getMyAuctions();
      setAuctions(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuctions();
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) setUserId(parseInt(storedUserId));
    // Load persisted notifications
    (async () => {
      try {
        const list = await getMyNotifications();
        setNotifications(Array.isArray(list) ? list.map(n => ({ id: n.id, message: n.message, type: n.type || 'info', time: n.createdAt ? new Date(n.createdAt).toLocaleString() : '', read: !!n.read })) : []);
      } catch {
      }
    })();
  }, []);

  useEffect(() => {
    connectNotifications(
      () => {
        // Subscribe to each auction topic for real-time bid counts
        Object.values(subsRef.current).forEach((unsub) => unsub && unsub());
        subsRef.current = {};
        (auctions || []).forEach((a) => {
          if (a.id) {
            const unsub = subscribeAuctionUpdates(a.id, (update) => {
              setAuctions((prev) =>
                prev.map((x) =>
                  x.id === a.id
                    ? {
                        ...x,
                        currentBid: typeof update.currentBid !== 'undefined' ? update.currentBid : x.currentBid,
                        bidCount: typeof update.bidCount !== 'undefined' ? update.bidCount : x.bidCount,
                        endTime: update.endTime ? update.endTime : x.endTime,
                        status: update.status ? update.status : x.status,
                        highestBidder: update.highestBidderId ? { ...(x.highestBidder || {}), id: update.highestBidderId } : x.highestBidder,
                      }
                    : x
                )
              );
            });
            subsRef.current[a.id] = () => unsub && unsub.unsubscribe && unsub.unsubscribe();
          }
        });
        // Subscribe to user notifications
        const uid = parseInt(localStorage.getItem('userId') || userId || 0);
        if (uid) {
          subscribeUserNotifications(uid, (notif) => {
            const n = { id: Date.now(), message: notif.message, type: notif.type || 'info', time: new Date().toLocaleTimeString(), read: false };
            setNotifications((prev) => [...prev, n]);
          });
        }
      },
      () => {}
    );
    return () => {
      Object.values(subsRef.current).forEach((unsub) => unsub && unsub());
      subsRef.current = {};
      disconnectNotifications();
    };
  }, [auctions]);

  // Compute dashboard counters
  const counters = useMemo(() => {
    const total = auctions.length;
    let live = 0;
    let ended = 0;
    let totalBids = 0;
    const now = new Date();
    auctions.forEach((a) => {
      const start = new Date(a.startTime);
      const end = new Date(a.endTime);
      if (now >= start && now <= end) live += 1;
      else if (now > end) ended += 1;
      totalBids += Number(a.bidCount || 0);
    });
    return { total, live, ended, totalBids };
  }, [auctions]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="seller-dashboard">
      <h1>{section === 'create' ? 'Create Listing' : section === 'listings' ? 'My Listings' : section === 'notifications' ? 'Notifications' : 'Seller Dashboard'}</h1>

      {error && <div className="error-message">{error}</div>}
      {section === 'notifications' && (
        <NotificationsPanel
          notifications={notifications}
          onMarkRead={async (id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            if (id && typeof id === 'number') {
              try { await markNotificationRead(id, true); } catch {}
            }
          }}
          onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
        />
      )}

      {section === 'dashboard' && (
        <div className="auctions-section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="create-form-container">
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.total}</div>
              <div style={{ color: '#555' }}>Total auctions created</div>
            </div>
            <div className="create-form-container">
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.live}</div>
              <div style={{ color: '#555' }}>Live auctions</div>
            </div>
            <div className="create-form-container">
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.ended}</div>
              <div style={{ color: '#555' }}>Ended auctions</div>
            </div>
            <div className="create-form-container">
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.totalBids}</div>
              <div style={{ color: '#555' }}>Total bids received</div>
            </div>
          </div>
        </div>
      )}

      {section === 'create' && (
        <div className="create-form-container">
          <AuctionForm
            initialValues={editItem || undefined}
            auctionId={editItem?.id}
            onCreated={() => {
              setMessage('Auction created successfully.');
              fetchAuctions();
            }}
            onError={(m) => setMessage(m || 'Failed to create auction.')}
          />
        </div>
      )}

      {section === 'listings' && (
        <div className="auctions-section">
          <h2>My Auctions</h2>
          {auctions.length === 0 ? (
            <p className="no-auctions">No auctions created yet.</p>
          ) : (
            <SellerAuctionTable
              auctions={auctions}
              onToggleEnabled={async (id, enabled) => {
                try {
                  await updateAuctionStatus(id, enabled);
                  setAuctions((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
                } catch {
                  setMessage('Failed to update status.');
                }
              }}
              onEdit={async (item) => {
                if (item && item.__analyticsOnly) {
                  setAnalyticsLoading(true);
                  try {
                    const data = await getAuctionBidAnalytics(item.id);
                    setAnalyticsData({ auction: item, ...data });
                  } catch {
                    setMessage('Failed to fetch analytics.');
                  } finally {
                    setAnalyticsLoading(false);
                  }
                } else {
                  setEditItem(item);
                }
              }}
              onDeclareWinner={async (item) => {
                try {
                  await declareWinner(item.id);
                  setMessage('Winner declared.');
                  setAuctions((prev) =>
                    prev.map((a) =>
                      a.id === item.id
                        ? { ...a, status: 'ENDED', enabled: false, endTime: new Date().toISOString() }
                        : a
                    )
                  );
                } catch {
                  setMessage('Failed to declare winner.');
                }
              }}
            />
          )}
        </div>
      )}

      {message && <div className="message info">{message}</div>}

      {analyticsData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="create-form-container" style={{ maxWidth: 640, width: '92%' }}>
            <h3>Bid Analytics</h3>
            {analyticsLoading ? (
              <div className="loading">Loading analytics…</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>Auction:</strong> {analyticsData.auction.productName}</div>
                <div><strong>Total bids:</strong> {analyticsData.count}</div>
                <div><strong>Highest bid:</strong> ${analyticsData.highest.toFixed(2)}</div>
                <div><strong>Average bid:</strong> ${analyticsData.avg.toFixed(2)}</div>
                <div><strong>Last bid time:</strong> {analyticsData.lastBidTime ? new Date(analyticsData.lastBidTime).toLocaleString() : '-'}</div>
              </div>
            )}
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="cancel-btn" onClick={() => setAnalyticsData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
