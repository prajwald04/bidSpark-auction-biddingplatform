import React, { useEffect, useState } from 'react';
import { createAuction as createAuctionApi, updateAuction as updateAuctionApi } from '../services/auction';

// Create Auction form for Seller with validation and submit handling
export default function AuctionForm({ onCreated, onError, initialValues, auctionId }) {
  const [productName, setProductName] = useState(initialValues?.productName || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [startingPrice, setStartingPrice] = useState(initialValues?.startingPrice?.toString() || '');
  const [minIncrement, setMinIncrement] = useState(initialValues?.minIncrement?.toString() || '1');
  const [buyNowPrice, setBuyNowPrice] = useState(initialValues?.buyNowPrice?.toString() || '');
  const [category, setCategory] = useState(initialValues?.category || 'Electronics');
  const [condition, setCondition] = useState(initialValues?.condition || 'New');
  const [imageUrls, setImageUrls] = useState(initialValues?.imageUrls || ['']);
  const defaultStart = new Date(Date.now() + 60 * 1000).toISOString().slice(0,16);
  const defaultEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0,16);
  const [startTime, setStartTime] = useState(initialValues?.startTime ? new Date(initialValues.startTime).toISOString().slice(0,16) : defaultStart);
  const [endTime, setEndTime] = useState(initialValues?.endTime ? new Date(initialValues.endTime).toISOString().slice(0,16) : defaultEnd);
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true);
  const [autoExtend, setAutoExtend] = useState(initialValues?.autoExtend ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const FALLBACK_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='16' text-anchor='middle' fill='%236b7280' font-family='sans-serif'>Image</text></svg>";

  useEffect(() => {
    if (initialValues) {
      setProductName(initialValues.productName || '');
      setDescription(initialValues.description || '');
      setStartingPrice(initialValues.startingPrice?.toString() || '');
      setMinIncrement(initialValues.minIncrement?.toString() || '1');
      setBuyNowPrice(initialValues.buyNowPrice?.toString() || '');
      setCategory(initialValues.category || 'Electronics');
      setCondition(initialValues.condition || 'New');
      setImageUrls(initialValues.imageUrls || ['']);
      setStartTime(initialValues.startTime ? new Date(initialValues.startTime).toISOString().slice(0,16) : defaultStart);
      setEndTime(initialValues.endTime ? new Date(initialValues.endTime).toISOString().slice(0,16) : defaultEnd);
      setEnabled(initialValues.enabled ?? true);
      setAutoExtend(initialValues.autoExtend ?? false);
    }
  }, [initialValues]);

  // Validate inputs per requirements
  function validate() {
    if (!productName || !description || !startingPrice || !startTime || !endTime || !category || !condition) {
      return 'All fields are mandatory.';
    }
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      return 'Starting price must be greater than 0.';
    }
    const inc = parseFloat(minIncrement);
    if (isNaN(inc) || inc <= 0) {
      return 'Minimum bid increment must be greater than 0.';
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime())) return 'Invalid start time.';
    if (isNaN(end.getTime())) return 'Invalid end time.';
    if (end <= start) return 'End time must be after start time.';
    return null;
  }

  // Submit handler to backend
  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback('');
    const error = validate();
    if (error) {
      setFeedback(error);
      onError && onError(error);
      return;
    }
    setSubmitting(true);
    try {
      const toLocalDateTimeString = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      const firstImage = (imageUrls || []).find((u) => !!u) || '';
      const maxUrlLen = 255;
      const safeImage = firstImage && firstImage.length <= maxUrlLen ? firstImage : '';
      const payload = {
        productName,
        description,
        startingPrice: parseFloat(startingPrice),
        minIncrement: parseFloat(minIncrement),
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : undefined,
        category,
        condition,
        imageUrl: safeImage || undefined,
        startTime: toLocalDateTimeString(new Date(startTime)),
        endTime: toLocalDateTimeString(new Date(endTime)),
        enabled,
        autoExtend,
      };
      if (auctionId) {
        await updateAuctionApi(auctionId, payload);
      } else {
        await createAuctionApi(payload);
      }
      setFeedback('Auction created successfully.');
      onCreated && onCreated();
      try {
        window.dispatchEvent(new CustomEvent('auctionCreated'));
      } catch {}
      setProductName('');
      setDescription('');
      setStartingPrice('');
      setMinIncrement('1');
      setBuyNowPrice('');
      setCategory('Electronics');
      setCondition('New');
      setImageUrls(['']);
      // Reset times to sensible defaults
      const nextStart = new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16);
      const nextEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
      setStartTime(nextStart);
      setEndTime(nextEnd);
      setEnabled(true);
      setAutoExtend(false);
    } catch (err) {
      const msg = 'Error creating auction.';
      setFeedback(msg);
      onError && onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <h3>Create Auction</h3>

      <div className="form-group">
        <label>Product Name</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="e.g., MacBook Pro 14”"
          required
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Furniture</option>
          <option>Books</option>
          <option>Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Product Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product"
          required
        />
      </div>

      <div className="form-group">
        <label>Condition</label>
        <div style={{ display: 'flex', gap: 12 }}>
          {['New', 'Used', 'Refurbished'].map((c) => (
            <label key={c} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="radio" name="condition" value={c} checked={condition === c} onChange={() => setCondition(c)} />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Product Images (URLs)</label>
        <div style={{ display: 'grid', gap: 8 }}>
          {imageUrls.map((u, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8 }}>
              <input
                type="url"
                value={u}
                onChange={(e) => {
                  const arr = [...imageUrls];
                  arr[idx] = e.target.value;
                  setImageUrls(arr);
                }}
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  const arr = imageUrls.filter((_, i) => i !== idx);
                  setImageUrls(arr.length ? arr : ['']);
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="submit-btn"
            onClick={() => setImageUrls([...imageUrls, ''])}
          >
            Add Image
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Starting Price ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={startingPrice}
          onChange={(e) => setStartingPrice(e.target.value)}
          placeholder="Enter a positive amount"
          required
        />
      </div>

      <div className="form-group">
        <label>Minimum Bid Increment ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={minIncrement}
          onChange={(e) => setMinIncrement(e.target.value)}
          placeholder="e.g., 1.00"
          required
        />
      </div>

      <div className="form-group">
        <label>Buy-Now Price (optional)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={buyNowPrice}
          onChange={(e) => setBuyNowPrice(e.target.value)}
          placeholder="Leave blank if none"
        />
      </div>

      <div className="form-group">
        <label>Auction Start Time</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Auction End Time</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <div className="form-group" style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={autoExtend} onChange={(e) => setAutoExtend(e.target.checked)} />
          Auto-extend near end
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={() => setShowPreview(true)}>Preview</button>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Auction'}
        </button>
      </div>

      {feedback && <div className="message info">{feedback}</div>}

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="create-form-container" style={{ maxWidth: 700, width: '90%' }}>
            <h3>Preview Listing</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <div><strong>Title:</strong> {productName}</div>
              <div><strong>Category:</strong> {category}</div>
              <div><strong>Description:</strong> {description}</div>
              <div><strong>Condition:</strong> {condition}</div>
              <div><strong>Starting Price:</strong> ${startingPrice || '0.00'}</div>
              <div><strong>Min Increment:</strong> ${minIncrement || '1.00'}</div>
              {buyNowPrice && <div><strong>Buy-Now:</strong> ${buyNowPrice}</div>}
              <div><strong>Start:</strong> {startTime ? new Date(startTime).toLocaleString() : '-'}</div>
              <div><strong>End:</strong> {endTime ? new Date(endTime).toLocaleString() : '-'}</div>
              <div><strong>Enabled:</strong> {enabled ? 'Yes' : 'No'}</div>
              <div><strong>Auto-extend:</strong> {autoExtend ? 'Yes' : 'No'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(imageUrls || []).filter(Boolean).map((u, i) => (
                  <img key={i} src={u} alt={`preview-${i}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} referrerPolicy="no-referrer" crossOrigin="anonymous" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                ))}
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button type="button" className="cancel-btn" onClick={() => setShowPreview(false)}>Close</button>
              <button type="submit" className="submit-btn" disabled={submitting} onClick={handleSubmit}>
                {auctionId ? 'Update & Publish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
