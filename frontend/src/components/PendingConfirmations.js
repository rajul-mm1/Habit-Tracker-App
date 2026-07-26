import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

// Shows check-ins the PARTNER made that are awaiting this user's review.
// This is the core of the anti-cheating design: a check-in never counts
// toward a streak until the other person in the partnership confirms it.
function PendingConfirmations({ partnershipId, partnerName, onReviewed }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/checkins/pending', { params: { partnershipId } });
      setPending(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pending confirmations');
    } finally {
      setLoading(false);
    }
  }, [partnershipId]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function handleReview(checkinId, action) {
    setReviewingId(checkinId);
    try {
      await client.post(`/api/checkins/${checkinId}/review`, { action });
      await loadPending();
      onReviewed?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) return null; // avoid a flash of "nothing pending" while loading
  if (error) return <p className="error-text">{error}</p>;
  if (pending.length === 0) return null;

  return (
    <div className="card pending-confirmations fade-in-up">
      <h2>
        <span className="pending-badge-dot" />
        Needs Your Confirmation
      </h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        {partnerName} checked in and is waiting on you to confirm it really happened.
      </p>

      {pending.map((item) => (
        <div key={item.id} className="pending-item">
          <div className="pending-item-info">
            <strong>{item.date}</strong>
            {item.proofImage ? (
              <button
                type="button"
                className="proof-view-link"
                onClick={() => setExpandedImage(item.proofImage)}
              >
                View proof photo
              </button>
            ) : (
              <span className="muted">No photo attached</span>
            )}
          </div>
          <div className="pending-item-actions">
            <button
              type="button"
              className="confirm-btn"
              disabled={reviewingId === item.id}
              onClick={() => handleReview(item.id, 'confirm')}
            >
              ✓ Confirm
            </button>
            <button
              type="button"
              className="dispute-btn"
              disabled={reviewingId === item.id}
              onClick={() => handleReview(item.id, 'dispute')}
            >
              ✗ Dispute
            </button>
          </div>
        </div>
      ))}

      {expandedImage && (
        <div className="proof-modal-overlay" onClick={() => setExpandedImage(null)}>
          <div className="proof-modal" onClick={(e) => e.stopPropagation()}>
            <img src={expandedImage} alt="Check-in proof" />
            <button type="button" className="proof-modal-close" onClick={() => setExpandedImage(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingConfirmations;
