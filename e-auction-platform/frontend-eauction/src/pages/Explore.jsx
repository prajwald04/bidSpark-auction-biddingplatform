import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import AuctionCard from '../components/AuctionCard';
import './Explore.css';

function Explore() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('time');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await api.get('/api/auctions');
        setAuctions(resp.data);
      } catch (err) {
        setError('Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = auctions;
    if (filter === 'live') {
      list = list.filter(a => new Date(a.startTime) <= now && new Date(a.endTime) >= now && a.enabled);
    } else if (filter === 'upcoming') {
      list = list.filter(a => new Date(a.startTime) > now && a.enabled);
    } else if (filter === 'ended') {
      list = list.filter(a => new Date(a.endTime) < now);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(a => (a.productName || '').toLowerCase().includes(q));
    }
    if (sort === 'price') {
      list = [...list].sort((a, b) => (a.currentBid ?? a.startingPrice) - (b.currentBid ?? b.startingPrice));
    } else {
      list = [...list].sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
    }
    return list;
  }, [auctions, filter, query, sort]);

  if (loading) return <div className="explore-loading">Loading...</div>;
  if (error) return <div className="explore-error">{error}</div>;

  return (
    <div className="explore">
      <div className="explore-controls">
        <input className="search" placeholder="Search auctions..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="ended">Ended</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="time">End Time</option>
          <option value="price">Price</option>
        </select>
      </div>
      <div className="explore-grid">
        {filtered.map(a => (
          <AuctionCard key={a.id} auction={a} userRole="BIDDER" />
        ))}
      </div>
    </div>
  );
}

export default Explore;
