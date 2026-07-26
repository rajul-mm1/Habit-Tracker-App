// Shared date helpers for month-based UI components. Kept separate from
// api/client.js so calendar/date math stays reusable and isolated from
// network concerns.

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function getTodayStr() {
  return toDateStr(new Date());
}

// Returns a Date set to the 1st of the given month (local time, time
// stripped) so month arithmetic doesn't drift across DST boundaries.
function startOfMonth(year, monthIndex) {
  return new Date(year, monthIndex, 1);
}

function endOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0);
}

function addMonths(year, monthIndex, delta) {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

function monthLabel(year, monthIndex) {
  return `${MONTH_LABELS[monthIndex]} ${year}`;
}

// "YYYY-MM" - used to filter a flat list of "YYYY-MM-DD" check-in dates
// down to just the ones belonging to a given month, without needing a
// new backend endpoint.
function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

// How many days back from today we need to request from the existing
// /api/checkins?days=N endpoint to be guaranteed to cover the given month.
// Returns null if the month is entirely in the future (nothing to fetch).
function daysNeededToCoverMonth(year, monthIndex) {
  const today = new Date();
  const monthStart = startOfMonth(year, monthIndex);

  if (monthStart > today) return null;

  const diffMs = today - monthStart;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 as a small buffer for timezone edge cases
}

// Builds a calendar grid (array of weeks, each an array of 7 cells) for the
// given month. Empty leading/trailing cells are `null`.
// `statusByDate` is a Map of "YYYY-MM-DD" -> "confirmed" | "pending" | "disputed".
function buildMonthGrid(year, monthIndex, statusByDate) {
  const first = startOfMonth(year, monthIndex);
  const last = endOfMonth(year, monthIndex);
  const daysInMonth = last.getDate();
  const leadingBlanks = first.getDay(); // 0 = Sunday

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateStr(new Date(year, monthIndex, day));
    cells.push({
      day,
      dateStr,
      status: statusByDate.get(dateStr) || null,
      isToday: dateStr === getTodayStr()
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  toDateStr,
  getTodayStr,
  startOfMonth,
  endOfMonth,
  addMonths,
  monthLabel,
  monthKey,
  daysNeededToCoverMonth,
  buildMonthGrid
};
