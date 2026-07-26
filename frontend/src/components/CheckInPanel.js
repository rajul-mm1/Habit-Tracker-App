import React, { useRef, useState } from 'react';
import client from '../api/client';

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB - generous for a phone photo, still bounded

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Handles today's check-in, including an optional proof photo. The check-in
// is created as "pending" on the backend - it won't count toward the streak
// until the partner confirms it (see routes/checkins.js).
function CheckInPanel({ partnershipId, todayStatus, onChanged }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('That image is too large — please use a photo under 3MB.');
      return;
    }

    setError('');
    const base64 = await fileToBase64(file);
    setSelectedBase64(base64);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedPhoto() {
    setSelectedBase64(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCheckIn() {
    setSubmitting(true);
    setError('');
    try {
      await client.post('/api/checkins', {
        partnershipId,
        proofImage: selectedBase64 || undefined
      });
      clearSelectedPhoto();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check in');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUndo() {
    setSubmitting(true);
    setError('');
    try {
      await client.post('/api/checkins', { partnershipId });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to undo check-in');
    } finally {
      setSubmitting(false);
    }
  }

  if (todayStatus) {
    return (
      <div className="checkin-panel fade-in-up">
        <div className={`status-pill status-${todayStatus}`}>
          {todayStatus === 'confirmed' && '✓ Confirmed by your partner'}
          {todayStatus === 'pending' && '⏳ Waiting on partner confirmation'}
          {todayStatus === 'disputed' && '✗ Disputed by your partner'}
        </div>
        <button type="button" className="secondary undo-btn" onClick={handleUndo} disabled={submitting}>
          Undo today's check-in
        </button>
      </div>
    );
  }

  return (
    <div className="checkin-panel fade-in-up">
      <div className="proof-upload-row">
        {previewUrl ? (
          <div className="proof-preview">
            <img src={previewUrl} alt="Proof preview" />
            <button type="button" className="proof-remove-btn" onClick={clearSelectedPhoto} aria-label="Remove photo">
              ×
            </button>
          </div>
        ) : (
          <label className="proof-upload-label">
            📷 Attach proof photo <span className="muted">(optional)</span>
            <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
          </label>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="checkin-button-row">
        <button type="button" className="checkin-btn" onClick={handleCheckIn} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Check in for today'}
        </button>
      </div>
      <p className="muted checkin-hint">
        Your partner will need to confirm this before it counts toward your streak.
      </p>
    </div>
  );
}

export default CheckInPanel;
