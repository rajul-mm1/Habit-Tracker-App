// utils/dateHelpers.js
// All dates are stored/compared as "YYYY-MM-DD" strings to avoid timezone bugs.

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function getTodayStr() {
  return toDateStr(new Date());
}

function getDateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

module.exports = { toDateStr, getTodayStr, getDateNDaysAgo };
