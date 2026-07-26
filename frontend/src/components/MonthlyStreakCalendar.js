import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import {
  monthLabel,
  monthKey,
  addMonths,
  daysNeededToCoverMonth,
  buildMonthGrid,
  WEEKDAY_LABELS
} from '../utils/dateUtils';

// Displays one month at a time with prev/next navigation. Each month's data
// is fetched and filtered independently, so months never mix. Reuses the
// existing GET /api/checkins?days=N endpoint (no upper date bound) rather
// than requiring a new backend route - we just request enough history to
// cover the viewed month and filter client-side to that month's dates.
//
// Each day now reflects its VERIFICATION status (confirmed / pending /
// disputed) rather than a simple done/not-done boolean, since check-ins
// only count once the accountability partner has reviewed them.
function MonthlyStreakCalendar({ partnershipId, userId }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [statusByDate, setStatusByDate] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setError('');

    const daysNeeded = daysNeededToCoverMonth(year, monthIndex);

    if (daysNeeded === null) {
      setStatusByDate(new Map());
      setLoading(false);
      return;
    }

    try {
      const { data } = await client.get('/api/checkins', {
        params: { partnershipId, userId, days: daysNeeded }
      });

      const targetKey = monthKey(year, monthIndex);
      const map = new Map();
      data
        .filter((entry) => entry.date.startsWith(targetKey))
        .forEach((entry) => map.set(entry.date, entry.status));

      setStatusByDate(map);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load streak data');
    } finally {
      setLoading(false);
    }
  }, [partnershipId, userId, year, monthIndex]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  function goToPreviousMonth() {
    const next = addMonths(year, monthIndex, -1);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  }

  function goToNextMonth() {
    const next = addMonths(year, monthIndex, 1);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  }

  function goToCurrentMonth() {
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
  }

  const weeks = buildMonthGrid(year, monthIndex, statusByDate);
  const isCurrentMonth = year === today.getFullYear() && monthIndex === today.getMonth();
  const confirmedCount = [...statusByDate.values()].filter((s) => s === 'confirmed').length;
  const hasAnyEntries = statusByDate.size > 0;

  return (
    <div className="monthly-calendar fade-in-up">
      <div className="monthly-calendar-header">
        <button
          type="button"
          className="secondary calendar-nav-btn"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          ‹
        </button>

        <div className="monthly-calendar-title">
          <span>{monthLabel(year, monthIndex)}</span>
          {!isCurrentMonth && (
            <button type="button" className="calendar-today-link" onClick={goToCurrentMonth}>
              Back to current month
            </button>
          )}
        </div>

        <button
          type="button"
          className="secondary calendar-nav-btn"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          {!hasAnyEntries ? (
            <p className="muted calendar-empty-state">No streak recorded this month.</p>
          ) : (
            <p className="muted calendar-summary">
              {confirmedCount} confirmed day{confirmedCount === 1 ? '' : 's'}
            </p>
          )}

          <div className="monthly-calendar-grid" role="table" aria-label={`Streak calendar for ${monthLabel(year, monthIndex)}`}>
            <div className="monthly-calendar-weekdays" role="row">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="monthly-calendar-weekday" role="columnheader">
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="monthly-calendar-week" role="row">
                {week.map((cell, cellIdx) =>
                  cell ? (
                    <div
                      key={cell.dateStr}
                      role="cell"
                      title={`${cell.dateStr}${cell.status ? ` — ${cell.status}` : ''}`}
                      className={[
                        'monthly-calendar-day',
                        cell.status ? `status-${cell.status}` : '',
                        cell.isToday ? 'today' : ''
                      ].filter(Boolean).join(' ')}
                    >
                      {cell.day}
                    </div>
                  ) : (
                    <div key={`blank-${weekIdx}-${cellIdx}`} className="monthly-calendar-day blank" />
                  )
                )}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <span className="legend-item"><span className="legend-dot status-confirmed" /> Confirmed</span>
            <span className="legend-item"><span className="legend-dot status-pending" /> Pending</span>
            <span className="legend-item"><span className="legend-dot status-disputed" /> Disputed</span>
          </div>
        </>
      )}
    </div>
  );
}

export default MonthlyStreakCalendar;
