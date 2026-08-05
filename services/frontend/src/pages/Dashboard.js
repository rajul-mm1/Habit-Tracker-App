import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import HowItWorks from '../components/HowItWorks';

function Dashboard() {
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [partnerEmail, setPartnerEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const userId = localStorage.getItem('userId');

  async function loadPartnerships() {
    setLoading(true);
    try {
      const { data } = await client.get('/api/partnerships');
      setPartnerships(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load partnerships');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPartnerships();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await client.post('/api/partnerships', { partnerEmail, goal });
      setPartnerEmail('');
      setGoal('');
      await loadPartnerships();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create partnership');
    } finally {
      setCreating(false);
    }
  }

  function otherUser(partnership) {
    return partnership.userA._id === userId ? partnership.userB : partnership.userA;
  }

  return (
    <div>
      <div className="dashboard-header fade-in-up">
        <h1>Your Accountability Partnerships</h1>
        <button
          type="button"
          className="secondary how-it-works-toggle"
          onClick={() => setShowHowItWorks((v) => !v)}
        >
          {showHowItWorks ? 'Hide' : '💡 How this app works'}
        </button>
      </div>

      {showHowItWorks && (
        <div className="card fade-in-up">
          <HowItWorks />
        </div>
      )}

      <div className="card-grid two-col">
        <div className="card fade-in-up">
          <h2>Your Partnerships</h2>
          {loading && <p className="muted">Loading...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && partnerships.length === 0 && (
            <p className="muted">No partnerships yet — invite someone to get started.</p>
          )}
          {partnerships.map((p) => (
            <Link key={p._id} to={`/partnerships/${p._id}`} className="partnership-list-item">
              <div>
                <strong>{p.goal}</strong>
                <div className="muted">with {otherUser(p).name}</div>
              </div>
              <span>→</span>
            </Link>
          ))}
        </div>

        <div className="card fade-in-up">
          <h2>Invite a Partner</h2>
          <form onSubmit={handleCreate}>
            <label htmlFor="partnerEmail">Partner's email</label>
            <input
              id="partnerEmail"
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="friend@example.com"
              required
            />

            <label htmlFor="goal">Shared goal</label>
            <input
              id="goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Exercise daily"
              required
            />

            {createError && <p className="error-text">{createError}</p>}

            <div style={{ marginTop: 16 }}>
              <button type="submit" disabled={creating} className="checkin-btn" style={{ width: '100%' }}>
                {creating ? 'Creating...' : 'Create Partnership'}
              </button>
            </div>
          </form>
          <p className="muted" style={{ marginTop: 12 }}>
            Your partner needs to already have an account with this email.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
