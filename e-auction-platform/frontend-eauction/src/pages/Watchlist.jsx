import React, { useEffect, useState } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import './Watchlist.css';

function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await api.get('/api/watchlist');
        setItems(resp.data);
      } catch (err) {
        setError('Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="watch-loading">Loading...</div>;
  if (error) return <div className="watch-error">{error}</div>;

  return (
    <div className="watch">
      <h1>My Watchlist</h1>
      {items.length === 0 ? (
        <div className="watch-empty">Your watchlist is empty.</div>
      ) : (
        <div className="watch-grid">
          {items.map(a => (
            <AuctionCard key={a.id} auction={a} userRole="BIDDER" />
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;
