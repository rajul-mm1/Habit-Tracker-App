const CheckIn = require('../models/CheckIn');
const { toDateStr } = require('../utils/dateHelpers');

async function calculateStreaks(partnershipId, userId) {
  // Only CONFIRMED check-ins count toward a streak. This is the core of
  // the anti-cheating design: a user can mark today done, but it doesn't
  // move the streak needle until their accountability partner confirms it.
  const checkins = await CheckIn.find({ partnershipId, userId, status: 'confirmed' })
    .sort({ date: 1 })
    .select('date -_id');

  const dateSet = new Set(checkins.map(c => c.date));

  if (dateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Longest streak: walk all dates in order, count consecutive runs
  const sortedDates = [...dateSet].sort();
  let longestStreak = 1;
  let running = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    running = diffDays === 1 ? running + 1 : 1;
    longestStreak = Math.max(longestStreak, running);
  }

  // Current streak: walk backward from today
  let currentStreak = 0;
  let cursor = new Date();

  if (!dateSet.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // today not logged yet, start from yesterday
  }

  while (dateSet.has(toDateStr(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak, longestStreak };
}

module.exports = { calculateStreaks };
