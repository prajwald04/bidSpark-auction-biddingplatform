import React from 'react';

// Table for seller's auctions with status color and bids count
export default function SellerAuctionTable({ auctions, onToggleEnabled, onEdit, onDeclareWinner }) {
  function statusOf(a) {
    if (a.status) {
      const s = a.status.toUpperCase();
      if (s === 'DRAFT') return 'Draft';
      if (s === 'SCHEDULED') return 'Scheduled';
      if (s === 'LIVE') return 'Live';
      if (s === 'ENDED') return 'Ended';
    }
    const now = new Date();
    const start = new Date(a.startTime);
    const end = new Date(a.endTime);
    if (!a.enabled && now < start) return 'Draft';
    if (now < start) return 'Scheduled';
    if (now >= start && now <= end) return 'Live';
    return 'Ended';
  }
  function fmt(d) {
    return new Date(d).toLocaleString();
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Starting Price</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Status</th>
            <th>Bids</th>
            <th>Highest Bidder</th>
            <th>Enabled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(auctions || []).map((a) => {
            const status = statusOf(a);
            const statusClass =
              status === 'Live'
                ? 'status-live'
                : status === 'Ended'
                ? 'status-ended'
                : status === 'Draft'
                ? 'status-draft'
                : 'status-upcoming';
            const isEditable = status === 'Scheduled' || status === 'Draft';
            return (
              <tr key={a.id || `${a.productName}-${a.startTime}`}>
                <td>{a.productName}</td>
                <td>{a.category || '-'}</td>
                <td>${Number(a.startingPrice).toFixed(2)}</td>
                <td>{fmt(a.startTime)}</td>
                <td>{fmt(a.endTime)}</td>
                <td>
                  <span className={`badge ${statusClass.toLowerCase()}`}>{status}</span>
                </td>
                <td>{a.bidCount ?? 0}</td>
                <td>{a.highestBidder?.username || '-'}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!a.enabled}
                    onChange={(e) => onToggleEnabled && onToggleEnabled(a.id, e.target.checked)}
                  />
                </td>
                <td>
                  <button
                    className="create-btn"
                    disabled={!isEditable}
                    onClick={() => isEditable && onEdit && onEdit(a)}
                  >
                    Edit
                  </button>
                  {(status === 'Live' || status === 'Ended') && (
                    <button
                      className="submit-btn"
                      style={{ marginLeft: 8 }}
                      onClick={() => onEdit && onEdit({ ...a, __analyticsOnly: true })}
                    >
                      Analytics
                    </button>
                  )}
                  {(status === 'Live' || status === 'Ended') && a.highestBidder && (
                    <button
                      className="submit-btn"
                      style={{ marginLeft: 8 }}
                      onClick={() => onDeclareWinner && onDeclareWinner(a)}
                    >
                      Declare Winner
                    </button>
                  )}
                  {!isEditable && (
                    <span className="hint" style={{ marginLeft: 8 }}>
                      {status === 'Live' ? 'Auction is live' : 'Auction has ended'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {(!auctions || auctions.length === 0) && (
            <tr>
              <td colSpan="8" className="empty">
                No auctions yet. Create one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
