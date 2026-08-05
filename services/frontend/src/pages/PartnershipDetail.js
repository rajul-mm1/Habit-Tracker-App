import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import MonthlyStreakCalendar from '../components/MonthlyStreakCalendar';
import CheckInPanel from '../components/CheckInPanel';
import PendingConfirmations from '../components/PendingConfirmations';

function PartnershipDetail() {
  const { id } = useParams();
  const userId = localStorage.getItem('userId');

  const [data, setData] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: detail } = await client.get(`/api/partnerships/${id}`);
      setData(detail);

      const { data: recent } = await client.get('/api/checkins', {
        params: { partnershipId: id, userId, days: 1 }
      });
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEntry = recent.find((entry) => entry.date === todayStr);
      setTodayStatus(todayEntry ? todayEntry.status : null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load partnership');
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return null;

  const { partnership, streaks } = data;
  const partnerUser = partnership.userA._id === userId ? partnership.userB : partnership.userA;
  const myStreaks = streaks[userId] || { currentStreak: 0, longestStreak: 0 };
  const partnerStreaks = streaks[partnerUser._id] || { currentStreak: 0, longestStreak: 0 };

  return (
    <div>
      <h1 className="fade-in-up">{partnership.goal}</h1>
      <p className="muted fade-in-up">Accountability partner: {partnerUser.name}</p>

      <PendingConfirmations partnershipId={id} partnerName={partnerUser.name} onReviewed={loadAll} />

      <div className="card-grid two-col">
        <div className="card fade-in-up">
          <h2>You</h2>
          <span className="streak-badge">🔥 {myStreaks.currentStreak} day streak</span>
          <span className="streak-badge">🏆 Best: {myStreaks.longestStreak}</span>

          <CheckInPanel partnershipId={id} todayStatus={todayStatus} onChanged={loadAll} />

          <MonthlyStreakCalendar partnershipId={id} userId={userId} />
        </div>

        <div className="card fade-in-up">
          <h2>{partnerUser.name}</h2>
          <span className="streak-badge">🔥 {partnerStreaks.currentStreak} day streak</span>
          <span className="streak-badge">🏆 Best: {partnerStreaks.longestStreak}</span>
          {partnerStreaks.currentStreak === 0 && (
            <p className="muted" style={{ marginTop: 8 }}>
              They haven't checked in recently — a friendly nudge might help!
            </p>
          )}

          <MonthlyStreakCalendar partnershipId={id} userId={partnerUser._id} />
        </div>
      </div>
    </div>
  );
}

export default PartnershipDetail;
