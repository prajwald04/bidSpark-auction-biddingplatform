import React, { useState, useEffect } from 'react';
import './AuctionCard.css';

const AuctionCard = ({ auction, onBid, isLive = false, userRole }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [currentBid, setCurrentBid] = useState(auction.currentBid ?? auction.startingPrice ?? 0);
  const [bidAmount, setBidAmount] = useState('');
  const [watched, setWatched] = useState(false);
  const [lastBidAt, setLastBidAt] = useState(auction.lastBidAt || null);
  const FALLBACK_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='48' text-anchor='middle' fill='%236b7280' font-family='sans-serif'>Image unavailable</text></svg>";
  const [imgSrc, setImgSrc] = useState(auction.imageUrl || FALLBACK_IMG);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.endTime).getTime();
      const distance = endTime - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        setTimeLeft('Ended');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [auction.endTime]);

  useEffect(() => {
    if (typeof auction.currentBid === 'number') {
      setCurrentBid(auction.currentBid);
    }
    if (auction.lastBidAt) {
      setLastBidAt(auction.lastBidAt);
    }
  }, [auction.currentBid]);

  useEffect(() => {
    setImgSrc(auction.imageUrl || FALLBACK_IMG);
  }, [auction.imageUrl]);

  const handleBid = () => {
    if (bidAmount && parseFloat(bidAmount) > currentBid && typeof onBid === 'function') {
      onBid(auction.id, parseFloat(bidAmount));
      setBidAmount('');
    }
  };

  const percentLeft = () => {
    const start = new Date(auction.startTime).getTime();
    const end = new Date(auction.endTime).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const toggleWatch = async () => {
    try {
      const resp = await (await import('../services/api')).default.post(`/api/auctions/${auction.id}/watch`);
      setWatched(!!resp.data.watched);
    } catch (e) {
    }
  };

  const getStatusNormalized = () => {
    if (auction.status) {
      const s = auction.status.toUpperCase();
      if (s === 'DRAFT') return 'Draft';
      if (s === 'SCHEDULED') return 'Scheduled';
      if (s === 'LIVE') return 'Live';
      if (s === 'ENDED') return 'Ended';
    }
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);
    if (!auction.enabled && now < startTime) return 'Draft';
    if (now < startTime) return 'Scheduled';
    if (now >= startTime && now <= endTime) return 'Live';
    return 'Ended';
  };

  return (
    <div className="auction-card">
      <img className="auction-image" src={imgSrc} alt={auction.productName} referrerPolicy="no-referrer" crossOrigin="anonymous" onError={() => setImgSrc(FALLBACK_IMG)} />
      <div className="auction-header">
        <h3>{auction.productName}</h3>
        <span className={`auction-status badge status-${getStatusNormalized().toLowerCase()}`}>
          {getStatusNormalized()}
        </span>
      </div>

      <div className="auction-details">
        <div className="auction-info">
          <p><strong>Category:</strong> {auction.category || 'Uncategorized'}</p>
          <p><strong>Condition:</strong> {auction.condition || 'Unknown'}</p>
          <p><strong>Starting Price:</strong> ${auction.startingPrice}</p>
          <p><strong>Current Bid:</strong> ${currentBid}</p>
          <p><strong>Start Time:</strong> {new Date(auction.startTime).toLocaleString()}</p>
          <p><strong>End Time:</strong> {new Date(auction.endTime).toLocaleString()}</p>
          <p><strong>Time Left:</strong> {timeLeft}</p>
          {lastBidAt && <p><strong>Last Bid:</strong> {new Date(lastBidAt).toLocaleString()}</p>}
          <div className="progress"><div className="progress-fill" style={{ width: `${percentLeft()}%` }} /></div>
          <button onClick={toggleWatch} style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: watched ? '#111827' : '#fff', color: watched ? '#fff' : '#111' }}>
            {watched ? 'Watching' : 'Watch'}
          </button>
        </div>

        {userRole === 'BIDDER' && getStatusNormalized() === 'Live' && (
          <div className="bid-section">
            <input
              type="number"
              placeholder="Enter bid amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={currentBid + 1}
              step="0.01"
            />
            <button onClick={handleBid} disabled={!bidAmount || parseFloat(bidAmount) <= currentBid || typeof onBid !== 'function'}>
              Place Bid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 

export default AuctionCard;
