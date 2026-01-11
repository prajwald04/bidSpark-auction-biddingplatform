import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './BidHistory.css';

function BidHistory({ auctionId }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await api.get(`/api/auctions/${auctionId}/bids`);
        setBids(resp.data);
      } catch (err) {
        setError('Failed to load bid history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [auctionId]);

  if (loading) return <div className="bidhistory-loading">Loading...</div>;
  if (error) return <div className="bidhistory-error">{error}</div>;

  return (
    <div className="bidhistory">
      <h3>Bid History</h3>
      {bids.length === 0 ? (
        <div className="bidhistory-empty">No bids yet.</div>
      ) : (
        <table className="bidhistory-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Bid Time</th>
              <th>Bidder</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(b => (
              <tr key={b.id}>
                <td>${b.amount}</td>
                <td>{new Date(b.bidTime).toLocaleString()}</td>
                <td>{b.bidder?.username || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BidHistory;
